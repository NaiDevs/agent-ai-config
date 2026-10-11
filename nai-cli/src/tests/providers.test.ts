import assert from "node:assert/strict";
import test from "node:test";
import {
  crearEventosProgresoClaude,
  parsearRespuestaClaude,
  parsearRespuestaClaudeStream,
} from "../providers/claude.provider.js";
import {
  crearEventoProgresoCodex,
  parsearModeloCodex,
  parsearRespuestaCodex,
} from "../providers/codex.provider.js";

test("lee el modelo principal de la configuración de Codex", () => {
  const configuracion = `model = "gpt-5.6-sol"
model_reasoning_effort = "medium"

[notice.model_migrations]
"gpt-5.3-codex" = "gpt-5.4"`;

  assert.equal(parsearModeloCodex(configuracion), "gpt-5.6-sol");
});

test("extrae sesión, texto y uso de Claude", () => {
  const resultado = parsearRespuestaClaude(
    JSON.stringify({
      session_id: "claude-1",
      result: "Listo",
      total_cost_usd: 0.01,
      modelUsage: { "claude-sonnet-4-6": { costUSD: 0.01 } },
      usage: { input_tokens: 10, cache_read_input_tokens: 5, output_tokens: 3 },
    }),
  );
  assert.equal(resultado.sessionId, "claude-1");
  assert.equal(resultado.texto, "Listo");
  assert.equal(resultado.uso.totalTokens, 18);
  assert.equal(resultado.uso.costUsd, 0.01);
  assert.equal(resultado.modelo, "claude-sonnet-4-6");
});

test("extrae sesión, mensaje y uso de Codex desde JSONL", () => {
  const salida = [
    JSON.stringify({ type: "thread.started", thread_id: "codex-1", model: "gpt-5.6-sol" }),
    JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "Hecho" } }),
    JSON.stringify({
      type: "turn.completed",
      usage: { input_tokens: 20, cached_input_tokens: 4, output_tokens: 8, total_tokens: 28 },
    }),
  ].join("\n");
  const resultado = parsearRespuestaCodex(salida);
  assert.equal(resultado.sessionId, "codex-1");
  assert.equal(resultado.texto, "Hecho");
  assert.equal(resultado.uso.totalTokens, 28);
  assert.equal(resultado.modelo, "gpt-5.6-sol");
});

test("calcula el total de Codex cuando el evento no incluye total_tokens", () => {
  const salida = JSON.stringify({
    type: "turn.completed",
    usage: { input_tokens: 38_372, cached_input_tokens: 29_952, output_tokens: 102 },
  });
  const resultado = parsearRespuestaCodex(salida);

  assert.equal(resultado.uso.totalTokens, 38_474);
  assert.equal(resultado.uso.contextTokens, 38_474);
});

test("convierte comandos de Codex en progreso visible", () => {
  const progreso = crearEventoProgresoCodex({
    type: "item.completed",
    item: {
      type: "command_execution",
      command: "npm.cmd test",
      aggregated_output: "ok 1\nok 2",
      exit_code: 0,
    },
  });

  assert.deepEqual(progreso, {
    tipo: "comando",
    descripcion: "Ejecutó npm.cmd test",
    detalle: "2 líneas · código 0",
    completado: true,
  });
});

test("convierte herramientas de Claude en inicio y resultado", () => {
  const actividades = new Map();
  const inicio = crearEventosProgresoClaude({
    type: "assistant",
    message: {
      content: [{ type: "tool_use", id: "tool-1", name: "Read", input: { file_path: "src/ui.ts" } }],
    },
  }, actividades);
  const fin = crearEventosProgresoClaude({
    type: "user",
    message: {
      content: [{ type: "tool_result", tool_use_id: "tool-1", content: "línea 1\nlínea 2" }],
    },
  }, actividades);

  assert.equal(inicio[0]?.descripcion, "Inspeccionando src/ui.ts");
  assert.equal(inicio[0]?.completado, false);
  assert.equal(fin[0]?.descripcion, "Inspeccionó src/ui.ts");
  assert.equal(fin[0]?.detalle, "2 líneas");
  assert.equal(fin[0]?.completado, true);
});

test("extrae el resultado final de Claude desde stream-json", () => {
  const salida = [
    JSON.stringify({ type: "system", subtype: "init", session_id: "claude-stream-1", model: "claude-sonnet-4-6" }),
    JSON.stringify({
      type: "result",
      session_id: "claude-stream-1",
      result: "Terminado",
      usage: { input_tokens: 12, output_tokens: 4 },
    }),
  ].join("\n");
  const resultado = parsearRespuestaClaudeStream(salida);

  assert.equal(resultado.sessionId, "claude-stream-1");
  assert.equal(resultado.modelo, "claude-sonnet-4-6");
  assert.equal(resultado.texto, "Terminado");
  assert.equal(resultado.uso.totalTokens, 16);
});
