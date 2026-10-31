import { DeviceStore } from './devices.mjs';
import { listenSecure, pingSecure } from './secure-transport.mjs';

function parsePort(items, fallback = 4392) {
  const idx = items.indexOf('--port');
  if (idx < 0) return fallback;
  const text = items[idx + 1];
  if (typeof text !== 'string' || !/^\d+$/.test(text)) throw new Error('Puerto invalido.');
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto invalido.');
  return port;
}

export async function runTransportCommand(args, store = new DeviceStore()) {
  const [action, ...rest] = args;
  if (action === 'serve') {
    const lan = rest.includes('--lan');
    const unknown = rest.filter((item, index) => item !== '--lan' && item !== '--port' && rest[index - 1] !== '--port');
    if (unknown.length || rest.filter(item => item === '--port').length > 1 || rest.filter(item => item === '--lan').length > 1) {
      throw new Error('Uso: transport serve [--lan] [--port 4392]');
    }
    const port = parsePort(rest);
    const host = lan ? '0.0.0.0' : '127.0.0.1';
    const server = await listenSecure(store, { port, host, allowLan: lan });
    return { listening: true, tls: '1.3', host, port: server.address().port,
      operations: ['ping'], memorySync: false, note: 'Solo dispositivos emparejados; sin acceso a memorias.' };
  }
  if (action === 'ping') {
    if (rest.length < 2 || rest.length > 4 || (rest.length > 2 && (rest[2] !== '--port' || rest.length !== 4))) {
      throw new Error('Uso: transport ping HOST DEVICE_ID [--port 4392]');
    }
    return pingSecure(store, { host: rest[0], peerId: rest[1], port: parsePort(rest) });
  }
  throw new Error('Uso: transport serve [--lan] [--port N] | transport ping HOST DEVICE_ID [--port N]');
}