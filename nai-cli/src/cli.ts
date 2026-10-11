#!/usr/bin/env node

import { existsSync } from "node:fs";
import { emitKeypressEvents } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ClaudeProvider } from "./providers/claude.provider.js";
import { CodexProvider } from "./providers/codex.provider.js";
import { crearHandoff } from "./handoff.js";
import { capturarImagenPortapapeles, extraerImagenes } from "./images.js";
import {
  buscarProyecto,
  buscarProyectoPorRuta,
  cargarProyectos,
  encontrarRegistry,
} from "./registry.js";
import { acumularUso, AlmacenEstado, esProveedor } from "./state.js";
import { InterfazTerminal } from "./ui.js";
import {
  PROVEEDORES,
  type AdaptadorProveedor,
  type EstadoNai,
  type EstadoProyecto,
  type Proveedor,
  type ProyectoRegistrado,
} from "./types.js";

const ui = new InterfazTerminal();
const VERSION_NAI = "0.2.0";

interface TeclaTerminal {
  ctrl?: boolean;
  name?: string;
}

function ayuda(): string {
  return `Nai CLI

Uso:
  nai                         Abre el último proyecto
  nai "yalo console"          Abre un proyecto por alias
  nai "yalo console" --claude Selecciona Claude
  nai "yalo console" --codex  Selecciona Codex
  nai status                  Muestra el estado guardado
  nai list                    Lista proyectos

Dentro de Nai:
  usá Claude | pasate a Codex | estado | proyectos | salir
  imagen <ruta> [pedido] | pegar imagen [pedido]`;
}

function extraerProveedor(textoEntrada: string): Proveedor | undefined {
  const normalizado = textoEntrada.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const intencion = /(?:usa|usar|cambia|cambiar|pasate|pasa|volve|volver|proveedor|motor|:)/u.test(normalizado);
  if (!intencion) {
    return undefined;
  }
  if (/\bclaude\b/u.test(normalizado)) {
    return PROVEEDORES.CLAUDE;
  }
  if (/\bcodex\b/u.test(normalizado)) {
    return PROVEEDORES.CODEX;
  }
  return undefined;
}

function esComando(textoEntrada: string, opciones: readonly string[]): boolean {
  const normalizado = textoEntrada.trim().toLocaleLowerCase("es");
  return opciones.includes(normalizado);
}

function resolverProyecto(
  argumentos: readonly string[],
  proyectos: readonly ProyectoRegistrado[],
  estado: EstadoNai,
): ProyectoRegistrado | undefined {
  const partesAlias = argumentos.filter((argumento) => !argumento.startsWith("--"));
  const consulta = partesAlias.join(" ").trim();
  if (consulta && !["status", "list", "help", "use"].includes(consulta)) {
    return buscarProyecto(proyectos, consulta);
  }
  if (estado.proyectoActivo) {
    return buscarProyecto(proyectos, estado.proyectoActivo);
  }
  return buscarProyectoPorRuta(proyectos, process.cwd());
}

function proveedorSolicitado(argumentos: readonly string[]): Proveedor | undefined {
  if (argumentos.includes("--claude")) {
    return PROVEEDORES.CLAUDE;
  }
  if (argumentos.includes("--codex")) {
    return PROVEEDORES.CODEX;
  }
  const indiceUse = argumentos.indexOf("use");
  const valor = indiceUse >= 0 ? argumentos[indiceUse + 1] : undefined;
  return valor && esProveedor(valor) ? valor : undefined;
}

function obtenerAdaptador(proveedor: Proveedor): AdaptadorProveedor {
  return proveedor === PROVEEDORES.CLAUDE ? new ClaudeProvider() : new CodexProvider();
}

function actualizarModeloConfigurado(proyecto: EstadoProyecto, proveedor: Proveedor): void {
  const modelo = obtenerAdaptador(proveedor).modeloConfigurado?.();
  if (modelo) {
    proyecto[proveedor].modelo = modelo;
  }
}

async function cambiarProveedor(
  proyecto: EstadoProyecto,
  proveedor: Proveedor,
  estado: EstadoNai,
  almacen: AlmacenEstado,
): Promise<void> {
  actualizarModeloConfigurado(proyecto, proveedor);
  if (proyecto.proveedorActivo === proveedor) {
    ui.cambioProveedor(proveedor, true);
    return;
  }
  const adaptador = obtenerAdaptador(proveedor);
  if (!(await adaptador.disponible())) {
    ui.error(`${proveedor} no está instalado o no está disponible en PATH.`);
    return;
  }
  proyecto.handoffPendiente = await crearHandoff(proyecto, proyecto.proveedorActivo, proveedor);
  proyecto.proveedorActivo = proveedor;
  estado.proveedorPredeterminado = proveedor;
  almacen.guardar(estado);
  ui.cambioProveedor(proveedor);
}

