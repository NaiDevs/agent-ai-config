import test from "node:test";
import assert from "node:assert/strict";
import { planificarSincronizacion } from "../src/index.ts";
const memoria = (revisionId, revisionPadreId = null, contenido = "decision") => ({
  id: "engram:1", proyectoId: "nai agendivo", revisionId, revisionPadreId,
  origen: "engram", contenido, eliminada: false,
});
test("snapshot inicial aplica memoria nueva", () => {
  assert.equal(planificarSincronizacion(new Map(), [memoria("r1")]).cambios.length, 1);
});
test("no duplica revision ya conocida", () => {
  const base = new Map([["engram:1", memoria("r1")]]);
  const plan = planificarSincronizacion(base, [memoria("r1")]);
  assert.equal(plan.cambios.length, 0);
  assert.equal(plan.omitidos, 1);
});
test("actualiza revision sucesora", () => {
  const base = new Map([["engram:1", memoria("r1")]]);
  assert.equal(planificarSincronizacion(base, [memoria("r2", "r1", "otra")]).cambios[0].operacion, "actualizar");
});
test("procesa varias revisiones encadenadas", () => {
  assert.equal(planificarSincronizacion(new Map(), [memoria("r1"), memoria("r2", "r1", "otra")]).cambios.length, 2);
});
test("ignora revision anterior", () => {
  const base = new Map([["engram:1", memoria("r2", "r1", "otra")]]);
  assert.equal(planificarSincronizacion(base, [memoria("r1")]).omitidos, 1);
});
test("detecta ramas divergentes", () => {
  const base = new Map([["engram:1", memoria("r2", "r1", "local")]]);
  assert.equal(planificarSincronizacion(base, [memoria("r3", "r1", "remota")]).conflictos[0].motivo, "revision-divergente");
});
test("no sobreescribe misma revision con contenido distinto", () => {
  const base = new Map([["engram:1", memoria("r1")]]);
  assert.equal(planificarSincronizacion(base, [memoria("r1", null, "otro")]).conflictos[0].motivo, "mismo-id-distinto-contenido");
});
test("rechaza revision sin padre conocido", () => {
  assert.throws(() => planificarSincronizacion(new Map(), [memoria("r2", "r1")]), /padre ausente/);
});
test("soporta borrado logico", () => {
  const base = new Map([["engram:1", memoria("r1")]]);
  assert.equal(planificarSincronizacion(base, [{...memoria("r2", "r1", ""), eliminada: true}]).cambios[0].memoria.eliminada, true);
});
test("no modifica el estado original", () => {
  const base = new Map([["engram:1", memoria("r1")]]);
  planificarSincronizacion(base, [memoria("r2", "r1", "otra")]);
  assert.equal(base.get("engram:1").revisionId, "r1");
});
