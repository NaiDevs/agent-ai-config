import assert from "node:assert/strict";
import test from "node:test";
import { buscarProyecto, parsearRegistry } from "../registry.js";

const REGISTRY = `
## YALO | C:\\Proyectos\\YALO

| Alias | Carpeta | Stack | Descripción |
|---|---|---|---|
| yalo console | YaloConsole | Node/TS | Consola |
| yalo console api | YaloApi | NestJS | API |

## Workspaces
| Workspace | Proyectos | Descripción |
|---|---|---|
| yalo full | yalo console, yalo console api | Todo |
`;

test("parsea proyectos sin confundir workspaces", () => {
  const proyectos = parsearRegistry(REGISTRY);
  assert.equal(proyectos.length, 2);
  assert.equal(proyectos[0]?.alias, "yalo console");
  assert.equal(proyectos[1]?.stack, "NestJS");
});

test("elige el alias completo más largo dentro de lenguaje natural", () => {
  const proyectos = parsearRegistry(REGISTRY);
  const proyecto = buscarProyecto(proyectos, "abrime yalo console api con codex");
  assert.equal(proyecto?.alias, "yalo console api");
});
