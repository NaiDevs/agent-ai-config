import assert from "node:assert/strict";
import test from "node:test";
import { acumularUso } from "../state.js";
import { crearUsoVacio } from "../types.js";

test("acumula tokens y conserva la última ventana de contexto", () => {
  const primero = acumularUso(crearUsoVacio(), {
    inputTokens: 10,
    outputTokens: 5,
    totalTokens: 15,
    contextTokens: 15,
    contextWindow: 100,
  });
  const segundo = acumularUso(primero, {
    inputTokens: 7,
    outputTokens: 3,
    totalTokens: 10,
    contextTokens: 10,
    contextWindow: 200,
  });
  assert.equal(segundo.inputTokens, 17);
  assert.equal(segundo.totalTokens, 25);
  assert.equal(segundo.contextTokens, 10);
  assert.equal(segundo.contextWindow, 200);
});