async function enviarTurno(
  promptUsuario: string,
  imagenes: readonly string[],
  proyecto: EstadoProyecto,
  estado: EstadoNai,
  almacen: AlmacenEstado,
): Promise<void> {
  const proveedor = proyecto.proveedorActivo;
  const adaptador = obtenerAdaptador(proveedor);
  if (!(await adaptador.disponible())) {
    ui.error(`${proveedor} no está disponible. Decime "usá ${proveedor === "claude" ? "Codex" : "Claude"}".`);
    return;
  }

  const sesion = proyecto[proveedor];
  const prompt = proyecto.handoffPendiente
    ? `${proyecto.handoffPendiente}\n\nSolicitud actual:\n${promptUsuario}`
    : promptUsuario;
  if (imagenes.length > 0) {
    ui.imagenesAdjuntas(imagenes);
  }
  const trabajo = ui.iniciarTrabajo(proveedor, promptUsuario);

  try {
    const resultado = await adaptador.enviar({
      prompt,
      rutaProyecto: proyecto.ruta,
      ...(sesion.sessionId ? { sessionId: sesion.sessionId } : {}),
      ...(imagenes.length > 0 ? { imagenes } : {}),
      alProgresar: (evento) => trabajo.progreso(evento),
    });
    trabajo.finalizar();
    ui.respuesta(proveedor, resultado.texto);
    if (resultado.sessionId) {
      sesion.sessionId = resultado.sessionId;
    }
    if (resultado.modelo) {
      sesion.modelo = resultado.modelo;
    }
    sesion.uso = acumularUso(sesion.uso, resultado.uso);
    sesion.actualizadoEn = new Date().toISOString();
    delete proyecto.handoffPendiente;
    proyecto.turnos.push({
      proveedor,
      solicitud: promptUsuario,
      ...(imagenes.length > 0 ? { imagenes: [...imagenes] } : {}),
      respuesta: resultado.texto,
      fecha: new Date().toISOString(),
    });
    proyecto.turnos = proyecto.turnos.slice(-20);
    almacen.guardar(estado);
  } catch (error: unknown) {
    trabajo.finalizar();
    ui.error(error instanceof Error ? error.message : String(error));
  }
}

