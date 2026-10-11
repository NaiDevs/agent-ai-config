import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
  AdaptadorProveedor,
  EventoProgreso,
  ResultadoProveedor,
  SolicitudProveedor,
  UsoProveedor,
} from "../types.js";
import { PROVEEDORES, TIPOS_PROGRESO } from "../types.js";
import {
  comandoDisponible,
  ejecutarProgramaStreaming,
  esRegistro,
  numero,
  resolverPrograma,
  texto,
} from "./process.js";

interface ActividadClaude {
  iniciada: string;
  completada: string;
  tipo: EventoProgreso["tipo"];
}

function leerModeloClaudeConfigurado(): string | undefined {
  if (process.env.ANTHROPIC_MODEL) {
    return process.env.ANTHROPIC_MODEL;
  }

  try {
    const configuracion: unknown = JSON.parse(
      readFileSync(join(homedir(), ".claude", "settings.json"), "utf8"),
    );
    return esRegistro(configuracion) ? texto(configuracion.model) : undefined;
  } catch {
    return undefined;
  }
}

export function parsearRespuestaClaude(salida: string): ResultadoProveedor {
  let valor: unknown;
  try {
    valor = JSON.parse(salida);
  } catch {
    return { texto: salida.trim(), uso: {} };
  }

  if (!esRegistro(valor)) {
    return { texto: salida.trim(), uso: {} };
  }

  const usoCrudo = esRegistro(valor.usage) ? valor.usage : {};
  const inputTokens = numero(usoCrudo.input_tokens) ?? 0;
  const cachedInputTokens =
    (numero(usoCrudo.cache_read_input_tokens) ?? 0) +
    (numero(usoCrudo.cache_creation_input_tokens) ?? 0);
  const outputTokens = numero(usoCrudo.output_tokens) ?? 0;
  const totalTokens = inputTokens + cachedInputTokens + outputTokens;
  const uso: Partial<UsoProveedor> = {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens,
    contextTokens: totalTokens,
  };
  const costo = numero(valor.total_cost_usd);
  if (costo !== undefined) {
    uso.costUsd = costo;
  }

  const sessionId = texto(valor.session_id);
  const usoPorModelo = esRegistro(valor.modelUsage) ? Object.keys(valor.modelUsage) : [];
  const modelo = texto(valor.model) ?? usoPorModelo[0];
  return {
    ...(sessionId ? { sessionId } : {}),
    texto: texto(valor.result) ?? "Claude terminó sin devolver texto.",
    ...(modelo ? { modelo } : {}),
    uso,
  };
}

export function parsearRespuestaClaudeStream(salida: string): ResultadoProveedor {
  let resultado: ResultadoProveedor = { texto: "Claude terminó sin devolver texto.", uso: {} };
  let sessionId: string | undefined;
  let modelo: string | undefined;

  for (const linea of salida.split(/\r?\n/u)) {
    if (!linea.trim()) {
      continue;
    }
    try {
      const evento: unknown = JSON.parse(linea);
      if (!esRegistro(evento)) {
        continue;
      }
      sessionId = texto(evento.session_id) ?? sessionId;
      modelo = texto(evento.model) ?? modelo;
      if (evento.type === "result") {
        resultado = parsearRespuestaClaude(linea);
      }
    } catch {
      continue;
    }
  }

  const sessionIdFinal = resultado.sessionId ?? sessionId;
  const modeloFinal = resultado.modelo ?? modelo;
  return {
    ...resultado,
    ...(sessionIdFinal ? { sessionId: sessionIdFinal } : {}),
    ...(modeloFinal ? { modelo: modeloFinal } : {}),
  };
}

function actividadHerramientaClaude(
  nombre: string,
  entrada: Record<string, unknown>,
): ActividadClaude {
  const archivo = texto(entrada.file_path) ?? texto(entrada.path);
  const comando = texto(entrada.command);
  const consulta = texto(entrada.query) ?? texto(entrada.pattern);
  if (nombre === "Bash" && comando) {
    return { iniciada: `Ejecutando ${comando}`, completada: `Ejecutó ${comando}`, tipo: TIPOS_PROGRESO.COMANDO };
  }
  if ((nombre === "Read" || nombre === "Glob" || nombre === "Grep") && (archivo ?? consulta)) {
    const objetivo = archivo ?? consulta ?? nombre;
    return { iniciada: `Inspeccionando ${objetivo}`, completada: `Inspeccionó ${objetivo}`, tipo: TIPOS_PROGRESO.ARCHIVO };
  }
  if ((nombre === "Edit" || nombre === "Write") && archivo) {
    return { iniciada: `Modificando ${archivo}`, completada: `Modificó ${archivo}`, tipo: TIPOS_PROGRESO.ARCHIVO };
  }
  if ((nombre === "WebSearch" || nombre === "WebFetch") && consulta) {
    return { iniciada: `Buscando ${consulta}`, completada: `Buscó ${consulta}`, tipo: TIPOS_PROGRESO.WEB };
  }
  return { iniciada: `Usando ${nombre}`, completada: `Usó ${nombre}`, tipo: TIPOS_PROGRESO.HERRAMIENTA };
}

