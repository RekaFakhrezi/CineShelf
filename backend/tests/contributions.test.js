import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { contributionRoutes } from '../src/routes/contributionRoutes.js';
import { decodeImage, MAX_IMAGE_BYTES } from '../src/middleware/image.js';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import { createCatalogModel } from '../src/models/catalogModel.js';
import { errorHandler } from '../src/middleware/errors.js';
import { authenticated } from '../src/middleware/auth.js';

const auth = { authClientFactory: () => ({ auth: { getUser: async token =>
  token === 'account-token' ? { data: { user: { id: 'account-A' } }, error: null } :
    { data: null, error: { status: 401, message: 'SECRET' } } } }) };

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
const payload = type => ({type,title:{title:'Tontonan pengujian',genre:'Drama',year:2026,rating:0,age:'SU',duration:'1j 40m',cast:'Belum dicantumkan',director:'Belum dicantumkan',synopsis:'Sinopsis pengujian.',...(type==='serial'?{episodes:6}:{})},cover:{base64:png.toString('base64')}});
function fakeStorage({failUpload=false,failSign=false}={}) {
  const calls={uploads:[],removed:[],signed:[]};
  return {calls,from:name=>{
    assert.equal(name,'cineshelf-covers');
    return {
      upload:async(path,bytes,options)=>{calls.uploads.push({path,bytes,options});return {error:failUpload?Error('Storage down'):null};},
      createSignedUrl:async(path,seconds)=>{calls.signed.push({path,seconds});return {data:{signedUrl:'https://storage.example/signed/'+path+'?token='+calls.signed.length},error:failSign?Error('Sign failed'):null};},
      remove:async paths=>{calls.removed.push(...paths);return {error:null};},
    };
  }};
}
async function serve(app,t) {
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  return {base,post:(body,token='account-token')=>fetch(base+'/api/contributions',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})};
}
test('authenticated contribution uploads a private cover and persists film/serial readable publicly through catalogue API',async t=>{
  const db=await connectDatabase({driver:'sqlite',sqlitePath:':memory:'});
  t.after(()=>db.close());
  const storage=fakeStorage();
  const {base,post}=await serve(createApp({...db,storage},{adminKey:'private-admin',origins:[],...auth}),t);
  for(const type of ['film','serial']) {
    const response=await post(payload(type));assert.equal(response.status,201);
    const {data}=await response.json();assert.equal(data.type,type);assert.ok(data._coverPath.startsWith('covers/'));
    const detail=await (await fetch(base+'/api/'+(type==='film'?'movies':'series')+'/'+data.id)).json();
    assert.equal(detail.data.title,payload(type).title.title);assert.match(detail.data.image,/https:\/\/storage.example\/signed\//);
  }
  assert.equal(storage.calls.uploads.length,2);
  assert.deepEqual(storage.calls.uploads[0].bytes,png);
  assert.equal(storage.calls.uploads[0].options.contentType,'image/png');
  assert.equal(storage.calls.signed[0].seconds,3600);
});
test('invalid fields and forged/oversized files are rejected before upload; admin edits stay protected',async t=>{
  const db=await connectDatabase({driver:'sqlite',sqlitePath:':memory:'});t.after(()=>db.close());
  const storage=fakeStorage();const {base,post}=await serve(createApp({...db,storage},{adminKey:'private-admin',origins:[],...auth}),t);
  const bad=payload('film');bad.title.year=1700;
  assert.equal((await post(bad)).status,400);
  assert.equal((await post({...payload('film'),cover:{base64:Buffer.from('<svg>not a raster image</svg>').toString('base64')}})).status,400);
  assert.equal((await post({...payload('film'),cover:{base64:'!!!!'}})).status,400);
  assert.equal(storage.calls.uploads.length,0);
  assert.equal((await fetch(base+'/api/movies/f1',{method:'DELETE'})).status,401);
  assert.throws(()=>decodeImage({base64:Buffer.alloc(MAX_IMAGE_BYTES+1).toString('base64')}),/2 MB/);
});
test('failed database write cleans uploaded cover; storage failure creates no title',async t=>{
  const storage=fakeStorage();let writes=0;
  const model={genres:async()=>['Drama'],create:async()=>{writes++;throw Error('Database down');}};
  const app=express();app.use('/api/contributions',contributionRoutes(model,storage,auth));app.use(errorHandler);
  const {post}=await serve(app,t);
  assert.equal((await post(payload('film'))).status,500);
  assert.equal(writes,1);assert.deepEqual(storage.calls.removed,[storage.calls.uploads[0].path]);
  const broken=fakeStorage({failUpload:true});
  const app2=express();app2.use('/api/contributions',contributionRoutes(model,broken,auth));app2.use(errorHandler);
  const second=await serve(app2,t);
  assert.equal((await second.post(payload('film'))).status,503);assert.equal(writes,1);
  const unsigned=fakeStorage({failSign:true});
  const app3=express();app3.use('/api/contributions',contributionRoutes(model,unsigned,auth));app3.use(errorHandler);
  const third=await serve(app3,t);
  assert.equal((await third.post(payload('film'))).status,500);assert.equal(writes,1);
  assert.deepEqual(unsigned.calls.removed,[unsigned.calls.uploads[0].path]);
});
test('signed URLs are renewed when reading a stored private cover',async()=>{
  const storage=fakeStorage();const stored={id:'test',type:'film',title:'Test',image:'https://expired.example/old',_coverPath:'covers/test.png'};
  const q={select:()=>q,order:()=>q,eq:()=>q,maybeSingle:async()=>({data:{payload:stored},error:null}),range:async()=>({data:[{payload:stored}],error:null})};
  const model=createCatalogModel({driver:'supabase',client:{storage,from:()=>q}});
  const first=await model.get('test');const second=await model.get('test');
  assert.notEqual(first.image,second.image);assert.notEqual(first.image,stored.image);
  assert.equal((await model.all())[0].image.endsWith('token=3'),true);
});
test('submission throttle rejects repeated contributions without uploading',async t=>{
  const app=express();app.use('/api/contributions',contributionRoutes({},null,auth));app.use(errorHandler);
  const {post}=await serve(app,t);
  for(let i=0;i<5;i++)assert.equal((await post(payload('film'))).status,503);
  assert.equal((await post(payload('film'))).status,429);
});
test('missing, forged, expired and admin tokens fail before parsing or any storage/model work',async t=>{
  let clients=0,verifications=0;
  const options={authClientFactory:()=>{
    clients++;
    return {auth:{getUser:async token=>{
      verifications++;
      assert.ok(['forged','expired','private-admin'].includes(token));
      return {data:null,error:{status:401,message:'SECRET'}};
    }}};
  }};
  const untouched=new Proxy({}, {get(){assert.fail('Unauthenticated storage/model access');}});
  const app=express();app.use('/api/contributions',contributionRoutes(untouched,untouched,options));app.use(errorHandler);
  const {base}=await serve(app,t);
  for(const token of [null,'forged','expired','private-admin']){
    const response=await fetch(base+'/api/contributions',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:'{invalid JSON'});
    assert.equal(response.status,401);assert.doesNotMatch(await response.text(),/SECRET/);
  }
  assert.equal(clients,3);assert.equal(verifications,3);
});
test('verification service failures return 503 before parsing or storage/model work',async t=>{
  const untouched=new Proxy({}, {get(){assert.fail('Storage/model accessed during auth outage');}});
  for(const mode of ['throw','server','rate-limit','no-status']){
    const options={authClientFactory:()=>({auth:{getUser:async()=>{
      if(mode==='throw')throw Error('SECRET');
      return {data:null,error:{status:mode==='server'?500:mode==='rate-limit'?429:undefined,message:'SECRET'}};
    }}})};
    const app=express();app.use('/api/contributions',contributionRoutes(untouched,untouched,options));app.use(errorHandler);
    const {base}=await serve(app,t);
    const response=await fetch(base+'/api/contributions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer account-token'},body:'{invalid JSON'});
    assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/SECRET/);
  }
});
test('a token without a verified user is unauthorized',async t=>{
  const options={authClientFactory:()=>({auth:{getUser:async()=>({data:{user:null},error:null})}})};
  const untouched=new Proxy({}, {get(){assert.fail('Unverified storage/model access');}});
  const app=express();app.use('/api/contributions',contributionRoutes(untouched,untouched,options));app.use(errorHandler);
  const {post}=await serve(app,t);
  assert.equal((await post(payload('film'))).status,401);
});
test('shared verifier creates a fresh auth client for each user and never accesses a library',async()=>{
  const clients=[];
  const freshClient=()=>{
    const client={auth:{getUser:async token=>({data:{user:{id:token}},error:null})}};
    clients.push(client);return client;
  };
  assert.equal((await authenticated({headers:{authorization:'Bearer A'}},freshClient)).user.id,'A');
  assert.equal((await authenticated({headers:{authorization:'Bearer B'}},freshClient)).user.id,'B');
  assert.notEqual(clients[0],clients[1]);
});
