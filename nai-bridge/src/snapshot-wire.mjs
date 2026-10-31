import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { AlmacenSnapshots } from './snapshot.mjs';
import { validateProjectScope } from './devices.mjs';

const MAX_PAGE = 96 * 1024;
const PAGE_ITEMS = 24;
export const DIGEST_VERSION = 2;
const PREFIX = 'NAI-SNAPSHOT-V2\n';
const encodeField = (value) => value === null ? '~' : Buffer.from(value, 'utf8').toString('base64url');

function assertRecord(item) {
  if (!item || typeof item.id !== 'string' || typeof item.proyectoId !== 'string' ||
      typeof item.revisionId !== 'string' || !(item.revisionPadreId === null ||
      typeof item.revisionPadreId === 'string') || item.origen !== 'engram' ||
      typeof item.contenido !== 'string' || typeof item.eliminada !== 'boolean') {
    throw new Error('Registro de memoria no canonico.');
  }
}
export function canonicalSnapshot(memories) {
  if (!Array.isArray(memories)) throw new Error('Snapshot invalido.');
  const ordered = [...memories].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const rows = ordered.map(item => {
    assertRecord(item);
    return [item.id, item.proyectoId, item.revisionId, item.revisionPadreId,
      item.origen, item.contenido].map(encodeField).join('.') +
      (item.eliminada ? '.1' : '.0');
  });
  return PREFIX + rows.join('\n') + '\n';
}
export function snapshotDigest(memories) {
  return createHash('sha256').update(canonicalSnapshot(memories), 'utf8').digest('hex');
}
function ordered(snapshot, project) {
  if (snapshot?.proyecto !== project || !Array.isArray(snapshot.memorias)) throw new Error('Snapshot de otro proyecto.');
  return [...snapshot.memorias].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export function describeSnapshot(snapshot, project) {
  const items = ordered(snapshot, project);
  return { project, count: items.length, digestVersion: DIGEST_VERSION, etag: snapshotDigest(items) };
}
export function pageSnapshot(snapshot, project, etag, offset = 0) {
  const items = ordered(snapshot, project);
  if (typeof etag !== 'string' || etag !== snapshotDigest(items)) throw new Error('Snapshot modificado durante la transferencia.');
  if (!Number.isInteger(offset) || offset < 0 || offset > items.length) throw new Error('Cursor de snapshot invalido.');
  const batch = [];
  for (let index = offset; index < Math.min(offset + PAGE_ITEMS, items.length); index++) {
    const item = items[index];
    const next = [...batch, item];
    if (Buffer.byteLength(JSON.stringify(next), 'utf8') > MAX_PAGE) {
      if (!batch.length) throw new Error('Memoria demasiado grande para transporte por pagina.');
      break;
    }
    batch.push(item);
  }
  const nextOffset = offset + batch.length;
  return { project, etag, digestVersion: DIGEST_VERSION, offset, memories: batch, nextOffset: nextOffset < items.length ? nextOffset : null, total: items.length };
}
export async function readAvailableSnapshot(store, project) {
  const scope = validateProjectScope(project);
  const path = store.ruta(scope);
  try { await fs.stat(path); }
  catch (error) {
    if (error?.code === 'ENOENT') throw new Error('No hay snapshot local para este proyecto.');
    throw error;
  }
  return store.cargar(scope);
}
export function remoteSnapshotStore(deviceId) {
  if (typeof deviceId !== 'string' || !/^device:[a-f0-9]{64}$/.test(deviceId)) throw new Error('Identidad remota invalida.');
  const safe = deviceId.slice('device:'.length);
  return new AlmacenSnapshots(join(homedir(), '.nai', 'remote-memories', safe));
}
export function checkDownloadedSnapshot(manifest, items) {
  if (!manifest || manifest.digestVersion !== DIGEST_VERSION || !Number.isInteger(manifest.count) || manifest.count < 0 || manifest.count > 100000 ||
      !/^[a-f0-9]{64}$/.test(manifest.etag ?? '') || !Array.isArray(items) || items.length !== manifest.count) {
    throw new Error('Descarga incompleta.');
  }
  const set = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || set.has(item.id) || item.proyectoId !== manifest.project ||
        item.origen !== 'engram' || typeof item.revisionId !== 'string' || typeof item.contenido !== 'string' || !(item.revisionPadreId === null || typeof item.revisionPadreId === 'string') ||
        typeof item.eliminada !== 'boolean') throw new Error('Memoria recibida invalida.');
    set.add(item.id);
  }
  if (snapshotDigest(items) !== manifest.etag) throw new Error('Integridad del snapshot fallida.');
  return true;
}
