/* MafiaCorp | Organização, hierarquia e painel de contribuições do QG */
(function(){
'use strict';
const API='/api/organization';
const e=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TITLES={
 admin_sistema:'Administrador do Sistema',
 lider_01:'Liderança 01',lider_02:'Liderança 02',lider_03:'Liderança 03',
 gerente_geral:'Gerente Geral',gerente_farm:'Gerente de Farm',gerente_acao:'Gerente de Ação',
 estrategista:'Estrategista / Inteligência',logistica:'Logística',elite:'Elite / Operadores',membro:'Membro / Integrante'
};
const ACCESS={admin_sistema:100,lider_01:100,lider_02:100,lider_03:100,gerente_geral:90,gerente_farm:65,gerente_acao:65,estrategista:60,logistica:55,elite:40,membro:25};
const DESCRIPTIONS={
 lider_01:['Definir objetivos e diretrizes','Tomar decisões importantes','Acompanhar Gerente Geral','Aprovar promoções e mudanças','Resolver situações internas'],
 lider_02:['Definir objetivos e diretrizes','Tomar decisões importantes','Acompanhar Gerente Geral','Aprovar promoções e mudanças','Resolver situações internas'],
 lider_03:['Definir objetivos e diretrizes','Tomar decisões importantes','Acompanhar Gerente Geral','Aprovar promoções e mudanças','Resolver situações internas'],
 gerente_geral:['Supervisionar todos os setores','Acompanhar metas','Cobrar resultados dos gerentes','Organizar reuniões e avaliações semanais','Manter comunicação entre os setores'],
 gerente_farm:['Acompanhar 20% por dia ativo','Organizar missões do QG','Incentivar missões do Noia','Acompanhar níveis','Controlar produção e estoque'],
 gerente_acao:['Responsável pela Elite','Organizar ações e dominações RP','Preparar integrantes','Organizar treinamentos e avaliações','Identificar talentos para Elite'],
 estrategista:['Auxiliar no planejamento de operações','Levantar informações relevantes ao RP','Identificar oportunidades','Trabalhar com Gerente de Ação'],
 logistica:['Auxiliar recursos e preparação','Dar suporte a Farm e Ação','Organizar disponibilidade de equipamentos e materiais RP'],
 elite:['Grupo especializado aprovado','Participar de treinamentos e ações','Apoiar Gerente de Ação','Ser referência técnica'],
 membro:['Cumprir metas diárias quando ativo','Participar de atividades','Respeitar hierarquia','Evoluir dentro da organização','Contribuir para o RP']
};
const MISSIONS={aeronave:['Aeronave',10],caminhao:['Caminhão',5],submarino:['Submarino',5],cargueiro:['Cargueiro',5]};
let ctx=null,mode=null,contextKey='',payload=null,selectedDate='',selectedMember='',selectedRole='',busy=false,renderSerial=0;
function label(role){return payload?.roles?.[role]?.label||TITLES[role]||TITLES.membro;}
async function api(path=API,method='GET',body){
 const opts={method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};
 if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
 const response=await fetch(path,opts);
 const data=await response.json().catch(()=>({error:'NETWORK'}));
 if(!response.ok){const code=data.error||'SERVER_ERROR';throw Error({
  UNAUTHENTICATED:'Sessão expirada. Entre novamente.',FORBIDDEN:'Seu cargo não autoriza esta operação.',
  UPLOAD_TOO_LARGE:'Print muito grande. Escolha uma imagem menor.',
  INVALID_EVIDENCE:'Imagem inválida. Use JPEG, PNG ou WEBP.',
  EVIDENCE_REQUIRED:'Escreva um log da missão ou anexe um print.',
  NOT_PENDING_OR_SELF:'A entrega já foi analisada ou pertence à sua própria conta.',
  PANEL_BELOW_100:'O painel precisa atingir 100% aprovado.',
  RATE_LIMITED:'Muitas solicitações. Aguarde um pouco.',
  INVALID_DATE:'Data inválida.',SERVICE_UNAVAILABLE:'Serviço indisponível.'
 }[code]||'Falha na operação: '+code);}
 return data;
}
function area(){return document.getElementById('view');}
function valid(){return area() && ctx && (!ctx.isActive||ctx.isActive());}
function shell(title,sub){return '<section class="org-shell"><header class="org-head"><div><div class="org-kicker">MAFIACORP / CENTRAL DA FAMÍLIA</div><h1>'+title+'</h1><p>'+sub+'</p></div><span class="org-seal">MC <small>COMANDO</small></span></header><div id="org-content"><p class="org-loading">Consultando o banco...</p></div></section>';}
function roleCard(role,extra){
 const users=payload?.members?.filter(m=>m.orgRole===role)||[];
 const def=payload?.roles?.[role];
 return '<div class="org-role-card '+(extra||'')+'"><div class="org-role-name">'+label(role)+'</div>'+
  '<div class="org-role-assigned">'+(users.length?users.map(m=>e(m.codename)).join(' · '):'Cargo disponível')+'</div>'+
  '<div class="org-level">'+(def?.access??ACCESS[role]??25)+'% de acesso</div><ul>'+((DESCRIPTIONS[role]||[def?.summary||'Cargo personalizado']).map(t=>'<li>'+e(t)+'</li>').join(''))+'</ul></div>';
}
function customRoleCards(){
 const extra=Object.entries(payload?.roles||{}).filter(([key,def])=>!def.builtin);
 return extra.length?'<div class="org-custom"><h3>Outros cargos da organização</h3><div class="org-grid two">'+
 extra.map(([key])=>roleCard(key)).join('')+'</div></div>':'';
}
function hierarchyGraph(){
 const known=[
  ['lider_01',150,75],['lider_02',450,75],['lider_03',750,75],
  ['gerente_geral',450,185],['gerente_farm',260,300],['gerente_acao',640,300],
  ['logistica',115,415],['estrategista',785,415],
  ['membro',260,525],['elite',640,525]
 ];
 const extra=Object.entries(payload?.roles||{}).filter(([key,def])=>!def.builtin);
 const nodes=[...known,...extra.map(([code],i)=>[code,125+(i%4)*215,645+Math.floor(i/4)*110])];
 const coords=new Map(nodes.map(([key,x,y])=>[key,{x,y}]));
 const links=[['lider_01','gerente_geral'],['lider_02','gerente_geral'],['lider_03','gerente_geral'],
  ['gerente_geral','gerente_farm'],['gerente_geral','gerente_acao'],
  ['gerente_farm','logistica'],['gerente_acao','estrategista'],
  ['gerente_farm','membro'],['gerente_acao','elite']];
 for(const [key] of extra)links.push(['gerente_geral',key]);
 const h=700+Math.max(0,Math.ceil(extra.length/4)-1)*110;
 const paths=links.map(([from,to])=>{
  const a=coords.get(from),b=coords.get(to);
  if(!a||!b)return '';
  const mid=(a.y+b.y)/2;
  return '<path class="org-graph-edge" d="M'+a.x+' '+(a.y+31)+' V'+mid+' H'+b.x+' V'+(b.y-31)+'"/>';
 }).join('');
 const roleNodes=nodes.map(([code,x,y])=>{
  const role=payload.roles?.[code]||{label:label(code),access:ACCESS[code]||25};
  const people=(payload.members||[]).filter(m=>m.orgRole===code);
  const member=people[0];
  const subtitle=people.length?people.map(m=>m.codename).join(' · '):'Vago';
  const display=subtitle.length>26?subtitle.slice(0,25)+'…':subtitle;
  const title=role.label.length>22?role.label.slice(0,21)+'…':role.label;
  const avatar=member?.avatarData&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(member.avatarData)?
   '<image href="'+e(member.avatarData)+'" x="'+(x-69)+'" y="'+(y-20)+'" width="28" height="28" clip-path="circle(14px at 14px 14px)"/>':
   '<circle cx="'+(x-55)+'" cy="'+(y-6)+'" r="13" fill="#374653" stroke="#9baaba"/>';
  return '<g class="org-graph-node" role="button" tabindex="0" data-org-role="'+e(code)+'" aria-label="Ver '+e(role.label)+'">'+
   '<rect x="'+(x-90)+'" y="'+(y-34)+'" width="180" height="70" rx="7"/>'+
   avatar+
   '<text class="org-graph-title" x="'+(x-31)+'" y="'+(y-8)+'">'+e(title)+'</text>'+
   '<text class="org-graph-person" x="'+(x-31)+'" y="'+(y+12)+'">'+e(display)+'</text>'+
   '<text class="org-graph-percent" x="'+(x+68)+'" y="'+(y+28)+'" text-anchor="end">'+Number(role.access??25)+'%</text>'+
   '</g>';
 }).join('');
 return '<section class="org-network"><div class="org-network-head"><div>'+
  '<div class="org-kicker">CONEXÕES DA ORGANIZAÇÃO</div><h2>Infográfico da hierarquia</h2>'+
  '<p>O mapa usa os cargos e integrantes cadastrados. Clique em um nó para visualizar seus integrantes.</p></div>'+
  '<span>MAPA RP / AO VIVO</span></div>'+
  '<div class="org-graph-scroll"><svg viewBox="0 0 900 '+h+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mapa visual de relações entre cargos e setores do MafiaCorp">'+
  '<defs><linearGradient id="orgSilver" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#262f39"/><stop offset="1" stop-color="#10151b"/></linearGradient></defs>'+
  paths+roleNodes+'</svg></div>'+
  '<div class="org-graph-legend">Ligação hierárquica · Cada nó exibe o cargo e o codinome do ocupante · "Vago" indica cargo disponível</div></section>';
}
function hierarchyHtml(){
 return '<div class="org-map"><div class="org-top-label">COMANDO SUPERIOR</div>'+
  '<div class="org-grid three">'+roleCard('lider_01')+roleCard('lider_02')+roleCard('lider_03')+'</div>'+
  '<div class="org-arrow">↓</div>'+roleCard('gerente_geral','org-wide')+
  '<div class="org-arrow">↓</div><div class="org-grid two">'+roleCard('gerente_farm','org-farm')+roleCard('gerente_acao','org-action')+'</div>'+
  '<div class="org-grid two">'+roleCard('logistica')+roleCard('estrategista')+'</div>'+
  '<div class="org-arrow">↓</div><div class="org-grid two">'+roleCard('elite')+roleCard('membro')+'</div>'+customRoleCards()+'</div>'+
  '<div class="org-note">Os percentuais representam níveis de acesso por cargo. A Liderança e a administração gerenciam cargos no Painel ADM. O servidor valida as permissões centrais.</div>'+hierarchyGraph();
}
function bar(num,total=100){const val=Math.max(0,Math.min(total,Number(num)||0));return '<div class="org-progress"><span style="width:'+Math.round(val/total*100)+'%"></span></div>';}
function badge(text,cls=''){return '<span class="org-badge '+cls+'">'+e(text)+'</span>';}
function overall(){
 const val=payload.collectiveApproved||0;
 const mine=payload.ownApproved||0,pending=payload.ownPending||0;
 const exempt=payload.permissions?.canSubmit===false;
 return '<div class="org-stats">'+
  '<div><small>PAINEL COLETIVO DO QG</small><strong>'+val+'% / 100%</strong>'+bar(val)+'</div>'+
  '<div><small>MINHA META DO DIA ATIVO</small><strong>'+(exempt?'ISENTO':mine+'% / 20%')+'</strong>'+(exempt?'<span class="org-sub">Administrador fora da hierarquia RP</span>':bar(mine,20))+'</div>'+
  '<div><small>AGUARDANDO CONFERÊNCIA</small><strong>'+pending+'%</strong><span class="org-sub">Pontuação ainda não aprovada</span></div>'+
  '<div><small>ATIVIDADE DE HOJE</small><strong>'+(exempt?'ADMINISTRADOR':payload.ownActive?'ATIVO':'NÃO MARCADO')+'</strong><span class="org-sub">'+(exempt?'Sem contribuição obrigatória':'Só há meta em dias ativos')+'</span></div>'+
 '</div>';
}
function membersHtml(){
 let members=(payload.members||[]).filter(m=>!selectedRole||m.orgRole===selectedRole);
 return '<section class="org-panel"><div class="org-panel-top"><h2>Integrantes e contribuições</h2><span>'+members.length+' perfis registrados'+(selectedRole?' · '+e(label(selectedRole)):'')+'</span></div>'+
 '<div class="org-member-grid">'+(members.length?members.map(m=>{
  const isMine=m.id===ctx.currentUser.id;
  const score=m.approved===null?'Privado':m.approved+'%';
  return '<div class="org-member-card"><div class="org-member-title"><span class="org-avatar">'+(m.avatarData?'<img src="'+e(m.avatarData)+'" alt="Foto">':e(m.codename.slice(0,2).toUpperCase()))+'</span><span><b>'+e(m.codename)+'</b><small>'+e(m.name)+'</small></span></div>'+
   '<div class="org-member-role">'+e(label(m.orgRole))+'</div>'+
   '<div class="org-member-points"><strong>'+score+'</strong><span>'+(m.pending===null?'Contribuição pessoal':m.pending+'% pendente')+'</span></div>'+
   (m.approved!==null?bar(m.approved,20):'')+
   '<div class="org-member-foot">'+badge(m.activeToday?'Ativo no dia':'Sem atividade marcada',m.activeToday?'green':'')+
   ((payload.permissions.canViewAll||isMine)?'<button data-org-member="'+e(m.id)+'">Ver log / prints</button>':'')+'</div></div>';
 }).join(''):'<p class="org-empty">Nenhuma conta central cadastrada.</p>')+'</div></section>';
}
function missionsHtml(){
 return '<section class="org-panel"><div class="org-panel-top"><h2>Missões do painel do QG</h2><span>20% por integrante / dia ativo</span></div>'+
 '<table class="org-missions"><thead><tr><th>Missão</th><th>Pontuação</th></tr></thead><tbody>'+
 Object.entries(MISSIONS).map(([key,v])=>'<tr><td>'+e(v[0])+'</td><td>'+v[1]+'%</td></tr>').join('')+'</tbody></table>'+
 '<p class="org-rule">Cada integrante responde pela própria contribuição. Missões podem ser escolhidas livremente. O progresso aprovado é compartilhado: cinco contribuições de 20% completam o painel de 100%. Ao concluir, a Liderança decide a produção.</p></section>';
}
function submitHtml(){
 return '<section class="org-panel"><div class="org-panel-top"><h2>Entregar missão</h2>'+badge('Avaliação pendente')+'</div>'+
 '<div class="org-inner"><p class="org-muted">Escolha uma missão e envie um log ou um print leve da conclusão no roleplay. A pontuação será adicionada após conferência.</p>'+
 '<form id="org-submit" class="org-submit">'+
 '<label>Missão<select name="missionType" required>'+Object.entries(MISSIONS).map(([key,v])=>'<option value="'+key+'">'+e(v[0])+' · '+v[1]+'%</option>').join('')+'</select></label>'+
 '<label>Log da entrega<textarea name="note" rows="3" maxlength="400" placeholder="Ex.: missão concluída no QG, comprovante do RP, horário..."></textarea></label>'+
 '<label>Print leve (opcional)<input name="photo" type="file" accept="image/*" id="org-photo"><small id="org-photo-label">JPEG, PNG ou WEBP. Compressão automática.</small></label>'+
 '<button class="org-btn primary" type="submit">Enviar para aprovação</button></form></div></section>';
}
function contributionRows(){
 const list=(payload.contributions||[]).filter(item=>!selectedMember||item.accountId===selectedMember);
 return '<section class="org-panel"><div class="org-panel-top"><h2>Registro de entregas</h2><span>'+list.length+' registro(s)</span></div>'+
 '<div class="org-log-table-wrap"><table class="org-log-table"><thead><tr><th>Integrante</th><th>Missão / Log</th><th>Pontos</th><th>Situação</th><th>Comprovante</th><th>Conferência</th></tr></thead><tbody>'+
 (list.length?list.map(item=>'<tr><td>'+e(item.codename)+'</td>'+
 '<td><strong>'+e(MISSIONS[item.missionType]?.[0]||item.missionType)+'</strong><small>'+e(item.note||'Sem log escrito')+'</small></td>'+
 '<td>'+item.points+'%</td>'+
 '<td>'+badge(item.status,item.status==='aprovado'?'green':item.status==='rejeitado'?'red':'')+'</td>'+
 '<td>'+(item.hasEvidence?'<button class="org-btn small" data-org-evidence="'+e(item.id)+'">Ver print</button>':'Somente log')+'</td>'+
 '<td>'+(payload.permissions.canReview&&item.status==='pendente'&&item.accountId!==ctx.currentUser.id?
 '<button class="org-btn small" data-org-review="'+e(item.id)+'" data-status="aprovado">Aprovar</button> '+
 '<button class="org-btn small muted" data-org-review="'+e(item.id)+'" data-status="rejeitado">Rejeitar</button>':'—')+'</td></tr>').join(''):'<tr><td colspan="6" class="org-empty">Ainda não existem entregas nesta data.</td></tr>')+
 '</tbody></table></div></section>';
}
function contributionHtml(){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
 const isToday=payload.date===today;
 return '<div class="org-controls"><label>Dia consultado <input id="org-date" type="date" value="'+e(payload.date)+'" max="'+e(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()))+'"></label>'+
 (payload.permissions.canSubmit?'<button class="org-btn" id="org-my-activity" '+(!isToday||payload.ownActive?'disabled':'')+'>'+(isToday?(payload.ownActive?'Atividade registrada':'Marcar que estive ativo hoje'):'Somente consulta histórica')+'</button>':'')+
 (payload.permissions.canViewAll?'<label>Integrante<select id="org-member-filter"><option value="">Todos</option>'+payload.members.map(m=>'<option value="'+e(m.id)+'" '+(selectedMember===m.id?'selected':'')+'>'+e(m.codename)+'</option>').join('')+'</select></label>':'')+'</div>'+
 overall()+'<div class="org-columns">'+(isToday&&payload.permissions.canSubmit?submitHtml():'<section class="org-panel"><div class="org-panel-top"><h2>Histórico de entregas</h2></div><div class="org-inner">Entregas e marcações de atividade são registradas somente no dia atual. Esta data está em modo de consulta.</div></section>')+missionsHtml()+'</div>'+contributionRows()+
 (payload.permissions.canManagePanel?'<section class="org-panel"><div class="org-panel-top"><h2>Fechamento do painel</h2>'+badge(payload.collectiveApproved>=100?'Meta coletiva atingida':'Aguardando 100%',payload.collectiveApproved>=100?'green':'')+'</div>'+
 '<div class="org-inner"><p>Somente Liderança e Gerente Geral podem registrar a escolha da produção após 100% aprovado.</p>'+
 '<form id="org-production"><input name="productionChoice" maxlength="250" placeholder="Escolha da produção RP" required value="'+e(payload.panel?.production_choice||'')+'"><button class="org-btn" '+(payload.collectiveApproved<100?'disabled':'')+'>Registrar produção</button></form></div></section>':'');
}
async function compress(file){
 if(!file)return null;
 if(!file.type.startsWith('image/'))throw Error('Selecione uma imagem.');
 if(file.size>8*1024*1024)throw Error('Print de origem acima de 8 MB.');
 const objectUrl=URL.createObjectURL(file);
 try{
  const picture=new Image();
  await new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=reject;picture.src=objectUrl;});
  const ratio=Math.min(1,1100/Math.max(picture.width,picture.height));
  const cv=document.createElement('canvas');
  cv.width=Math.max(1,Math.round(picture.width*ratio));cv.height=Math.max(1,Math.round(picture.height*ratio));
  const context=cv.getContext('2d');if(!context)throw Error('Seu navegador não suporta compressão.');
  context.drawImage(picture,0,0,cv.width,cv.height);
  for(const quality of [.7,.56,.43,.32]){
   const data=cv.toDataURL('image/jpeg',quality);
   if(data.length<140000)return data;
  }
  throw Error('O print ainda ficou grande. Recorte a imagem antes de enviar.');
 }finally{URL.revokeObjectURL(objectUrl);}
}
function setBusy(on){busy=on;document.querySelectorAll('.org-btn[type=submit]').forEach(b=>b.disabled=on);}
async function update(){
 if(!ctx||!valid())return;
 const index=++renderSerial;
 try{
  const query=selectedDate?'?date='+encodeURIComponent(selectedDate):'';
  const data=await api(API+query);
  if(index!==renderSerial||!valid())return;
  payload=data;selectedDate=data.date;
  const root=document.getElementById('org-content');if(!root)return;
  root.innerHTML=mode==='hierarquia'?hierarchyHtml():mode==='roster'?membersHtml():contributionHtml();
  wire();
 }catch(err){
  if(index===renderSerial&&valid())document.getElementById('org-content').innerHTML='<p class="org-error">'+e(err.message)+'</p>';
 }
}
async function perform(body){
 if(busy)return;
 setBusy(true);
 try{await api(API,'POST',body);ctx.toast('Registro salvo no banco.');await update();}
 catch(err){ctx.toast(err.message,true);}
 finally{setBusy(false);}
}
function wire(){
 document.querySelectorAll('[data-org-role]').forEach(b=>{
   const open=()=>ctx.navigate('roster',{orgRole:b.dataset.orgRole});
   b.addEventListener('click',open);
   b.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open();}});
 });
 document.querySelectorAll('[data-org-member]').forEach(b=>b.addEventListener('click',()=>ctx.navigate('contribuicoes',{memberId:b.dataset.orgMember})));
 const date=document.getElementById('org-date');
 if(date)date.addEventListener('change',()=>{selectedDate=date.value;update();});
 const selected=document.getElementById('org-member-filter');
 if(selected)selected.addEventListener('change',()=>{selectedMember=selected.value;const root=document.getElementById('org-content');if(root){root.innerHTML=contributionHtml();wire();}});
 const active=document.getElementById('org-my-activity');
 if(active)active.addEventListener('click',()=>perform({action:'activity'}));
 const form=document.getElementById('org-submit');
 if(form)form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const data=new FormData(form),image=data.get('photo');
  let evidenceData=null;
  try{if(image&&image.size)evidenceData=await compress(image);}
  catch(err){return ctx.toast(err.message,true);}
  await perform({action:'submit',missionType:String(data.get('missionType')),note:String(data.get('note')||''),evidenceData});
 });
 const photo=document.getElementById('org-photo');
 if(photo)photo.addEventListener('change',()=>{const out=document.getElementById('org-photo-label');if(out)out.textContent=photo.files?.[0]?.name||'Nenhum print selecionado';});
 document.querySelectorAll('[data-org-review]').forEach(b=>b.addEventListener('click',async()=>{
  if(!window.confirm(b.dataset.status==='aprovado'?'Aprovar esta entrega RP?':'Rejeitar esta entrega RP?'))return;
  await perform({action:'review',id:b.dataset.orgReview,status:b.dataset.status});
 }));
 document.querySelectorAll('[data-org-evidence]').forEach(b=>b.addEventListener('click',async()=>{
  try{
   const result=await api(API+'?action=evidence&id='+encodeURIComponent(b.dataset.orgEvidence));
   if(!result.image)return ctx.toast('Sem imagem disponível.');
   ctx.openModal('<div class="modal-head"><h3>Comprovante de missão RP</h3><button type="button" class="modal-close" id="org-close-modal">×</button></div>'+
    '<div class="org-preview"><img alt="Comprovante de missão do roleplay" src="'+e(result.image)+'"></div>');
   const close=document.getElementById('org-close-modal');if(close)close.addEventListener('click',ctx.closeModal);
  }catch(err){ctx.toast(err.message,true);}
 }));
 const prod=document.getElementById('org-production');
 if(prod)prod.addEventListener('submit',async event=>{
  event.preventDefault();
  const value=new FormData(prod).get('productionChoice');
  if(!window.confirm('Registrar escolha da produção RP para este painel?'))return;
  await perform({action:'production',date:payload.date,productionChoice:String(value)});
 });
}
function render(view,context,params={}){
 ctx=context;mode=view;contextKey=view;payload=null;selectedDate='';selectedMember=String(params.memberId||'');selectedRole=String(params.orgRole||'');
 const root=area();if(!root)return;
 const title=view==='hierarquia'?'Hierarquia da organização':view==='roster'?'Integrantes e resultados':'Metas e contribuições';
 const subtitle=view==='hierarquia'?'Cargos, atribuições e níveis de acesso por setor.':
 view==='roster'?'Perfis e evolução diária dos integrantes cadastrados.':
 'Sistema coletivo do QG, entregas diárias e evidências do roleplay.';
 root.innerHTML=shell(title,subtitle);
 update();
}
window.MafiaOrg={render,api,TITLES,ACCESS};
})();