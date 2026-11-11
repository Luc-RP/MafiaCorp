/* MafiaCorp: perfil próprio no PostgreSQL (nome, codinome e miniatura). */
(function(){
'use strict';
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
let ctx=null,record=null,photoChanged=false,photoValue=null;
async function api(method='GET',body){
 const opts={method,credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'};
 if(body!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
 const res=await fetch('/api/profile',opts);
 const obj=await res.json().catch(()=>({error:'UNAVAILABLE'}));
 if(!res.ok)throw Error(({INVALID_PROFILE:'Nome ou codinome inválido.',CODENAME_IN_USE:'Codinome já em uso.',INVALID_PHOTO:'Imagem inválida ou muito grande.',PHOTO_TOO_LARGE:'O arquivo compactado excedeu o limite.',FORBIDDEN:'Acesso negado.'})[obj.error]||'Não foi possível atualizar seu perfil.');
 return obj;
}
function imageSource(url){return typeof url==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(url)?url:null;}
function avatarHtml(user,large=false){
 const image=imageSource(user?.avatarData);
 const cls='mf-avatar '+(large?'large':'');
 return image?'<img class="'+cls+'" alt="Foto de perfil" src="'+esc(image)+'">':
 '<div class="'+cls+' fallback">'+esc((user?.codename||user?.name||'?').slice(0,2).toUpperCase())+'</div>';
}
function template(){
 return '<section class="mf-shell"><div class="mf-heading"><span>MAFIACORP / SUA IDENTIDADE</span><h1>Meu Perfil</h1><p>Atualize suas informações pessoais de acesso. A foto aparece no Painel ADM e nos perfis da organização.</p></div>'+
 '<div class="mf-content"><div class="mf-card"><div class="mf-card-heading"><h2>Identificação</h2><span>CONTA CENTRAL</span></div>'+
 '<form id="mf-form"><div class="mf-photo"><div id="mf-preview">'+avatarHtml(record,true)+'</div><div><label class="mf-upload" for="mf-file">Selecionar foto ou logo</label>'+
 '<input type="file" id="mf-file" accept="image/png,image/jpeg,image/webp,image/*" hidden><button type="button" id="mf-remove" class="mf-muted">Remover imagem</button>'+
 '<small>Imagem quadrada, compactada em JPEG. Máximo de 64 KB armazenados.</small></div></div>'+
 '<label>Nome<input name="name" value="'+esc(record.name)+'" minlength="2" maxlength="120" required></label>'+
 '<label>Codinome / login<input name="codename" value="'+esc(record.codename)+'" minlength="3" maxlength="48" required></label>'+
 '<div class="mf-metadata"><div><small>PERMISSÃO ATUAL</small><b>'+esc(record.permissions?.label||'Integrante')+'</b></div>'+
 '<div><small>ADMINISTRAÇÃO</small><b>'+(record.isSystemAdmin?'Administrador principal':'Por cargo')+'</b></div></div>'+
 '<button class="mf-save" type="submit">Salvar alterações</button></form></div>'+
 '<aside class="mf-hint"><h3>Perfil e permissões</h3><p>Seu codinome é usado para entrar no MafiaCorp. A senha e o cargo não são alterados nesta tela.</p>'+
 '<p>O administrador ou os Líderes 01, 02 e 03 podem atribuir cargos pela seção Painel ADM. A foto é um identificador visual, não um comprovante de missão.</p></aside></div></section>';
}
async function compress(file){
 if(!file||!file.type.startsWith('image/'))throw Error('Escolha uma imagem válida.');
 if(file.size>6*1024*1024)throw Error('Imagem original acima de 6 MB.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();
  await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Não foi possível abrir a imagem.'));image.src=url;});
  if(!image.width||!image.height)throw Error('Imagem sem dimensões válidas.');
  const c=document.createElement('canvas');c.width=180;c.height=180;
  const g=c.getContext('2d');if(!g)throw Error('Compressão indisponível no navegador.');
  g.fillStyle='#15191f';g.fillRect(0,0,180,180);
  const scale=Math.max(180/image.width,180/image.height),w=image.width*scale,h=image.height*scale;
  g.drawImage(image,(180-w)/2,(180-h)/2,w,h);
  for(const quality of [.72,.59,.45,.32]){
   const result=c.toDataURL('image/jpeg',quality);
   if(result.length<=80000)return result;
  }
  throw Error('Foto muito grande, escolha outra imagem.');
 }finally{URL.revokeObjectURL(url);}
}
function wire(){
 const form=document.getElementById('mf-form'),file=document.getElementById('mf-file'),remove=document.getElementById('mf-remove');
 if(file)file.addEventListener('change',async()=>{
  if(!file.files?.length)return;
  try{
   const src=await compress(file.files[0]);
   photoChanged=true;photoValue=src;
   document.getElementById('mf-preview').innerHTML=avatarHtml({avatarData:src},true);
  }catch(err){ctx.toast(err.message,true);}
 });
 if(remove)remove.addEventListener('click',()=>{
  photoChanged=true;photoValue=null;
  document.getElementById('mf-preview').innerHTML=avatarHtml({codename:record.codename},true);
  if(file)file.value='';
 });
 if(form)form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const values=new FormData(form),button=form.querySelector('[type=submit]');
  const body={name:String(values.get('name')||'').trim(),codename:String(values.get('codename')||'').trim()};
  if(photoChanged)body.avatarData=photoValue;
  button.disabled=true;
  try{
   const saved=await api('PATCH',body);
   record=saved.user;photoChanged=false;photoValue=null;
   ctx.onUpdated(saved.user);
   ctx.toast('Perfil atualizado no PostgreSQL.');
   document.getElementById('view').innerHTML=template();wire();
  }catch(err){ctx.toast(err.message,true);}
  finally{button.disabled=false;}
 });
}
async function render(context){
 ctx=context;const root=document.getElementById('view');
 root.innerHTML='<div class="mf-shell">Carregando perfil...</div>';
 try{
  const result=await api();
  if(context.isActive&&!context.isActive())return;
  record=result.user;photoChanged=false;photoValue=null;
  root.innerHTML=template();wire();
 }catch(err){root.innerHTML='<div class="mf-shell">'+esc(err.message)+'</div>';}
}
window.MafiaProfile={render};
})();