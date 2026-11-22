import assert from "node:assert/strict";
import { createApi } from "../src/services/api.js";

const base = process.argv[2] || "http://localhost:5002/api";
const api = createApi(base);
const health = await api.health();
assert.equal(health.status, "ok");
assert.equal(health.service, "cineshelf-api");
for (const type of ["film", "serial"]) {
  const result = await api.list(type);
  assert.ok(result.data.length > 0, type + " must contain at least one item");
  for (const item of result.data) {
    const detail = (await api.detail(item)).data;
    assert.equal(detail.id, item.id);
    assert.equal(detail.type, type);
    assert.ok(detail.title && detail.synopsis);
  }
  console.log(type + ": " + result.data.length + " list items and details verified");
}
assert.ok((await api.home()).data.total > 0);
console.log("Live API check passed (" + health.database + ").");
