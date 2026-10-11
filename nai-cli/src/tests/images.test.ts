import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { extraerImagenes } from "../images.js";

test("extrae una imagen arrastrada y conserva el pedido", (contexto) => {
  const directorio = mkdtempSync(join(tmpdir(), "nai-images-"));
  contexto.after(() => rmSync(directorio, { recursive: true, force: true }));
  const ruta = join(directorio, "captura pantalla.png");
  writeFileSync(ruta, "imagen de prueba");

  const resultado = extraerImagenes(`imagen "${ruta}" revisa este error`, directorio);

  assert.deepEqual(resultado.imagenes, [ruta]);
  assert.equal(resultado.prompt, "revisa este error");
  assert.deepEqual(resultado.rutasInvalidas, []);
});

test("reporta rutas de imagen inexistentes", () => {
  const resultado = extraerImagenes("analiza @captura.png", "C:\\proyecto");

  assert.equal(resultado.imagenes.length, 0);
  assert.equal(resultado.rutasInvalidas.length, 1);
});
