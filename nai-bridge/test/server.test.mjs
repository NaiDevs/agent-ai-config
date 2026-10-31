import test from "node:test";
import assert from "node:assert/strict";
import { escucharSoloLocal } from "../src/server.mjs";
test("solo health, sin sync no implementado", async (t) => {
  const servidor = await escucharSoloLocal(0);
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const puerto = servidor.address().port;
  const health = await fetch(`http://127.0.0.1:${puerto}/v1/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  const caps = await fetch(`http://127.0.0.1:${puerto}/v1/capabilities`);
  assert.equal((await caps.json()).memorySync, false);
  assert.equal((await fetch(`http://127.0.0.1:${puerto}/v1/memories`)).status, 404);
});
test("rechaza host no local", async () => {
  await assert.rejects(escucharSoloLocal(4391, "0.0.0.0"), /Solo loopback/);
});
test("rechaza metodos de escritura", async (t) => {
  const servidor = await escucharSoloLocal(0);
  t.after(() => new Promise(resolve => servidor.close(resolve)));
  const puerto = servidor.address().port;
  assert.equal((await fetch(`http://127.0.0.1:${puerto}/v1/health`, { method: "POST" })).status, 405);
});
