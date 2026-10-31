#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { escucharSoloLocal } from "./server.mjs";
const ejecutar = promisify(execFile);
async function versionEngram() {
  for (const args of [["--version"], ["version"]]) {
    try {
      const resultado = await ejecutar("engram", args, { timeout: 4000, maxBuffer: 32768, windowsHide: true });
      const primeraLinea = resultado.stdout.trim().split(/\r?\n/u)[0];
      if (primeraLinea) return primeraLinea.slice(0, 180);
    } catch { /* Falta Engram o la sintaxis cambia segun la version. */ }
  }
  return "No detectado (verificar instalacion y comandos manualmente)";
}
async function principal() {
  const [comando = "doctor", valorPuerto] = process.argv.slice(2);
  if (comando === "doctor") {
    process.stdout.write(`${JSON.stringify({
      bridge: "0.1.0",
      node: process.version,
      engram: await versionEngram(),
      estado: "solo-diagnostico",
      advertencia: "No lee ni exporta la base Engram; sin endpoints de memoria en LAN"
    }, null, 2)}\n`);
    return;
  }
  if (comando === "serve") {
    const puerto = valorPuerto === undefined ? 4391 : Number(valorPuerto);
    const servidor = await escucharSoloLocal(puerto);
    const direccion = servidor.address();
    const puertoReal = typeof direccion === "object" && direccion ? direccion.port : puerto;
    process.stdout.write(`Nai Bridge: http://127.0.0.1:${puertoReal}/v1/health (sin acceso a memorias)\n`);
    return;
  }
  throw new Error("Uso: nai-bridge doctor | serve [puerto]");
}
principal().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
