import { createHash, randomBytes, X509Certificate } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import tls from 'node:tls';

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
    try {
      await (options.openssl ?? exec)('openssl', [
        'req', '-new', '-x509', '-key', keyPath, '-out', certPath, '-days', '30',
        '-subj', '/CN=nai-bridge', '-addext', 'basicConstraints=critical,CA:FALSE',
        '-addext', 'keyUsage=critical,digitalSignature',
      ], { timeout: 10000, windowsHide: true, maxBuffer: 8192 });
    } catch { throw new Error('No fue posible generar el certificado. Instala OpenSSL para habilitar TLS.'); }
    const cert = await fs.readFile(certPath, 'utf8');
    const actualKey = new X509Certificate(cert).publicKey
      .export({ type: 'spki', format: 'der' }).toString('base64url');
    if (actualKey !== identity.publicKey) throw new Error('Certificado TLS no coincide con identidad local.');
    return { cert, key: identity.privateKey };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

function readOneLine(socket, callback) {
  let pending = '';
  const onData = chunk => {
    pending += chunk.toString('utf8');
    if (Buffer.byteLength(pending, 'utf8') > MAX_FRAME) { socket.destroy(); return; }
    const lineEnd = pending.indexOf('\n');
    if (lineEnd >= 0) {
      socket.off('data', onData);
      if (pending.slice(lineEnd + 1).trim()) { socket.destroy(); return; }
      callback(pending.slice(0, lineEnd));
    }
  };
  socket.on('data', onData);
}

export async function listenSecure(store, { host = '127.0.0.1', port = 4392, allowLan = false } = {}) {
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
      readOneLine(socket, async line => {
        try {
          // Refresh revocations for each request; old open connections do not retain access.
          await authenticatePeer(socket, store, peer.deviceId);
          const request = JSON.parse(line);
          if (request?.version !== 1 || request?.op !== 'ping' ||
              typeof request.nonce !== 'string' || !/^[a-f0-9]{32}$/.test(request.nonce)) {
            socket.destroy(); return;
          }
          const identity = await store.identity();
          socket.end(JSON.stringify({ version: 1, ok: true, nonce: request.nonce, deviceId: identity.deviceId }) + '\n');
        } catch { socket.destroy(); }
      });
      socket.resume();
    } catch { socket.destroy(); }
  });
  server.maxConnections = 32;
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return server;
}

export async function pingSecure(store, { host, port = 4392, peerId } = {}) {
  if (typeof host !== 'string' || !host || host.length > 255 || /[\s/]/.test(host)) throw new Error('Host invalido.');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto invalido.');
  if (typeof peerId !== 'string' || !/^device:[a-f0-9]{64}$/.test(peerId)) throw new Error('ID esperado invalido.');
  const creds = await createTlsCredentials(await store.identity());
  return new Promise((resolve, reject) => {
    // rejectUnauthorized:false is needed for self-signed certs. No application data
    // is sent until authenticatePeer strictly pins its SPKI to the paired identity.
    const socket = tls.connect({ host, port, ...creds, rejectUnauthorized: false,
      minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3' });
    socket.setTimeout(TIMEOUT_MS, () => done(new Error('Tiempo de espera TLS agotado.')));
    let settled = false;
    function done(error, result) {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error); else resolve(result);
    }
    socket.on('error', () => done(new Error('Conexion TLS fallida.')));
    socket.once('close', () => done(new Error('Conexion TLS cerrada por el otro dispositivo.')));
    socket.once('secureConnect', async () => {
      try {
        const peer = await authenticatePeer(socket, store, peerId);
        const nonce = randomBytes(16).toString('hex');
        readOneLine(socket, line => {
          try {
            const response = JSON.parse(line);
            if (response?.version !== 1 || response?.ok !== true || response.nonce !== nonce || response.deviceId !== peer.deviceId) {
              throw new Error('Respuesta TLS invalida.');
            }
            done(null, { connected: true, peerId: peer.deviceId, encrypted: true, memoryAccess: false });
          } catch (error) { done(error); }
        });
        socket.write(JSON.stringify({ version: 1, op: 'ping', nonce }) + '\n');
      } catch (error) { done(error); }
    });
  });
}
