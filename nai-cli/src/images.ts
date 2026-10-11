import { execFile } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);
const PATRON_IMAGEN = /(?:^|\s)@?(?:"([^"]+\.(?:png|jpe?g|gif|webp|bmp))"|'([^']+\.(?:png|jpe?g|gif|webp|bmp))'|(\S+\.(?:png|jpe?g|gif|webp|bmp)))(?=\s|$)/giu;

export interface EntradaConImagenes {
  prompt: string;
  imagenes: string[];
  rutasInvalidas: string[];
}

export function extraerImagenes(entrada: string, rutaBase: string): EntradaConImagenes {
  const imagenes: string[] = [];
  const rutasInvalidas: string[] = [];
  const prompt = entrada.replace(
    PATRON_IMAGEN,
    (coincidencia: string, doble: string | undefined, simple: string | undefined, directa: string | undefined) => {
      const valor = doble ?? simple ?? directa;
      if (!valor) {
        return coincidencia;
      }
      const ruta = isAbsolute(valor) ? valor : resolve(rutaBase, valor);
      if (existsSync(ruta) && statSync(ruta).isFile()) {
        if (!imagenes.includes(ruta)) {
          imagenes.push(ruta);
        }
      } else {
        rutasInvalidas.push(ruta);
      }
      return " ";
    },
  ).replace(/^\s*imagen\s*/iu, "").replace(/\s+/gu, " ").trim();

  return {
    prompt: prompt || "Analiza esta imagen.",
    imagenes,
    rutasInvalidas,
  };
}

export async function capturarImagenPortapapeles(): Promise<string> {
  if (process.platform !== "win32") {
    throw new Error("La captura del portapapeles está disponible en Windows; arrastrá el archivo al prompt.");
  }

  const directorio = join(homedir(), ".nai", "uploads");
  mkdirSync(directorio, { recursive: true });
  const ruta = join(directorio, `${randomUUID()}.png`);
  const rutaPowerShell = ruta.replace(/'/gu, "''");
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    "Add-Type -AssemblyName System.Drawing",
    "if (-not [Windows.Forms.Clipboard]::ContainsImage()) { throw 'El portapapeles no contiene una imagen.' }",
    `$imagen = [Windows.Forms.Clipboard]::GetImage()`,
    `$imagen.Save('${rutaPowerShell}', [System.Drawing.Imaging.ImageFormat]::Png)`,
    "$imagen.Dispose()",
  ].join("; ");

  try {
    await execFileAsync("powershell.exe", ["-NoProfile", "-STA", "-Command", script], {
      encoding: "utf8",
      windowsHide: true,
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : String(error);
    throw new Error(`No pude obtener una imagen del portapapeles. ${mensaje}`);
  }

  if (!existsSync(ruta)) {
    throw new Error("No pude guardar la imagen del portapapeles.");
  }
  return ruta;
}
