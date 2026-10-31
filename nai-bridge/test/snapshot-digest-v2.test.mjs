import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSnapshot, snapshotDigest, describeSnapshot, pageSnapshot, checkDownloadedSnapshot } from '../src/snapshot-wire.mjs';

const item = (id='engram:1') => ({
  id, proyectoId:'demo', revisionId:'r1', revisionPadreId:null,
  origen:'engram', contenido:'hola', eliminada:false
});
test('vector SHA256 v2 compatible con Dart',()=>{
 assert.equal(canonicalSnapshot([item()]), 'NAI-SNAPSHOT-V2\nZW5ncmFtOjE.ZGVtbw.cjE.~.ZW5ncmFt.aG9sYQ.0\n');
 assert.equal(snapshotDigest([item()]),'d6eb9836d1e12d150654d0128751741307f65d3720622db36840122bb7cb4c0e');
});
test('orden estable y campos extra no afectan digest',()=>{
 assert.equal(snapshotDigest([item('engram:a'),item('engram:b')]),
   snapshotDigest([{...item('engram:b'),extra:'ignorar'},item('engram:a')]));
});
test('cambio en contenido invalida checksum',()=>{
 const manifest=describeSnapshot({proyecto:'demo',memorias:[item()]},'demo');
 assert.equal(manifest.digestVersion,2);
 assert.throws(()=>checkDownloadedSnapshot(manifest,[{...item(),contenido:'adulterado'}]),/Integridad/);
});
test('pagina entrega version y hash v2',()=>{
 const snapshot={proyecto:'demo',memorias:[item()]};
 const manifest=describeSnapshot(snapshot,'demo');
 const page=pageSnapshot(snapshot,'demo',manifest.etag,0);
 assert.equal(page.digestVersion,2);
 assert.equal(checkDownloadedSnapshot(manifest,page.memories),true);
});
test('rechaza manifest legacy',()=>{
 const manifest=describeSnapshot({proyecto:'demo',memorias:[item()]},'demo');
 assert.throws(()=>checkDownloadedSnapshot({...manifest,digestVersion:1},[item()]));
});
