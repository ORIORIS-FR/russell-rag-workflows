'use strict';

// Fonctions pures, partagées entre les tests et les nœuds Code générés.
// Aucun module externe, aucune lecture de fichiers, aucun appel réseau.
function fail(code) { throw new Error(code); }
function scalar(value) {
  const v = value.trim();
  if (v.startsWith('"')) { try { return JSON.parse(v); } catch { fail('INVALID_QUOTED_SCALAR'); } }
  if (v.startsWith("'")) {
    if (!v.endsWith("'")) fail('INVALID_QUOTED_SCALAR');
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v.replace(/\s+#.*$/, '').trim();
}
function frontmatter(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { fields: {}, body: text };
  const fields = {};
  // Sous-ensemble volontaire : clés racine scalaires ; listes de tags à part.
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-zA-Z_][\w-]*):[ \t]*(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (!['rag_sync', 'audit_russell', 'updated_at', 'title', 'type', 'status', 'tags'].includes(key)) continue;
    if (Object.hasOwn(fields, key)) fail('DUPLICATE_FRONTMATTER_KEY');
    if (key === 'rag_sync' || key === 'audit_russell') {
      const v = m[2].replace(/\s+#.*$/, '').trim();
      if (!['true', 'false'].includes(v)) fail('INVALID_BOOLEAN');
      fields[key] = v === 'true';
    } else if (key === 'tags') {
      if (m[2].trim().startsWith('[')) {
        // Tableaux JSON et listes YAML simples sans virgule dans un tag.
        try { fields.tags = JSON.parse(m[2]); }
        catch { fields.tags = m[2].replace(/^\s*\[|\]\s*$/g, '').split(',').filter(Boolean).map(scalar); }
      } else {
        fields.tags = [];
        for (let j = i + 1; j < lines.length && /^\s+/.test(lines[j]); j++) {
          const tag = lines[j].match(/^\s+-\s+(.+)$/);
          if (tag) fields.tags.push(scalar(tag[1]));
        }
      }
      if (!Array.isArray(fields.tags) || fields.tags.some(t => typeof t !== 'string')) fail('INVALID_TAGS');
    } else {
      if (/^[|>&*!{]/.test(m[2].trim())) fail('UNSUPPORTED_YAML_SCALAR');
      fields[key] = scalar(m[2]);
      if (typeof fields[key] !== 'string') fail('INVALID_SCALAR');
    }
  }
  return { fields, body: text.replace(/^\uFEFF/, '').slice(match[0].length) };
}
function sourcePath(item, root) {
  const b = item.binary?.data || {};
  let p = item.json?.source_path;
  if (!p && b.directory && b.fileName) p = `${b.directory}/${b.fileName}`;
  if (!p && String(item.json?.fileName || '').includes('/')) p = item.json.fileName;
  if (!p) fail('MISSING_FULL_SOURCE_PATH');
  p = String(p).replace(/\\/g, '/').replace(/\/+/g, '/');
  const r = String(root).replace(/\/+$/, '');
  if (!r.startsWith('/') || !p.startsWith(r + '/') || /[\u0000-\u001f]/.test(p) || p.split('/').some(s => s === '..' || s === '.')) fail('SOURCE_OUTSIDE_VAULT');
  if (!p.endsWith('.md')) fail('NOT_MARKDOWN');
  return p;
}
function sha256(text) {
  // SHA-256 UTF-8, sans require('crypto') : compatible sandbox Code n8n.
  const bytes = Array.from(Buffer.from(text, 'utf8'));
  const bits = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(Math.floor(bits / 2 ** (i * 8)) & 255);
  const k = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rr = (x,n) => (x >>> n) | (x << (32-n));
  for (let offset = 0; offset < bytes.length; offset += 64) {
    const w = [];
    for (let i=0;i<16;i++) w[i] = ((bytes[offset+i*4]<<24)|(bytes[offset+i*4+1]<<16)|(bytes[offset+i*4+2]<<8)|bytes[offset+i*4+3]) >>> 0;
    for (let i=16;i<64;i++) { const a=w[i-15],b=w[i-2]; w[i]=((rr(a,7)^rr(a,18)^(a>>>3))+w[i-16]+(rr(b,17)^rr(b,19)^(b>>>10))+w[i-7])>>>0; }
    let [a,b,c,d,e,f,g,z] = h;
    for (let i=0;i<64;i++) { const t1=(z+(rr(e,6)^rr(e,11)^rr(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0; const t2=((rr(a,2)^rr(a,13)^rr(a,22))+((a&b)^(a&c)^(b&c)))>>>0; z=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0; }
    h=h.map((v,i)=>(v+[a,b,c,d,e,f,g,z][i])>>>0);
  }
  return h.map(v=>v.toString(16).padStart(8,'0')).join('');
}
function chunksOf(text, size, overlap) {
  if (!Number.isInteger(size) || size < 64 || !Number.isInteger(overlap) || overlap < 0 || overlap >= size) fail('INVALID_CHUNK_CONFIG');
  const points = Array.from(text); // Ne coupe pas les paires de substitution Unicode.
  const out = [];
  for (let i=0; i<points.length; i+=size-overlap) {
    const part=points.slice(i,i+size).join('');
    if (part.trim()) out.push(part);
    if (i+size>=points.length) break;
  }
  return out;
}
function planNote(text, fileName, cfg, now = Date.now()) {
  if (typeof text !== 'string' || !text.trim() || text === 'undefined') fail('EMPTY_NOTE');
  if (text.length > cfg.maxNoteChars) fail('NOTE_TOO_LARGE');
  const { fields:f, body } = frontmatter(text);
  const base={ fileName, audit_russell: f.audit_russell === true, metadata: {title:f.title || fileName.split('/').pop().replace(/\.md$/, ''),type:f.type || '',status:f.status || '',tags:f.tags || [],fileName} };
  if (f.rag_sync === undefined) return {...base, action:'skip',reason:'RAG_FLAG_ABSENT'};
  if (f.rag_sync === false) return {...base,action:cfg.dryRun?'dry-run':'purge',plannedAction:'purge',file_filter:{must:[{key:'metadata.fileName',match:{value:fileName}}]}};
  if (!body.trim()) fail('EMPTY_NOTE_BODY');
  if (!cfg.fullRescan) {
    if (!f.updated_at || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(f.updated_at)) fail('INVALID_UPDATED_AT');
    const date = Date.parse(f.updated_at);
    if (!Number.isFinite(date) || date > now + 300000) fail('INVALID_UPDATED_AT');
    if (date < now - cfg.lookbackHours*3600000) return {...base,action:'skip',reason:'OUTSIDE_LOOKBACK'};
  }
  const chunks=chunksOf(body,cfg.chunkSize,cfg.chunkOverlap);
  if (!chunks.length || chunks.length>cfg.maxChunks) fail('CHUNK_BUDGET_EXCEEDED');
  const generation=sha256(JSON.stringify([text,cfg.model,cfg.embeddingRevision,cfg.chunkSize,cfg.chunkOverlap,'char-v1']));
  const file_filter={must:[{key:'metadata.fileName',match:{value:fileName}}]};
  const generation_filter={must:[...file_filter.must,{key:'metadata.generation',match:{value:generation}}]};
  const cleanup_filter={...file_filter,must_not:[{key:'metadata.generation',match:{value:generation}}]};
  return {...base,action:cfg.dryRun?'dry-run':'upsert',plannedAction:'upsert',generation,chunks,file_filter,generation_filter,cleanup_filter,excerpt:body.slice(0,1000)};
}
function makePoints(note, response, cfg) {
  const vectors=response.embeddings;
  if (!Array.isArray(vectors) || vectors.length!==note.chunks.length) fail('EMBEDDING_COUNT_MISMATCH');
  return vectors.map((vector,i)=>{
    if (!Array.isArray(vector)||vector.length!==cfg.expectedDimensions||vector.some(v=>typeof v!=='number'||!Number.isFinite(v))||vector.every(v=>v===0)) fail('INVALID_EMBEDDING');
    const hex=sha256(`${note.fileName}\n${note.generation}\n${i}`);
    // UUID version 8 : identifiant dérivé d'un SHA-256, variante RFC 9562.
    const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-8${hex.slice(13,16)}-${((parseInt(hex[16],16)&3)|8).toString(16)}${hex.slice(17,20)}-${hex.slice(20,32)}`;
    return {id,vector,payload:{pageContent:note.chunks[i],metadata:{...note.metadata,generation:note.generation,chunkIndex:i,chunkCount:note.chunks.length,embeddingModel:cfg.model,embeddingRevision:cfg.embeddingRevision}}};
  });
}
function completed(response) {
  if (response?.status!=='ok'||response?.result?.status!=='completed') fail('QDRANT_NOT_COMPLETED');
  return true;
}
function normalizeInput(j,cfg,executionId) {
  let source, text, chatId=null, sessionId;
  if (j.message) {
    const m=j.message;
    chatId=String(m.chat?.id ?? '');
    const userId=String(m.from?.id ?? '');
    if (!cfg.allowedChatIds.map(String).includes(chatId)||!cfg.allowedUserIds.map(String).includes(userId)) fail('TELEGRAM_NOT_ALLOWED');
    if (m.chat?.type!=='private') fail('PRIVATE_CHAT_REQUIRED');
    text=m.text;
    source='telegram';sessionId=`telegram:${chatId}:${userId}:${m.message_thread_id || 0}`;
  } else {
    source='rag';text=j.notes_du_jour;sessionId=`rag:${executionId}`;
  }
  if (typeof text!=='string'||!text.trim()) fail('EMPTY_INPUT');
  if (text.length>cfg.maxInputChars) fail('INPUT_TOO_LARGE');
  return {source,input_text:text,chat_id:chatId,session_id:sessionId,dryRun:cfg.dryRun};
}
function reportOf(output,ctx,cfg,executionId,now=new Date()) {
  if (typeof output!=='string'||!output.trim()) fail('EMPTY_MODEL_OUTPUT');
  if (output.length>cfg.maxReportChars) fail('REPORT_TOO_LARGE');
  const split=output.indexOf('===SPLIT===');
  const report=(split<0?output:output.slice(0,split)).trim();
  if (!report) fail('EMPTY_REPORT');
  const summary=(split<0?'Rapport disponible.':output.slice(split+11).split('===SPLIT===')[0]).replace(/[\u0000-\u001f]/g,' ').trim() || 'Rapport disponible.';
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const telegram=esc(Array.from(summary).slice(0,600).join(''));
  const stamp=now.toISOString();
  const id=String(executionId).replace(/[^a-zA-Z0-9_-]/g,'');
  if (!id) fail('INVALID_EXECUTION_ID');
  const root=cfg.reportDirectory.replace(/\/+$/,'');
  if (!cfg.dryRun && (!root.startsWith('/')||root.includes('__')||root.split('/').includes('..'))) fail('INVALID_REPORT_DIRECTORY');
  const fileName=`Rapport_Russell_${stamp.replace(/[:.]/g,'-')}_${id}.md`;
  const texte_final=`---\ntitle: "Rapport Russell"\ncreated_at: "${stamp}"\nrag_sync: false\naudit_russell: false\nsource: "${ctx.source}"\nexecution_id: "${id}"\n---\n\n${report}\n`;
  return {texte_final,resume_telegram:telegram,report_path:`${root}/${fileName}`,chat_id:ctx.chat_id,notify:Boolean(!cfg.dryRun && cfg.sendTelegram && ctx.chat_id),dryRun:cfg.dryRun,format_warning:split<0?'MISSING_SPLIT':null};
}
module.exports={fail,scalar,frontmatter,sourcePath,sha256,chunksOf,planNote,makePoints,completed,normalizeInput,reportOf};
