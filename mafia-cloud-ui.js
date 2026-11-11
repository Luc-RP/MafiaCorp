/* MafiaCorp • browser client for central Vercel/PostgreSQL authentication. */
(function(){
"use strict";
const API='/api/auth';
const ADMIN='/api/admin';
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts={
  INVALID_CREDENTIALS:'Codinome ou senha incorretos.',
  INVALID_PROFILE:'Informe nome e codinome válidos (3 a 48 caracteres).',
  WEAK_PASSWORD:'Use no mínimo 8 caracteres, combinando letras, números e símbolos.',
  CODENAME_IN_USE:'Este codinome já está cadastrado.',
  ACCOUNT_DISABLED:'Esta conta foi bloqueada pela administração.',
  TRY_LATER:'Muitas tentativas. Tente novamente mais tarde.',
  RATE_LIMITED:'Limite de tentativas atingido. Tente novamente mais tarde.',
  UNAUTHENTICATED:'Sua sessão expirou. Entre novamente.',
  INVALID_ORIGIN:'Operação bloqueada por verificação de origem.',
  REGISTRATION_CLOSED:'Novos cadastros estão temporariamente fechados.',
  FORBIDDEN:'Sua conta não tem permissão de administrador.',
  SERVICE_UNAVAILABLE:'O servidor de autenticação está indisponível.',
  LAST_ADMIN_PROTECTED:'O último administrador ativo está protegido.',
  CANNOT_MODIFY_OWN_ACCOUNT:'Você não pode modificar o próprio acesso nesta tela.',
  ROLE_OCCUPIED:'Este cargo de comando já está ocupado. Escolha outro posto ou altere o responsável atual.',
  ACCOUNT_HAS_HISTORY:'Este integrante possui histórico de missões. Bloqueie a conta para preservar os comprovantes; a exclusão definitiva ficará para a política de retenção.',
  SYSTEM_ADMIN_PROTECTED:'A conta administrativa principal é protegida.'
};
async function api(path,method='GET',body){
  const params={method,credentials:'same-origin',cache:'no-store',headers:{'Accept':'application/json'}};
  if(body!==undefined){params.headers['Content-Type']='application/json';params.body=JSON.stringify(body);}
  const response=await fetch(path,params);
  const value=await response.json().catch(()=>({error:'SERVICE_UNAVAILABLE'}));
  if(!response.ok){const ex=new Error(texts[value.error]||'Não foi possível concluir a operação.');ex.status=response.status;ex.code=value.error;throw ex;}
  return value;
}
function status(){return api(API+'?action=status');}
function login(codename,password){return api(API+'?action=login','POST',{codename,password});}
function register(name,codename,password){return api(API+'?action=register','POST',{name,codename,password});}
function me(){return api(API+'?action=me');}
function logout(){return api(API+'?action=logout','POST',{});}
function safeDate(s){if(!s)return 'Nunca';const d=new Date(s);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR');}
const ROLE={admin:'Administrador',chefe:'Chefe',investigador:'Investigador',observador:'Observador'};
const ORG_ROLE={admin_sistema:'Administrador do Sistema',lider_01:'Liderança 01',lider_02:'Liderança 02',lider_03:'Liderança 03',gerente_geral:'Gerente Geral',gerente_farm:'Gerente de Farm',gerente_acao:'Gerente de Ação',estrategista:'Estrategista / Inteligência',logistica:'Logística',elite:'Elite / Operadores',membro:'Membro / Integrante'};
const ORG_ACCESS={admin_sistema:100,lider_01:100,lider_02:100,lider_03:100,gerente_geral:90,gerente_farm:65,gerente_acao:65,estrategista:60,logistica:55,elite:40,membro:25};
function roleOptions(selected){return Object.entries(ORG_ROLE).filter(([key])=>key!=='admin_sistema').map(([key,value])=>'<option value="'+key+'" '+(selected===key?'selected':'')+'>'+esc(value)+' · '+ORG_ACCESS[key]+'% acesso</option>').join('');}

let ctx=null,users=[],search='',filter='all';
function adminHtml(){
 const active=users.filter(x=>x.isActive).length;
 return '<section class="am-shell"><div class="am-head"><div class="am-eyebrow">MAFIACORP / BANCO CENTRAL AIVEN</div><h1>Painel ADM</h1><p>Contas compartilhadas entre navegadores. Bloqueios e senhas são validados pelo servidor.</p></div>'+
 '<div class="am-stats"><div><small>CONTAS CADASTRADAS</small><strong>'+users.length+'</strong></div><div><small>HABILITADAS</small><strong>'+active+'</strong></div><div><small>BLOQUEADAS</small><strong>'+(users.length-active)+'</strong></div><div><small>ADMINISTRADORES</small><strong>'+users.filter(x=>x.role==='admin'&&x.isActive).length+'</strong></div></div>'+
 '<div class="am-panel"><div class="am-panel-bar"><h2>Perfis no PostgreSQL</h2><button class="am-btn am-primary" data-cloud="create">+ Criar conta</button></div>'+
 '<div class="am-filters"><label>Pesquisar<input id="cloud-search" placeholder="Nome ou codinome" value="'+esc(search)+'"/></label><label>Situação<select id="cloud-filter"><option value="all" '+(filter==='all'?'selected':'')+'>Todas</option><option value="active" '+(filter==='active'?'selected':'')+'>Habilitadas</option><option value="blocked" '+(filter==='blocked'?'selected':'')+'>Bloqueadas</option></select></label></div>'+
 '<div id="cloud-table">'+tableHtml()+'</div></div><div class="am-foot">Sessões são revogadas no servidor quando uma conta é bloqueada, tem a senha redefinida ou é excluída. Os registros RP locais continuam separados.</div></section>';
}
function tableHtml(){
 const q=search.toLocaleLowerCase('pt-BR');
 const filtered=users.filter(x=>(filter==='all'||(filter==='active'&&x.isActive)||(filter==='blocked'&&!x.isActive))&&(!q||[x.name,x.codename].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q))));
 return '<div class="am-table-overflow"><table class="am-table"><thead><tr><th>PERFIL</th><th>PERMISSÃO</th><th>ACESSO</th><th>ÚLTIMO LOGIN</th><th>AÇÕES</th></tr></thead><tbody>'+
 (filtered.length?filtered.map(u=>{
  const own=u.id===ctx.currentUser.id;
  return '<tr><td><div class="am-profile"><div class="am-avatar">'+esc(u.codename.slice(0,2).toUpperCase())+'</div><div><strong>'+esc(u.name)+'</strong><small>@'+esc(u.codename)+(own?' · VOCÊ':'')+'</small></div></div></td>'+
  '<td><span class="am-role">'+esc(ORG_ROLE[u.orgRole]||ORG_ROLE.membro)+'</span><small>'+Number(ORG_ACCESS[u.orgRole]||25)+'% de acesso</small></td>'+
  '<td><span class="am-status '+(u.isActive?'is-active':'is-blocked')+'">'+(u.isActive?'ATIVO':'BLOQUEADO')+'</span></td>'+
  '<td class="am-muted">'+esc(safeDate(u.lastAccess))+'</td><td><div class="am-actions">'+
  '<button class="am-btn" data-cloud="profile" data-id="'+esc(u.id)+'">Ficha</button>'+
  '<button class="am-btn" data-cloud="orgRole" data-id="'+esc(u.id)+'" '+(own?'disabled':'')+'>Cargo</button>'+'<button class="am-btn" data-cloud="contributions" data-id="'+esc(u.id)+'">Metas</button>'+'<button class="am-btn" data-cloud="password" data-id="'+esc(u.id)+'" '+(own?'disabled':'')+'>Senha</button>'+
  '<button class="am-btn am-warning-btn" data-cloud="toggle" data-id="'+esc(u.id)+'" '+(own?'disabled':'')+'>'+(u.isActive?'Bloquear':'Reativar')+'</button>'+
  '<button class="am-btn am-danger" data-cloud="delete" data-id="'+esc(u.id)+'" '+(own?'disabled':'')+'>Excluir</button></div></td></tr>';
 }).join(''):'<tr><td colspan="5"><div class="am-empty">Nenhuma conta encontrada.</div></td></tr>')+'</tbody></table></div>';
}
function wireButtons(root){
 root.querySelectorAll('[data-cloud]').forEach(b=>b.addEventListener('click',()=>dispatch(b.dataset.cloud,b.dataset.id)));
}
function formModal(title,body,submit,label='Salvar'){
 ctx.openModal('<div class="modal-head"><h3>'+esc(title)+'</h3><button type="button" class="modal-close" data-cloud-close>×</button></div>'+
 '<form id="cloud-form"><div class="modal-body am-modal-fields">'+body+'</div><div class="am-modal-actions">'+
 '<button class="am-btn" data-cloud-close type="button">Cancelar</button><button class="am-btn am-primary" type="submit">'+esc(label)+'</button></div></form>');
 document.querySelectorAll('[data-cloud-close]').forEach(b=>b.addEventListener('click',ctx.closeModal));
 const f=document.getElementById('cloud-form');
 f.addEventListener('submit',async event=>{
  event.preventDefault();if(!f.reportValidity())return;
  const button=f.querySelector('[type="submit"]');if(button)button.disabled=true;
  try{await submit(new FormData(f));ctx.closeModal();await refresh();ctx.toast('Alteração salva no banco central.');}
  catch(err){ctx.toast(err.message||'Falha ao salvar alteração.',true);}
  finally{if(button)button.disabled=false;}
 });
}
function profile(u){
 formModal('Perfil de '+u.codename,'<div class="am-profile-detail">'+[
  ['Nome',u.name],['Codinome',u.codename],['Cargo',ORG_ROLE[u.orgRole]||ORG_ROLE.membro],['Visibilidade',String(ORG_ACCESS[u.orgRole]||25)+'%'],['Situação',u.isActive?'Ativo':'Bloqueado'],['Criado em',safeDate(u.createdAt)],['Último acesso',safeDate(u.lastAccess)]
 ].map(([k,v])=>'<div><small>'+esc(k)+'</small><span>'+esc(v||'—')+'</span></div>').join('')+'</div>',()=>Promise.resolve(),'Fechar');
}
function create(){
 formModal('Criar conta no PostgreSQL','<label>Nome<input name="name" minlength="2" maxlength="120" required></label>'+
  '<label>Codinome de acesso<input name="codename" minlength="3" maxlength="48" required></label>'+
  '<label>Cargo na organização<select name="orgRole">'+roleOptions('membro')+'</select></label>'+
  '<label>Senha inicial<input name="password" type="password" minlength="8" required></label>'+
  '<label>Confirmar senha<input name="confirm" type="password" minlength="8" required></label>',
 async data=>{
  if(data.get('password')!==data.get('confirm'))throw new Error('Confirmação de senha diferente.');
  await api(ADMIN,'POST',{name:data.get('name'),codename:data.get('codename'),orgRole:data.get('orgRole'),password:data.get('password')});
 },'Criar usuário');
}
function reset(u){
 formModal('Redefinir senha: '+u.codename,'<p class="am-inline-warning">A senha nova será válida imediatamente e todas as sessões antigas serão revogadas.</p>'+
  '<label>Nova senha (mín. 8 caracteres)<input name="password" type="password" minlength="8" required></label>'+
  '<label>Confirme a senha<input name="confirm" type="password" minlength="8" required></label>',
 async data=>{
  if(data.get('password')!==data.get('confirm'))throw new Error('As senhas não coincidem.');
  await api(ADMIN,'PATCH',{id:u.id,action:'resetPassword',password:data.get('password')});
 },'Redefinir senha');
}
function changeOrgRole(u){
 formModal('Atribuir cargo: '+u.codename,
  '<p class="am-inline-warning">As permissões e telas serão atualizadas no servidor. A pessoa precisará entrar novamente após a mudança de cargo.</p>'+
  '<label>Cargo oficial<select name="orgRole">'+roleOptions(u.orgRole||'membro')+'</select></label>',
  async data=>{
    await api(ADMIN,'PATCH',{id:u.id,action:'orgRole',orgRole:String(data.get('orgRole'))});
  },'Salvar cargo');
}
function toggle(u){
 formModal((u.isActive?'Bloquear':'Reativar')+': '+u.codename,
  '<p class="am-confirm">'+(u.isActive?'Bloquear o acesso de':'Reativar o acesso de')+' <strong>'+esc(u.name)+'</strong> em todos os dispositivos?</p>',
  async()=>{await api(ADMIN,'PATCH',{id:u.id,action:u.isActive?'block':'unblock'});},u.isActive?'Bloquear acesso':'Reativar');
}
function remove(u){
 formModal('Excluir: '+u.codename,
  '<p class="am-inline-warning">Esta conta será excluída do banco central. Os dossiês locais de outros navegadores não serão apagados.</p>'+
  '<label>Digite o codinome para confirmar<input name="confirm" required></label>',
  async data=>{
   if(data.get('confirm')!==u.codename)throw new Error('Digite o codinome exatamente como mostrado.');
   await api(ADMIN,'DELETE',{id:u.id});
  },'Excluir conta');
}
function dispatch(action,id){
 if(action==='create')return create();
 const u=users.find(x=>x.id===id);if(!u)return;
 if(action==='profile')return profile(u);
 if(action==='contributions'){if(ctx.navigate)ctx.navigate('contribuicoes',{memberId:u.id});return;}
 if(u.id===ctx.currentUser.id)return;
 if(action==='orgRole')return changeOrgRole(u);
 if(action==='password')return reset(u);
 if(action==='toggle')return toggle(u);
 if(action==='delete')return remove(u);
}
async function refresh(){
 const res=await api(ADMIN);
 users=res.users||[];
 const root=document.getElementById('view');if(!root||(ctx.isActive&&!ctx.isActive()))return;
 root.innerHTML=adminHtml();wire();
}
function wire(){
 const searchEl=document.getElementById('cloud-search'),filterEl=document.getElementById('cloud-filter');
 if(searchEl)searchEl.addEventListener('input',()=>{search=searchEl.value;const el=document.getElementById('cloud-table');if(el){el.innerHTML=tableHtml();wireButtons(el);}});
 if(filterEl)filterEl.addEventListener('change',()=>{filter=filterEl.value;const el=document.getElementById('cloud-table');if(el){el.innerHTML=tableHtml();wireButtons(el);}});
 wireButtons(document);
}
async function renderAdmin(context){
 ctx=context;
 const root=document.getElementById('view');if(!root)return;
 root.innerHTML='<div class="am-shell"><h1>Painel ADM</h1><p>Consultando contas do servidor...</p></div>';
 try{await refresh();}
 catch(err){if(!ctx.isActive||ctx.isActive())root.innerHTML='<div class="am-shell"><h1>Não foi possível consultar as contas</h1><p>'+esc(err.message)+'</p></div>';}
}
window.MafiaCloud={status,login,register,me,logout,renderAdmin};
})();