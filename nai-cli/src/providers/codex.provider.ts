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

interface AcumuladorCodex {
  sessionId?: string;
  mensajes: string[];
  modelo?: string;
  uso: Partial<UsoProveedor>;
}

export function parsearModeloCodex(configuracion: string): string | undefined {
  return /^\s*model\s*=\s*["']([^"']+)["']/mu.exec(configuracion)?.[1];
}

function leerModeloCodexConfigurado(): string | undefined {
  const raizCodex = process.env.CODEX_HOME ?? join(homedir(), ".codex");
  try {
    return parsearModeloCodex(readFileSync(join(raizCodex, "config.toml"), "utf8"));
  } catch {
    return undefined;
  }
}

function contarLineas(valor: string): number {
  return valor.trim() ? valor.trim().split(/\r?\n/u).length : 0;
}

function describirHerramienta(item: Record<string, unknown>): string {
  const servidor = texto(item.server) ?? texto(item.server_name);
  const herramienta = texto(item.tool) ?? texto(item.tool_name) ?? "herramienta";
  return servidor ? `${servidor}.${herramienta}` : herramienta;
}

export function crearEventoProgresoCodex(evento: Record<string, unknown>): EventoProgreso | undefined {
  const tipoEvento = texto(evento.type);
  if (tipoEvento === "turn.started") {
    return {
      tipo: TIPOS_PROGRESO.ANALISIS,
      descripcion: "Preparando contexto",
      completado: false,
    };
  }
  if (tipoEvento === "error") {
    return {
      tipo: TIPOS_PROGRESO.ERROR,
      descripcion: texto(evento.message) ?? "Codex reportó un error",
      completado: true,
    };
  }
  if ((tipoEvento !== "item.started" && tipoEvento !== "item.completed") || !esRegistro(evento.item)) {
    return undefined;
  }

  const item = evento.item;
  const completado = tipoEvento === "item.completed";
  const tipoItem = texto(item.type);
  if (tipoItem === "agent_message") {
    return undefined;
  }
  if (tipoItem === "reasoning") {
    const resumen = texto(item.text) ?? texto(item.summary);
    return resumen
      ? { tipo: TIPOS_PROGRESO.ANALISIS, descripcion: resumen, completado }
      : undefined;
  }
  if (tipoItem === "command_execution") {
    const comando = texto(item.command) ?? "comando";
    const salida = texto(item.aggregated_output) ?? texto(item.output) ?? "";
    const codigo = numero(item.exit_code);
    const lineas = contarLineas(salida);
    const detalles = [
      lineas > 0 ? `${lineas} ${lineas === 1 ? "línea" : "líneas"}` : undefined,
      codigo !== undefined ? `código ${codigo}` : undefined,
    ].filter((valor): valor is string => valor !== undefined);
    return {
      tipo: TIPOS_PROGRESO.COMANDO,
      descripcion: `${completado ? "Ejecutó" : "Ejecutando"} ${comando}`,
      ...(detalles.length > 0 ? { detalle: detalles.join(" · ") } : {}),
      completado,
    };
  }
  if (tipoItem === "mcp_tool_call") {
    return {
      tipo: TIPOS_PROGRESO.HERRAMIENTA,
      descripcion: `${completado ? "Usó" : "Usando"} ${describirHerramienta(item)}`,
      completado,
    };
  }
  if (tipoItem === "web_search") {
    const consulta = texto(item.query) ?? "la web";
    return {
      tipo: TIPOS_PROGRESO.WEB,
      descripcion: `${completado ? "Buscó" : "Buscando"} ${consulta}`,
      completado,
    };
  }
  if (tipoItem === "file_change") {
    const cambios = Array.isArray(item.changes) ? item.changes : [];
    const rutas = cambios
      .filter(esRegistro)
      .map((cambio) => texto(cambio.path))
      .filter((ruta): ruta is string => ruta !== undefined);
    return {
      tipo: TIPOS_PROGRESO.ARCHIVO,
      descripcion: rutas.length > 0 ? `Modificó ${rutas.join(", ")}` : "Modificó archivos",
      completado,
    };
  }
  if (tipoItem === "todo_list") {
    return {
      tipo: TIPOS_PROGRESO.ANALISIS,
      descripcion: "Actualizó el plan",
      completado,
    };
  }
  if (tipoItem === "error") {
    return {
      tipo: TIPOS_PROGRESO.ERROR,
      descripcion: texto(item.message) ?? "Codex reportó un error",
      completado: true,
    };
  }
  return undefined;
}

