import {
  createHash, createPrivateKey, createPublicKey, generateKeyPairSync,
  randomBytes, sign, timingSafeEqual, verify,
} from 'node:crypto';

const PREFIX = 'nai-pair-v1:';
const MAX_TOKEN = 8000;
const MAX_TTL_MS = 3 * 60 * 1000;
const DOMAIN = 'nai-pair-v1';

function assertion(ok, message = 'Mensaje de emparejamiento invalido.') {
  if (!ok) throw new Error(message);
}
function digest(...data) { return createHash('sha256').update(JSON.stringify([DOMAIN, ...data])).digest('hex'); }
function signedBytes(kind, fields) { return Buffer.from(JSON.stringify([DOMAIN, kind, ...fields])); }
function publicId(key) { return 'device:' + createHash('sha256').update(Buffer.from(key, 'base64url')).digest('hex'); }
function validarClave(key) {
  assertion(typeof key === 'string' && key.length < 220);
  let obj;
  try { obj = createPublicKey({ key: Buffer.from(key, 'base64url'), format: 'der', type: 'spki' }); }
  catch { throw new Error('Clave publica invalida.'); }
  assertion(obj.asymmetricKeyType === 'ed25519', 'Se requiere clave Ed25519.');
  const canonical = obj.export({ format: 'der', type: 'spki' }).toString('base64url');
  assertion(canonical === key, 'Clave publica no canonica.');
  return obj;
}
function signFields(identity, kind, fields) {
  return sign(null, signedBytes(kind, fields), createPrivateKey(identity.privateKey)).toString('base64url');
}
function verifyFields(key, signature, kind, fields) {
  assertion(typeof signature === 'string' && signature.length <= 150);
  const sig = Buffer.from(signature, 'base64url');
  assertion(sig.length === 64 && sig.toString('base64url') === signature, 'Firma malformada.');
  assertion(verify(null, signedBytes(kind, fields), validarClave(key), sig), 'Firma de dispositivo invalida.');
}
function checkDate(expiresAt, now) {
  assertion(Number.isSafeInteger(expiresAt) && expiresAt >= now && expiresAt - now <= MAX_TTL_MS,
    'Invitacion expirada o fuera de plazo.');
}
function verifyInvite(invite, now) {
  assertion(invite?.version === 1 && invite?.kind === 'invite');
  assertion(typeof invite.nonce === 'string' && /^[A-Za-z0-9_-]{43}$/.test(invite.nonce));
  assertion(typeof invite.name === 'string' && invite.name.length >= 1 && invite.name.length <= 60);
  const hostId = publicId(invite.publicKey);
  assertion(hostId === invite.deviceId, 'ID del invitador no coincide con su clave.');
  checkDate(invite.expiresAt, now);
  verifyFields(invite.publicKey, invite.signature, 'invite',
    [invite.deviceId, invite.publicKey, invite.name, invite.nonce, invite.expiresAt]);
  return hostId;
}
function inviteDigest(invite) { return digest('invite', invite.deviceId, invite.publicKey, invite.name, invite.nonce, invite.expiresAt, invite.signature); }
function responseFields(response) { return [response.invitationDigest, response.deviceId, response.publicKey, response.name]; }
function verifyResponse(response, invite) {
  assertion(response?.version === 1 && response?.kind === 'response');
  assertion(typeof response.name === 'string' && response.name.length >= 1 && response.name.length <= 60);
  assertion(response.invitationDigest === inviteDigest(invite), 'Respuesta para otra invitacion.');
  assertion(publicId(response.publicKey) === response.deviceId, 'ID del invitado no coincide con su clave.');
  assertion(response.deviceId !== invite.deviceId, 'No se puede vincular un dispositivo consigo mismo.');
  verifyFields(response.publicKey, response.signature, 'response', responseFields(response));
}
function codeFor(invite, response) {
  const codeHash = digest('sas', inviteDigest(invite), response.deviceId, response.publicKey, response.signature);
  return String(Number(BigInt('0x' + codeHash.slice(0, 12)) % 100000000n)).padStart(8, '0');
}
function checkCode(actual, expected) {
  assertion(typeof actual === 'string' && /^[0-9]{8}$/.test(actual), 'Codigo de confirmacion invalido.');
  assertion(timingSafeEqual(Buffer.from(actual), Buffer.from(expected)), 'El codigo de confirmacion no coincide.');
}
function verifyAck(ack, invite, response) {
  assertion(ack?.version === 1 && ack?.kind === 'ack');
  assertion(ack.invitationDigest === inviteDigest(invite) && ack.guestId === response.deviceId,
    'Confirmacion corresponde a otro emparejamiento.');
  verifyFields(invite.publicKey, ack.signature, 'ack', [ack.invitationDigest, ack.guestId]);
}

