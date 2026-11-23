import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';
const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('hero: rapid navigation, wrap, resize, swipe and reduced-motion stay in sync', async () => {
  const moves = [];
  let reduced = false;
  const ScrollView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ scrollTo: options => moves.push(options) }));
    return React.createElement('Track', props, props.children);
  });
  const native = {
    View: 'View', Text: 'Text', ImageBackground: 'Image', Pressable: 'Pressable', ScrollView,
    StyleSheet: {create: x => x, absoluteFill: {}}, Platform: {OS: 'android'},
    useWindowDimensions: () => ({width:375,height:812}),
  };
  const code = transformSync(fs.readFileSync(new URL('../src/components/home/HeroBannerCarousel.js', import.meta.url),'utf8'), {
    configFile:false,babelrc:false,plugins:['@babel/plugin-transform-react-jsx','@babel/plugin-transform-modules-commonjs'],
  }).code;
  const module = {exports:{}};
  new Function('require','module','exports',code)(name => {
    if(name === 'react') return React;
    if(name === 'react-native') return native;
    if(name === 'expo-linear-gradient') return {LinearGradient:'Gradient'};
    if(name.endsWith('/theme')) return {THEME:{bg:'#0D1724'}};
    if(name.endsWith('/useReducedMotion')) return {useReducedMotion:()=>reduced};
    if(name.endsWith('/ScalePressable')) return {ScalePressable:'Control'};
    if(name.endsWith('/Button')) return {Button:'Button'};
    if(name.endsWith('/Icon')) return {Icon:'Icon'};
    throw Error(name);
  },module,module.exports);
  const Hero = module.exports.HeroBannerCarousel;
  const items = Array.from({length:5},(_,i)=>({id:String(i),title:'Film '+i}));
  let tree;
  await act(async()=>{tree=create(React.createElement(Hero,{items,ready:true}));});
  const next=()=>tree.root.findByProps({accessibilityLabel:'Pilihan berikutnya'}).props.onPress();
  await act(async()=>{next();next();next();});
  assert.deepEqual(moves.slice(-3).map(x=>x.x),[375,750,1125]);
  const track=()=>tree.root.findByType('Track');
  const event=x=>({nativeEvent:{contentOffset:{x}}});
  await act(async()=>{track().props.onMomentumScrollEnd(event(1125));});
  assert.equal(tree.root.findByProps({accessibilityLabel:'Tampilkan pilihan 4: Film 3'}).props.accessibilityState.selected,true);
  await act(async()=>{tree.root.findAllByType('View')[0].props.onLayout({nativeEvent:{layout:{width:320}}});});
  assert.equal(moves.at(-1).x,960);
  await act(async()=>{track().props.onScrollBeginDrag();track().props.onScroll(event(320));track().props.onMomentumScrollEnd(event(320));});
  reduced=true;
  await act(async()=>{tree.update(React.createElement(Hero,{items,ready:true}));});
  await act(async()=>{next();});
  assert.deepEqual(moves.at(-1),{x:640,animated:false});
  await act(async()=>{next();next();next();});
  assert.equal(moves.at(-1).x,0);
  await act(async()=>{tree.update(React.createElement(Hero,{items:[]}));});
  assert.equal(tree.toJSON(),null);
  await act(async()=>tree.unmount());
});
