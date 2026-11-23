import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {create,act} from 'react-test-renderer';
const require=createRequire(import.meta.url);
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
globalThis.requestAnimationFrame=callback=>callback();

test('add title form validates, sends picked cover, handles serials and prevents double submission',async()=>{
  const code=require('@babel/core').transformSync(fs.readFileSync(new URL('../src/components/catalog/AddTitleModal.js',import.meta.url),'utf8'),{configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx','@babel/plugin-transform-modules-commonjs']}).code;
  const module={exports:{}};
  const native={View:'View',Text:'Text',TextInput:'Input',Modal:'Modal',ScrollView:'ScrollView',Image:'Image',KeyboardAvoidingView:'Keyboard',Pressable:'Pressable',Platform:{OS:'android'},StyleSheet:{create:x=>x}};
  new Function('require','module','exports',code)(name=>{
    if(name==='react')return React;
    if(name==='react-native')return native;
    if(name==='react-native-safe-area-context')return {useSafeAreaInsets:()=>({top:0,bottom:0})};
    if(name==='expo-image-picker')return {launchImageLibraryAsync:async()=>({canceled:false,assets:[{uri:'file:///cover.jpg',base64:'aW1hZ2U='}]})};
    if(name.endsWith('/theme'))return {THEME:{}};
    if(name.endsWith('/useReducedMotion'))return {useReducedMotion:()=>true};
    if(name.endsWith('/ScalePressable'))return {ScalePressable:'Control'};
    if(name.endsWith('/Icon'))return {Icon:'Icon'};
    if(name.endsWith('/Button'))return {Button:'Button'};
    throw Error(name);
  },module,module.exports);
  let tree,resolve,received,created=0,calls=0;
  await act(async()=>{tree=create(React.createElement(module.exports.AddTitleModal,{visible:true,genres:['Drama','Sci-Fi'],api:{contribute:body=>{received=body;calls++;return new Promise(r=>{resolve=r})}},onCreated:()=>created++}));});
  const save=()=>tree.root.findByType('Button').props.onPress();
  await act(async()=>{await save();});
  assert.ok(tree.root.findAllByType('Text').some(x=>x.props.children==='Pilih foto cover terlebih dahulu.'));
  await act(async()=>{await tree.root.findByProps({accessibilityLabel:'Pilih foto cover'}).props.onPress();});
  await act(async()=>{
    tree.root.findByProps({accessibilityLabel:'Judul *'}).props.onChangeText('Film pengguna');
    tree.root.findByProps({accessibilityLabel:'Sinopsis *'}).props.onChangeText('Sinopsis dari pengguna.');
    tree.root.findByProps({accessibilityLabel:'Serial'}).props.onPress();
  });
  await act(async()=>{tree.root.findByProps({accessibilityLabel:'Jumlah episode *'}).props.onChangeText('6');});
  let submission;
  await act(async()=>{submission=save();save();});
  assert.equal(calls,1);assert.equal(received.type,'serial');assert.equal(received.title.episodes,6);
  assert.equal(received.title.duration,'1 musim · 6 episode');assert.equal(received.cover.base64,'aW1hZ2U=');
  assert.equal(received.title.cast,'Belum dicantumkan');assert.equal('adminKey' in received,false);
  await act(async()=>{resolve({data:{id:'new'}});await submission;});assert.equal(created,1);
  await act(async()=>tree.unmount());
});
