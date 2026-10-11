import { stderr, stdout } from "node:process";
import { clearLine, cursorTo, moveCursor } from "node:readline";
import { formatearEstado, porcentajeContexto, resumirSesionActiva } from "./status.js";
import { TIPOS_PROGRESO } from "./types.js";
import type { EstadoProyecto, EventoProgreso, Proveedor, ProyectoRegistrado } from "./types.js";

const COLOR = {
  reset: "\u001B[0m",
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  cyan: "\u001B[38;5;45m",
  cyanSoft: "\u001B[38;5;80m",
  violet: "\u001B[38;5;141m",
  green: "\u001B[38;5;84m",
  yellow: "\u001B[38;5;221m",
  red: "\u001B[38;5;203m",
  gray: "\u001B[38;5;245m",
  white: "\u001B[38;5;255m",
} as const;

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

export const SATURNO_ASCII = [
  "                              _.oo.",
  "              _.u[[/;:,.  .odMMMM'",
  "           .o888UU[[[/;-.      MMM^",
  "          dNMMN888UU[[/;-.   .dP^",
  "         ,MMMNN888UU[[/;. .o@^",
  "         888888UU[[[/o@^-..",
  "      .@^ YUU[[[/o@^;::--..",
  "    oMP    ^/o@P^;:::--..",
  " .dMMM   .o@^   `^^^^",
  "YMMMUP^",
] as const;

export interface ControlTrabajo {
  progreso(evento: EventoProgreso): void;
  finalizar(): void;
}

function limitar(texto: string, maximo: number): string {
  return texto.length <= maximo ? texto : `${texto.slice(0, Math.max(0, maximo - 1))}…`;
}

function textoPromptPlano(proyecto: EstadoProyecto): string {
  return `nai/${proyecto.proveedorActivo} ❯ `;
}

export class InterfazTerminal {
  private readonly usaColor = stdout.isTTY && process.env.NO_COLOR === undefined;

  private pintar(texto: string, color: string): string {
    return this.usaColor ? `${color}${texto}${COLOR.reset}` : texto;
  }

  texto(mensaje = ""): void {
    stdout.write(`${mensaje}\n`);
  }

  error(mensaje: string): void {
    stderr.write(`${this.pintar("✕", COLOR.red)} ${this.pintar(mensaje, COLOR.red)}\n`);
  }

  cabecera(proyecto: EstadoProyecto): void {
    const proveedor = proyecto.proveedorActivo.toUpperCase();
    const columnas = stdout.columns ?? 80;
    const anchoArte = Math.max(...SATURNO_ASCII.map((linea) => linea.length));
    const anchoPanel = 36;
    const anchoContenido = anchoPanel - 4;
    const bordeSuperior = this.pintar(`╭${"─".repeat(anchoPanel - 2)}╮`, COLOR.cyanSoft);
    const bordeInferior = this.pintar(`╰${"─".repeat(anchoPanel - 2)}╯`, COLOR.cyanSoft);
    const lineaPanel = (etiqueta: string, valor: string, colorValor: string = COLOR.white): string => {
      const etiquetaVisible = etiqueta.padEnd(9);
      const valorVisible = limitar(valor, anchoContenido - etiquetaVisible.length).padEnd(
        anchoContenido - etiquetaVisible.length,
      );
      return `${this.pintar("│ ", COLOR.cyanSoft)}${this.pintar(etiquetaVisible, COLOR.gray)}${this.pintar(valorVisible, colorValor)}${this.pintar(" │", COLOR.cyanSoft)}`;
    };
    const panel = [
      bordeSuperior,
      `${this.pintar("│ ", COLOR.cyanSoft)}${this.pintar("NAI", `${COLOR.bold}${COLOR.cyan}`)}${this.pintar("  CONTROL PLANE".padEnd(anchoContenido - 3), COLOR.dim)}${this.pintar(" │", COLOR.cyanSoft)}`,
      `${this.pintar("│ ", COLOR.cyanSoft)}${" ".repeat(anchoContenido)}${this.pintar(" │", COLOR.cyanSoft)}`,
      lineaPanel("PROYECTO", proyecto.alias, `${COLOR.bold}${COLOR.white}`),
      lineaPanel("MOTOR", `● ${proveedor}`, this.colorProveedor(proyecto.proveedorActivo)),
      lineaPanel("ESTADO", "DISPONIBLE", COLOR.green),
      bordeInferior,
    ];

    this.texto();
    if (columnas >= anchoArte + anchoPanel + 3) {
      const inicioPanel = 1;
      for (let indice = 0; indice < SATURNO_ASCII.length; indice += 1) {
        const arte = SATURNO_ASCII[indice] ?? "";
        const detalle = panel[indice - inicioPanel] ?? "";
        this.texto(`${this.pintar(arte.padEnd(anchoArte), COLOR.cyanSoft)}   ${detalle}`.trimEnd());
      }
    } else {
      this.texto(`${this.pintar("NAI", `${COLOR.bold}${COLOR.cyan}`)} ${this.pintar("/", COLOR.gray)} ${this.pintar(proyecto.alias, `${COLOR.bold}${COLOR.white}`)}`);
      this.texto(`${this.pintar(`● ${proveedor}`, this.colorProveedor(proyecto.proveedorActivo))}  ${this.pintar("DISPONIBLE", COLOR.green)}`);
    }

    const anchoSeparador = Math.min(72, Math.max(28, columnas - 4));
    this.texto(this.pintar(`  ${"─".repeat(anchoSeparador)}`, COLOR.gray));
    this.texto(`  ${this.pintar("COMENZÁ", `${COLOR.bold}${COLOR.cyan}`)}  ${this.pintar("escribí una tarea para el agente", COLOR.white)}`);
    this.texto(`  ${this.pintar("Ctrl+V", COLOR.cyanSoft)} ${this.pintar("imagen", COLOR.dim)}  ${this.pintar("·", COLOR.gray)}  ${this.pintar("arrastrá", COLOR.cyanSoft)} ${this.pintar("archivos", COLOR.dim)}  ${this.pintar("·", COLOR.gray)}  ${this.pintar("?", COLOR.cyanSoft)} ${this.pintar("ayuda", COLOR.dim)}`);
    this.texto();
  }

