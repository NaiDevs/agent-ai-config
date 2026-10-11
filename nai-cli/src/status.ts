import type { EstadoProyecto, SesionProveedor, UsoProveedor } from "./types.js";

function numeroFormateado(valor: number): string {
  return new Intl.NumberFormat("es-GT").format(valor);
}

export function resumirSesionActiva(proyecto: EstadoProyecto): string {
  const sesion = proyecto[proyecto.proveedorActivo];
  const porcentaje = porcentajeContexto(sesion.uso);
  const modelo = sesion.modelo ?? "modelo automático";
  const contexto = porcentaje === undefined ? "contexto n/d" : `contexto ${porcentaje.toFixed(1)}%`;

  return `${modelo} · ${numeroFormateado(sesion.uso.totalTokens)} tokens · ${contexto}`;
}

export function porcentajeContexto(uso: UsoProveedor): number | undefined {
  if (!uso.contextWindow || uso.contextWindow <= 0 || uso.contextTokens === undefined) {
    return undefined;
  }
  return Math.min(100, (uso.contextTokens / uso.contextWindow) * 100);
}

function lineaSesion(nombre: string, sesion: SesionProveedor): string {
  const porcentaje = porcentajeContexto(sesion.uso);
  const contexto = porcentaje === undefined ? "contexto n/d" : `contexto ${porcentaje.toFixed(1)}%`;
  const costo = sesion.uso.costUsd === undefined ? "" : ` · $${sesion.uso.costUsd.toFixed(4)}`;
  return `${nombre}: ${numeroFormateado(sesion.uso.totalTokens)} tokens · ${contexto}${costo}`;
}

export function formatearEstado(proyecto: EstadoProyecto): string {
  const activo = proyecto[proyecto.proveedorActivo];
  const porcentaje = porcentajeContexto(activo.uso);
  const alerta = porcentaje !== undefined && porcentaje >= 80
    ? "\n⚠ El contexto del proveedor activo supera 80%; conviene compactar o iniciar una sesión nueva."
    : "";

  return [
    `Proyecto: ${proyecto.alias}`,
    `Ruta: ${proyecto.ruta}`,
    `Proveedor activo: ${proyecto.proveedorActivo}${activo.modelo ? ` (${activo.modelo})` : ""}`,
    lineaSesion("Claude", proyecto.claude),
    lineaSesion("Codex", proyecto.codex),
    "Límites del plan: cada proveedor solo los expone cuando su CLI los reporta; Nai no inventa un saldo combinado.",
  ].join("\n") + alerta;
}
