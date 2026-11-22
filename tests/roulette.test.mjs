import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('roulette reveals metadata only after completion, and cancels reveal when closed', async () => {
  const animations = [];
  class Value {
    setValue() {}
    interpolate() { return 0; }
    stopAnimation() { this.running?.({ finished: false }); this.running = null; }
  }
  const native = {
    View: 'View', Text: 'Text', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator',
    Modal: ({ visible, children }) => visible ? React.createElement('Modal', null, children) : null,
    useWindowDimensions: () => ({ width: 375, height: 812 }),
    StyleSheet: { create: x => x, absoluteFill: {} }, Platform: { OS: 'web' },
    Easing: { bezier: () => null },
    Animated: {
      Value, View: 'AnimatedView',
      timing: value => ({ start: callback => { value.running = callback; animations.push(callback); } }),
      spring: () => ({ start() {} }),
    },
  };
  const code = transformSync(fs.readFileSync(new URL('../src/components/home/CineRouletteModal.js', import.meta.url), 'utf8'), {
    configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
  }).code;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react') return React;
    if (id === 'react-native') return native;
    if (id === 'expo-linear-gradient') return { LinearGradient: 'LinearGradient' };
    if (id.endsWith('/theme')) return { THEME: {} };
    if (id.endsWith('/Icon')) return { Icon: 'Icon' };
    if (id.endsWith('/Artwork')) return { Artwork: 'Artwork' };
    if (id.endsWith('/ScalePressable')) return { ScalePressable: 'ScalePressable' };
    if (id.endsWith('/DitherAccent')) return {};
    throw Error('Unexpected dependency: ' + id);
  }, mod, mod.exports);
  const Roulette = mod.exports.CineRouletteModal;
  const item = { id: 'test', title: 'Secret winner', year: 2099, genre: 'Secret genre', duration: '1j 37m', tagline: 'Secret quotation', rating: '9.8' };
  const props = { visible: true, catalog: [item], onClose() {}, onOpenDetail() {} };
  let renderer;
  await act(async () => { renderer = create(React.createElement(Roulette, props)); });
  const text = () => {
    const collect = node => typeof node === 'string' ? node : (node?.children || []).map(collect).join(' ');
    return collect(renderer.toJSON());
  };
  const assertHidden = () => {
    assert.match(text(), /Mengacak tontonan/);
    for (const value of ['2099', item.genre, item.duration, item.tagline]) assert.ok(!text().includes(value), value + ' leaked while spinning');
  };
  assertHidden();
  const firstFinish = animations.at(-1);
  await act(async () => { firstFinish({ finished: true }); });
  for (const value of ['2099', item.genre, item.duration, item.tagline]) assert.ok(text().includes(value), value + ' missing after completion');
  await act(async () => { renderer.root.findAllByType('ScalePressable').find(x => x.props.accessibilityLabel === 'Putar roulette lagi').props.onPress(); });
  assertHidden();
  const interruptedFinish = animations.at(-1);
  await act(async () => { renderer.update(React.createElement(Roulette, { ...props, visible: false })); });
  assert.equal(renderer.toJSON(), null);
  await act(async () => { renderer.update(React.createElement(Roulette, props)); });
  await act(async () => { interruptedFinish({ finished: false }); });
  assertHidden();
  await act(async () => { animations.at(-1)({ finished: true }); });
  assert.ok(text().includes(item.tagline));
  await act(async () => { renderer.unmount(); });
});
