import type { EstadoProyecto, Proveedor } from "./types.js";
import { ejecutarPrograma } from "./providers/process.js";

async function obtenerEstadoGit(ruta: string): Promise<string> {
  try {
    const estado = await ejecutarPrograma("git", ["status", "--short"], ruta);
    const diff = await ejecutarPrograma("git", ["diff", "--stat"], ruta);
    return [estado.stdout.trim(), diff.stdout.trim()].filter(Boolean).join("\n") || "Sin cambios locales.";
  } catch {
    return "Estado git no disponible.";
  }
}

function recortar(texto: string, maximo = 1_500): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, maximo)}…`;
}

export async function crearHandoff(
  proyecto: EstadoProyecto,
  origen: Proveedor,
  destino: Proveedor,
): Promise<string> {
  const turnos = proyecto.turnos
    .slice(-4)
    .map(
      (turno) =>
        `[${turno.proveedor}] Usuario: ${recortar(turno.solicitud)}\nRespuesta: ${recortar(turno.respuesta)}`,
    )
    .join("\n\n");
  const git = await obtenerEstadoGit(proyecto.ruta);

  return [
    "Contexto de continuidad generado por Nai.",
    `Proyecto: ${proyecto.alias}`,
    `Cambio de proveedor: ${origen} -> ${destino}`,
    "Estado actual de git:",
    git,
    turnos ? "Turnos recientes relevantes:" : "",
    turnos,
    "Continuá desde este estado. Verificá el código antes de asumir que una modificación fue aplicada.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
