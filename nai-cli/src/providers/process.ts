import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAXIMO_SALIDA = 20 * 1024 * 1024;

export interface ProgramaEjecutable {
  comando: string;
  argumentosIniciales: string[];
}

export function resolverPrograma(nombre: "claude" | "codex"): ProgramaEjecutable {
  if (process.platform !== "win32") {
    return { comando: nombre, argumentosIniciales: [] };
  }

  const directorioNode = dirname(process.execPath);
  if (nombre === "claude") {
    const ejecutable = join(
      directorioNode,
      "node_modules",
      "@anthropic-ai",
      "claude-code",
      "bin",
      "claude.exe",
    );
    if (existsSync(ejecutable)) {
      return { comando: ejecutable, argumentosIniciales: [] };
    }
  }

  if (nombre === "codex") {
    const entrada = join(
      directorioNode,
      "node_modules",
      "@openai",
      "codex",
      "bin",
      "codex.js",
    );
    if (existsSync(entrada)) {
      return { comando: process.execPath, argumentosIniciales: [entrada] };
    }
  }

  return { comando: nombre, argumentosIniciales: [] };
}

export async function ejecutarPrograma(
  comando: string,
  argumentos: readonly string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  try {
    const resultado = await execFileAsync(comando, argumentos, {
      cwd,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    });
    return { stdout: resultado.stdout, stderr: resultado.stderr };
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null) {
      const salida = "stdout" in error && typeof error.stdout === "string" ? error.stdout : "";
      const errores = "stderr" in error && typeof error.stderr === "string" ? error.stderr : "";
      const mensaje = "message" in error && typeof error.message === "string" ? error.message : "Error desconocido";
      throw new Error([mensaje, errores, salida].filter(Boolean).join("\n"));
    }
    throw new Error(String(error));
  }
}

export async function ejecutarProgramaStreaming(
  comando: string,
  argumentos: readonly string[],
  cwd: string,
  alRecibirLinea: (linea: string) => void,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proceso = spawn(comando, argumentos, {
      cwd,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let salida = "";
    let errores = "";
    let pendiente = "";

    proceso.stdout.setEncoding("utf8");
    proceso.stderr.setEncoding("utf8");
    proceso.stdout.on("data", (fragmento: string) => {
      salida += fragmento;
      pendiente += fragmento;
      if (salida.length > MAXIMO_SALIDA) {
        proceso.kill();
        reject(new Error("La salida del proveedor superó el límite de 20 MB."));
        return;
      }

      const lineas = pendiente.split(/\r?\n/u);
      pendiente = lineas.pop() ?? "";
      for (const linea of lineas) {
        if (linea.trim()) {
          alRecibirLinea(linea);
        }
      }
    });
    proceso.stderr.on("data", (fragmento: string) => {
      errores += fragmento;
    });
    proceso.once("error", (error: Error) => reject(error));
    proceso.once("close", (codigo: number | null) => {
      if (pendiente.trim()) {
        alRecibirLinea(pendiente);
      }
      if (codigo === 0) {
        resolve({ stdout: salida, stderr: errores });
        return;
      }
      reject(
        new Error(
          [
            `El proveedor terminó con código ${codigo ?? "desconocido"}.`,
            errores.trim(),
            salida.trim(),
          ].filter(Boolean).join("\n"),
        ),
      );
    });
  });
}

export async function comandoDisponible(nombre: "claude" | "codex", cwd: string): Promise<boolean> {
  try {
    const programa = resolverPrograma(nombre);
    await ejecutarPrograma(
      programa.comando,
      [...programa.argumentosIniciales, "--version"],
      cwd,
    );
    return true;
  } catch {
    return false;
  }
}

export function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

export function numero(valor: unknown): number | undefined {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined;
}

export function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.length > 0 ? valor : undefined;
}
