import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { create, act } from 'react-test-renderer';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('press feedback follows live reduced-motion preference and removes its shared listener', async () => {
  let preferenceChanged, removed = false;
  const timings = [];
  class Value { constructor(value) { this.value = value; } setValue(value) { this.value = value; } stopAnimation() {} }
  const native = {
    Pressable: 'Pressable',
    Animated: { Value, View: 'AnimatedView', timing: (value, options) => ({ start() { timings.push(options); value.value = options.toValue; } }) },
    AccessibilityInfo: {
      isReduceMotionEnabled: async () => false,
      addEventListener: (event, listener) => { assert.equal(event, 'reduceMotionChanged'); preferenceChanged = listener; return { remove() { removed = true; } }; },
    },
  };
  const load = (file, dependencies = {}) => {
    const code = transformSync(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), {
      configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'],
    }).code;
    const mod = { exports: {} };
    new Function('require', 'module', 'exports', code)(id => {
      if (id === 'react') return React;
      if (id === 'react-native') return native;
      if (id in dependencies) return dependencies[id];
      throw Error(id);
    }, mod, mod.exports);
    return mod.exports;
  };
  const motion = load('../src/hooks/useReducedMotion.js');
  const { ScalePressable } = load('../src/components/common/ScalePressable.js', { '../../hooks/useReducedMotion': motion });
  let renderer;
  await act(async () => { renderer = create(React.createElement(motion.MotionProvider, null, React.createElement(ScalePressable, { onPress() {} }, 'Press me'))); });
  const button = () => renderer.root.findByType('Pressable');
  await act(async () => { button().props.onPressIn(); button().props.onPressOut(); });
  assert.deepEqual(timings.map(x => x.toValue), [0.98, 1]);
  assert.ok(timings.every(x => x.useNativeDriver && x.duration <= 120));
  await act(async () => { preferenceChanged(true); });
  await act(async () => { button().props.onPressIn(); button().props.onPressOut(); });
  assert.equal(timings.length, 2, 'reduced motion must not schedule scale animations');
  assert.equal(renderer.root.findByType('AnimatedView').props.style.at(-1).transform[0].scale.value, 1);
  await act(async () => { renderer.unmount(); });
  assert.ok(removed);
});
