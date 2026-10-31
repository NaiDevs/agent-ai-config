import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createIdentity, validateIdentity } from './pairing.mjs';

const MAX_FILE_BYTES = 32 * 1024;
const SAFE_DIR_MODE = 0o700;
const SAFE_FILE_MODE = 0o600;

function validFilename(name) {
  if (!['identity.json', 'peers.json', 'pending-invite.json', 'pending-response.json'].includes(name)) {
    throw new Error('Archivo local no permitido.');
  }
  return name;
}
export class DeviceStore {
  constructor(root = join(homedir(), '.nai', 'devices')) { this.root = root; }
  async ensureDir() {
    await fs.mkdir(this.root, { mode: SAFE_DIR_MODE, recursive: true });
    const stat = await fs.lstat(this.root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Directorio de identidad no es seguro.');
    if (process.platform !== 'win32') await fs.chmod(this.root, SAFE_DIR_MODE);
  }
  path(name) { return join(this.root, validFilename(name)); }
  async read(name) {
    const path = this.path(name);
    let stat;
    try { stat = await fs.lstat(path); }
    catch (err) { if (err?.code === 'ENOENT') return null; throw err; }
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_FILE_BYTES) {
      throw new Error('Archivo de identidad inseguro o demasiado grande.');
    }
    if (process.platform !== 'win32' && (stat.mode & 0o077) !== 0) {
      throw new Error('Permisos inseguros del archivo de identidad.');
    }
    try { return JSON.parse(await fs.readFile(path, 'utf8')); }
    catch { throw new Error('Archivo de identidad corrupto.'); }
  }
  async write(name, value, { createOnly = false } = {}) {
    await this.ensureDir();
    const path = this.path(name);
    const text = JSON.stringify(value, null, 2);
    if (Buffer.byteLength(text, 'utf8') > MAX_FILE_BYTES) throw new Error('El archivo supera el limite permitido.');
    if (createOnly) {
      const fh = await fs.open(path, 'wx', SAFE_FILE_MODE);
      try { await fh.writeFile(text, 'utf8'); await fh.sync(); }
      finally { await fh.close(); }
      return;
    }
    const tmp = join(this.root, randomUUID() + '.tmp');
    try {
      const fh = await fs.open(tmp, 'wx', SAFE_FILE_MODE);
      try { await fh.writeFile(text, 'utf8'); await fh.sync(); }
      finally { await fh.close(); }
      const prev = await this.read(name);
      if (prev === null) {
        let exists = false;
        try { await fs.lstat(path); exists = true; }
        catch (err) { if (err?.code !== 'ENOENT') throw err; }
        if (exists) throw new Error('Archivo existente no valido.');
      }
      await fs.rename(tmp, path);
    } finally { await fs.rm(tmp, { force: true }); }
  }
  async remove(name) {
    const existing = await this.read(name);
    if (existing !== null) await fs.unlink(this.path(name));
  }
  async init(name) {
    const identity = createIdentity(name);
    await this.write('identity.json', identity, { createOnly: true });
    return validateIdentity(identity);
  }
  async identity() {
    const identity = await this.read('identity.json');
    if (!identity) throw new Error('Primero inicializa la identidad con: nai-bridge device init NOMBRE');
    validateIdentity(identity);
    return identity;
  }
  async peers() {
    const data = await this.read('peers.json');
    if (data === null) return [];
    if (data.version !== 1 || !Array.isArray(data.peers) || data.peers.some(p => !p.deviceId || !p.publicKey || !Array.isArray(p.permissions))) {
      throw new Error('Registro de dispositivos corrupto.');
    }
    return data.peers;
  }
  async addPeer(peer) {
    const peers = await this.peers();
    const exists = peers.find(p => p.deviceId === peer.deviceId);
    if (exists?.publicKey !== undefined && exists.publicKey !== peer.publicKey) throw new Error('Clave del dispositivo cambiada.');
    if (exists && !exists.revokedAt) throw new Error('El dispositivo ya esta emparejado.');
    await this.write('peers.json', { version: 1, peers: [...peers.filter(p => p.deviceId !== peer.deviceId), peer] });
  }
  async revoke(id) {
    const peers = await this.peers();
    const found = peers.find(p => p.deviceId === id && !p.revokedAt);
    if (!found) throw new Error('No existe un dispositivo activo con ese ID.');
    await this.write('peers.json', { version: 1, peers: peers.map(p => p.deviceId === id ? { ...p, permissions: [], revokedAt: Date.now() } : p) });
  }
}
