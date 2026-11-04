'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const w=JSON.parse(fs.readFileSync(path.join(__dirname,'../workflows/optimized/rag-obsidian.v0.1.json')));
const r=JSON.parse(fs.readFileSync(path.join(__dirname,'../workflows/optimized/russell.v0.1.json')));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const config=require('../config/rag.example.json');
const input={json:{fileName:'note.md'},binary:{data:{directory:'/vault/A',fileName:'note.md'}}};
const doc='---\nrag_sync: true\naudit_russell: true\n---\nContenu à indexer.';
async function runCode(workflow,name,items,states,helpers={}){
 const n=workflow.nodes.find(n=>n.name===name);assert.ok(n,name);
 const $=key=>({first:()=>states[key][0],item:states[key][0],all:()=>states[key]});
 const result=await new AsyncFunction('$input','$json','$','$execution',n.parameters.jsCode).call({helpers}, {all:()=>items,first:()=>items[0]},items[0]?.json,$,{id:'test-001'});
 states[name]=result;return result;
}
function body(name,j,states){const n=w.nodes.find(n=>n.name===name);return Function('$json','$',`return (${n.parameters.jsonBody.slice(3,-2)});`)(j,key=>({first:()=>states[key][0]}));}
async function simulate({count=0,embeddingFailure=false,upsertFailure=false,dryRun=false,content=doc}={}){
 const states={'Configurer RAG':[{json:{...config,dryRun,embeddingRevision:'sha256:synthetic-test-revision',qdrantBaseUrl:'http://qdrant.test',ollamaBaseUrl:'http://ollama.test'}}]};const calls=[];
 const p=await runCode(w,'Planifier notes',[input],states,{getBinaryDataBuffer:async()=>Buffer.from(content)});states['Boucle notes']=p;
 const n=p[0].json;
 if(n.action==='dry-run'||n.action==='skip')return {calls,states};
 calls.push('count');body('Compter generation',n,states);
 await runCode(w,'Verifier generation',[{json:{status:'ok',result:{count}}}],states);
 const needs=states['Verifier generation'][0].json;
 if(needs.needsEmbedding){
  calls.push('embed');const req=body('Calculer embeddings',needs,states);assert.equal(req.truncate,false);
  if(embeddingFailure)throw Object.assign(Error('embed failed'),{calls});
  await runCode(w,'Construire points',[{json:{embeddings:n.chunks.map(()=>Array(768).fill(.1))}}],states);
  calls.push('upsert');body('Upsert generation',states['Construire points'][0].json,states);
  if(upsertFailure)throw Object.assign(Error('upsert failed'),{calls});
  await runCode(w,'Confirmer upsert',[{json:{status:'ok',result:{status:'completed'}}}],states);
 }
 calls.push('cleanup');const del=body('Nettoyer anciennes generations',needs,states);assert.equal(del.filter.must[0].match.value,'/vault/A/note.md');
 const result=await runCode(w,'Confirmer indexation',[{json:{status:'ok',result:{status:'completed'}}}],states);
 await runCode(w,'Bilan et extraits',result,states);return {calls,states};
}
test('chemin réel du candidat : count → embed → upsert → cleanup',async()=>{const s=await simulate();assert.deepEqual(s.calls,['count','embed','upsert','cleanup']);assert.equal(s.states['Confirmer indexation'][0].json.status,'indexed');});
test('échec embedding : aucun upsert ni delete',async()=>{await assert.rejects(simulate({embeddingFailure:true}),e=>{assert.deepEqual(e.calls,['count','embed']);return true;});});
test('échec upsert : aucun cleanup',async()=>{await assert.rejects(simulate({upsertFailure:true}),e=>{assert.deepEqual(e.calls,['count','embed','upsert']);return true;});});
test('génération complète : aucun embedding et aucun audit répété',async()=>{const s=await simulate({count:1});assert.deepEqual(s.calls,['count','cleanup']);assert.equal(s.states['Confirmer indexation'][0].json.status,'unchanged');assert.equal(s.states['Bilan et extraits'][0].json.callAudit,false);});
test('dryRun RAG : zéro HTTP',async()=>{assert.deepEqual((await simulate({dryRun:true})).calls,[]);});
test('révision embedding non renseignée : refus avant lecture binaire et HTTP',async()=>{const states={'Configurer RAG':[{json:{...config,dryRun:false,qdrantBaseUrl:'http://qdrant.test',ollamaBaseUrl:'http://ollama.test'}}]};let reads=0;await assert.rejects(runCode(w,'Planifier notes',[input],states,{getBinaryDataBuffer:async()=>{reads++;return Buffer.from(doc);}}),/EMBEDDING_REVISION_REQUIRED/);assert.equal(reads,0);});
test('agrégation audit bornée, sources omises comptées',async()=>{const states={'Configurer RAG':[{json:{...config,enableAudit:true,maxAuditNotes:2,maxAuditChars:1200}}]};const rows=Array.from({length:8},(_,i)=>({json:{fileName:'/vault/'+i+'.md',status:'indexed',audit_russell:true,excerpt:'a'.repeat(300)}}));const out=await runCode(w,'Bilan et extraits',rows,states);assert.ok(out[0].json.notes_du_jour.length<=1200);assert.equal(out[0].json.audit_omitted,6);assert.equal(out[0].json.callAudit,true);});
test('normalisation Russell interdit plusieurs entrées',async()=>{const states={};await assert.rejects(runCode(r,'Normaliser entree',[{json:{}},{json:{}}],states),/ONE_INPUT_REQUIRED/);});
test('Russell simulation contourne modèle et outils dans le graphe',()=>{const outs=r.connections['Mode simulation'].main;assert.equal(outs[0][0].node,'Apercu sans reseau');assert.equal(outs[1][0].node,'Router source');});
test('audit utilise une chaîne sans mémoire ni outils',()=>{const target=r.nodes.find(n=>n.name==='Analyser extraits');assert.equal(target.type,'@n8n/n8n-nodes-langchain.chainLlm');for(const connections of Object.values(r.connections))for(const type of ['ai_memory','ai_tool'])assert.ok(!(connections[type]||[]).flat().some(e=>e.node===target.name));});
test('tous les nœuds Code compilent sans exécution',()=>{for(const wf of [r,w])for(const n of wf.nodes.filter(n=>n.type==='n8n-nodes-base.code'))assert.doesNotThrow(()=>new AsyncFunction('$input','$json','$','$execution',n.parameters.jsCode),n.name);});
test('expressions des URLs HTTP valides et URLs sans double séparateur',()=>{for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest')){const fn=Function('$',`return (${n.parameters.url.slice(3,-2)});`);const url=fn(()=>({first:()=>({json:{qdrantBaseUrl:'http://qdrant.test:6333/',ollamaBaseUrl:'http://ollama.test:11434/',collection:'staging'}})}));assert.ok(url.startsWith(n.name==='Calculer embeddings'?'http://ollama.test:11434/api/embed':'http://qdrant.test:6333/collections/staging/'));}});
test('toutes les expressions embarquées sont syntaxiquement valides',()=>{function visit(v){if(typeof v==='string'&&v.startsWith('={{')&&v.endsWith('}}'))assert.doesNotThrow(()=>Function(`return (${v.slice(3,-2)});`),v);else if(v&&typeof v==='object')for(const x of Object.values(v))visit(x);}visit(r);visit(w);});
test('aucune connexion Bobby ou Audit Cerveau ; pas de credential exporté',()=>{assert.ok(!r.nodes.some(n=>/Call Bobby|AUDIT_CERVEAU/.test(n.name)));for(const wf of [r,w]){assert.equal(wf.active,false);assert.ok(wf.nodes.every(n=>!n.credentials));}});
