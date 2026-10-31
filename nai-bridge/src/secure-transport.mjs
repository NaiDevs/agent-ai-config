import { createHash, randomBytes, X509Certificate } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import tls from 'node:tls';
import { AlmacenSnapshots } from './snapshot.mjs';
import { canReadProject, validateProjectScope } from './devices.mjs';
import { describeSnapshot, pageSnapshot, readAvailableSnapshot, checkDownloadedSnapshot } from './snapshot-wire.mjs';

const exec = promisify(execFile);
const MAX_FRAME = 4096;
const TIMEOUT_MS = 6000;

function certificateKey(socket) {
  const remote = socket.getPeerCertificate(true);
  if (!remote?.raw) throw new Error('Certificado de cliente ausente.');
  const cert = new X509Certificate(remote.raw);
  const now = Date.now();
  if (now < Date.parse(cert.validFrom) || now > Date.parse(cert.validTo)) throw new Error('Certificado vencido.');
  if (cert.publicKey.asymmetricKeyType !== 'ed25519') throw new Error('Se requiere identidad Ed25519.');
  if (!cert.verify(cert.publicKey)) throw new Error('Certificado no auto-firmado.');
  return cert.publicKey.export({ type: 'spki', format: 'der' }).toString('base64url');
}

/** TLS con certificados autofirmados de identidad: la confianza depende de claves emparejadas, NO del CA del sistema. */
async function authenticatePeer(socket, store, expectedId) {
  const key = certificateKey(socket);
  const deviceId = 'device:' + createHash('sha256').update(Buffer.from(key, 'base64url')).digest('hex');
  if (expectedId && deviceId !== expectedId) throw new Error('El servidor no coincide con la identidad esperada.');
  const peers = await store.peers();
  const peer = peers.find(p => p.deviceId === deviceId && p.publicKey === key && p.revokedAt == null);
  if (!peer) throw new Error('Dispositivo no emparejado o revocado.');
  return peer;
}

export async function createTlsCredentials(identity, options = {}) {
  const { validateIdentity } = await import('./pairing.mjs');
  validateIdentity(identity);
  const directory = await fs.mkdtemp(join(tmpdir(), 'nai-bridge-tls-'));
  try {
    await fs.chmod(directory, 0o700);
    const keyPath = join(directory, 'key.pem');
    const certPath = join(directory, 'cert.pem');
    await fs.writeFile(keyPath, identity.privateKey, { mode: 0o600, flag: 'wx' });
    const args = ['req', '-new', '-x509', '-key', keyPath, '-out', certPath, '-days', '30',
      '-subj', '/CN=nai-bridge', '-addext', 'basicConstraints=critical,CA:FALSE',
      '-addext', 'keyUsage=critical,digitalSignature'];
    const candidates = process.platform === 'win32' && !options.openssl
      ? ['openssl', join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'usr', 'bin', 'openssl.exe'),
          join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'mingw64', 'bin', 'openssl.exe')]
      : ['openssl'];
    let generated = false;
    for (const executable of candidates) {
      try {
        await (options.openssl ?? exec)(executable, args,
          { timeout: 10000, windowsHide: true, maxBuffer: 8192 });
        generated = true;
        break;
      } catch (error) {
        if (error?.code !== 'ENOENT') break;
      }
    }
    if (!generated) throw new Error('No fue posible generar el certificado. Instala OpenSSL para habilitar TLS.');
    const cert = await fs.readFile(certPath, 'utf8');
    const actualKey = new X509Certificate(cert).publicKey
      .export({ type: 'spki', format: 'der' }).toString('base64url');
    if (actualKey !== identity.publicKey) throw new Error('Certificado TLS no coincide con identidad local.');
    return { cert, key: identity.privateKey };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}


