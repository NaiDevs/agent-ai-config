import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MAXIMO_BYTES = 32 * 1024 * 1024;
const ESQUEMA = 1;

function esObjeto(valor) {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function validarProyecto(proyecto) {
  if (typeof proyecto !== 'string' || !proyecto.trim() || proyecto.length > 160 || /[\r\n\0]/u.test(proyecto)) {
    throw new Error('El proyecto solicitado no es valido.');
  }
  return proyecto.trim();
}

function validarMemorias(proyecto, memorias) {
  if (!Array.isArray(memorias)) throw new Error('El snapshot no contiene un arreglo de memorias.');
  const ids = new Set();
  for (const m of memorias) {
    if (!esObjeto(m) || typeof m.id !== 'string' || !m.id || typeof m.revisionId !== 'string' || !m.revisionId ||
        m.proyectoId !== proyecto || m.origen !== 'engram' || typeof m.contenido !== 'string' || typeof m.eliminada !== 'boolean') {
      throw new Error('El snapshot contiene una memoria invalida o de otro proyecto.');
    }
    if (ids.has(m.id)) throw new Error('El snapshot contiene IDs duplicados.');
    ids.add(m.id);
  }
}

/** Diff entre snapshots de una sola fuente. La ausencia NO equivale a borrado. */
export function calcularDeltaSnapshot(anteriores, actuales) {
  const previo = new Map(anteriores.map((m) => [m.id, m]));
  const visto = new Set();
  const siguiente = new Map(previo);
  const estadisticas = { nuevas: 0, actualizadas: 0, eliminadasLogicas: 0, sinCambios: 0, ausentes: 0 };
  for (const actual of actuales) {
    visto.add(actual.id);
    const anterior = previo.get(actual.id);
    if (!anterior) {
      estadisticas.nuevas++;
      if (actual.eliminada) estadisticas.eliminadasLogicas++;
      siguiente.set(actual.id, { ...actual, revisionPadreId: null });
    } else if (anterior.revisionId !== actual.revisionId) {
      estadisticas.actualizadas++;
      if (!anterior.eliminada && actual.eliminada) estadisticas.eliminadasLogicas++;
      siguiente.set(actual.id, { ...actual, revisionPadreId: anterior.revisionId });
    } else {
      if (anterior.contenido !== actual.contenido || anterior.eliminada !== actual.eliminada) {
        throw new Error('Conflicto: revision igual con contenido diferente.');
      }
      estadisticas.sinCambios++;
    }
  }
  for (const id of previo.keys()) if (!visto.has(id)) estadisticas.ausentes++;
  return { estadisticas, memorias: [...siguiente.values()] };
}

export class AlmacenSnapshots {
  constructor(directorio = join(homedir(), '.nai', 'engram-snapshots')) {
    this.directorio = directorio;
  }

  ruta(proyecto) {
    const clave = createHash('sha256').update(validarProyecto(proyecto)).digest('hex');
    return join(this.directorio, clave + '.json');
  }

  async asegurarDirectorio() {
    await fs.mkdir(this.directorio, { recursive: true, mode: 0o700 });
    const estado = await fs.lstat(this.directorio);
    if (!estado.isDirectory() || estado.isSymbolicLink()) throw new Error('Directorio de snapshots invalido.');
    if (process.platform !== 'win32') await fs.chmod(this.directorio, 0o700);
  }

  async cargar(proyecto) {
    const solicitado = validarProyecto(proyecto);
    const ruta = this.ruta(solicitado);
    let estado;
    try { estado = await fs.lstat(ruta); }
    catch (error) {
      if (error?.code === 'ENOENT') return { version: ESQUEMA, proyecto: solicitado, memorias: [] };
      throw error;
    }
    if (!estado.isFile() || estado.isSymbolicLink() || estado.size > MAXIMO_BYTES) {
      throw new Error('Cache de Engram insegura o demasiado grande.');
    }
    let contenido;
    try { contenido = JSON.parse(await fs.readFile(ruta, 'utf8')); }
    catch { throw new Error('La cache de Engram esta corrupta. Se preservo para su recuperacion.'); }
    if (!esObjeto(contenido) || contenido.version !== ESQUEMA || contenido.proyecto !== solicitado) {
      throw new Error('Formato o proyecto de cache invalido; no se sobreescribira.');
    }
    validarMemorias(solicitado, contenido.memorias);
    return contenido;
  }

  async actualizar(snapshot) {
    const proyecto = validarProyecto(snapshot?.proyecto);
    validarMemorias(proyecto, snapshot.memorias);
    await this.asegurarDirectorio();
    const ruta = this.ruta(proyecto);
    const bloqueo = ruta + '.lock';
    let lock;
    try { lock = await fs.open(bloqueo, 'wx', 0o600); }
    catch (error) {
      if (error?.code === 'EEXIST') throw new Error('Ya existe una sincronizacion o bloqueo pendiente para este proyecto.');
      throw error;
    }
    try {
      const anterior = await this.cargar(proyecto);
      const delta = calcularDeltaSnapshot(anterior.memorias, snapshot.memorias);
      const contenido = JSON.stringify({
        version: ESQUEMA, proyecto, actualizadoEn: new Date().toISOString(),
        memorias: delta.memorias,
      });
      if (Buffer.byteLength(contenido, 'utf8') > MAXIMO_BYTES) throw new Error('La cache superaria el limite de 32 MiB.');
      const temporal = join(this.directorio, randomUUID() + '.tmp');
      try {
        const archivo = await fs.open(temporal, 'wx', 0o600);
        try { await archivo.writeFile(contenido, 'utf8'); await archivo.sync(); }
        finally { await archivo.close(); }
        await fs.rename(temporal, ruta);
      } finally {
        await fs.rm(temporal, { force: true });
      }
      return { proyecto, ...delta.estadisticas, totalEnCache: delta.memorias.length, soloLocal: true };
    } finally {
      await lock.close();
      await fs.rm(bloqueo, { force: true });
    }
  }
}

/** Importa solo snapshot obtenido localmente mediante Engram; no hace escritura en Engram. */
export async function actualizarDesdeEngram(proyecto, opciones = {}) {
  const { leerEngramPorProyecto } = await import('./engram.mjs');
  const almacen = opciones.almacen ?? new AlmacenSnapshots();
  const snapshot = await leerEngramPorProyecto(proyecto, opciones);
  return almacen.actualizar(snapshot);
}