async function iniciarRepl(
  proyecto: EstadoProyecto,
  estado: EstadoNai,
  almacen: AlmacenEstado,
  proyectos: readonly ProyectoRegistrado[],
): Promise<void> {
  const lector = createInterface({ input: stdin, output: stdout });
  ui.cabecera(proyecto);

  const procesarEntrada = async (
    entradaCruda: string,
    imagenesPegadas: readonly string[] = [],
  ): Promise<boolean> => {
    const entradaSinMarcadores = entradaCruda.replace(/\[imagen \d+\]\s*/giu, "").trim();
    const entrada = entradaSinMarcadores || (imagenesPegadas.length > 0 ? "Analiza esta imagen." : "");
    if (!entrada && imagenesPegadas.length === 0) {
      return true;
    }
    if (esComando(entrada, ["salir", "exit", "quit", ":q"])) {
      return false;
    }
    if (esComando(entrada, ["ayuda", "help", "?"])) {
      ui.texto(ayuda());
      return true;
    }
    if (esComando(entrada, ["estado", "status"])) {
      ui.estado(proyecto);
      return true;
    }
    if (esComando(entrada, ["proyectos", "list", "lista proyectos"])) {
      ui.proyectos(proyectos);
      return true;
    }
    const proveedor = extraerProveedor(entrada);
    if (proveedor) {
      await cambiarProveedor(proyecto, proveedor, estado, almacen);
      return true;
    }

    const pegarImagen = /^(?:pega|pegar)\s+imagen(?:\s+(.+))?$/iu.exec(entrada);
    let promptUsuario = entrada;
    let imagenes: string[] = [...imagenesPegadas];
    if (pegarImagen) {
      try {
        imagenes.push(await capturarImagenPortapapeles());
        promptUsuario = pegarImagen[1]?.trim() || "Analiza esta imagen.";
      } catch (error: unknown) {
        ui.error(error instanceof Error ? error.message : String(error));
        return true;
      }
    } else {
      const entradaConImagenes = extraerImagenes(entrada, proyecto.ruta);
      if (entradaConImagenes.rutasInvalidas.length > 0) {
        ui.error(`No encontré la imagen: ${entradaConImagenes.rutasInvalidas.join(", ")}`);
        return true;
      }
      promptUsuario = entradaConImagenes.prompt;
      imagenes.push(...entradaConImagenes.imagenes);
    }

    await enviarTurno(promptUsuario, imagenes, proyecto, estado, almacen);
    return true;
  };

  try {
    if (!stdin.isTTY) {
      for await (const entrada of lector) {
        if (!(await procesarEntrada(entrada))) {
          break;
        }
      }
      return;
    }

    emitKeypressEvents(stdin, lector);
    let imagenesPegadas: string[] = [];
    let capturasPendientes: Promise<void>[] = [];
    let esperandoEntrada = false;
    const pegarDesdePortapapeles = (_caracter: string | undefined, tecla: TeclaTerminal): void => {
      if (!esperandoEntrada || !tecla.ctrl || tecla.name !== "v") {
        return;
      }
      const captura = capturarImagenPortapapeles()
        .then((ruta: string) => {
          imagenesPegadas.push(ruta);
          if (esperandoEntrada) {
            lector.write(`[imagen ${imagenesPegadas.length}] `);
          }
        })
        .catch(() => undefined);
      capturasPendientes.push(captura);
    };
    stdin.on("keypress", pegarDesdePortapapeles);

    try {
      while (true) {
        esperandoEntrada = true;
        const respuestaPendiente = lector.question(ui.prompt(proyecto));
        ui.mostrarPiePrompt(proyecto);
        const entrada = await respuestaPendiente;
        esperandoEntrada = false;
        ui.ocultarPiePrompt();
        await Promise.all(capturasPendientes);
        const adjuntos = imagenesPegadas;
        imagenesPegadas = [];
        capturasPendientes = [];
        if (!(await procesarEntrada(entrada, adjuntos))) {
          break;
        }
      }
    } finally {
      stdin.off("keypress", pegarDesdePortapapeles);
    }
  } finally {
    lector.close();
    if (stdin.isTTY) {
      ui.despedida();
    }
  }
}

async function main(): Promise<void> {
  const argumentos = process.argv.slice(2);
  if (argumentos.includes("--version") || argumentos.includes("-v")) {
    ui.texto(`nai ${VERSION_NAI}`);
    return;
  }
  if (argumentos.includes("--help") || argumentos.includes("-h") || argumentos[0] === "help") {
    ui.texto(ayuda());
    return;
  }

  const rutaRegistry = encontrarRegistry();
  const proyectos = cargarProyectos(rutaRegistry);
  const almacen = new AlmacenEstado();
  const estado = almacen.cargar();

  if (argumentos[0] === "list") {
    ui.proyectos(proyectos);
    return;
  }
  if (argumentos[0] === "status") {
    const proyectoActivo = estado.proyectoActivo
      ? estado.proyectos[estado.proyectoActivo]
      : undefined;
    if (!proyectoActivo) {
      ui.texto("Nai todavía no tiene un proyecto activo.");
      return;
    }
    ui.estado(proyectoActivo);
    return;
  }

  const proyectoRegistrado = resolverProyecto(argumentos, proyectos, estado);
  if (!proyectoRegistrado) {
    ui.error(`No reconocí el proyecto. Registry activo: ${rutaRegistry}`);
    ui.texto('Probá "nai list" o "nai \"yalo console\"".');
    process.exitCode = 1;
    return;
  }
  if (!existsSync(proyectoRegistrado.ruta)) {
    ui.error(`La ruta registrada no existe: ${proyectoRegistrado.ruta}`);
    process.exitCode = 1;
    return;
  }

  const proyecto = almacen.obtenerProyecto(estado, proyectoRegistrado);
  estado.proyectoActivo = proyecto.alias;
  const solicitado = proveedorSolicitado(argumentos);
  if (solicitado) {
    await cambiarProveedor(proyecto, solicitado, estado, almacen);
  }
  actualizarModeloConfigurado(proyecto, proyecto.proveedorActivo);
  almacen.guardar(estado);
  await iniciarRepl(proyecto, estado, almacen, proyectos);
}

await main().catch((error: unknown) => {
  ui.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