const MAX_REPLY = 192 * 1024;
function readFrame(socket, limit = MAX_FRAME) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const clean = () => { socket.off('data', data); socket.off('close', close); socket.off('error', error); };
    const fail = e => { clean(); reject(e); };
    const close = () => fail(new Error('Conexion TLS cerrada.'));
    const error = () => fail(new Error('Conexion TLS fallida.'));
    const data = chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > limit) return fail(new Error('Mensaje TLS demasiado grande.'));
      const end = buffer.indexOf(10);
      if (end < 0) return;
      if (buffer.length !== end + 1) return fail(new Error('Multiples mensajes no permitidos.'));
      clean();
      try { resolve(JSON.parse(buffer.subarray(0, end).toString('utf8'))); }
      catch { reject(new Error('JSON TLS invalido.')); }
    };
    socket.on('data', data); socket.once('close', close); socket.once('error', error);
  });
}
function sendFrame(socket, data) {
  const bytes = Buffer.from(JSON.stringify(data) + '\n');
  if (bytes.length > MAX_REPLY) throw new Error('Respuesta TLS excede limite.');
  socket.end(bytes);
}
function validateRequest(r) {
  if (r?.version !== 1 || typeof r?.nonce !== 'string' || !/^[a-f0-9]{32}$/.test(r.nonce) ||
      !['ping', 'manifest', 'page'].includes(r.op)) throw new Error('Solicitud TLS invalida.');
}
export async function listenSecure(store, { host = '127.0.0.1', port = 4392, allowLan = false,
  allowMemory = false, snapshotStore = new AlmacenSnapshots() } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Puerto TLS invalido.');
  if (!['127.0.0.1', '0.0.0.0'].includes(host) || (host === '0.0.0.0' && !allowLan)) {
    throw new Error('LAN requiere permiso explicito --lan; bind restringido.');
  }
  const creds = await createTlsCredentials(await store.identity());
  const server = tls.createServer({ ...creds, requestCert: true, rejectUnauthorized: false,
    minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3', handshakeTimeout: TIMEOUT_MS }, async socket => {
    socket.pause();
    socket.setTimeout(TIMEOUT_MS, () => socket.destroy());
    try {
      const peer = await authenticatePeer(socket, store);
      const pending = readFrame(socket);
      socket.resume();
      const req = await pending;
      validateRequest(req);
      let result = { memoryAccess: false };
      if (req.op !== 'ping') {
        if (!allowMemory) throw new Error('Lectura de memoria deshabilitada.');
        const project = validateProjectScope(req.project);
        if (!canReadProject(peer, project)) throw new Error('Acceso no autorizado.');
        const snapshot = await readAvailableSnapshot(snapshotStore, project);
        result = req.op === 'manifest' ? describeSnapshot(snapshot, project) :
          pageSnapshot(snapshot, project, req.etag, req.offset);
      }
      const fresh = await authenticatePeer(socket, store, peer.deviceId);
      if (req.op !== 'ping' && !canReadProject(fresh, req.project)) throw new Error('Permiso revocado.');
      const identity = await store.identity();
      sendFrame(socket, { version: 1, ok: true, nonce: req.nonce, deviceId: identity.deviceId, ...result });
    } catch { socket.destroy(); }
  });
  server.maxConnections = 32;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  return server;
}
export async function requestSecure(store, { host, port = 4392, peerId, request } = {}) {
  if (typeof host !== 'string' || !host || host.length > 255 || /[\s/]/.test(host)) throw new Error('Host invalido.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto invalido.');
  if (typeof peerId !== 'string' || !/^device:[a-f0-9]{64}$/.test(peerId)) throw new Error('ID esperado invalido.');
  const creds = await createTlsCredentials(await store.identity());
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, ...creds, rejectUnauthorized: false,
      minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3' });
    let settled = false;
    const done = (error, data) => {
      if (settled) return;
      settled = true; socket.destroy();
      if (error) reject(error); else resolve(data);
    };
    socket.setTimeout(TIMEOUT_MS, () => done(new Error('Tiempo TLS agotado.')));
    socket.once('error', () => done(new Error('Conexion TLS fallida.')));
    socket.once('close', () => done(new Error('Conexion TLS cerrada.')));
    socket.once('secureConnect', async () => {
      try {
        const peer = await authenticatePeer(socket, store, peerId);
        const nonce = randomBytes(16).toString('hex');
        const raw = Buffer.from(JSON.stringify({ version: 1, ...request, nonce }) + '\n');
        if (raw.length > MAX_FRAME) throw new Error('Solicitud excede limite.');
        const reply = readFrame(socket, MAX_REPLY);
        socket.write(raw);
        const response = await reply;
        if (response?.version !== 1 || response.ok !== true || response.nonce !== nonce ||
            response.deviceId !== peer.deviceId) throw new Error('Respuesta TLS invalida.');
        done(null, response);
      } catch (e) { done(e); }
    });
  });
}
export async function pingSecure(store, { host, port = 4392, peerId } = {}) {
  const response = await requestSecure(store, { host, port, peerId, request: { op: 'ping' } });
  return { connected: true, peerId: response.deviceId, encrypted: true, memoryAccess: false };
}
export async function pullSecure(store, { host, port = 4392, peerId, project,
  remoteStore = null, requester = requestSecure } = {}) {
  const scope = validateProjectScope(project);
  const base = { host, port, peerId };
  const manifest = await requester(store, { ...base, request: { op: 'manifest', project: scope } });
  if (manifest?.project !== scope || manifest?.digestVersion !== 2 || !Number.isInteger(manifest.count) || manifest.count < 0 ||
      manifest.count > 100000 || !/^[a-f0-9]{64}$/.test(manifest.etag ?? '')) throw new Error('Manifiesto invalido.');
  const memories = [];
  let offset = 0;
  while (offset < manifest.count) {
    const page = await requester(store, { ...base, request: { op: 'page', project: scope, etag: manifest.etag, offset } });
    if (page.project !== scope || page.etag !== manifest.etag || page.digestVersion !== 2 || page.offset !== offset ||
        page.total !== manifest.count || !Array.isArray(page.memories) || !page.memories.length) throw new Error('Pagina invalida.');
    const next = offset + page.memories.length;
    if (next > manifest.count || page.nextOffset !== (next === manifest.count ? null : next)) throw new Error('Cursor invalido.');
    memories.push(...page.memories);
    offset = next;
  }
  checkDownloadedSnapshot(manifest, memories);
  const result = remoteStore
    ? await remoteStore.actualizar({ proyecto: scope, memorias: memories })
    : { nuevas: 0, actualizadas: 0, eliminadasLogicas: 0 };
  return { peerId, project: scope, count: memories.length, etag: manifest.etag,
    added: result.nuevas, updated: result.actualizadas, deleted: result.eliminadasLogicas,
    storedLocally: remoteStore !== null, importedIntoEngram: false };
}