function detalleResultadoClaude(bloque: Record<string, unknown>): string | undefined {
  const contenido = texto(bloque.content);
  if (!contenido?.trim()) {
    return undefined;
  }
  const lineas = contenido.trim().split(/\r?\n/u).length;
  return `${lineas} ${lineas === 1 ? "línea" : "líneas"}`;
}

export function crearEventosProgresoClaude(
  evento: Record<string, unknown>,
  actividades: Map<string, ActividadClaude>,
): EventoProgreso[] {
  if (evento.type === "system" && evento.subtype === "init") {
    return [{ tipo: TIPOS_PROGRESO.ANALISIS, descripcion: "Preparando contexto", completado: false }];
  }
  if ((evento.type !== "assistant" && evento.type !== "user") || !esRegistro(evento.message)) {
    return [];
  }
  const contenido = Array.isArray(evento.message.content) ? evento.message.content : [];
  const progresos: EventoProgreso[] = [];
  for (const valor of contenido) {
    if (!esRegistro(valor)) {
      continue;
    }
    if (valor.type === "text" && evento.type === "assistant") {
      const mensaje = texto(valor.text);
      if (mensaje) {
        progresos.push({ tipo: TIPOS_PROGRESO.ANALISIS, descripcion: mensaje, completado: true });
      }
    }
    if (valor.type === "tool_use") {
      const id = texto(valor.id);
      const nombre = texto(valor.name) ?? "herramienta";
      const entrada = esRegistro(valor.input) ? valor.input : {};
      const actividad = actividadHerramientaClaude(nombre, entrada);
      if (id) {
        actividades.set(id, actividad);
      }
      progresos.push({ tipo: actividad.tipo, descripcion: actividad.iniciada, completado: false });
    }
    if (valor.type === "tool_result") {
      const id = texto(valor.tool_use_id);
      const actividad = id ? actividades.get(id) : undefined;
      const detalle = detalleResultadoClaude(valor);
      progresos.push({
        tipo: actividad?.tipo ?? TIPOS_PROGRESO.HERRAMIENTA,
        descripcion: actividad?.completada ?? "Completó una herramienta",
        ...(detalle ? { detalle } : {}),
        completado: true,
      });
    }
  }
  return progresos;
}

export class ClaudeProvider implements AdaptadorProveedor {
  readonly nombre = PROVEEDORES.CLAUDE;

  modeloConfigurado(): string | undefined {
    return leerModeloClaudeConfigurado();
  }

  async disponible(): Promise<boolean> {
    return comandoDisponible("claude", process.cwd());
  }

  async enviar(solicitud: SolicitudProveedor): Promise<ResultadoProveedor> {
    const sessionId = solicitud.sessionId ?? randomUUID();
    const prompt = solicitud.imagenes?.length
      ? `${solicitud.prompt}\n\nImágenes adjuntas. Usa la herramienta Read para verlas:\n${solicitud.imagenes.map((ruta) => `- ${ruta}`).join("\n")}`
      : solicitud.prompt;
    const argumentos = solicitud.sessionId
      ? ["-p", prompt, "--output-format", "stream-json", "--verbose", "--resume", solicitud.sessionId]
      : ["-p", prompt, "--output-format", "stream-json", "--verbose", "--session-id", sessionId];
    const programa = resolverPrograma("claude");
    const actividades = new Map<string, ActividadClaude>();
    const resultado = await ejecutarProgramaStreaming(programa.comando, [
      ...programa.argumentosIniciales,
      ...argumentos,
    ], solicitud.rutaProyecto, (linea: string) => {
      try {
        const evento: unknown = JSON.parse(linea);
        if (esRegistro(evento)) {
          for (const progreso of crearEventosProgresoClaude(evento, actividades)) {
            solicitud.alProgresar?.(progreso);
          }
        }
      } catch {
        return;
      }
    });
    const parseado = parsearRespuestaClaudeStream(resultado.stdout);
    const modelo = parseado.modelo ?? this.modeloConfigurado();
    return {
      ...parseado,
      sessionId: parseado.sessionId ?? sessionId,
      ...(modelo ? { modelo } : {}),
    };
  }
}
