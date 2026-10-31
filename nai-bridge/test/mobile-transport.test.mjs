import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createPrivateKey, createPublicKey, randomBytes, sign, verify, X509Certificate } from 'node:crypto';
import { once } from 'node:events';
import tls from 'node:tls';
import { createIdentity } from '../src/pairing.mjs';
import { listenMobileSecure } from '../src/mobile-transport.mjs';

const domain = 'nai-transport-v2';
const signed = (kind, fields) => Buffer.from(JSON.stringify([domain, kind, ...fields]));
class Store {
  constructor(identity) { this.local = identity; this.entries = []; }
  async identity() { return this.local; }
  async peers() { return this.entries; }
  add(identity) { this.entries.push({ deviceId: identity.deviceId, publicKey: identity.publicKey, permissions: [], revokedAt: null }); }
}
function frame(socket) {
  return new Promise((resolve, reject) => {
    let bytes = Buffer.alloc(0);
    const clean = () => { socket.off('data', data); socket.off('close', close); socket.off('error', error); };
    const close = () => { clean(); reject(new Error('Conexion cerrada.')); };
    const error = cause => { clean(); reject(cause); };
    const data = chunk => {
      bytes = Buffer.concat([bytes, chunk]);
      const end = bytes.indexOf(10);
      if (end < 0) return;
      clean(); resolve(JSON.parse(bytes.subarray(0, end).toString('utf8')));
    };
    socket.on('data', data); socket.once('close', close); socket.once('error', error);
  });
}
async function mobileRequest(port, serverId, client, operation = 'ping', alter) {
  const socket = tls.connect({ host: '127.0.0.1', port, rejectUnauthorized: false,
    minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3' });
  await once(socket, 'secureConnect');
  try {
    const cert = new X509Certificate(socket.getPeerCertificate(true).raw);
    assert.equal(cert.publicKey.asymmetricKeyType, 'ec');
    const certHash = createHash('sha256').update(cert.raw).digest('hex');
    const clientNonce = randomBytes(16).toString('hex');
    const pendingProof = frame(socket);
    socket.write(JSON.stringify({ version: 2, kind: 'hello', clientNonce }) + '\n');
    const proof = await pendingProof;
    assert.equal(proof.serverId, serverId);
    assert.equal(proof.clientNonce, clientNonce);
    assert.equal(proof.certHash, certHash);
    const serverNonce = proof.serverNonce;
    const serverKey = createPublicKey({ key: Buffer.from(client.server.publicKey, 'base64url'),
      format: 'der', type: 'spki' });
    assert.ok(verify(null, signed('server-proof', [serverId, clientNonce, serverNonce, certHash]),
      serverKey, Buffer.from(proof.signature, 'base64url')));
    const project = operation === 'ping' ? null : 'demo';
    const fields = [client.local.deviceId, serverId, clientNonce, serverNonce, certHash,
      operation, project, null, null];
    const request = { version: 2, kind: 'request', clientId: client.local.deviceId,
      clientNonce, serverNonce, certHash, op: operation,
      ...(project && { project }),
      signature: sign(null, signed('request', fields), createPrivateKey(client.local.privateKey)).toString('base64url') };
    if (alter) alter(request);
    const pendingReply = frame(socket);
    socket.write(JSON.stringify(request) + '\n');
    return await pendingReply;
  } finally { socket.destroy(); }
}

test('transporte movil TLS 1.3 autentica ambos pares y responde ping sin memoria', async t => {
  const host = new Store(createIdentity('pc'));
  const phone = { local: createIdentity('phone'), server: host.local };
  host.add(phone.local);
  const server = await listenMobileSecure(host, { port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const result = await mobileRequest(server.address().port, host.local.deviceId, phone);
  assert.equal(result.version, 2);
  assert.equal(result.ok, true);
  assert.equal(result.memoryAccess, false);
});

test('transporte movil rechaza cliente desconocido y lectura sin bandera', async t => {
  const host = new Store(createIdentity('pc'));
  const phone = { local: createIdentity('phone'), server: host.local };
  const server = await listenMobileSecure(host, { port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  await assert.rejects(mobileRequest(server.address().port, host.local.deviceId, phone));
  host.add(phone.local);
  await assert.rejects(mobileRequest(server.address().port, host.local.deviceId, phone, 'manifest'));
});

test('transporte movil corta acceso de par revocado', async t => {
  const host = new Store(createIdentity('pc'));
  const phone = { local: createIdentity('phone'), server: host.local };
  host.add(phone.local);
  const server = await listenMobileSecure(host, { port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  host.entries[0].revokedAt = Date.now();
  await assert.rejects(mobileRequest(server.address().port, host.local.deviceId, phone));
});

test('transporte movil rechaza operacion cambiada despues de firmar', async t => {
  const host = new Store(createIdentity('pc'));
  const phone = { local: createIdentity('phone'), server: host.local };
  host.add(phone.local);
  const server = await listenMobileSecure(host, { port: 0 });
  t.after(() => new Promise(resolve => server.close(resolve)));
  await assert.rejects(mobileRequest(server.address().port, host.local.deviceId,
    phone, 'ping', request => { request.op = 'manifest'; request.project = 'demo'; }));
});
