/* MafiaCorp | Administração de contas locais
   Somente gerenciamento do banco local deste navegador, sem controle remoto. */
(function(){
"use strict";
let ctx=null,filter="",statusFilter="all";
const roles={admin:"Administrador",chefe:"Chefe de investigação",investigador:"Investigador",observador:"Observador"};
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function now(){return new Date().toISOString();}
function available(){return ctx&&ctx.isAdmin&&ctx.currentUser&&ctx.db&&Array.isArray(ctx.db.users);}
function rows(){return available()?ctx.db.users:[];}
function eligible(user){return user && user.id!=="u_admin" && user.id!==ctx.currentUser.id;}
function label(user){return user.name||user.username||"Usuário";}
function fmtDate(date){if(!date)return "Nunca";try{return new Date(date).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch{return "—";}}
function eBtn(action,id,title,css="",disabled=false){return '<button type="button" class="am-btn '+css+'" data-am-action="'+esc(action)+'" data-am-id="'+esc(id||"")+'" '+(disabled?"disabled ":"")+'>'+esc(title)+'</button>';}
function view(){
 if(!available())return '<section class="am-shell"><h1>Acesso restrito</h1><p>Somente administradores podem abrir este painel.</p></section>';
 const users=rows(),active=users.filter(u=>!u.accessDisabled).length,blocked=users.length-active,admins=users.filter(u=>u.role==="admin"&&!u.accessDisabled).length;
 const shown=users.filter(u=>{
  if(statusFilter==="active"&&u.accessDisabled)return false;
  if(statusFilter==="blocked"&&!u.accessDisabled)return false;
  const q=filter.toLocaleLowerCase("pt-BR").trim();
  return !q||[u.username,u.name,u.codename,u.contact,u.specialty].some(t=>String(t||"").toLocaleLowerCase("pt-BR").includes(q));
 });
 const table='<div class="am-table-overflow"><table class="am-table"><thead><tr><th>PERFIL</th><th>FUNÇÃO</th><th>ACESSO LOCAL</th><th>ÚLTIMO LOGIN</th><th>AÇÕES</th></tr></thead><tbody>'+
 (shown.length?shown.map(u=>{
   const isSelf=u.id===ctx.currentUser.id,canChange=eligible(u);
   return '<tr><td><div class="am-profile"><div class="am-avatar">'+esc((u.codename||u.username||"?").slice(0,2).toUpperCase())+'</div><div><strong>'+esc(label(u))+'</strong><small>@'+esc(u.username||"—")+(isSelf?" · VOCÊ":"")+'</small><small>'+esc(u.codename||"")+'</small></div></div></td>'+
    '<td><span class="am-role">'+esc(roles[u.role]||u.role||"—")+'</span><small>'+esc(u.specialty||"")+'</small></td>'+
    '<td><span class="am-status '+(u.accessDisabled?"is-blocked":"is-active")+'">'+(u.accessDisabled?"ACESSO BLOQUEADO":"HABILITADO")+'</span>'+
    (u.mustChangePassword?'<small class="am-warning">Senha redefinida</small>':'')+'</td>'+
    '<td class="am-muted">'+esc(fmtDate(u.lastAccess))+'</td>'+
    '<td><div class="am-actions">'+eBtn("profile",u.id,"Ficha")+
     eBtn("password",u.id,"Redefinir senha","",!canChange)+
     eBtn("toggle",u.id,u.accessDisabled?"Reativar":"Bloquear",u.accessDisabled?"":"am-warning-btn",!canChange)+
     eBtn("delete",u.id,"Excluir","am-danger",!canChange)+'</div></td></tr>';
 }).join(""):'<tr><td colspan="5"><div class="am-empty">Nenhum usuário correspondente aos filtros.</div></td></tr>')+
 '</tbody></table></div>';
 return '<section class="am-shell">'+
 '<div class="am-head"><div class="am-eyebrow">MAFIACORP / CONTROLE DE CONTAS</div><h1>Painel ADM</h1><p>Gerencie perfis e credenciais existentes na base local deste navegador.</p></div>'+
 '<div class="am-notice"><strong>GERENCIAMENTO LOCAL</strong><p>Este painel não lista contas criadas em outros computadores ou navegadores. Bloquear, excluir ou redefinir uma senha aqui <b>não revoga remotamente</b> o acesso de outra pessoa. Sem servidor central, não existe controle de acesso compartilhado.</p></div>'+
 '<div class="am-stats"><div><small>CONTAS NESTE NAVEGADOR</small><strong>'+users.length+'</strong></div><div><small>HABILITADAS</small><strong>'+active+'</strong></div><div><small>BLOQUEADAS</small><strong>'+blocked+'</strong></div><div><small>ADMINISTRADORES HABILITADOS</small><strong>'+admins+'</strong></div></div>'+
 '<div class="am-panel"><div class="am-panel-bar"><h2>Contas cadastradas</h2>'+eBtn("create","","+ Criar conta","am-primary")+'</div>'+
 '<div class="am-filters"><label>Buscar perfil<input type="search" id="am-query" placeholder="Nome, login, codinome ou contato" value="'+esc(filter)+'"/></label>'+
 '<label>Situação<select id="am-filter-status"><option value="all" '+(statusFilter==="all"?"selected":"")+'>Todas</option><option value="active" '+(statusFilter==="active"?"selected":"")+'>Habilitadas</option><option value="blocked" '+(statusFilter==="blocked"?"selected":"")+'>Bloqueadas</option></select></label></div>'+
 '<div id="am-table-wrap">'+table+'</div></div>'+
 '<div class="am-foot">Ações locais ficam registradas na auditoria deste navegador. As senhas atuais não são exibidas, e excluir uma conta não apaga os cadastros de personagens ou dossiês.</div></section>';
}
function validateName(username,currentId){
 const id=String(username||"").trim();
 if(id.length<3||id.length>64||!/^[-_.a-zA-Z0-9]+$/.test(id))throw Error("Usuário: use de 3 a 64 letras, números, pontos, traços ou sublinhados.");
 if(rows().some(u=>u.id!==currentId&&String(u.username).toLowerCase()===id.toLowerCase()))throw Error("Já existe uma conta com esse login.");
 return id;
}
function ensureUser(id){
 if(!available())throw Error("Acesso administrativo necessário.");
 const user=rows().find(u=>u.id===id);
 if(!user)throw Error("Conta não encontrada nesta base.");
 return user;
}
function actionAllowed(user){
 if(!eligible(user))throw Error("Não é permitido alterar o próprio acesso nem a conta administrativa principal.");
}
function openModal(title,body,onSubmit,label="Salvar"){
 ctx.openModal('<div class="modal-head"><h3>'+esc(title)+'</h3><button type="button" class="modal-close" data-am-close>×</button></div>'+
 '<form class="am-form" id="am-modal-form"><div class="modal-body am-modal-fields">'+body+'</div><div class="am-modal-actions">'+
 '<button type="button" class="am-btn" data-am-close>Cancelar</button><button type="submit" class="am-btn am-primary">'+esc(label)+'</button></div></form>');
 document.querySelectorAll("[data-am-close]").forEach(b=>b.addEventListener("click",ctx.closeModal));
 const form=document.getElementById("am-modal-form");
 form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(!form.reportValidity())return;
  const submit=form.querySelector('[type="submit"]');
  if(submit)submit.disabled=true;
  try{await onSubmit(new FormData(form));}
  catch(err){ctx.toast(err.message||"Falha ao atualizar conta.",true);}
  finally{if(submit)submit.disabled=false;}
 });
}
async function commitUser(action,detail){
 ctx.logAudit(action,detail);
 const success=await ctx.saveDB();
 if(!success)throw Error("Falha ao salvar a alteração neste navegador.");
 ctx.closeModal();ctx.renderView();ctx.toast("Alteração de conta registrada localmente.");
}
function profile(id){
 const u=ensureUser(id),self=u.id===ctx.currentUser.id;
 const fields=[
 ["Nome",u.name],["Codinome",u.codename],["Login",u.username],["Cargo",roles[u.role]||u.role],
 ["Especialidade",u.specialty],["Contato",u.contact],["Situação no RP",u.status],
 ["Primeiro cadastro",fmtDate(u.createdAt)],["Último acesso local",fmtDate(u.lastAccess)],
 ["Permissão",u.accessDisabled?"Bloqueada":"Habilitada"]
 ];
 const body='<div class="am-profile-detail">'+fields.map(([k,v])=>'<div><small>'+esc(k)+'</small><span>'+esc(v||"—")+'</span></div>').join("")+'</div>'+
 (self?'<p class="am-inline-warning">Sua conta está protegida contra bloqueio e exclusão neste painel.</p>':'');
 openModal("Ficha da conta",body,async()=>ctx.closeModal(),"Fechar");
}
function createUser(){
 openModal("Criar conta local",
 '<label>Nome do perfil<input name="name" maxlength="120" required></label>'+
 '<label>Login<input name="username" minlength="3" maxlength="64" autocomplete="off" required></label>'+
 '<label>Codinome<input name="codename" maxlength="70"></label>'+
 '<label>Função<select name="role">'+Object.entries(roles).map(([key,name])=>'<option value="'+esc(key)+'" '+(key==="observador"?"selected":"")+'>'+esc(name)+'</option>').join("")+'</select></label>'+
 '<label>Especialidade<input name="specialty" maxlength="100"></label>'+
 '<label>Contato de RP<input name="contact" maxlength="150"></label>'+
 '<label>Senha inicial (10 caracteres ou mais)<input name="password" type="password" minlength="10" autocomplete="new-password" required></label>'+
 '<label>Confirmar senha<input name="confirmPassword" type="password" minlength="10" autocomplete="new-password" required></label>',
 async f=>{
  const username=validateName(f.get("username")),name=String(f.get("name")||"").trim(),pass=String(f.get("password")||"");
  if(!name)throw Error("Informe o nome do perfil.");
  if(pass.length<10||pass!==String(f.get("confirmPassword")))throw Error("A senha deve ter pelo menos 10 caracteres e coincidir com a confirmação.");
  const u={id:ctx.uid(),username,name,codename:String(f.get("codename")||"").trim(),role:String(f.get("role")||"observador"),specialty:String(f.get("specialty")||"").trim(),contact:String(f.get("contact")||"").trim(),status:"OFFLINE",passwordHash:await ctx.sha256(pass),createdAt:now(),lastAccess:null,accessDisabled:false};
  if(!roles[u.role])throw Error("Cargo inválido.");
  ctx.db.users.push(u);
  try{await commitUser("Criou conta local",username);}catch(err){ctx.db.users=ctx.db.users.filter(x=>x!==u);throw err;}
 },"Criar conta");
}
function passwordReset(id){
 const user=ensureUser(id);actionAllowed(user);
 openModal("Redefinir senha • "+label(user),
 '<p class="am-inline-warning">A nova senha valerá somente para esta conta nesta base local. Comunique-a ao jogador por um canal adequado, pois o site não envia notificações.</p>'+
 '<label>Nova senha (mínimo 10 caracteres)<input type="password" name="password" minlength="10" autocomplete="new-password" required></label>'+
 '<label>Confirmar senha<input type="password" name="confirmPassword" minlength="10" autocomplete="new-password" required></label>',
 async f=>{
  actionAllowed(ensureUser(id));
  const pass=String(f.get("password")||"");
  if(pass.length<10||pass!==String(f.get("confirmPassword")))throw Error("A senha deve ter pelo menos 10 caracteres e coincidir com a confirmação.");
  const previous=user.passwordHash,previousRevision=Number(user.passwordRevision||0),previousChangedAt=user.passwordChangedAt;
  user.passwordHash=await ctx.sha256(pass);user.passwordRevision=previousRevision+1;user.passwordChangedAt=now();
  try{await commitUser("Redefiniu senha local",user.username);}catch(err){user.passwordHash=previous;user.passwordRevision=previousRevision;user.passwordChangedAt=previousChangedAt;throw err;}
 },"Redefinir senha");
}
function toggleAccess(id){
 const user=ensureUser(id);actionAllowed(user);
 const blocked=!user.accessDisabled;
 openModal(blocked?"Bloquear acesso local":"Reativar acesso local",
 '<p class="am-confirm">Você está prestes a <strong>'+(blocked?"bloquear":"reativar")+'</strong> a conta <strong>@'+esc(user.username)+'</strong> nesta base.</p>'+
 '<p class="am-inline-warning">Isso não bloqueia sessões em outros navegadores ou computadores. Para revogação remota será necessária uma autenticação central.</p>',
 async()=>{
  actionAllowed(ensureUser(id));
  const prev=!!user.accessDisabled;user.accessDisabled=blocked;user.status=blocked?"OFFLINE":user.status;
  try{await commitUser(blocked?"Bloqueou acesso local":"Reativou acesso local",user.username);}catch(err){user.accessDisabled=prev;throw err;}
 },blocked?"Bloquear aqui":"Reativar aqui");
}
function removeUser(id){
 const user=ensureUser(id);actionAllowed(user);
 openModal("Excluir conta local",
 '<p class="am-confirm">Esta operação remove definitivamente o perfil <strong>@'+esc(user.username)+'</strong> desta base local. Dossiês, missões e cadastros RP serão mantidos.</p>'+
 '<p class="am-inline-warning">Isso não afeta cópias da conta em outros dispositivos. Faça um backup antes, se necessário.</p>'+
 '<label>Para confirmar, digite exatamente <strong>'+esc(user.username)+'</strong><input name="confirmation" required autocomplete="off"></label>',
 async f=>{
  actionAllowed(ensureUser(id));
  if(String(f.get("confirmation")||"")!==user.username)throw Error("Digite o login exatamente como solicitado.");
  const index=ctx.db.users.indexOf(user);
  ctx.db.users.splice(index,1);
  try{await commitUser("Excluiu conta local",user.username);}catch(err){ctx.db.users.splice(index,0,user);throw err;}
 },"Excluir conta");
}
function execute(action,id){
 if(!available()){ctx.toast("Área restrita à administração local.",true);return;}
 try{
  if(action==="create")createUser();
  else if(action==="profile")profile(id);
  else if(action==="password")passwordReset(id);
  else if(action==="toggle")toggleAccess(id);
  else if(action==="delete")removeUser(id);
 }catch(err){ctx.toast(err.message||"Falha ao abrir ação.",true);}
}
function wire(){
 const q=document.getElementById("am-query"),status=document.getElementById("am-filter-status");
 if(q)q.addEventListener("input",()=>{filter=q.value;const target=document.getElementById("am-table-wrap");if(target)target.innerHTML=buildTable();wireButtons(target);});
 if(status)status.addEventListener("change",()=>{statusFilter=status.value;const target=document.getElementById("am-table-wrap");if(target)target.innerHTML=buildTable();wireButtons(target);});
 wireButtons(document);
}
function buildTable(){
 const users=rows().filter(u=>{
  if(statusFilter==="active"&&u.accessDisabled)return false;
  if(statusFilter==="blocked"&&!u.accessDisabled)return false;
  const q=filter.toLocaleLowerCase("pt-BR").trim();
  return !q||[u.username,u.name,u.codename,u.contact,u.specialty].some(t=>String(t||"").toLocaleLowerCase("pt-BR").includes(q));
 });
 return '<div class="am-table-overflow"><table class="am-table"><thead><tr><th>PERFIL</th><th>FUNÇÃO</th><th>ACESSO LOCAL</th><th>ÚLTIMO LOGIN</th><th>AÇÕES</th></tr></thead><tbody>'+
 (users.length?users.map(u=>{
  const self=u.id===ctx.currentUser.id,allowed=eligible(u);
  return '<tr><td><div class="am-profile"><div class="am-avatar">'+esc((u.codename||u.username||"?").slice(0,2).toUpperCase())+'</div><div><strong>'+esc(label(u))+'</strong><small>@'+esc(u.username||"—")+(self?" · VOCÊ":"")+'</small><small>'+esc(u.codename||"")+'</small></div></div></td>'+
 '<td><span class="am-role">'+esc(roles[u.role]||u.role||"—")+'</span><small>'+esc(u.specialty||"")+'</small></td>'+
 '<td><span class="am-status '+(u.accessDisabled?"is-blocked":"is-active")+'">'+(u.accessDisabled?"ACESSO BLOQUEADO":"HABILITADO")+'</span></td>'+
 '<td class="am-muted">'+esc(fmtDate(u.lastAccess))+'</td>'+
 '<td><div class="am-actions">'+eBtn("profile",u.id,"Ficha")+eBtn("password",u.id,"Redefinir senha","",!allowed)+eBtn("toggle",u.id,u.accessDisabled?"Reativar":"Bloquear",u.accessDisabled?"":"am-warning-btn",!allowed)+eBtn("delete",u.id,"Excluir","am-danger",!allowed)+'</div></td></tr>';
 }).join(""):'<tr><td colspan="5" class="am-empty">Nenhum perfil encontrado.</td></tr>')+"</tbody></table></div>";
}
function wireButtons(root){
 root.querySelectorAll("[data-am-action]").forEach(b=>b.addEventListener("click",()=>execute(b.dataset.amAction,b.dataset.amId)));
}
function render(context){
 ctx=context;
 if(!available())return '<section class="am-shell"><h1>Acesso restrito</h1><p>Somente a administração pode visualizar os perfis locais.</p></section>';
 return view();
}
window.MafiaAdmin={render,wire};
})();