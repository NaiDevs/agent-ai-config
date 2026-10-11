import assert from "node:assert/strict";
import test from "node:test";
import { resumirSesionActiva } from "../status.js";
import type { EstadoProyecto } from "../types.js";
import { crearUsoVacio } from "../types.js";

test("resume modelo, tokens y contexto del proveedor activo", () => {
  const proyecto: EstadoProyecto = {
    alias: "yalo console",
    ruta: "C:\\proyectos\\yalo-console",
    proveedorActivo: "codex",
    claude: { uso: crearUsoVacio(), actualizadoEn: "" },
    codex: {
      modelo: "gpt-5.6-sol",
      uso: {
        ...crearUsoVacio(),
        totalTokens: 12_500,
        contextTokens: 12_500,
        contextWindow: 250_000,
      },
      actualizadoEn: "",
    },
    turnos: [],
  };

  assert.equal(resumirSesionActiva(proyecto), "gpt-5.6-sol · 12,500 tokens · contexto 5.0%");
});
