import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { interpretarExportacionEngram, leerEngramPorProyecto, inspeccionarEngramPorProyecto } from "../src/engram.mjs";
const obs = (extra={}) => ({
  sync_id:"x-1",session_id:"s-1",title:"Decision",content:"SQLite local",
  project:"nai agendivo",updated_at:"2026-10-30T00:00:00Z",revision_count:1,...extra
});
const backup=(observations=[obs()])=>({
  version:"0.2.0",sessions:[{id:"s-1",project:"nai agendivo"}],
  observations,prompts:[{content:"PROMPT_PRIVADO"}],relations:[]
});
test("conserva sync_id y no transporta prompts",()=>{
 const r=interpretarExportacionEngram(backup(),"nai agendivo");
 assert.equal(r.memorias[0].id,"engram:x-1");
 assert.ok(!JSON.stringify(r).includes("PROMPT_PRIVADO"));
});
test("filtra por proyecto",()=>assert.equal(interpretarExportacionEngram(backup([obs({project:"otro"})]),"nai agendivo").memorias.length,0));
test("resuelve proyecto desde la sesion",()=>assert.equal(interpretarExportacionEngram(backup([obs({project:null})]),"nai agendivo").memorias.length,1));
test("incluye borrados logicos",()=>assert.equal(interpretarExportacionEngram(backup([obs({deleted_at:"2026-10-31"})]),"nai agendivo").memorias[0].eliminada,true));
test("hash de revision determinista",()=>{
 const a=interpretarExportacionEngram(backup(),"nai agendivo").memorias[0].revisionId;
 const b=interpretarExportacionEngram(backup([obs({content:"Nuevo"})]),"nai agendivo").memorias[0].revisionId;
 assert.notEqual(a,b);assert.equal(a,interpretarExportacionEngram(backup(),"nai agendivo").memorias[0].revisionId);
});
test("rechaza formatos desconocidos",()=>assert.throws(()=>interpretarExportacionEngram({...backup(),version:"10.0"},"nai agendivo"),/Formato/));
test("rechaza IDs duplicados",()=>assert.throws(()=>interpretarExportacionEngram(backup([obs(),obs()]),"nai agendivo"),/repetidos/));
test("exporta solo un proyecto, sin shell, limpia temporal",async()=>{
 let ruta;
 const ejecutar=async (cmd,args,options)=>{
   assert.equal(cmd,"engram");assert.equal(options.shell,false);
   assert.deepEqual(args.slice(2),["--project","nai agendivo"]);
   ruta=args[1];await fs.writeFile(ruta,JSON.stringify(backup()));
 };
 const r=await leerEngramPorProyecto("nai agendivo",{ejecutar});
 assert.equal(r.memorias.length,1);
 await assert.rejects(fs.stat(ruta),{code:"ENOENT"});
});
test("limpia temporal tras fallo y no expone stderr",async()=>{
 let ruta;
 const ejecutar=async(_cmd,args)=>{
   ruta=args[1];const err=new Error("fallo");
   err.stderr="SECRETO";throw err;
 };
 await assert.rejects(leerEngramPorProyecto("nai agendivo",{ejecutar}),err=>!err.message.includes("SECRETO"));
 await assert.rejects(fs.stat(ruta),{code:"ENOENT"});
});
test("inspect solamente informa conteos",async()=>{
 const ejecutar=async(_cmd,args)=>fs.writeFile(args[1],JSON.stringify(backup()));
 const r=await inspeccionarEngramPorProyecto("nai agendivo",{ejecutar});
 assert.equal(r.observaciones,1);
 assert.ok(!JSON.stringify(r).includes("SQLite local"));
});
