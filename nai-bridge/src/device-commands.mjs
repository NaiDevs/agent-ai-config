import { DeviceStore } from './devices.mjs';
import { PairSession } from './pair-session.mjs';
import { validateIdentity, fingerprint } from './pairing.mjs';
import QRCode from 'qrcode';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  if (action === 'grant-read' && rest.length >= 2) return store.grantRead(rest[0], rest.slice(1).join(' '));
  if (action === 'deny-read' && rest.length >= 2) return store.denyRead(rest[0], rest.slice(1).join(' '));
  if (action === 'revoke' && rest.length === 1) {
    await store.revoke(rest[0]);
    return { revoked: rest[0] };
  }
  throw new Error('Uso: device init NOMBRE | device info | device peers | device revoke DEVICE_ID | device grant-read DEVICE_ID PROJECT | device deny-read DEVICE_ID PROJECT');
}
export async function runPairCommand(args, store = new DeviceStore(), now = () => Date.now()) {
  const pairing = new PairSession(store, now);
  const [action, ...rest] = args;
  if (action === 'invite' && rest.length === 0) return pairing.invite();
  if (action === 'invite' && rest.length === 1 && rest[0] === '--qr') {
    const invitation = await pairing.invite();
    const svg = await QRCode.toString(invitation.invitation,
      { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 768 });
    const qrPath = join(tmpdir(), `nai-pair-${randomUUID()}.svg`);
    await fs.writeFile(qrPath, svg, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    return { ...invitation, qrPath };
  }
  if (action === 'respond' && rest.length === 1) return pairing.respond(rest[0]);
  if (action === 'confirm' && rest.length === 2) return pairing.confirm(rest[0], rest[1]);
  if (action === 'finalize' && rest.length === 2) return pairing.finalize(rest[0], rest[1]);
  throw new Error('Uso: pair invite [--qr] | pair respond TOKEN | pair confirm TOKEN CODIGO | pair finalize TOKEN CODIGO');
}
