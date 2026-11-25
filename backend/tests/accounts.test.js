import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { accountRoutes } from '../src/routes/accountRoutes.js';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import { errorHandler } from '../src/middleware/errors.js';

const library = () => ({ saved: ['f1'], shelves: [{ id: 'all', name: 'Semua', icon: 'albums-outline', isDefault: true, items: [] }], watchedList: [], userRatings: { f1: 4.5 }, userReactions: { f1: '😍' } });
async function serve(app, t) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return async (path, { method = 'GET', token, body } = {}) => fetch('http://127.0.0.1:' + server.address().port + path, {
    method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function stub() {
  const rows = new Map(), clients = [], writes = [];
  const database = { driver: 'supabase', client: {
    auth: new Proxy({}, { get() { throw Error('Service-role auth client was touched'); } }),
    from(table) {
      assert.equal(table, 'user_libraries');
      return {
        select(column) { assert.equal(column, 'data'); return { eq(key, owner) {
          assert.equal(key, 'user_id');
          return { maybeSingle: async () => ({ data: rows.has(owner) ? { data: rows.get(owner) } : null, error: null }) };
        } }; },
        async upsert(row, options) {
          assert.deepEqual(options, { onConflict: 'user_id' });
          writes.push(row); rows.set(row.user_id, structuredClone(row.data)); return { error: null };
        },
      };
    },
  } };
  const authClientFactory = () => {
    const client = { session: null, auth: {
      async getUser(token) { return ['A', 'B'].includes(token) ? { data: { user: { id: token } }, error: null } : { data: null, error: { status: 401, message: 'SECRET' } }; },
      async signInWithPassword(credentials) {
        assert.equal(credentials.email, 'a@example.com');
        client.session = 'A';
        return { data: { session: { access_token: 'A', refresh_token: 'refresh-A', user: { id: 'A' } } }, error: null };
      },
      async signUp(credentials) { assert.equal(credentials.options.data.name, 'Ayu'); return { data: { session: null }, error: null }; },
      async refreshSession(credentials) { assert.equal(credentials.refresh_token, 'refresh-A'); return { data: { session: { access_token: 'A2' } }, error: null }; },
      admin: { async signOut(token, scope) { assert.equal(token, 'A'); assert.equal(scope, 'local'); return { error: null }; } },
    } };
    clients.push(client); return client;
  };
  return { database, authClientFactory, clients, rows, writes };
}
test('account routes verify tokens, isolate account libraries and never mutate service-role auth', async t => {
  const fixture = stub();
  const app = express(); app.use(express.json({ limit: '32kb' }));
  app.use('/api', accountRoutes(fixture.database, fixture)); app.use(errorHandler);
  const request = await serve(app, t);
  assert.equal((await request('/api/library')).status, 401);
  const forged = await request('/api/library', { token: 'forged' });
  assert.equal(forged.status, 401); assert.doesNotMatch(await forged.text(), /SECRET/);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: { ...library(), user_id: 'B' } })).status, 400);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: { ...library(), userRatings: { f1: 6 } } })).status, 400);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: { ...library(), saved: ['../../owner'] } })).status, 400);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: { ...library(), userReactions: { f1: 1 } } })).status, 400);
  assert.equal(fixture.writes.length, 0);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: library() })).status, 200);
  assert.deepEqual((await (await request('/api/library?user_id=A', { token: 'B' })).json()).data, null);
  const second = { ...library(), saved: ['s1'] };
  assert.equal((await request('/api/library', { method: 'PUT', token: 'B', body: second })).status, 200);
  assert.deepEqual((await (await request('/api/library?user_id=B', { token: 'A' })).json()).data, library());
  assert.deepEqual(fixture.writes.map(row => row.user_id), ['A', 'B']);
  const login = await request('/api/auth/login', { method: 'POST', body: { email: 'a@example.com', password: 'secret123' } });
  assert.equal(login.status, 200); assert.equal((await login.json()).data.access_token, 'A');
  const signup = await request('/api/auth/signup', { method: 'POST', body: { email: 'a@example.com', password: 'secret123', name: 'Ayu' } });
  assert.equal(signup.status, 201); const confirmation = await signup.json(); assert.equal(confirmation.data, null); assert.match(confirmation.message, /email/);
  assert.equal((await request('/api/auth/refresh', { method: 'POST', body: { refresh_token: 'refresh-A' } })).status, 200);
  assert.equal((await request('/api/auth/logout', { method: 'POST', token: 'forged' })).status, 401);
  assert.equal((await request('/api/auth/logout', { method: 'POST', token: 'A' })).status, 200);
  assert.equal(new Set(fixture.clients).size, fixture.clients.length);
  assert.equal(fixture.clients.filter(client => client.session).length, 1);
  assert.equal((await request('/api/library', { method: 'PUT', token: 'A', body: { ...library(), saved: ['x'.repeat(33000)] } })).status, 413);
});
test('sqlite keeps catalogue available and explains Supabase account prerequisite', async t => {
  const database = await connectDatabase({ driver: 'sqlite', sqlitePath: ':memory:' });
  t.after(() => database.close());
  const request = await serve(createApp(database, { adminKey: '', origins: [] }), t);
  assert.equal((await request('/api/health')).status, 200);
  assert.equal((await request('/api/movies')).status, 200);
  for (const [path, method] of [['/api/library', 'GET'], ['/api/library', 'PUT'], ['/api/auth/login', 'POST']]) {
    const response = await request(path, { method }); assert.equal(response.status, 503); assert.match(await response.text(), /DB_DRIVER=supabase/);
  }
});
