import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  PROVEEDORES,
  crearUsoVacio,
  type EstadoNai,
  type EstadoProyecto,
  type Proveedor,
  type ProyectoRegistrado,
  type SesionProveedor,
  type UsoProveedor,
} from "./types.js";

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

function crearSesion(): SesionProveedor {
  return {
    uso: crearUsoVacio(),
    actualizadoEn: new Date(0).toISOString(),
  };
}

export function crearEstadoInicial(): EstadoNai {
  return {
    version: 1,
    proveedorPredeterminado: PROVEEDORES.CODEX,
    proyectos: {},
  };
}

export class AlmacenEstado {
  readonly ruta: string;

  constructor(ruta = process.env.NAI_STATE_PATH ?? join(homedir(), ".nai", "state.json")) {
    this.ruta = ruta;
  }

  cargar(): EstadoNai {
    if (!existsSync(this.ruta)) {
      return crearEstadoInicial();
    }

    try {
      const valor: unknown = JSON.parse(readFileSync(this.ruta, "utf8"));
      if (!esRegistro(valor) || valor.version !== 1 || !esRegistro(valor.proyectos)) {
        return crearEstadoInicial();
      }
      return valor as unknown as EstadoNai;
    } catch {
      return crearEstadoInicial();
    }
  }

  guardar(estado: EstadoNai): void {
    mkdirSync(dirname(this.ruta), { recursive: true });
    writeFileSync(this.ruta, `${JSON.stringify(estado, null, 2)}\n`, "utf8");
  }

  obtenerProyecto(estado: EstadoNai, proyecto: ProyectoRegistrado): EstadoProyecto {
    const existente = estado.proyectos[proyecto.alias];
    if (existente) {
      existente.ruta = proyecto.ruta;
      return existente;
    }

    const creado: EstadoProyecto = {
      alias: proyecto.alias,
      ruta: proyecto.ruta,
      proveedorActivo: estado.proveedorPredeterminado,
      claude: crearSesion(),
      codex: crearSesion(),
      turnos: [],
    };
    estado.proyectos[proyecto.alias] = creado;
    return creado;
  }
}

export function acumularUso(actual: UsoProveedor, nuevo: Partial<UsoProveedor>): UsoProveedor {
  return {
    inputTokens: actual.inputTokens + (nuevo.inputTokens ?? 0),
    cachedInputTokens: actual.cachedInputTokens + (nuevo.cachedInputTokens ?? 0),
    outputTokens: actual.outputTokens + (nuevo.outputTokens ?? 0),
    reasoningTokens: actual.reasoningTokens + (nuevo.reasoningTokens ?? 0),
    totalTokens: actual.totalTokens + (nuevo.totalTokens ?? 0),
    ...(nuevo.contextTokens !== undefined ? { contextTokens: nuevo.contextTokens } : {}),
    ...(nuevo.contextWindow !== undefined ? { contextWindow: nuevo.contextWindow } : {}),
    ...(nuevo.costUsd !== undefined ? { costUsd: (actual.costUsd ?? 0) + nuevo.costUsd } : {}),
    ...(nuevo.rateLimitUsedPercent !== undefined
      ? { rateLimitUsedPercent: nuevo.rateLimitUsedPercent }
      : {}),
  };
}

export function esProveedor(valor: string): valor is Proveedor {
  return valor === PROVEEDORES.CLAUDE || valor === PROVEEDORES.CODEX;
}
