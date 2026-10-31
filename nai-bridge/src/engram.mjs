import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const ejecutarArchivo = promisify(execFile);
const LIMITE_RESPALDO = 32 * 1024 * 1024;
const VERSIONES_PERMITIDAS = new Set(["0.1.0", "0.2.0"]);

function esObjeto(valor) {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function exigirProyecto(proyecto) {
  if (typeof proyecto !== "string" || !proyecto.trim() || proyecto.length > 160 || /[\r\n\0]/u.test(proyecto)) {
    throw new Error("Indica un proyecto Engram valido mediante --project.");
  }
  return proyecto.trim();
}

function obtenerProyecto(observacion, sesiones) {
  const explicito = typeof observacion.project === "string" ? observacion.project.trim() : "";
  if (explicito) return explicito;
  return sesiones.get(observacion.session_id) ?? "";
}

/** Interpreta un backup oficial de Engram, pero no lo importa ni altera. */
export function interpretarExportacionEngram(documento, proyecto) {
  const solicitado = exigirProyecto(proyecto);
  if (!esObjeto(documento) || !VERSIONES_PERMITIDAS.has(documento.version) || !Array.isArray(documento.observations) || !Array.isArray(documento.sessions)) {
    throw new Error("Formato de exportacion Engram no soportado o incompleto.");
  }
  const sesiones = new Map();
  for (const sesion of documento.sessions) {
    if (esObjeto(sesion) && typeof sesion.id === "string" && typeof sesion.project === "string") {
      sesiones.set(sesion.id, sesion.project.trim());
    }
  }
  const ids = new Set();
  const memorias = [];
  for (const obs of documento.observations) {
    if (!esObjeto(obs) || typeof obs.sync_id !== "string" || !obs.sync_id.trim() || typeof obs.content !== "string" || typeof obs.title !== "string" || typeof obs.updated_at !== "string") {
      throw new Error("Una observacion de Engram contiene campos obligatorios invalidos.");
    }
    const project = obtenerProyecto(obs, sesiones);
    if (project !== solicitado) {
      // Exportaciones legacy pueden llevar otros proyectos; no enviarlos por accidente.
      continue;
    }
    if (ids.has(obs.sync_id)) throw new Error("Engram exporto identificadores sync_id repetidos.");
    ids.add(obs.sync_id);
    const eliminada = typeof obs.deleted_at === "string" && obs.deleted_at.length > 0;
    const contenido = [obs.title.trim(), obs.content].filter(Boolean).join("\n\n");
    if (!eliminada && !contenido.trim()) throw new Error("Observacion activa de Engram sin contenido.");
    const version = JSON.stringify({
      sync_id: obs.sync_id,
      project,
      title: obs.title,
      content: obs.content,
      updated_at: obs.updated_at,
      revision_count: obs.revision_count ?? 0,
      deleted_at: obs.deleted_at ?? null,
    });
    const hash = createHash("sha256").update(version).digest("hex");
    memorias.push({
      id: "engram:" + obs.sync_id,
      proyectoId: project,
      revisionId: "sha256:" + hash,
      revisionPadreId: null,
      origen: "engram",
      contenido,
      eliminada,
    });
  }
  return { proyecto: solicitado, versionExportacion: documento.version, memorias };
}

/** Crea un archivo temporal en una carpeta privada y lo destruye incluso si falla el comando. */
export async function leerEngramPorProyecto(proyecto, opciones = {}) {
  const solicitado = exigirProyecto(proyecto);
  const ejecutar = opciones.ejecutar ?? ejecutarArchivo;
  const binario = opciones.binario ?? "engram";
  const carpeta = await fs.mkdtemp(join(tmpdir(), "nai-engram-export-"));
  const archivo = join(carpeta, "backup.json");
  try {
    await fs.chmod(carpeta, 0o700);
    // --project es obligatorio: prohibido exportar de todos los proyectos.
    await ejecutar(binario, ["export", archivo, "--project", solicitado], {
      windowsHide: true,
      shell: false,
      timeout: 20000,
      maxBuffer: 64 * 1024,
    });
    const info = await fs.lstat(archivo);
    if (!info.isFile() || info.size > LIMITE_RESPALDO) {
      throw new Error("Archivo de exportacion invalido o demasiado grande.");
    }
    const texto = await fs.readFile(archivo, "utf8");
    let documento;
    try {
      documento = JSON.parse(texto);
    } catch {
      throw new Error("Engram devolvio un JSON de exportacion invalido.");
    }
    return interpretarExportacionEngram(documento, solicitado);
  } catch (error) {
    // Nunca incluir stdout/stderr ni las rutas de memorias en mensajes de error.
    if (error instanceof Error && /Engram|exportacion|observacion|proyecto/.test(error.message) && !error.stdout && !error.stderr) {
      throw error;
    }
    throw new Error("No se pudo exportar Engram. Verifica la instalacion y el proyecto local.");
  } finally {
    await fs.rm(carpeta, { recursive: true, force: true });
  }
}

/** El CLI informa solo conteos: nunca imprime contenido privado. */
export async function inspeccionarEngramPorProyecto(proyecto, opciones = {}) {
  const snapshot = await leerEngramPorProyecto(proyecto, opciones);
  return {
    proyecto: snapshot.proyecto,
    versionExportacion: snapshot.versionExportacion,
    observaciones: snapshot.memorias.length,
    activas: snapshot.memorias.filter((m) => !m.eliminada).length,
    eliminadas: snapshot.memorias.filter((m) => m.eliminada).length,
    soloLectura: true,
  };
}
