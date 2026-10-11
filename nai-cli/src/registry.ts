import { existsSync, readFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ProyectoRegistrado } from "./types.js";

const DIRECTORIO_MODULO = dirname(fileURLToPath(import.meta.url));

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

function expandirUsuario(ruta: string): string {
  return ruta.replaceAll("{username}", userInfo().username);
}

export function obtenerRutasRegistry(): string[] {
  const configurada = process.env.NAI_REGISTRY;
  const raizRepo = resolve(DIRECTORIO_MODULO, "..", "..");
  return [
    configurada,
    join(homedir(), ".codex", "projects-registry.md"),
    join(homedir(), ".claude", "projects-registry.md"),
    join(raizRepo, "projects-registry.md"),
  ].filter((ruta): ruta is string => typeof ruta === "string" && ruta.length > 0);
}

export function encontrarRegistry(): string {
  const ruta = obtenerRutasRegistry().find((candidata) => existsSync(candidata));
  if (!ruta) {
    throw new Error("No encontré projects-registry.md. Configurá NAI_REGISTRY o ejecutá setup.ps1.");
  }
  return ruta;
}

export function parsearRegistry(contenido: string): ProyectoRegistrado[] {
  const proyectos: ProyectoRegistrado[] = [];
  let cliente = "";
  let rutaBase = "";

  for (const linea of contenido.split(/\r?\n/u)) {
    const encabezado = /^##\s+(.+?)\s*\|\s*(.+?)\s*$/u.exec(linea);
    if (encabezado?.[1] && encabezado[2]) {
      cliente = encabezado[1].trim();
      rutaBase = expandirUsuario(encabezado[2].trim());
      continue;
    }

    if (!rutaBase || !linea.trimStart().startsWith("|")) {
      continue;
    }

    const columnas = linea
      .trim()
      .replace(/^\|/u, "")
      .replace(/\|$/u, "")
      .split("|")
      .map((columna) => columna.trim());

    if (columnas.length < 4 || normalizar(columnas[0] ?? "") === "alias") {
      continue;
    }
    if (columnas.every((columna) => /^-+$/u.test(columna))) {
      continue;
    }

    const [alias = "", carpeta = "", stack = "", descripcion = ""] = columnas;
    if (!alias || !carpeta) {
      continue;
    }

    proyectos.push({
      alias,
      cliente,
      carpeta,
      stack,
      descripcion,
      ruta: resolve(rutaBase, carpeta),
    });
  }

  return proyectos;
}

export function cargarProyectos(rutaRegistry = encontrarRegistry()): ProyectoRegistrado[] {
  return parsearRegistry(readFileSync(rutaRegistry, "utf8"));
}

export function buscarProyecto(
  proyectos: readonly ProyectoRegistrado[],
  consulta: string,
): ProyectoRegistrado | undefined {
  const buscada = normalizar(consulta);
  const exacta = proyectos.find((proyecto) => normalizar(proyecto.alias) === buscada);
  if (exacta) {
    return exacta;
  }

  return [...proyectos]
    .sort((a, b) => b.alias.length - a.alias.length)
    .find((proyecto) => buscada.includes(normalizar(proyecto.alias)));
}

export function buscarProyectoPorRuta(
  proyectos: readonly ProyectoRegistrado[],
  rutaActual: string,
): ProyectoRegistrado | undefined {
  const actual = normalizar(resolve(rutaActual));
  return [...proyectos]
    .sort((a, b) => b.ruta.length - a.ruta.length)
    .find((proyecto) => actual === normalizar(proyecto.ruta) || actual.startsWith(`${normalizar(proyecto.ruta)}\\`));
}
