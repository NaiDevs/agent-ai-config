import { DeviceStore } from './devices.mjs';
import { listenSecure, pingSecure, pullSecure } from './secure-transport.mjs';

function parsePort(items, fallback = 4392) {
  const idx = items.indexOf('--port');
  if (idx < 0) return fallback;
  const text = items[idx + 1];
  if (typeof text !== 'string' || !/^\d+$/.test(text)) throw new Error('Puerto invalido.');
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto invalido.');
  return port;
}

export async function runTransportCommand(args, store = new DeviceStore(), transport = { listenSecure, pingSecure, pullSecure }) {
  const [action, ...rest] = args;
  if (action === 'serve') {
    const lan = rest.includes('--lan');
    const memory = rest.includes('--memory');
    const unknown = rest.filter((item, index) => item !== '--lan' && item !== '--memory' && item !== '--port' && rest[index - 1] !== '--port');
    if (unknown.length || rest.filter(item => item === '--port').length > 1 || rest.filter(item => item === '--lan').length > 1 || rest.filter(item => item === '--memory').length > 1) {
      throw new Error('Uso: transport serve [--lan] [--memory] [--port 4392]');
    }
    const port = parsePort(rest);
    const host = lan ? '0.0.0.0' : '127.0.0.1';
    const server = await transport.listenSecure(store, { port, host, allowLan: lan, allowMemory: memory });
    return { listening: true, tls: '1.3', host, port: server.address().port,
      operations: memory ? ['ping','manifest','page'] : ['ping'], memorySync: memory, note: 'Solo dispositivos emparejados; sin acceso a memorias.' };
  }
  if (action === 'ping') {
    if (rest.length < 2 || rest.length > 4 || (rest.length > 2 && (rest[2] !== '--port' || rest.length !== 4))) {
      throw new Error('Uso: transport ping HOST DEVICE_ID [--port 4392]');
    }
    return transport.pingSecure(store, { host: rest[0], peerId: rest[1], port: parsePort(rest) });
  }
  if (action === 'pull') {
    if ((rest.length !== 4 && rest.length !== 6) || rest[2] !== '--project' ||
        (rest.length === 6 && rest[4] !== '--port') || !rest[0] || !rest[1] || !rest[3]) {
      throw new Error('Uso: transport pull HOST DEVICE_ID --project NAME [--port N]');
    }
    return transport.pullSecure(store, { host: rest[0], peerId: rest[1], project: rest[3], port: parsePort(rest) });
  }
  throw new Error('Uso: transport serve [--lan] [--memory] [--port N] | transport ping HOST DEVICE_ID [--port N] | transport pull HOST DEVICE_ID --project NAME [--port N]');
}