function procesarEvento(evento: Record<string, unknown>, acumulador: AcumuladorCodex): void {
  const tipo = texto(evento.type);
  if (tipo === "thread.started") {
    const sessionId = texto(evento.thread_id);
    if (sessionId) {
      acumulador.sessionId = sessionId;
    }
  }

  if (tipo === "item.completed" && esRegistro(evento.item)) {
    const item = evento.item;
    if (item.type === "agent_message" && texto(item.text)) {
      acumulador.mensajes.push(texto(item.text) ?? "");
    }
  }

  if ((tipo === "turn.completed" || tipo === "token_count") && esRegistro(evento.usage)) {
    const uso = evento.usage;
    const inputTokens = numero(uso.input_tokens) ?? acumulador.uso.inputTokens ?? 0;
    const outputTokens = numero(uso.output_tokens) ?? acumulador.uso.outputTokens ?? 0;
    const totalTokens = numero(uso.total_tokens) ?? inputTokens + outputTokens;
    acumulador.uso = {
      inputTokens,
      cachedInputTokens: numero(uso.cached_input_tokens) ?? acumulador.uso.cachedInputTokens ?? 0,
      outputTokens,
      reasoningTokens: numero(uso.reasoning_output_tokens) ?? acumulador.uso.reasoningTokens ?? 0,
      totalTokens,
      contextTokens: totalTokens,
    };
  }

  const modelo = texto(evento.model);
  if (modelo) {
    acumulador.modelo = modelo;
  }
  const ventana = numero(evento.model_context_window);
  if (ventana !== undefined) {
    acumulador.uso.contextWindow = ventana;
  }
}

export function parsearRespuestaCodex(salida: string): ResultadoProveedor {
  const acumulador: AcumuladorCodex = { mensajes: [], uso: {} };
  for (const linea of salida.split(/\r?\n/u)) {
    if (!linea.trim()) {
      continue;
    }
    try {
      const evento: unknown = JSON.parse(linea);
      if (esRegistro(evento)) {
        procesarEvento(evento, acumulador);
      }
    } catch {
      continue;
    }
  }

  return {
    ...(acumulador.sessionId ? { sessionId: acumulador.sessionId } : {}),
    texto: acumulador.mensajes.join("\n\n") || "Codex terminó sin devolver texto.",
    ...(acumulador.modelo ? { modelo: acumulador.modelo } : {}),
    uso: acumulador.uso,
  };
}

export class CodexProvider implements AdaptadorProveedor {
  readonly nombre = PROVEEDORES.CODEX;

  modeloConfigurado(): string | undefined {
    return leerModeloCodexConfigurado();
  }

  async disponible(): Promise<boolean> {
    return comandoDisponible("codex", process.cwd());
  }

  async enviar(solicitud: SolicitudProveedor): Promise<ResultadoProveedor> {
    const argumentosImagenes = (solicitud.imagenes ?? []).flatMap((ruta) => ["-i", ruta]);
    const argumentos = solicitud.sessionId
      ? ["exec", "resume", "--json", ...argumentosImagenes, solicitud.sessionId, solicitud.prompt]
      : ["exec", "--json", "-C", solicitud.rutaProyecto, ...argumentosImagenes, solicitud.prompt];
    const programa = resolverPrograma("codex");
    const resultado = await ejecutarProgramaStreaming(programa.comando, [
      ...programa.argumentosIniciales,
      ...argumentos,
    ], solicitud.rutaProyecto, (linea: string) => {
      try {
        const evento: unknown = JSON.parse(linea);
        if (esRegistro(evento)) {
          const progreso = crearEventoProgresoCodex(evento);
          if (progreso) {
            solicitud.alProgresar?.(progreso);
          }
        }
      } catch {
        return;
      }
    });
    const parseado = parsearRespuestaCodex(resultado.stdout);
    const modelo = parseado.modelo ?? this.modeloConfigurado();
    return { ...parseado, ...(modelo ? { modelo } : {}) };
  }
}
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
