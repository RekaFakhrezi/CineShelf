import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { MAX_IMAGE_BYTES } from '../src/middleware/image.js';

const oldPath = 'avatars/A/32d9a8a3-44e0-484e-91b9-dad4ab4f574b.png';
const otherPath = oldPath.replace('/A/', '/B/');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
const avatar = { base64: png.toString('base64') };
const user = (id, path = null) => ({ id, email: `${id.toLowerCase()}@example.com`, user_metadata: { name: id, cineshelf_avatar: path, preserved: true } });

async function serve(app, t) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

async function fixture(t, { driver = 'supabase', rejectUpdate = false, rejectSign = false } = {}) {
  const users = { A: user('A', oldPath), B: user('B', otherPath) };
  const objects = new Set([oldPath, otherPath]);
  const events = [];
  const provider = express();
  provider.use(express.json());
  provider.all('/auth/v1/user', (req, res) => {
    const actor = req.get('Authorization')?.replace(/^Bearer /, '');
    if (req.get('apikey') !== 'provider-key' || !Object.hasOwn(users, actor))
      return res.status(401).json({ message: 'SECRET_PROVIDER_ERROR' });
    if (req.method === 'GET') return res.json(users[actor]);
    if (req.method !== 'PUT') return res.sendStatus(405);
    events.push(['update', actor, req.body]);
    if (rejectUpdate) return res.status(422).json({ message: 'SECRET_PROVIDER_ERROR' });
    const { email, data } = req.body;
    if (email) users[actor].new_email = email;
    if (data) Object.assign(users[actor].user_metadata, data);
    res.json(users[actor]);
  });
  const env = { SUPABASE_URL: await serve(provider, t), SUPABASE_SERVICE_ROLE_KEY: 'provider-key' };
  for (const [key, value] of Object.entries(env)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
  const storage = { from(bucket) {
    assert.equal(bucket, 'cineshelf-covers');
    return {
      async upload(path, bytes, options) { events.push(['upload', path, bytes, options]); objects.add(path); return { error: null }; },
      async createSignedUrl(path, expiry) {
        events.push(['sign', path, expiry]);
        if (rejectSign || !objects.has(path)) return { error: Error('SECRET_STORAGE_ERROR') };
        return { data: { signedUrl: `https://storage.example/${path}?signed=${events.length}` } };
      },
      async remove(paths) { events.push(['remove', ...paths]); paths.forEach(path => objects.delete(path)); return { error: null }; },
    };
  } };
  const database = { driver, client: { storage, get auth() { throw Error('Service-role auth client touched'); } } };
  const base = await serve(createApp(database, { origins: [] }), t);
  return {
    users, objects, events,
    request: ({ token, body, raw, query = '' } = {}) => fetch(base + '/api/profile' + query, {
      method: body === undefined && raw === undefined ? 'GET' : 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    }),
  };
}

test('profile requires Supabase, is not cached, and verifies the bearer before parsing or accessing storage', async t => {
  const { request, events } = await fixture(t);
  for (const token of [undefined, 'forged', 'provider-key']) {
    const response = await request({ token, raw: '{' });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.doesNotMatch(await response.text(), /SECRET|provider-key/);
  }
  const signedIn = await request({ token: 'A', raw: '{' });
  assert.equal(signedIn.status, 400);
  assert.doesNotMatch(await signedIn.text(), /SyntaxError|Unexpected/);
  assert.deepEqual(events, []);
});

test('the profile route rejects non-Supabase deployments without parsing', async t => {
  const { request } = await fixture(t, { driver: 'sqlite' });
  const response = await request({ token: 'A', raw: '{' });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(await response.text(), /Supabase/);
});

test('profile rejects identity, metadata and path overrides, and invalid patch values before any writes', async t => {
  const { events, request } = await fixture(t);
  for (const body of [null, [], {}, { id: 'B' }, { user_id: 'B' }, { user_metadata: { cineshelf_avatar: otherPath } },
    { name: '   ' }, { name: 'a'.repeat(81) }, { email: 'invalid' }, { password: '12345' }, { password: 'a'.repeat(1025) },
    { avatar: otherPath }, { avatar: { ...avatar, path: otherPath } }, { avatar: { base64: '???=' } },
    { avatar: { base64: Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64') } }]) {
    const response = await request({ token: 'A', body });
    assert.equal(response.status, 400, 'invalid profile payload must be rejected');
  }
  assert.equal((await request({ token: 'A', raw: ' '.repeat(3 * 1024 * 1024 + 1) })).status, 413);
  assert.deepEqual(events, []);
});

test('profile gets and updates only the verified account; email stays pending and password is never trimmed', async t => {
  const { users, events, request } = await fixture(t);
  const response = await request({ token: 'A', query: '?user_id=B' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const initial = (await response.json()).data;
  assert.equal(initial.user.id, 'A');
  assert.match(initial.avatarUrl, /avatars\/A\//);
  const patch = await request({ token: 'A', query: '?user_id=B', body: { name: '  Ayu  ', email: ' baru@example.com ', password: ' secret ' } });
  assert.equal(patch.status, 200);
  const { data, message } = await patch.json();
  assert.equal(data.user.email, 'a@example.com');
  assert.deepEqual(data.user.user_metadata, { name: 'Ayu', cineshelf_avatar: oldPath, preserved: true });
  assert.match(message, /konfirmasi/);
  assert.notEqual(data.avatarUrl, initial.avatarUrl);
  assert.equal(users.B.user_metadata.name, 'B');
  assert.deepEqual(events, [['sign', oldPath, 3600], ['sign', oldPath, 3600], ['update', 'A', {
    data: { name: 'Ayu' }, email: 'baru@example.com', password: ' secret ',
  }]]);
});

test('profile avatar upload bypasses the generic parser limit, signs before publishing, and removes previous objects after success', async t => {
  const { events, objects, users, request } = await fixture(t);
  const bytes = Buffer.concat([png, Buffer.alloc(36 * 1024)]);
  const response = await request({ token: 'A', body: { avatar: { base64: bytes.toString('base64') } } });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  const path = users.A.user_metadata.cineshelf_avatar;
  assert.match(path, /^avatars\/A\/[0-9a-f-]{36}\.png$/);
  assert.match(data.avatarUrl, /\?signed=/);
  assert.equal(data.user.user_metadata.cineshelf_avatar, path);
  assert.deepEqual(events, [
    ['upload', path, bytes, { contentType: 'image/png', cacheControl: '3600', upsert: false }],
    ['sign', path, 3600], ['update', 'A', { data: { cineshelf_avatar: path } }], ['remove', oldPath],
  ]);
  assert.deepEqual(objects, new Set([otherPath, path]));
  const removal = await request({ token: 'A', body: { avatar: null } });
  assert.equal(removal.status, 200);
  assert.equal((await removal.json()).data.avatarUrl, null);
  assert.equal(users.A.user_metadata.cineshelf_avatar, null);
  assert.deepEqual(events.slice(-2), [['update', 'A', { data: { cineshelf_avatar: null } }], ['remove', path]]);
  assert.deepEqual(objects, new Set([otherPath]));
});

test('client-writable avatar metadata is not signed or deleted unless it is an exact owned object path', async t => {
  const { events, objects, users, request } = await fixture(t);
  for (const path of [otherPath, 'covers/' + oldPath.split('/').at(-1), `avatars/A/../B/${oldPath.split('/').at(-1)}`, oldPath + '\n', oldPath + '?x=1']) {
    users.A.user_metadata.cineshelf_avatar = path;
    const response = await request({ token: 'A' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.avatarUrl, null);
    assert.equal((await request({ token: 'A', body: { avatar: null } })).status, 200);
  }
  assert.equal(events.length, 5);
  assert.ok(events.every(([operation]) => operation === 'update'));
  assert.deepEqual(objects, new Set([oldPath, otherPath]));
});

for (const [flag, status, operations] of [
  ['rejectUpdate', 400, ['upload', 'sign', 'update', 'remove']],
  ['rejectSign', 503, ['upload', 'sign', 'remove']],
]) {
  test(`profile rolls back only the new avatar on ${flag}`, async t => {
    const { events, objects, users, request } = await fixture(t, { [flag]: true });
    const response = await request({ token: 'A', body: { avatar } });
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /SECRET/);
    assert.deepEqual(events.map(([operation]) => operation), operations);
    assert.equal(events.at(-1)[1], events[0][1]);
    assert.equal(users.A.user_metadata.cineshelf_avatar, oldPath);
    assert.deepEqual(objects, new Set([oldPath, otherPath]));
  });
}
