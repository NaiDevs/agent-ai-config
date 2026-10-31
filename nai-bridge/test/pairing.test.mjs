import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createIdentity, validateIdentity, createInvitation, respondToInvitation, confirmInvitation, finalizePairing, encodePairing, decodePairing } from '../src/pairing.mjs';
import { DeviceStore } from '../src/devices.mjs';
import { PairSession } from '../src/pair-session.mjs';
import { runDeviceCommand, runPairCommand } from '../src/device-commands.mjs';
import QRCode from 'qrcode';

const NOW = 1000000;
const host = createIdentity('PC');
const guest = createIdentity('Samsung');
function sample() {
  const invite = createInvitation(host, NOW);
  const { response, code } = respondToInvitation(guest, invite, NOW + 1);
  return { invite, response, code };
}
async function stores(t) {
  const dir = await fs.mkdtemp(join(tmpdir(), 'nai-pair-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const a = new DeviceStore(join(dir, 'pc'));
  const b = new DeviceStore(join(dir, 'phone'));
  await a.init('PC'); await b.init('Samsung');
  return { a, b };
}
test('Identidad Ed25519 valida sin divulgar clave privada', () => {
  const publicInfo = validateIdentity(host);
  assert.match(publicInfo.deviceId, /^device:[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(publicInfo).includes('PRIVATE KEY'));
});
test('Detecta identidad con clave privada ajena', () => {
  assert.throws(() => validateIdentity({ ...host, privateKey: guest.privateKey }), /no coincide/);
});
test('Completa invitacion, respuesta y confirmacion firmadas', () => {
  const { invite, response, code } = sample();
  const { ack, peer } = confirmInvitation(host, invite, response, code, NOW + 2);
  assert.equal(peer.deviceId, guest.deviceId);
  assert.deepEqual(peer.permissions, []);
  assert.equal(finalizePairing(guest, invite, response, ack, code, NOW + 3).deviceId, host.deviceId);
});
test('Expiracion de invitacion', () => {
  assert.throws(() => respondToInvitation(guest, createInvitation(host, NOW), NOW + 181000), /expirada/);
});
test('Firma modificada en invitacion', () => {
  const invite = createInvitation(host, NOW);
  assert.throws(() => respondToInvitation(guest, { ...invite, name: 'Otro' }, NOW), /Firma/);
});
test('Firma modificada en respuesta', () => {
  const { invite, response, code } = sample();
  assert.throws(() => confirmInvitation(host, invite, { ...response, name: 'Otro' }, code, NOW), /Firma/);
});
test('Rechaza codigo humano incorrecto', () => {
  const { invite, response, code } = sample();
  assert.throws(() => confirmInvitation(host, invite, response, code === '00000000' ? '99999999' : '00000000', NOW), /codigo/);
});
test('Rechaza emparejar dispositivo consigo mismo', () => {
  assert.throws(() => respondToInvitation(host, createInvitation(host, NOW), NOW), /consigo mismo/);
});
test('Rechaza respuesta de invitacion distinta', () => {
  const { response, code } = sample();
  assert.throws(() => confirmInvitation(host, createInvitation(host, NOW), response, code, NOW), /otra invitacion/);
});
test('Rechaza confirmacion alterada', () => {
  const { invite, response, code } = sample();
  const { ack } = confirmInvitation(host, invite, response, code, NOW);
  assert.throws(() => finalizePairing(guest, invite, response, { ...ack, guestId: host.deviceId }, code, NOW), /otro emparejamiento/);
});
test('Token codificado no incluye secretos', () => {
  const { invite } = sample();
  const token = encodePairing(invite);
  assert.deepEqual(decodePairing(token), invite);
  assert.ok(!token.includes('PRIVATE KEY'));
  assert.throws(() => decodePairing('incorrecto'), /invalido/);
});
test('Identidad persistente tras reinicio y sin duplicacion', async t => {
  const { a } = await stores(t);
  assert.equal((await a.identity()).deviceId, (await new DeviceStore(a.root).identity()).deviceId);
  await assert.rejects(a.init('otro'), { code: 'EEXIST' });
});
test('Intercambio completo consume invitacion y respuesta una sola vez', async t => {
  const { a, b } = await stores(t);
  const pc = new PairSession(a, () => NOW);
  const invite = await pc.invite();
  const movil = new PairSession(b, () => NOW + 1000);
  const { response, code } = await movil.respond(invite.invitation);
  const { confirmation } = await new PairSession(a, () => NOW + 2000).confirm(response, code);
  await new PairSession(b, () => NOW + 3000).finalize(confirmation, code);
  assert.equal((await a.peers()).length, 1);
  assert.equal((await b.peers()).length, 1);
  await assert.rejects(pc.confirm(response, code), /pendiente/);
  await assert.rejects(movil.finalize(confirmation, code), /pendiente/);
});
test('Revocacion retira permisos y conserva registro', async t => {
  const { a, b } = await stores(t);
  const peer = validateIdentity(await b.identity());
  await a.addPeer({ ...peer, permissions: [], pairedAt: NOW, revokedAt: null });
  await a.revoke(peer.deviceId);
  const saved = (await a.peers())[0];
  assert.notEqual(saved.revokedAt, null);
  assert.deepEqual(saved.permissions, []);
});
test('No permite emparejar nuevamente un par activo', async t => {
  const { a, b } = await stores(t);
  const peer = validateIdentity(await b.identity());
  await a.addPeer({ ...peer, permissions: [], pairedAt: NOW, revokedAt: null });
  await assert.rejects(a.addPeer({ ...peer, permissions: [], pairedAt: NOW, revokedAt: null }), /ya esta/);
});
test('La salida del CLI no incluye clave privada', async t => {
  const { a } = await stores(t);
  const info = await runDeviceCommand(['info'], a);
  assert.ok(!JSON.stringify(info).includes('PRIVATE KEY'));
});

test('invitacion QR produce SVG escaneable sin clave privada', async t => {
  const { a } = await stores(t);
  const result = await runPairCommand(['invite', '--qr'], a, () => NOW);
  t.after(() => fs.rm(result.qrPath, { force: true }));
  const svg = await fs.readFile(result.qrPath, 'utf8');
  assert.equal(svg, await QRCode.toString(result.invitation,
    { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 768 }));
  assert.equal(decodePairing(result.invitation).deviceId, (await a.identity()).deviceId);
  assert.ok(!JSON.stringify(result).includes('PRIVATE KEY'));
  if (process.platform !== 'win32') assert.equal((await fs.stat(result.qrPath)).mode & 0o077, 0);
});
test('Directorio y claves con permisos privados en POSIX', async t => {
  const { a } = await stores(t);
  if (process.platform !== 'win32') {
    assert.equal((await fs.stat(a.path('identity.json'))).mode & 0o077, 0);
    assert.equal((await fs.stat(a.root)).mode & 0o077, 0);
  }
});
