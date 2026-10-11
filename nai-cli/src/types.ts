export const PROVEEDORES = {
  CLAUDE: "claude",
  CODEX: "codex",
} as const;

export type Proveedor = (typeof PROVEEDORES)[keyof typeof PROVEEDORES];

export const TIPOS_PROGRESO = {
  ANALISIS: "analisis",
  COMANDO: "comando",
  HERRAMIENTA: "herramienta",
  ARCHIVO: "archivo",
  WEB: "web",
  ERROR: "error",
} as const;

export type TipoProgreso = (typeof TIPOS_PROGRESO)[keyof typeof TIPOS_PROGRESO];

export interface EventoProgreso {
  tipo: TipoProgreso;
  descripcion: string;
  detalle?: string;
  completado: boolean;
}

export interface ProyectoRegistrado {
  alias: string;
  cliente: string;
  carpeta: string;
  stack: string;
  descripcion: string;
  ruta: string;
}

export interface UsoProveedor {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  contextTokens?: number;
  contextWindow?: number;
  costUsd?: number;
  rateLimitUsedPercent?: number;
}

export interface SesionProveedor {
  sessionId?: string;
  modelo?: string;
  uso: UsoProveedor;
  actualizadoEn: string;
}

export interface TurnoGuardado {
  proveedor: Proveedor;
  solicitud: string;
  imagenes?: string[];
  respuesta: string;
  fecha: string;
}

export interface EstadoProyecto {
  alias: string;
  ruta: string;
  proveedorActivo: Proveedor;
  claude: SesionProveedor;
  codex: SesionProveedor;
  turnos: TurnoGuardado[];
  handoffPendiente?: string;
}

export interface EstadoNai {
  version: 1;
  proyectoActivo?: string;
  proveedorPredeterminado: Proveedor;
  proyectos: Record<string, EstadoProyecto>;
}

export interface ResultadoProveedor {
  sessionId?: string;
  texto: string;
  modelo?: string;
  uso: Partial<UsoProveedor>;
}

export interface SolicitudProveedor {
  prompt: string;
  rutaProyecto: string;
  sessionId?: string;
  imagenes?: readonly string[];
  alProgresar?: (evento: EventoProgreso) => void;
}

export interface AdaptadorProveedor {
  readonly nombre: Proveedor;
  disponible(): Promise<boolean>;
  modeloConfigurado?(): string | undefined;
  enviar(solicitud: SolicitudProveedor): Promise<ResultadoProveedor>;
}

export function crearUsoVacio(): UsoProveedor {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
  };
}
