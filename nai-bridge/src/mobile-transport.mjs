import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign, verify, X509Certificate } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import tls from 'node:tls';
import { AlmacenSnapshots } from './snapshot.mjs';
import { canReadProject, validateProjectScope } from './devices.mjs';
import { describeSnapshot, pageSnapshot, readAvailableSnapshot } from './snapshot-wire.mjs';

const exec = promisify(execFile);
const DOMAIN = 'nai-transport-v2';
const TIMEOUT_MS = 8000;
const MAX_REQUEST = 4096;
const MAX_RESPONSE = 192 * 1024;
const noncePattern = /^[a-f0-9]{32}$/;
const devicePattern = /^device:[a-f0-9]{64}$/;

function signedBytes(kind, fields) { return Buffer.from(JSON.stringify([DOMAIN, kind, ...fields])); }
function hashCertificate(cert) { return createHash('sha256').update(new X509Certificate(cert).raw).digest('hex'); }
function assertValid(value, message = 'Trama movil invalida.') { if (!value) throw new Error(message); }
function readFrame(socket) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const clean = () => { socket.off('data', data); socket.off('close', close); socket.off('error', error); };
    const fail = cause => { clean(); reject(cause); };
    const close = () => fail(new Error('Conexion cerrada.'));
    const error = () => fail(new Error('Conexion TLS fallida.'));
    const data = chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length > MAX_REQUEST) return fail(new Error('Trama demasiado grande.'));
      const end = buffer.indexOf(10);
      if (end < 0) return;
      if (end !== buffer.length - 1) return fail(new Error('Multiples tramas.'));
      clean();
      try { resolve(JSON.parse(buffer.subarray(0, end).toString('utf8'))); }
      catch { reject(new Error('JSON invalido.')); }
    };
    socket.on('data', data); socket.once('close', close); socket.once('error', error);
  });
}
function sendFrame(socket, value, close = false) {
  const frame = Buffer.from(JSON.stringify(value) + '\n');
  assertValid(frame.length <= MAX_RESPONSE, 'Respuesta demasiado grande.');
  if (close) socket.end(frame); else socket.write(frame);
}
async function credentials() {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const key = pair.privateKey.export({ format: 'pem', type: 'pkcs8' });
  const dir = await fs.mkdtemp(join(tmpdir(), 'nai-mobile-tls-'));
  try {
    await fs.chmod(dir, 0o700);
    const keyPath = join(dir, 'key.pem');
    const certPath = join(dir, 'cert.pem');
    await fs.writeFile(keyPath, key, { mode: 0o600, flag: 'wx' });
    const args = ['req', '-new', '-x509', '-key', keyPath, '-out', certPath, '-days', '1',
      '-subj', '/CN=nai-mobile-bridge', '-addext', 'basicConstraints=critical,CA:FALSE',
      '-addext', 'keyUsage=critical,digitalSignature'];
    const candidates = process.platform === 'win32'
      ? ['openssl', join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'usr', 'bin', 'openssl.exe'),
          join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git', 'mingw64', 'bin', 'openssl.exe')]
      : ['openssl'];
    let generated = false;
    for (const executable of candidates) {
      try { await exec(executable, args, { timeout: 10000, windowsHide: true, maxBuffer: 8192 }); generated = true; break; }
      catch (error) { if (error?.code !== 'ENOENT') break; }
    }
    assertValid(generated, 'No fue posible generar certificado TLS P-256.');
    const cert = await fs.readFile(certPath, 'utf8');
    assertValid(new X509Certificate(cert).publicKey.asymmetricKeyType === 'ec', 'Certificado TLS incompatible.');
    return { key, cert, certHash: hashCertificate(cert) };
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
}
function verifyRequest(request, helloNonce, serverNonce, certHash, identity, peers) {
  assertValid(request?.version === 2 && request.kind === 'request' &&
    devicePattern.test(request.clientId) && noncePattern.test(request.clientNonce) &&
    request.clientNonce === helloNonce && request.serverNonce === serverNonce &&
    request.certHash === certHash && ['ping', 'manifest', 'page'].includes(request.op));
  assertValid(typeof request.signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(request.signature));
  const peer = peers.find(p => p.deviceId === request.clientId && p.revokedAt == null);
  assertValid(peer, 'Dispositivo no emparejado.');
  const fields = [request.clientId, identity.deviceId, helloNonce, serverNonce, certHash,
    request.op, request.project ?? null, request.etag ?? null, request.offset ?? null];
  const publicKey = createPublicKey({ key: Buffer.from(peer.publicKey, 'base64url'), format: 'der', type: 'spki' });
  const signature = Buffer.from(request.signature, 'base64url');
  assertValid(signature.length === 64 && signature.toString('base64url') === request.signature &&
    verify(null, signedBytes('request', fields), publicKey, signature), 'Firma movil invalida.');
  return peer;
}

export async function listenMobileSecure(store, { host = '127.0.0.1', port = 4393, allowLan = false,
  allowMemory = false, snapshotStore = new AlmacenSnapshots() } = {}) {
  assertValid(Number.isInteger(port) && port >= 0 && port <= 65535, 'Puerto TLS invalido.');
  assertValid(['127.0.0.1', '0.0.0.0'].includes(host) && (host !== '0.0.0.0' || allowLan), 'LAN requiere --lan.');
  const identity = await store.identity();
  const { key, cert, certHash } = await credentials();
  const server = tls.createServer({ key, cert, requestCert: false, minVersion: 'TLSv1.3',
    maxVersion: 'TLSv1.3', handshakeTimeout: TIMEOUT_MS }, async socket => {
    socket.pause();
    socket.setTimeout(TIMEOUT_MS, () => socket.destroy());
    try {
      const pending = readFrame(socket);
      socket.resume();
      const hello = await pending;
      assertValid(hello?.version === 2 && hello.kind === 'hello' && noncePattern.test(hello.clientNonce));
      const serverNonce = randomBytes(16).toString('hex');
      const fields = [identity.deviceId, hello.clientNonce, serverNonce, certHash];
      const signature = sign(null, signedBytes('server-proof', fields), createPrivateKey(identity.privateKey)).toString('base64url');
      sendFrame(socket, { version: 2, kind: 'server-proof', serverId: identity.deviceId,
        clientNonce: hello.clientNonce, serverNonce, certHash, signature });
      const request = await readFrame(socket);
      const peer = verifyRequest(request, hello.clientNonce, serverNonce, certHash, identity, await store.peers());
      let result = { memoryAccess: false };
      if (request.op !== 'ping') {
        assertValid(allowMemory, 'Lectura de memoria deshabilitada.');
        const project = validateProjectScope(request.project);
        assertValid(canReadProject(peer, project), 'Acceso no autorizado.');
        const snapshot = await readAvailableSnapshot(snapshotStore, project);
        result = request.op === 'manifest' ? describeSnapshot(snapshot, project) :
          pageSnapshot(snapshot, project, request.etag, request.offset);
      }
      const fresh = (await store.peers()).find(p => p.deviceId === peer.deviceId && p.revokedAt == null);
      assertValid(fresh && (request.op === 'ping' || canReadProject(fresh, request.project)), 'Permiso revocado.');
      sendFrame(socket, { version: 2, ok: true, nonce: hello.clientNonce,
        deviceId: identity.deviceId, ...result }, true);
    } catch { socket.destroy(); }
  });
  server.maxConnections = 32;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  return server;
}
