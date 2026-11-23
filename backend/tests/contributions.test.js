import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { contributionRoutes, decodeCover, MAX_COVER_BYTES } from '../src/routes/contributionRoutes.js';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import { createCatalogModel } from '../src/models/catalogModel.js';
import { errorHandler } from '../src/middleware/errors.js';

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
  return {base,post:body=>fetch(base+'/api/contributions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})};
}
test('public contribution uploads a private cover and persists film/serial readable through catalogue API',async t=>{
  const db=await connectDatabase({driver:'sqlite',sqlitePath:':memory:'});
  t.after(()=>db.close());
  const storage=fakeStorage();
  const {base,post}=await serve(createApp({...db,storage},{adminKey:'private-admin',origins:[]}),t);
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
  const storage=fakeStorage();const {base,post}=await serve(createApp({...db,storage},{adminKey:'private-admin',origins:[]}),t);
  const bad=payload('film');bad.title.year=1700;
  assert.equal((await post(bad)).status,400);
  assert.equal((await post({...payload('film'),cover:{base64:Buffer.from('<svg>not a raster image</svg>').toString('base64')}})).status,400);
  assert.equal((await post({...payload('film'),cover:{base64:'!!!!'}})).status,400);
  assert.equal(storage.calls.uploads.length,0);
  assert.equal((await fetch(base+'/api/movies/f1',{method:'DELETE'})).status,401);
  assert.throws(()=>decodeCover({base64:Buffer.alloc(MAX_COVER_BYTES+1).toString('base64')}),/2 MB/);
});
test('failed database write cleans uploaded cover; storage failure creates no title',async t=>{
  const storage=fakeStorage();let writes=0;
  const model={genres:async()=>['Drama'],create:async()=>{writes++;throw Error('Database down');}};
  const app=express();app.use('/api/contributions',contributionRoutes(model,storage));app.use(errorHandler);
  const {post}=await serve(app,t);
  assert.equal((await post(payload('film'))).status,500);
  assert.equal(writes,1);assert.deepEqual(storage.calls.removed,[storage.calls.uploads[0].path]);
  const broken=fakeStorage({failUpload:true});
  const app2=express();app2.use('/api/contributions',contributionRoutes(model,broken));app2.use(errorHandler);
  const second=await serve(app2,t);
  assert.equal((await second.post(payload('film'))).status,503);assert.equal(writes,1);
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
  const app=express();app.use('/api/contributions',contributionRoutes({},null));app.use(errorHandler);
  const {post}=await serve(app,t);
  for(let i=0;i<5;i++)assert.equal((await post(payload('film'))).status,503);
  assert.equal((await post(payload('film'))).status,429);
});
