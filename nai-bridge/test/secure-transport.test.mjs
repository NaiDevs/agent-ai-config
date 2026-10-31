import test from 'node:test';
import assert from 'node:assert/strict';
import tls from 'node:tls';
import { createIdentity } from '../src/pairing.mjs';
import { createTlsCredentials, listenSecure, pingSecure } from '../src/secure-transport.mjs';

const identity = createIdentity;
class Store {
  constructor(id) { this.id=id;this.entries=[]; }
  async identity() {return this.id;}
  async peers() {return this.entries;}
  add(id) {this.entries.push({...id,permissions:[],revokedAt:null});}
  revoke(id) {this.entries.find(x=>x.deviceId===id).revokedAt=Date.now();}
}
async function serverFor(t) {
  const a=new Store(identity('pc'));
  const b=new Store(identity('phone'));
  a.add(b.id); b.add(a.id);
  const server=await listenSecure(a,{port:0});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  return {a,b,port:server.address().port,server};
}

test('TLS 1.3 con clave publica emparejada',async t=>{
  const {a,b,port}=await serverFor(t);
  const pong=await pingSecure(b,{host:'127.0.0.1',port,peerId:a.id.deviceId});
  assert.deepEqual(pong,{connected:true,peerId:a.id.deviceId,encrypted:true,memoryAccess:false});
});
test('identidades TLS usan exactamente la clave Ed25519 emparejada',async()=>{
  const id=identity('test');
  const creds=await createTlsCredentials(id);
  assert.match(creds.cert,/BEGIN CERTIFICATE/);
  assert.equal(creds.key,id.privateKey);
});
test('un servidor distinto es rechazado por el cliente',async t=>{
  const {b,port}=await serverFor(t);
  const wrong=identity('stranger');
  await assert.rejects(pingSecure(b,{host:'127.0.0.1',port,peerId:wrong.deviceId}),/identidad esperada/);
});
test('revocar servidor impide nuevas conexiones',async t=>{
  const {a,b,port}=await serverFor(t);
  b.revoke(a.id.deviceId);
  await assert.rejects(pingSecure(b,{host:'127.0.0.1',port,peerId:a.id.deviceId}),/revocado/);
});
test('cliente desconocido no recibe respuesta',async t=>{
  const {a,port}=await serverFor(t);
  const unknown=new Store(identity('unknown')); unknown.add(a.id);
  await assert.rejects(pingSecure(unknown,{host:'127.0.0.1',port,peerId:a.id.deviceId}));
});
test('cliente revocado no recibe respuesta',async t=>{
  const {a,b,port}=await serverFor(t);
  a.revoke(b.id.deviceId);
  await assert.rejects(pingSecure(b,{host:'127.0.0.1',port,peerId:a.id.deviceId}));
});
test('acceso a LAN requiere permiso explicito',async()=>{
  const s=new Store(identity('pc'));
  await assert.rejects(listenSecure(s,{host:'0.0.0.0',port:0}),/LAN requiere/);
});
test('solo se acepta puerto entero',async()=>{
  const s=new Store(identity('pc'));
  await assert.rejects(listenSecure(s,{port:65536}),/Puerto TLS/);
});
test('conexiones en TLS 1.2 son rechazadas',async t=>{
  const {port}=await serverFor(t);
  const creds=await createTlsCredentials(identity('bad'));
  await assert.rejects(new Promise((resolve,reject)=>{
    const socket=tls.connect({host:'127.0.0.1',port,...creds,rejectUnauthorized:false,maxVersion:'TLSv1.2'});
    socket.once('secureConnect',()=>{socket.destroy();resolve();});
    socket.once('error',reject);
  }));
});
