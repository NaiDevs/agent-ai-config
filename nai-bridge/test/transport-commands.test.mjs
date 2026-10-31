import test from 'node:test';
import assert from 'node:assert/strict';
import { runTransportCommand } from '../src/transport-commands.mjs';
import { pullSecure } from '../src/secure-transport.mjs';
import { snapshotDigest } from '../src/snapshot-wire.mjs';

test('transport pull despacha host, par, proyecto y puerto', async () => {
  const store = {};
  let received;
  const transport = { pullSecure: async (actualStore, options) => {
    received = { actualStore, options };
    return { count: 2 };
  } };
  const result = await runTransportCommand(
    ['pull', '127.0.0.1', 'device:test', '--project', 'demo', '--port', '4439'], store, transport);
  assert.deepEqual(result, { count: 2 });
  assert.deepEqual(received, { actualStore: store, options: {
    host: '127.0.0.1', peerId: 'device:test', project: 'demo', port: 4439 } });
});

test('transport serve --lan --memory expone solo las operaciones habilitadas', async () => {
  const store = {};
  let received;
  const transport = { listenSecure: async (actualStore, options) => {
    received = { actualStore, options };
    return { address: () => ({ port: 4392 }) };
  } };
  const result = await runTransportCommand(['serve', '--lan', '--memory', '--port', '4392'], store, transport);
  assert.deepEqual(received, { actualStore: store, options: {
    port: 4392, host: '0.0.0.0', allowLan: true, allowMemory: true } });
  assert.deepEqual(result.operations, ['ping', 'manifest', 'page']);
  assert.equal(result.memorySync, true);
});

test('transport serve --mobile usa TLS compatible en puerto separado y sin memorias', async () => {
  let received;
  const transport = { listenMobileSecure: async (_, options) => {
    received = options;
    return { address: () => ({ port: 4393 }) };
  } };
  const result = await runTransportCommand(['serve', '--mobile'], {}, transport);
  assert.deepEqual(received, { port: 4393, host: '127.0.0.1', allowLan: false, allowMemory: false });
  assert.equal(result.protocol, 'nai-transport-v2');
  assert.deepEqual(result.operations, ['ping']);
});

test('transport rechaza argumentos ambiguos antes de abrir el servidor', async () => {
  const transport = { listenSecure: async () => { throw new Error('No debe escucharse'); } };
  for (const args of [
    ['serve', '--lan', '--lan'], ['serve', '--memory', '--memory'],
    ['serve', '--port'], ['serve', '--port', '0'], ['serve', '--unknown'],
    ['pull', 'localhost', 'device:test', '--project'],
    ['pull', 'localhost', 'device:test', '--project', 'demo', '--port', '0'],
    ['pull', 'localhost', 'device:test', '--project', 'demo', '--memory'],
  ]) {
    await assert.rejects(runTransportCommand(args, {}, transport));
  }
});

test('pull sin destino explicito verifica y no persiste memorias', async () => {
  const result = await pullSecure({}, {
    host: '127.0.0.1', peerId: `device:${'a'.repeat(64)}`, project: 'demo',
    requester: async () => ({ project: 'demo', count: 0,
      digestVersion: 2, etag: snapshotDigest([]) }),
  });
  assert.equal(result.storedLocally, false);
  assert.equal(result.count, 0);
  assert.equal(result.importedIntoEngram, false);
});