/** The privateKey is never included in tokens or HTTP responses. */
export function createIdentity(name) {
  assertion(typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 60,
    'Nombre de dispositivo invalido.');
  const pair = generateKeyPairSync('ed25519');
  const publicKey = pair.publicKey.export({ format: 'der', type: 'spki' }).toString('base64url');
  return {
    version: 1, name: name.trim(), deviceId: publicId(publicKey), publicKey,
    privateKey: pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
  };
}
export function validateIdentity(identity) {
  assertion(identity?.version === 1 && typeof identity?.name === 'string');
  assertion(identity.deviceId === publicId(identity.publicKey), 'ID local inconsistente.');
  const obj = createPrivateKey(identity.privateKey);
  assertion(obj.asymmetricKeyType === 'ed25519');
  const publicFromPrivate = createPublicKey(obj).export({ format: 'der', type: 'spki' }).toString('base64url');
  assertion(identity.publicKey === publicFromPrivate, 'Clave privada no coincide con la identidad.');
  return { name: identity.name, deviceId: identity.deviceId, publicKey: identity.publicKey };
}
export function createInvitation(identity, now = Date.now()) {
  validateIdentity(identity);
  const invite = {
    version: 1, kind: 'invite', deviceId: identity.deviceId, publicKey: identity.publicKey,
    name: identity.name, nonce: randomBytes(32).toString('base64url'), expiresAt: now + MAX_TTL_MS,
  };
  invite.signature = signFields(identity, 'invite', [invite.deviceId, invite.publicKey, invite.name, invite.nonce, invite.expiresAt]);
  return invite;
}
export function respondToInvitation(identity, invite, now = Date.now()) {
  validateIdentity(identity);
  verifyInvite(invite, now);
  assertion(identity.deviceId !== invite.deviceId, 'No se puede vincular un dispositivo consigo mismo.');
  const response = {
    version: 1, kind: 'response', invitationDigest: inviteDigest(invite),
    deviceId: identity.deviceId, publicKey: identity.publicKey, name: identity.name,
  };
  response.signature = signFields(identity, 'response', responseFields(response));
  return { response, code: codeFor(invite, response) };
}
export function confirmInvitation(identity, invite, response, code, now = Date.now()) {
  validateIdentity(identity);
  verifyInvite(invite, now);
  assertion(invite.deviceId === identity.deviceId, 'La invitacion pertenece a otro dispositivo.');
  verifyResponse(response, invite);
  checkCode(code, codeFor(invite, response));
  const ack = { version: 1, kind: 'ack', invitationDigest: inviteDigest(invite), guestId: response.deviceId };
  ack.signature = signFields(identity, 'ack', [ack.invitationDigest, ack.guestId]);
  return { ack, peer: { deviceId: response.deviceId, publicKey: response.publicKey, name: response.name, permissions: [], pairedAt: now, revokedAt: null } };
}
export function finalizePairing(identity, invite, response, ack, code, now = Date.now()) {
  validateIdentity(identity);
  verifyInvite(invite, now);
  assertion(identity.deviceId === response.deviceId, 'La respuesta pertenece a otro dispositivo.');
  verifyResponse(response, invite);
  checkCode(code, codeFor(invite, response));
  verifyAck(ack, invite, response);
  return { deviceId: invite.deviceId, publicKey: invite.publicKey, name: invite.name, permissions: [], pairedAt: now, revokedAt: null };
}
export function encodePairing(value) {
  assertion(value?.version === 1 && ['invite', 'response', 'ack'].includes(value.kind));
  return PREFIX + Buffer.from(JSON.stringify(value)).toString('base64url');
}
export function decodePairing(token) {
  assertion(typeof token === 'string' && token.startsWith(PREFIX) && token.length < MAX_TOKEN, 'Token de emparejamiento invalido.');
  let result;
  try { result = JSON.parse(Buffer.from(token.slice(PREFIX.length), 'base64url').toString('utf8')); }
  catch { throw new Error('Token de emparejamiento malformado.'); }
  assertion(result?.version === 1 && ['invite', 'response', 'ack'].includes(result.kind));
  return result;
}
export function fingerprint(identity) { return identity.deviceId.slice('device:'.length, 'device:'.length + 16); }