  prompt(proyecto: EstadoProyecto): string {
    const proveedor = proyecto.proveedorActivo;
    const marca = this.pintar("nai", `${COLOR.bold}${COLOR.cyanSoft}`);
    const motor = this.pintar(proveedor, this.colorProveedor(proveedor));
    return `${marca}${this.pintar("/", COLOR.gray)}${motor} ${this.pintar("❯", COLOR.cyan)} `;
  }

  mostrarPiePrompt(proyecto: EstadoProyecto): void {
    if (!stdout.isTTY) {
      return;
    }

    const resumen = limitar(resumirSesionActiva(proyecto), Math.max(24, (stdout.columns ?? 80) - 5));
    stdout.write(`\n  ${this.pintar("└─", COLOR.gray)} ${this.pintar(resumen, COLOR.dim)}`);
    moveCursor(stdout, 0, -1);
    cursorTo(stdout, textoPromptPlano(proyecto).length);
  }

  ocultarPiePrompt(): void {
    if (!stdout.isTTY) {
      return;
    }

    clearLine(stdout, 0);
    cursorTo(stdout, 0);
  }

  cambioProveedor(proveedor: Proveedor, yaActivo = false): void {
    const nombre = proveedor === "claude" ? "Claude" : "Codex";
    const simbolo = yaActivo ? "●" : "↻";
    const detalle = yaActivo ? "ya estaba activo" : "motor cambiado";
    this.texto(
      `${this.pintar(simbolo, this.colorProveedor(proveedor))} ${this.pintar(nombre, COLOR.bold)} ${this.pintar(`· ${detalle}`, COLOR.dim)}`,
    );
  }

  imagenesAdjuntas(imagenes: readonly string[]): void {
    const nombres = imagenes.map((ruta) => ruta.split(/[\\/]/u).pop() ?? ruta);
    const cantidad = imagenes.length;
    this.texto(
      `${this.pintar("▣", COLOR.cyan)} ${this.pintar(`${cantidad} ${cantidad === 1 ? "imagen adjunta" : "imágenes adjuntas"}`, COLOR.bold)} ${this.pintar(`· ${nombres.join(", ")}`, COLOR.dim)}`,
    );
  }

