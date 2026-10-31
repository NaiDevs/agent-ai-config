import test from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateIdentity } from '../src/pairing.mjs';
import { DeviceStore, canReadProject } from '../src/devices.mjs';
import { AlmacenSnapshots } from '../src/snapshot.mjs';
import { listenSecure, pullSecure, requestSecure } from '../src/secure-transport.mjs';

const project = 'demo';
const memory = n => ({ id: 'engram:' + n, proyectoId: project, revisionId: 'r' + n,
  revisionPadreId: null, origen: 'engram', contenido: 'texto ' + n, eliminada: false });
async function setup(t, { enabled = true, count = 3 } = {}) {
  const dir = await fs.mkdtemp(join(tmpdir(), 'nai-sync-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const host = new DeviceStore(join(dir, 'pc')), guest = new DeviceStore(join(dir, 'phone'));
  await host.init('PC'); await guest.init('Phone');
  const h = validateIdentity(await host.identity()), g = validateIdentity(await guest.identity());
  await host.addPeer({ ...g, permissions: [], pairedAt: 1, revokedAt: null });
  await guest.addPeer({ ...h, permissions: [], pairedAt: 1, revokedAt: null });
  const source = new AlmacenSnapshots(join(dir, 'source'));
  await source.actualizar({ proyecto: project, memorias: Array.from({length: count}, (_, i) => memory(i)) });
  const dest = new AlmacenSnapshots(join(dir, 'target'));
  const server = await listenSecure(host, { port: 0, allowMemory: enabled, snapshotStore: source });
  t.after(() => new Promise(resolve => server.close(resolve)));
  return { host, guest, h, g, source, dest, args: {
    host: '127.0.0.1', port: server.address().port, peerId: h.deviceId, project, remoteStore: dest } };
}
test('par no autorizado no puede leer memoria', async t => {
  const x = await setup(t);
  assert.equal(canReadProject((await x.host.peers())[0], project), false);
  await assert.rejects(pullSecure(x.guest, x.args));
  assert.equal((await x.dest.cargar(project)).memorias.length, 0);
});
test('descarga segura de 50 registros, paginas y reinicio', async t => {
  const x = await setup(t, { count: 50 });
  await x.host.grantRead(x.g.deviceId, project);
  const result = await pullSecure(x.guest, x.args);
  assert.equal(result.count, 50);
  assert.equal(result.importedIntoEngram, false);
  assert.equal((await new AlmacenSnapshots(x.dest.directorio).cargar(project)).memorias.length, 50);
  assert.equal((await pullSecure(x.guest, x.args)).added, 0);
});
test('permisos no se extienden a otros proyectos', async t => {
  const x = await setup(t);
  await x.host.grantRead(x.g.deviceId, project);
  await assert.rejects(pullSecure(x.guest, {...x.args, project: 'otro'}));
});
test('revocar permisos y par corta descargas', async t => {
  const x = await setup(t);
  await x.host.grantRead(x.g.deviceId, project);
  await x.host.denyRead(x.g.deviceId, project);
  await assert.rejects(pullSecure(x.guest, x.args));
  await x.host.grantRead(x.g.deviceId, project);
  await x.host.revoke(x.g.deviceId);
  await assert.rejects(pullSecure(x.guest, x.args));
});
test('bandera allowMemory necesaria aun con permiso', async t => {
  const x = await setup(t, {enabled: false});
  await x.host.grantRead(x.g.deviceId, project);
  await assert.rejects(pullSecure(x.guest, x.args));
});
test('manifest antiguo no permite leer snapshot cambiado', async t => {
  const x = await setup(t);
  await x.host.grantRead(x.g.deviceId, project);
  const m = await requestSecure(x.guest, {...x.args, request: {op: 'manifest', project}});
  await x.source.actualizar({ proyecto: project, memorias: [memory(0), {...memory(1), revisionId: 'r9', contenido: 'cambio'}, memory(2)] });
  await assert.rejects(requestSecure(x.guest, {...x.args, request: {op: 'page', project, etag: m.etag, offset: 0}}));
});
