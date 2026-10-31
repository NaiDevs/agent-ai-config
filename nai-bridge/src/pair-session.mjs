import { DeviceStore } from './devices.mjs';
import {
  createInvitation, respondToInvitation, confirmInvitation, finalizePairing,
  encodePairing, decodePairing,
} from './pairing.mjs';

export class PairSession {
  constructor(store = new DeviceStore(), now = () => Date.now()) { this.store = store; this.now = now; }
  async invite() {
    const identity = await this.store.identity();
    const invite = createInvitation(identity, this.now());
    await this.store.write('pending-invite.json', invite);
    return { invitation: encodePairing(invite), expiresAt: invite.expiresAt };
  }
  async respond(invitationToken) {
    const identity = await this.store.identity();
    const invite = decodePairing(invitationToken);
    const { response, code } = respondToInvitation(identity, invite, this.now());
    await this.store.write('pending-response.json', { invite, response });
    return { response: encodePairing(response), code, expiresAt: invite.expiresAt };
  }
  async confirm(responseToken, code) {
    const identity = await this.store.identity();
    const invite = await this.store.read('pending-invite.json');
    if (!invite) throw new Error('No existe una invitacion pendiente o ya fue utilizada.');
    const response = decodePairing(responseToken);
    const { ack, peer } = confirmInvitation(identity, invite, response, code, this.now());
    await this.store.addPeer(peer);
    await this.store.remove('pending-invite.json');
    return { confirmation: encodePairing(ack), peerId: peer.deviceId, permissions: [] };
  }
  async finalize(ackToken, code) {
    const identity = await this.store.identity();
    const pending = await this.store.read('pending-response.json');
    if (!pending?.invite || !pending?.response) throw new Error('No existe una respuesta pendiente.');
    const ack = decodePairing(ackToken);
    const peer = finalizePairing(identity, pending.invite, pending.response, ack, code, this.now());
    await this.store.addPeer(peer);
    await this.store.remove('pending-response.json');
    return { peerId: peer.deviceId, permissions: [] };
  }
}