  iniciarTrabajo(proveedor: Proveedor, tarea: string): ControlTrabajo {
    const nombre = proveedor === "claude" ? "Claude" : "Codex";
    const inicio = Date.now();
    const tareaLimpia = tarea.replace(/\s+/gu, " ").trim();
    if (!stdout.isTTY) {
      this.texto(`${nombre} está trabajando en: ${tareaLimpia}`);
      return {
        progreso: (evento: EventoProgreso): void => {
          if (evento.completado) {
            this.texto(`- ${evento.descripcion}${evento.detalle ? ` (${evento.detalle})` : ""}`);
          }
        },
        finalizar: (): void => undefined,
      };
    }

    let indice = 0;
    let actividad = "Analizando la solicitud";
    this.texto(
      `${this.pintar("●", this.colorProveedor(proveedor))} ${this.pintar(nombre, COLOR.bold)} ${this.pintar(`· ${limitar(tareaLimpia, Math.max(24, (stdout.columns ?? 80) - nombre.length - 7))}`, COLOR.dim)}`,
    );

    const renderizar = (): void => {
      const cuadro = SPINNER[indice % SPINNER.length] ?? "·";
      indice += 1;
      const segundos = Math.floor((Date.now() - inicio) / 1000);
      const espacioFijo = segundos.toString().length + 12;
      const descripcion = limitar(actividad, Math.max(18, (stdout.columns ?? 80) - espacioFijo));
      stdout.write(
        `\r\u001B[2K  ${this.pintar(cuadro, this.colorProveedor(proveedor))} ${this.pintar(descripcion, COLOR.dim)} ${this.pintar(`· ${segundos}s`, COLOR.gray)}`,
      );
    };
    renderizar();
    const temporizador = setInterval(renderizar, 80);
    return {
      progreso: (evento: EventoProgreso): void => {
        actividad = evento.descripcion;
        if (!evento.completado) {
          renderizar();
          return;
        }

        stdout.write("\r\u001B[2K");
        const simbolo = evento.tipo === TIPOS_PROGRESO.ERROR ? "✕" : "├";
        const color = evento.tipo === TIPOS_PROGRESO.ERROR ? COLOR.red : COLOR.green;
        this.texto(`  ${this.pintar(simbolo, color)} ${limitar(evento.descripcion, Math.max(24, (stdout.columns ?? 80) - 6))}`);
        if (evento.detalle) {
          this.texto(`  ${this.pintar("│", COLOR.gray)} ${this.pintar(limitar(evento.detalle, Math.max(24, (stdout.columns ?? 80) - 6)), COLOR.dim)}`);
        }
        actividad = "Continuando";
        renderizar();
      },
      finalizar: (): void => {
        clearInterval(temporizador);
        stdout.write("\r\u001B[2K");
        const segundos = Math.floor((Date.now() - inicio) / 1000);
        this.texto(`  ${this.pintar("└", COLOR.green)} ${this.pintar(`Listo · ${segundos}s`, COLOR.dim)}`);
        this.texto();
      },
    };
  }

  respuesta(proveedor: Proveedor, contenido: string): void {
    const nombre = proveedor === "claude" ? "CLAUDE" : "CODEX";
    this.texto(`${this.pintar("◆", this.colorProveedor(proveedor))} ${this.pintar(nombre, COLOR.bold)}`);
    this.texto();
    for (const linea of contenido.trim().split(/\r?\n/u)) {
      this.texto(linea ? `  ${linea}` : "");
    }
    this.texto();
  }

  estado(proyecto: EstadoProyecto): void {
    if (!stdout.isTTY) {
      this.texto(formatearEstado(proyecto));
      return;
    }

    const activo = proyecto[proyecto.proveedorActivo];
    const porcentaje = porcentajeContexto(activo.uso);
    const anchoBarra = 22;
    const llenos = porcentaje === undefined ? 0 : Math.round((porcentaje / 100) * anchoBarra);
    const barra = porcentaje === undefined
      ? "░".repeat(anchoBarra)
      : `${"█".repeat(llenos)}${"░".repeat(anchoBarra - llenos)}`;
    const uso = porcentaje === undefined ? "sin dato" : `${porcentaje.toFixed(1)}%`;

    this.texto();
    this.texto(this.pintar("ESTADO DE NAI", `${COLOR.bold}${COLOR.cyan}`));
    this.texto(`${this.pintar("Proyecto", COLOR.gray)}   ${proyecto.alias}`);
    this.texto(`${this.pintar("Motor", COLOR.gray)}      ${this.pintar(proyecto.proveedorActivo.toUpperCase(), this.colorProveedor(proyecto.proveedorActivo))}`);
    this.texto(`${this.pintar("Contexto", COLOR.gray)}   ${this.pintar(barra, porcentaje !== undefined && porcentaje >= 80 ? COLOR.yellow : COLOR.green)}  ${uso}`);
    this.texto(`${this.pintar("Claude", COLOR.gray)}     ${proyecto.claude.uso.totalTokens.toLocaleString("es-GT")} tokens`);
    this.texto(`${this.pintar("Codex", COLOR.gray)}      ${proyecto.codex.uso.totalTokens.toLocaleString("es-GT")} tokens`);
    if (activo.uso.costUsd !== undefined) {
      this.texto(`${this.pintar("Costo", COLOR.gray)}      $${activo.uso.costUsd.toFixed(4)}`);
    }
    this.texto();
  }

  proyectos(proyectos: readonly ProyectoRegistrado[]): void {
    const aliasMaximo = Math.min(28, Math.max(...proyectos.map((proyecto) => proyecto.alias.length)));
    this.texto();
    this.texto(this.pintar("PROYECTOS", `${COLOR.bold}${COLOR.cyan}`));
    for (const proyecto of proyectos) {
      const alias = limitar(proyecto.alias, aliasMaximo).padEnd(aliasMaximo);
      this.texto(`  ${this.pintar(alias, COLOR.white)}  ${this.pintar(proyecto.stack, COLOR.dim)}`);
    }
    this.texto();
  }

  despedida(): void {
    this.texto(this.pintar("Sesión guardada. Nos vemos.", COLOR.dim));
  }

  private colorProveedor(proveedor: Proveedor): string {
    return proveedor === "claude" ? COLOR.cyan : COLOR.cyanSoft;
  }
}
