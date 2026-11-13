import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { create, act } from "react-test-renderer";
import { useRequest } from "../src/hooks/useRequest.js";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
test("hasil query lama tidak menimpa hasil query baru; request lama dibatalkan", async () => {
  let latest;
  const pending = new Map();
  function Probe({ query }) {
    latest = useRequest(
      (signal) =>
        new Promise((resolve) => pending.set(query, { resolve, signal })),
      [query],
    );
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Probe, { query: "old" }));
  });
  await act(async () => {
    renderer.update(React.createElement(Probe, { query: "new" }));
  });
  assert.equal(pending.get("old").signal.aborted, true);
  await act(async () => pending.get("new").resolve("new result"));
  assert.equal(latest.data, "new result");
  await act(async () => pending.get("old").resolve("old result"));
  assert.equal(latest.data, "new result");
  await act(async () => renderer.unmount());
});
test("request gagal dapat dicoba ulang dan mode nonaktif tidak memanggil API", async () => {
  let latest,
    calls = 0;
  function Probe({ enabled }) {
    latest = useRequest(
      async () => {
        calls++;
        if (calls === 1) throw Error("offline");
        return "online";
      },
      [],
      enabled,
    );
    return null;
  }
  let renderer;
  await act(async () => {
    renderer = create(React.createElement(Probe, { enabled: false }));
  });
  assert.equal(calls, 0);
  await act(async () =>
    renderer.update(React.createElement(Probe, { enabled: true })),
  );
  assert.equal(latest.error, "offline");
  await act(async () => latest.retry());
  assert.equal(latest.data, "online");
  assert.equal(latest.error, "");
  await act(async () => renderer.unmount());
});
