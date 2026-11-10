/* MafiaCorp Infográficos • Grafo de conhecimento para personagens fictícios de RP.
   Canvas sem dependências, leitura dos registros já existentes e conexões locais. */
(function(){
"use strict";
const CATEGORIES=[
  ["members","Membros","#d8dce2"],["suspects","Investigados","#afb8c6"],
  ["associates","Associados","#b6a0b9"],["contacts","Contatos","#cfbfa5"],
  ["factions","Facções","#b6a3ce"],["vehicles","Veículos","#9daab9"],
  ["locations","QGs e locais","#a2beb4"],["addresses","Endereços","#83a8a3"],
  ["investigations","Investigações","#d0a8a6"],["operations","Operações","#aaa9cb"],
  ["missions","Missões RP","#c3ac90"],["evidence","Evidências","#afb5ba"],
  ["notes","Notas","#e4d5a2"]
];
const FIELDS=[
 ["suspects","factionId","factions","PERTENCE À FACÇÃO"],["suspects","investigationId","investigations","INVESTIGADO EM"],
 ["associates","suspectId","suspects","ASSOCIADO A"],["associates","investigationId","investigations","RELACIONADO AO CASO"],
 ["contacts","suspectId","suspects","CONTATO DE"],["contacts","investigationId","investigations","LIGADO AO CASO"],
 ["vehicles","ownerId","suspects","VEÍCULO DE"],["vehicles","investigationId","investigations","VINCULADO AO CASO"],
 ["addresses","suspectId","suspects","LOCAL VINCULADO A"],["addresses","investigationId","investigations","LOCAL DO CASO"],
 ["factions","investigationId","investigations","INVESTIGADA EM"],
 ["operations","investigationId","investigations","OPERAÇÃO DO CASO"],
 ["evidence","suspectId","suspects","EVIDÊNCIA DO INVESTIGADO"],
 ["evidence","investigationId","investigations","EVIDÊNCIA DO CASO"],
 ["evidence","operationId","operations","EVIDÊNCIA DA OPERAÇÃO"],
 ["missions","memberId","members","RESPONSÁVEL"],["missions","suspectId","suspects","ALVO DA MISSÃO"],
 ["missions","factionId","factions","FACÇÃO RELACIONADA"],["missions","locationId","locations","LOCAL DA MISSÃO"],
 ["locations","memberId","members","RESPONSÁVEL PELO LOCAL"],
 ["locations","factionId","factions","LOCAL DA FACÇÃO"]
];
const LABELS=Object.fromEntries(CATEGORIES.map(x=>[x[0],x[1]]));
const COLORS=Object.fromEntries(CATEGORIES.map(x=>[x[0],x[2]]));
const TYPES=CATEGORIES.map(x=>x[0]);
const CANVAS_MAX_NODES=250;
let ctx=null, db=null, model=null, state=null, observer=null, disposeListeners=[];
const el=id=>document.getElementById(id);
function esc(text){return String(text==null?"":text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function uid(){return "inf_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9);}
function active(arr){return Array.isArray(arr)?arr.filter(x=>x&&!x.archived):[];}
function prep(){
 if(!db.rp || typeof db.rp!=="object")db.rp={};
 if(!Array.isArray(db.rp.graphNotes))db.rp.graphNotes=[];
 if(!db.rp.graphPositions || typeof db.rp.graphPositions!=="object" || Array.isArray(db.rp.graphPositions))db.rp.graphPositions={};
 if(!Array.isArray(db.rp.links))db.rp.links=[];
}
function rows(type){
 if(type==="notes")return active(db.rp.graphNotes);
 if(["members","missions","locations"].includes(type))return active(db.rp[type]);
 return active(db[type]);
}
function label(type,record){
 if(type==="vehicles")return [record.brand,record.model,record.plate].filter(Boolean).join(" ")||record.plate||"Veículo";
 if(type==="investigations")return record.name||record.caseId||"Investigação";
 if(type==="operations")return record.name||record.code||"Operação";
 if(type==="missions")return record.title||"Missão";
 if(type==="members")return record.codename||record.name||"Membro";
 if(type==="suspects")return record.alias||record.name||"Investigado";
 return record.name||record.title||record.alias||"Registro";
}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function graphData(){
 prep();
 let nodes=[],nodeMap=new Map();
 TYPES.forEach(type=>rows(type).forEach(r=>{
  if(typeof r.id!=="string"||!r.id)return;
  const key=type+":"+r.id,n={key,id:r.id,type,label:String(label(type,r)),record:r,color:COLORS[type]};
  nodes.push(n);nodeMap.set(key,n);
 }));
 let edges=[],seen=new Set();
 function add(from,to,kind,manual,record){
  if(from===to||!nodeMap.has(from)||!nodeMap.has(to))return;
  const k=manual?"manual:"+record.id:"auto:"+from+">"+to+":"+kind;
  if(seen.has(k))return;
  seen.add(k);edges.push({id:k,from,to,kind,manual:!!manual,record:record||null});
 }
 FIELDS.forEach(([source,field,destination,kind])=>{
  rows(source).forEach(r=>{if(r[field]!=null && r[field]!=="")add(source+":"+r.id,destination+":"+String(r[field]),kind,false);});
 });
 active(db.rp.links).forEach(r=>{
  if(typeof r.from==="string"&&typeof r.to==="string")add(r.from,r.to,String(r.kind||"VÍNCULO"),true,r);
 });
 return {nodes,edges,nodeMap};
}
function graphForView(){
 const data=model;
 const included=new Set(data.nodes.filter(n=>state.enabled.has(n.type)).map(n=>n.key));
 let eligible=data.edges.filter(e=>included.has(e.from)&&included.has(e.to));
 let visible=included;
 if(state.mode==="focus"&&state.focusKey&&included.has(state.focusKey)){
  let frontier=new Set([state.focusKey]),reachable=new Set(frontier);
  for(let depth=0;depth<state.depth;depth++){
   const next=new Set();
   eligible.forEach(e=>{
    if(frontier.has(e.from)&&!reachable.has(e.to))next.add(e.to);
    if(frontier.has(e.to)&&!reachable.has(e.from))next.add(e.from);
   });
   for(const key of next)reachable.add(key);
   frontier=next;
  }
  visible=reachable;
 }
 let found=model.nodes.filter(n=>visible.has(n.key));
 if(state.query){
  const q=state.query.toLocaleLowerCase("pt-BR");
  const matching=new Set(found.filter(n=>n.label.toLocaleLowerCase("pt-BR").includes(q)||n.type.includes(q)).map(n=>n.key));
  // Conservar os nós encontrados e seus vizinhos imediatos para dar contexto visual.
  const neighbors=new Set(matching);
  eligible.forEach(e=>{
   if(matching.has(e.from))neighbors.add(e.to);
   if(matching.has(e.to))neighbors.add(e.from);
  });
  found=found.filter(n=>neighbors.has(n.key));
 }
 if(found.length>CANVAS_MAX_NODES){
  const order=new Map();
  data.edges.forEach(e=>{order.set(e.from,(order.get(e.from)||0)+1);order.set(e.to,(order.get(e.to)||0)+1)});
  found.sort((a,b)=>((b.key===state.selectedKey?100000:0)+(order.get(b.key)||0))-((a.key===state.selectedKey?100000:0)+(order.get(a.key)||0)));
  found=found.slice(0,CANVAS_MAX_NODES);
 }
 const keys=new Set(found.map(n=>n.key));
 return {nodes:found,edges:eligible.filter(e=>keys.has(e.from)&&keys.has(e.to)),total:visible.size};
}
function storedPosition(key){
 const p=db.rp.graphPositions[key];
 if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return {x:Math.max(-2000,Math.min(2000,p.x)),y:Math.max(-2000,Math.min(2000,p.y))};
 const h=hash(key),a=((h%6283)/1000),r=80+((h>>>13)%350);
 return {x:Math.cos(a)*r,y:Math.sin(a)*r};
}
function layout(graph){
 const n=graph.nodes.length;if(!n)return;
 const byKey=new Map();
 graph.nodes.forEach((node,i)=>{const p=storedPosition(node.key);node.x=p.x;node.y=p.y;node.vx=0;node.vy=0;byKey.set(node.key,i);});
 const connected=new Set();
 graph.edges.forEach(e=>{connected.add(e.from);connected.add(e.to)});
 const iter=n>150?80:130;
 const charge=Math.min(14500,3300+125*Math.sqrt(n));
 for(let step=0;step<iter;step++){
  const alpha=(1-step/iter)*.16+.01;
  for(let i=0;i<n;i++){
   const a=graph.nodes[i];
   a.vx+=(-a.x)*.00035;
   a.vy+=(-a.y)*.00035;
   for(let j=i+1;j<n;j++){
    const b=graph.nodes[j];
    let dx=a.x-b.x,dy=a.y-b.y;
    let d2=dx*dx+dy*dy+32;
    const force=Math.min(1.6,charge/d2)*alpha;
    const inv=1/Math.sqrt(d2);
    const fx=dx*inv*force,fy=dy*inv*force;
    a.vx+=fx;a.vy+=fy;b.vx-=fx;b.vy-=fy;
   }
  }
  graph.edges.forEach(edge=>{
   const i=byKey.get(edge.from),j=byKey.get(edge.to);
   if(i==null||j==null)return;
   const a=graph.nodes[i],b=graph.nodes[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
   const f=(d-125)*.002*alpha;
   a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;
  });
  graph.nodes.forEach(node=>{
   node.vx*=.86;node.vy*=.86;
   node.x=Math.max(-1800,Math.min(1800,node.x+node.vx*13));
   node.y=Math.max(-1800,Math.min(1800,node.y+node.vy*13));
  });
 }
}
function panelHtml(){
 return '<div class="ig-shell">'+
  '<div class="ig-heading"><div><div class="ig-kicker">MAFIACORP / INTELIGÊNCIA VISUAL</div><h1>Infográficos</h1><p>Explore relações entre personagens e registros da cidade. Uma rede viva, inspirada na visualização do Obsidian.</p></div>'+
   '<div class="ig-heading-actions">'+(ctx.canEdit?'<button class="ig-btn ig-emphasis" data-ig="new-note">+ Nova nota</button><button class="ig-btn" data-ig="new-link">+ Criar conexão</button>':'')+'</div></div>'+
  '<div class="ig-toolbar"><div class="ig-switch" role="group" aria-label="Visualização">'+
  '<button class="ig-toggle '+(state.mode==="global"?"active":"")+'" data-ig="global">◉ Visão global</button>'+
  '<button class="ig-toggle '+(state.mode==="focus"?"active":"")+'" data-ig="focus">◎ Visão focada</button></div>'+
  '<input class="ig-search" id="ig-search" placeholder="Buscar pessoa, facção, veículo ou nota..." aria-label="Buscar no grafo" value="'+esc(state.query)+'"/>'+
  '<div class="ig-zoom"><button class="ig-btn" data-ig="zoom-in" title="Aproximar" aria-label="Aproximar">+</button><button class="ig-btn" data-ig="zoom-out" title="Afastar" aria-label="Afastar">−</button><button class="ig-btn" data-ig="fit" title="Enquadrar grafo">Enquadrar</button></div></div>'+
  '<div class="ig-layout"><aside class="ig-filters"><h3>FILTROS <small>'+model.nodes.length+' REGISTROS</small></h3>'+
   '<div class="ig-filter-list">'+CATEGORIES.map(([type,title,color])=>'<label class="ig-filter"><input type="checkbox" data-ig-type="'+esc(type)+'" '+(state.enabled.has(type)?"checked":"")+'/><span class="ig-swatch" style="--cat:'+color+'"></span><span>'+esc(title)+'</span><b>'+model.nodes.filter(n=>n.type===type).length+'</b></label>').join("")+'</div>'+
   '<div class="ig-filter-footer"><button class="ig-text-button" data-ig="all-categories">Mostrar todos</button><button class="ig-text-button" data-ig="reset-layout">Reorganizar</button></div>'+
   '<div class="ig-depth"><label for="ig-depth">Profundidade do foco <b id="ig-depth-value">'+state.depth+'</b></label><input id="ig-depth" type="range" min="1" max="3" value="'+state.depth+'" '+(state.mode==="focus"?"":"disabled")+'/></div>'+
   '<p class="ig-help">Arraste para mover. Use a roda do mouse para zoom. Clique em um nó para abrir os detalhes; dê duplo clique para focar.</p>'+
  '</aside><div class="ig-viewport"><div class="ig-stage" id="ig-stage"><canvas id="ig-canvas" aria-label="Rede interativa de informações fictícias do roleplay"></canvas>'+
  '<div class="ig-topline"><span id="ig-counter">0 nós · 0 conexões</span><span>GRAFO LOCAL • RP</span></div>'+
  '<div class="ig-empty" id="ig-empty" hidden><strong>Nenhum registro visível</strong><p>Cadastre personagens, facções ou notas, ou ajuste os filtros.</p></div>'+
  '</div><div class="ig-stage-foot"><span><i class="ig-dot"></i> Ligação cadastrada</span><span><i class="ig-dot auto"></i> Ligação automática</span><span id="ig-zoom-value">100%</span></div></div>'+
  '<aside class="ig-details" id="ig-details"><div class="ig-detail-empty"><span>◇</span><h3>Selecione uma informação</h3><p>Um clique abre a ficha resumida e suas relações. Use o foco para explorar o entorno.</p></div></aside></div>'+
  '<div class="ig-footnote">Os registros estão apenas neste navegador. Conexões automáticas vêm das fichas; conexões manuais podem ser editadas. Use somente dados fictícios de RP.</div>'+
  '</div>';
}
function measure(){
 const stage=el("ig-stage"),canvas=el("ig-canvas");
 if(!stage||!canvas||!state)return;
 const rect=stage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 state.width=Math.max(280,rect.width);
 state.height=Math.max(270,rect.height);
 canvas.width=Math.round(state.width*dpr);canvas.height=Math.round(state.height*dpr);
 canvas.style.width=state.width+"px";canvas.style.height=state.height+"px";
 const c=canvas.getContext("2d");
 if(c)c.setTransform(dpr,0,0,dpr,0,0);
 draw();
}
function screen(node){return {x:state.width/2+(node.x+state.tx)*state.zoom,y:state.height/2+(node.y+state.ty)*state.zoom};}
function toWorld(x,y){return {x:(x-state.width/2)/state.zoom-state.tx,y:(y-state.height/2)/state.zoom-state.ty};}
function radius(n){return (state.selectedKey===n.key?12:8)+Math.min(7,Math.sqrt(n.degree||0)*2);}
function draw(){
 const canvas=el("ig-canvas");if(!canvas||!state)return;
 const c=canvas.getContext("2d");if(!c)return;
 const w=state.width,h=state.height;
 c.clearRect(0,0,w,h);
 c.fillStyle="#090b0e";c.fillRect(0,0,w,h);
 const grid=48*state.zoom;
 if(grid>14){
  c.lineWidth=1;c.strokeStyle="rgba(192,199,209,.035)";
  const ox=(w/2+state.tx*state.zoom)%grid,oy=(h/2+state.ty*state.zoom)%grid;
  for(let x=ox;x<w;x+=grid){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
  for(let y=oy;y<h;y+=grid){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 }
 if(!state.graph)return;
 const nodes=state.graph.nodes,edges=state.graph.edges,byKey=new Map(nodes.map(n=>[n.key,n]));
 const selected=state.selectedKey;
 const adjacent=new Set([selected]);
 if(selected){edges.forEach(e=>{if(e.from===selected)adjacent.add(e.to);if(e.to===selected)adjacent.add(e.from);});}
 c.lineWidth=1;
 edges.forEach(edge=>{
  const a=byKey.get(edge.from),b=byKey.get(edge.to);if(!a||!b)return;
  const p=screen(a),q=screen(b);
  const highlight=selected&&(edge.from===selected||edge.to===selected);
  c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);
  c.strokeStyle=highlight?"rgba(223,231,243,.9)":edge.manual?"rgba(175,188,209,.51)":"rgba(111,124,143,.29)";
  c.lineWidth=highlight?2.1:(edge.manual?1.4:.9);
  if(!edge.manual)c.setLineDash([3,5]); else c.setLineDash([]);
  c.stroke();
 });
 c.setLineDash([]);
 nodes.forEach(n=>{
  const p=screen(n),r=radius(n)*Math.max(.75,Math.min(1.6,state.zoom));
  if(p.x< -80||p.x>w+80||p.y< -60||p.y>h+60)return;
  const dim=!!selected&&!adjacent.has(n.key);
  c.globalAlpha=dim?.18:1;
  const isSelected=selected===n.key;
  if(isSelected){
   c.beginPath();c.arc(p.x,p.y,r+9,0,Math.PI*2);c.strokeStyle="rgba(229,234,241,.42)";c.lineWidth=1.2;c.stroke();
  }
  c.beginPath();c.arc(p.x,p.y,r+3,0,Math.PI*2);c.fillStyle="rgba(9,11,15,.95)";c.fill();
  c.beginPath();c.arc(p.x,p.y,r,0,Math.PI*2);c.fillStyle=n.color;c.fill();
  c.beginPath();c.arc(p.x,p.y,Math.max(2,r*.34),0,Math.PI*2);c.fillStyle="#111419";c.fill();
  if(isSelected||state.zoom>.56||state.graph.nodes.length<45){
   const title=n.label.length>24?n.label.slice(0,23)+"…":n.label;
   c.font=(isSelected?"600 ":"")+"11px system-ui,Arial,sans-serif";
   c.textAlign="center";c.textBaseline="top";
   c.fillStyle=isSelected?"#f4f6fa":"#d3d8e0";
   c.fillText(title,p.x,p.y+r+7,145);
  }
  c.globalAlpha=1;
 });
 const count=el("ig-counter");if(count)count.textContent=nodes.length+" de "+state.graph.total+" nós · "+edges.length+" conexões"+(model.nodes.length>CANVAS_MAX_NODES?" · limite visual "+CANVAS_MAX_NODES:"");
 const zoom=el("ig-zoom-value");if(zoom)zoom.textContent=Math.round(state.zoom*100)+"%";
 const empty=el("ig-empty");if(empty)empty.hidden=nodes.length!==0;
}
function fit(){
 if(!state.graph||!state.graph.nodes.length){state.zoom=1;state.tx=0;state.ty=0;draw();return;}
 const nodes=state.graph.nodes;
 const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
 const minX=Math.min(...xs)-110,maxX=Math.max(...xs)+110,minY=Math.min(...ys)-100,maxY=Math.max(...ys)+110;
 state.zoom=Math.max(.22,Math.min(2.2,Math.min((state.width-48)/Math.max(180,maxX-minX),(state.height-42)/Math.max(180,maxY-minY))));
 state.tx=-(minX+maxX)/2;state.ty=-(minY+maxY)/2;
 draw();
}
function refreshGraph(refit){
 model=graphData();
 state.graph=graphForView();
 layout(state.graph);
 const degrees={};state.graph.edges.forEach(e=>{degrees[e.from]=(degrees[e.from]||0)+1;degrees[e.to]=(degrees[e.to]||0)+1;});
 state.graph.nodes.forEach(n=>n.degree=degrees[n.key]||0);
 if(refit)fit();else draw();
 details();
}
function pick(pos){
 if(!state.graph)return null;
 for(let i=state.graph.nodes.length-1;i>=0;i--){
  const n=state.graph.nodes[i],p=screen(n);
  if(Math.hypot(pos.x-p.x,pos.y-p.y)<Math.max(16,radius(n)*state.zoom+7))return n;
 }
 return null;
}
function setZoom(z,center){
 const prev=state.zoom,next=Math.max(.18,Math.min(4,z));
 const centerX=center?center.x:state.width/2,centerY=center?center.y:state.height/2;
 const worldX=(centerX-state.width/2)/prev-state.tx,worldY=(centerY-state.height/2)/prev-state.ty;
 state.zoom=next;
 state.tx=(centerX-state.width/2)/next-worldX;
 state.ty=(centerY-state.height/2)/next-worldY;draw();
}
function focusOn(key){
 if(!model.nodeMap.has(key)){ctx.toast("Este registro não está disponível.",true);return;}
 state.selectedKey=key;state.focusKey=key;state.mode="focus";
 const found=model.nodeMap.get(key);state.enabled.add(found.type);
 refreshControls();
 refreshGraph(true);
}
function connectedTo(key){return model.edges.filter(e=>e.from===key||e.to===key);}
function details(){
 const root=el("ig-details");if(!root)return;
 const n=model.nodeMap.get(state.selectedKey);
 if(!n){
  root.innerHTML='<div class="ig-detail-empty"><span>◇</span><h3>Selecione uma informação</h3><p>Clique em um nó para abrir detalhes e suas conexões.</p></div>';
  return;
 }
 const relations=connectedTo(n.key);
 const fields=[];
 for(const [k,v] of Object.entries(n.record)){
  if(["id","archived","passwordHash","photoUrl","updatedAt","createdAt"].includes(k) || /^(?:.+Id|.+At)$/.test(k) || typeof v==="object" || v==null||v==="")continue;
  if(fields.length>=8)break;
  fields.push([k,String(v).slice(0,200)]);
 }
 const fieldLabels={name:"Nome",codename:"Codinome",alias:"Apelido",phone:"Contato RP",home:"Residência",vehicle:"Veículo",rank:"Patente",role:"Função",district:"Distrito",kind:"Tipo",notes:"Anotações",description:"Descrição",plate:"Placa",model:"Modelo",brand:"Marca",status:"Situação",title:"Título",body:"Conteúdo",color:"Cor",priority:"Prioridade",target:"Meta",current:"Realizado",riskLevel:"Nível de interesse"};
 root.innerHTML='<div class="ig-side-head"><div class="ig-kicker">REGISTRO SELECIONADO</div><div class="ig-node-chip"><i style="--cat:'+n.color+'"></i>'+esc(LABELS[n.type])+'</div><h2>'+esc(n.label)+'</h2></div>'+
  '<div class="ig-side-actions"><button class="ig-btn" data-ig="focus-selected">◎ Focar</button>'+
  (ctx.canEdit?'<button class="ig-btn" data-ig="link-selected">+ Conectar</button>':'')+
  '<button class="ig-btn" data-ig="open-record">Abrir cadastro</button></div>'+
  (fields.length?'<div class="ig-properties">'+fields.map(([k,v])=>'<div><small>'+esc(fieldLabels[k]||k)+'</small><span>'+esc(v)+'</span></div>').join("")+'</div>':'')+
  '<div class="ig-relations"><h3>Relações <small>'+relations.length+'</small></h3>'+
  (relations.length?relations.map(edge=>{
   const other=model.nodeMap.get(edge.from===n.key?edge.to:edge.from);
   if(!other)return "";
   return '<div class="ig-relation"><button type="button" data-ig-select="'+esc(other.key)+'"><i style="--cat:'+other.color+'"></i><span><strong>'+esc(other.label)+'</strong><small>'+esc(edge.kind)+(edge.manual?" · MANUAL":" · AUTOMÁTICA")+'</small></span></button>'+
    (edge.manual&&ctx.canEdit?'<div class="ig-relation-actions"><button data-ig-edit="'+esc(edge.record.id)+'" title="Editar conexão">Editar</button><button data-ig-delete="'+esc(edge.record.id)+'" title="Excluir conexão">×</button></div>':'')+'</div>';
  }).join(""):'<p class="ig-muted">Ainda não há conexões para este registro.</p>')+'</div>';
 wireDetails();
}
function wireDetails(){
 const root=el("ig-details");if(!root)return;
 root.querySelectorAll("[data-ig-select]").forEach(button=>button.addEventListener("click",()=>selectNode(button.dataset.igSelect)));
 root.querySelectorAll("[data-ig-edit]").forEach(button=>button.addEventListener("click",()=>editLink(button.dataset.igEdit)));
 root.querySelectorAll("[data-ig-delete]").forEach(button=>button.addEventListener("click",()=>deleteLink(button.dataset.igDelete)));
 root.querySelectorAll("[data-ig]").forEach(button=>button.addEventListener("click",()=>perform(button.dataset.ig)));
}
function selectNode(key){
 if(!model.nodeMap.has(key))return;
 state.selectedKey=key;
 if(state.mode==="focus"&&!state.graph.nodes.some(n=>n.key===key))refreshGraph(true);
 else{draw();details();}
}
function nodeOptions(value){
 return model.nodes.slice().sort((a,b)=>a.label.localeCompare(b.label,"pt-BR")).map(n=>'<option value="'+esc(n.key)+'" '+(value===n.key?"selected":"")+'>'+esc(LABELS[n.type]+" · "+n.label)+'</option>').join("");
}
function modalForm(title,body,onSubmit){
 if(!ctx.canEdit)return;
 ctx.openModal('<div class="modal-head"><h3>'+esc(title)+'</h3><button class="modal-close" type="button" data-ig-close>×</button></div>'+
  '<form id="ig-form"><div class="modal-body ig-modal-fields">'+body+'</div>'+
  '<div class="ig-modal-actions"><button type="button" class="ig-btn" data-ig-close>Cancelar</button><button type="submit" class="ig-btn ig-emphasis">Salvar</button></div></form>');
 document.querySelectorAll("[data-ig-close]").forEach(b=>b.addEventListener("click",ctx.closeModal));
 el("ig-form").addEventListener("submit",event=>{event.preventDefault();if(event.target.reportValidity())onSubmit(new FormData(event.target));});
}
function createNote(editId){
 const existing=editId?db.rp.graphNotes.find(n=>n.id===editId):null;
 modalForm(existing?"Editar nota":"Nova nota do infográfico",
  '<label>Título da nota<input name="title" maxlength="120" required value="'+esc(existing&&existing.title)+'"/></label>'+
  '<label>Conteúdo / informações do RP<textarea name="body" rows="6" maxlength="6000" placeholder="Descreva o que este nó representa no roleplay...">'+esc(existing&&existing.body)+'</textarea></label>',
  async data=>{
   const title=String(data.get("title")||"").trim();
   if(!title)return;
   if(existing){existing.title=title;existing.body=String(data.get("body")||"").trim();existing.updatedAt=new Date().toISOString();}
   else db.rp.graphNotes.push({id:uid(),title,body:String(data.get("body")||"").trim(),createdAt:new Date().toISOString()});
   if(!await ctx.saveDB()){ctx.toast("Não foi possível salvar a nota.",true);return;}
   ctx.closeModal();model=graphData();state.selectedKey="notes:"+(existing?existing.id:db.rp.graphNotes[db.rp.graphNotes.length-1].id);
   state.enabled.add("notes");refreshControls();refreshGraph(true);ctx.toast("Nota salva na Central RP.");
  }
 );
}
function editLink(id){
 const record=id?db.rp.links.find(x=>x.id===id&&!x.archived):null;
 if(!model.nodes.length){ctx.toast("Cadastre dois registros antes de criar uma ligação.",true);return;}
 const from=record?record.from:state.selectedKey||"",to=record?record.to:"";
 const kinds=["VÍNCULO","MEMBRO","FAMILIAR RP","ALIADO","CONTATO","RESPONSÁVEL","PARCEIRO","RIVALIDADE RP","LOCALIZAÇÃO","LIGAÇÃO COMERCIAL RP","OUTRA RELAÇÃO"];
 modalForm(record?"Editar conexão":"Criar conexão",
  '<label>Origem<select name="from" required><option value="">Selecione um registro</option>'+nodeOptions(from)+'</select></label>'+
  '<label>Destino<select name="to" required><option value="">Selecione um registro</option>'+nodeOptions(to)+'</select></label>'+
  '<label>Tipo de vínculo<select name="kind">'+kinds.map(k=>'<option value="'+esc(k)+'" '+((record&&record.kind)===k?"selected":"")+'>'+esc(k)+'</option>').join("")+'</select></label>'+
  '<label>Descrição<textarea name="notes" rows="4" maxlength="1500" placeholder="Como os personagens ou registros se relacionam?">'+esc(record&&record.notes)+'</textarea></label>',
  async data=>{
   const a=String(data.get("from")||""),b=String(data.get("to")||"");
   if(a===b||!model.nodeMap.has(a)||!model.nodeMap.has(b)){ctx.toast("Escolha dois registros diferentes.",true);return;}
   if(record){record.from=a;record.to=b;record.kind=String(data.get("kind")||"VÍNCULO");record.notes=String(data.get("notes")||"").trim();record.updatedAt=new Date().toISOString();}
   else db.rp.links.push({id:uid(),from:a,to:b,kind:String(data.get("kind")||"VÍNCULO"),notes:String(data.get("notes")||"").trim(),createdAt:new Date().toISOString()});
   if(!await ctx.saveDB()){ctx.toast("Não foi possível salvar a conexão.",true);return;}
   ctx.closeModal();state.selectedKey=a;refreshGraph(false);ctx.toast("Conexão salva.");
  });
}
async function deleteLink(id){
 if(!ctx.canEdit)return;
 const rec=db.rp.links.find(x=>x.id===id&&!x.archived);if(!rec)return;
 if(!window.confirm("Excluir a conexão manual selecionada?"))return;
 rec.archived=true;
 if(!await ctx.saveDB()){rec.archived=false;ctx.toast("Falha ao salvar a exclusão.",true);return;}
 refreshGraph(false);ctx.toast("Conexão removida.");
}
function openRecord(){
 const n=model.nodeMap.get(state.selectedKey);if(!n)return;
 if(n.type==="notes"){createNote(n.id);return;}
 if(n.type==="suspects"){ctx.navigate("suspect-detail",{id:n.id});return;}
 const screens={
 members:"rp-members",missions:"rp-missions",locations:"rp-locations",
 factions:"factions",vehicles:"vehicles",contacts:"contacts",associates:"associates",
 addresses:"addresses",investigations:"investigations",operations:"operations",evidence:"evidence"
 };
 const page=screens[n.type];if(page)ctx.navigate(page);
}
function refreshControls(){
 const global=el("ig-global"),focus=el("ig-focus");
 document.querySelectorAll("[data-ig=global],[data-ig=focus]").forEach(b=>b.classList.toggle("active",b.dataset.ig===state.mode));
 const depth=el("ig-depth");if(depth)depth.disabled=state.mode!=="focus";
 const search=el("ig-search");if(search&&search.value!==state.query)search.value=state.query;
 CATEGORIES.forEach(([type])=>{const b=document.querySelector('[data-ig-type="'+type+'"]');if(b)b.checked=state.enabled.has(type);});
}
function perform(command){
 if(command==="global"){state.mode="global";refreshControls();refreshGraph(true);}
 else if(command==="focus"){if(!state.focusKey&&state.selectedKey)state.focusKey=state.selectedKey;if(!state.focusKey){ctx.toast("Selecione um nó antes de focar.",true);return;}state.mode="focus";refreshControls();refreshGraph(true);}
 else if(command==="focus-selected"){focusOn(state.selectedKey);}
 else if(command==="new-note"){createNote();}
 else if(command==="new-link"||command==="link-selected"){editLink();}
 else if(command==="open-record"){openRecord();}
 else if(command==="zoom-in"){setZoom(state.zoom*1.27);}
 else if(command==="zoom-out"){setZoom(state.zoom/1.27);}
 else if(command==="fit"){fit();}
 else if(command==="all-categories"){state.enabled=new Set(TYPES);refreshControls();refreshGraph(true);}
 else if(command==="reset-layout"){db.rp.graphPositions={};refreshGraph(true);ctx.saveDB();}
}
function persistPosition(node){
 db.rp.graphPositions[node.key]={x:Math.round(node.x*10)/10,y:Math.round(node.y*10)/10};
 ctx.saveDB();
}
function pointerEvents(){
 const canvas=el("ig-canvas");if(!canvas)return;
 const xy=event=>{const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};};
 const down=event=>{
  if(event.button!=null&&event.button!==0)return;
  const p=xy(event),n=pick(p);
  state.pointer={start:p,last:p,node:n,dragged:false};
  try{canvas.setPointerCapture(event.pointerId);}catch(err){}
  event.preventDefault();
 };
 const move=event=>{
  if(!state.pointer)return;
  const p=xy(event),ref=state.pointer;
  if(Math.hypot(p.x-ref.start.x,p.y-ref.start.y)>4)ref.dragged=true;
  if(ref.dragged){
   if(ref.node){const point=toWorld(p.x,p.y);ref.node.x=point.x;ref.node.y=point.y;}
   else{state.tx+=(p.x-ref.last.x)/state.zoom;state.ty+=(p.y-ref.last.y)/state.zoom;}
   draw();
  }
  ref.last=p;
 };
 const up=event=>{
  if(!state.pointer)return;
  const ref=state.pointer,p=xy(event);
  if(ref.node){
   if(ref.dragged)persistPosition(ref.node);
   else selectNode(ref.node.key);
  }else if(!ref.dragged){state.selectedKey=null;draw();details();}
  state.pointer=null;
  try{canvas.releasePointerCapture(event.pointerId);}catch(err){}
 };
 const wheel=event=>{event.preventDefault();const p=xy(event);setZoom(state.zoom*(event.deltaY<0?1.12:.89),p);};
 const dbl=event=>{const n=pick(xy(event));if(n)focusOn(n.key);};
 canvas.addEventListener("pointerdown",down);
 canvas.addEventListener("pointermove",move);
 canvas.addEventListener("pointerup",up);
 canvas.addEventListener("pointercancel",up);
 canvas.addEventListener("wheel",wheel,{passive:false});
 canvas.addEventListener("dblclick",dbl);
}
function wire(){
 document.querySelectorAll("[data-ig]").forEach(b=>b.addEventListener("click",()=>perform(b.dataset.ig)));
 document.querySelectorAll("[data-ig-type]").forEach(input=>input.addEventListener("change",()=>{
  if(input.checked)state.enabled.add(input.dataset.igType);else state.enabled.delete(input.dataset.igType);
  refreshGraph(true);
 }));
 const search=el("ig-search");if(search)search.addEventListener("input",()=>{state.query=search.value.trim();refreshGraph(true);});
 const depth=el("ig-depth");if(depth)depth.addEventListener("input",()=>{
  state.depth=Number(depth.value);
  const value=el("ig-depth-value");if(value)value.textContent=String(state.depth);
  if(state.mode==="focus")refreshGraph(true);
 });
 pointerEvents();
 if(typeof ResizeObserver!=="undefined"){
  observer=new ResizeObserver(measure);
  observer.observe(el("ig-stage"));
 }else{
  window.addEventListener("resize",measure);
  disposeListeners.push(()=>window.removeEventListener("resize",measure));
 }
 measure();
}
function dispose(){
 if(observer){observer.disconnect();observer=null;}
 disposeListeners.forEach(fn=>fn());disposeListeners=[];
 ctx=null;db=null;model=null;state=null;
}
function render(database,context){
 dispose();
 db=database;ctx=context;prep();
 model=graphData();
 state={
   enabled:new Set(TYPES),mode:"global",depth:2,query:"",selectedKey:null,focusKey:null,
   graph:null,width:800,height:520,zoom:1,tx:0,ty:0,pointer:null
 };
 const html=panelHtml();
 return html;
}
function mount(){
 if(!db||!ctx||!state)return;
 state.graph=graphForView();
 layout(state.graph);
 const degree={};state.graph.edges.forEach(e=>{degree[e.from]=(degree[e.from]||0)+1;degree[e.to]=(degree[e.to]||0)+1;});
 state.graph.nodes.forEach(n=>n.degree=degree[n.key]||0);
 wire();fit();
}
window.MafiaInfographics={render,mount,dispose,buildGraph:graphData};
})();