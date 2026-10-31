import { DeviceStore } from './devices.mjs';
import { PairSession } from './pair-session.mjs';
import { validateIdentity, fingerprint } from './pairing.mjs';

export async function runDeviceCommand(args, store = new DeviceStore()) {
  const [action, ...rest] = args;
  if (action === 'init' && rest.length >= 1) {
    return { identity: await store.init(rest.join(' ')), note: 'Clave privada guardada solo en esta maquina.' };
  }
  if (action === 'info' && rest.length === 0) {
    const pub = validateIdentity(await store.identity());
    return { ...pub, fingerprint: fingerprint(pub) };
  }
  if (action === 'peers' && rest.length === 0) {
    const peers = await store.peers();
    return { peers: peers.map(p => ({ deviceId: p.deviceId, name: p.name, permissions: p.permissions, revokedAt: p.revokedAt })) };
  }
  if (action === 'revoke' && rest.length === 1) {
    await store.revoke(rest[0]);
    return { revoked: rest[0] };
  }
  throw new Error('Uso: device init NOMBRE | device info | device peers | device revoke DEVICE_ID');
}
export async function runPairCommand(args, store = new DeviceStore(), now = () => Date.now()) {
  const pairing = new PairSession(store, now);
  const [action, ...rest] = args;
  if (action === 'invite' && rest.length === 0) return pairing.invite();
  if (action === 'respond' && rest.length === 1) return pairing.respond(rest[0]);
  if (action === 'confirm' && rest.length === 2) return pairing.confirm(rest[0], rest[1]);
  if (action === 'finalize' && rest.length === 2) return pairing.finalize(rest[0], rest[1]);
  throw new Error('Uso: pair invite | pair respond TOKEN | pair confirm TOKEN CODIGO | pair finalize TOKEN CODIGO');
}
