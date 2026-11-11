/* MafiaCorp central admin API • all authorization validated server-side. */
import {database,configured,respond,verifyOrigin,jsonBody,passwordPolicy,
 hashPassword,profile,userFromRequest,rateLimit,audit,serverError} from '../server/auth-core.js';
import {ROLE_DEFS,LEADERS,platformRoleFor,permission} from '../server/org-roles.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_ROLES=new Set(['admin','chefe','investigador','observador']);
const CODENAME=/^[\p{L}\p{N}._ -]{3,48}$/u;

export default async function handler(req,res){
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!verifyOrigin(req))return respond(res,403,{error:'INVALID_ORIGIN'});
 try{
  const db=database(),actor=await userFromRequest(req);
  if(!actor)return respond(res,401,{error:'UNAUTHENTICATED'});
  if(actor.role!=='admin'||!permission(actor,'canManageAccounts'))return respond(res,403,{error:'FORBIDDEN'});
  if(req.method==='GET'){
   const result=await db.query(`SELECT a.id,a.name,a.codename,a.role,a.org_role,a.is_active,a.is_system_admin,
     a.avatar_data,a.created_at,a.last_login_at,a.password_revision,
     r.code AS role_code,r.label AS role_label,r.section AS role_section,
     r.summary AS role_summary,r.access_percent AS role_access,r.allowed_views AS role_views,
     r.can_view_all AS role_can_view_all,r.can_review AS role_can_review,
     r.can_manage_panel AS role_can_manage_panel,r.can_submit AS role_can_submit
     FROM public.mc_accounts a LEFT JOIN public.mc_org_roles r ON r.code=a.org_role
     ORDER BY a.created_at ASC LIMIT 1000`);
   return respond(res,200,{users:result.rows.map(profile)});
  }
  await rateLimit(req,'admin_mutation',120);
  const body=req.method==='DELETE'?Object.assign({},req.query||{},req.body||{}):jsonBody(req);
  if(req.method==='POST'){
   const name=String(body.name||'').trim(),codename=String(body.codename||'').trim();
   if(name.length<2||name.length>120||!CODENAME.test(codename)||!passwordPolicy(body.password,codename))return respond(res,400,{error:'INVALID_PROFILE_OR_PASSWORD'});
   const orgRole=String(body.orgRole||'membro');
   if(orgRole==='admin_sistema')return respond(res,403,{error:'FORBIDDEN'});
   const roleFound=await db.query('SELECT code FROM public.mc_org_roles WHERE code=$1',[orgRole]);
   if(!roleFound.rows.length)return respond(res,400,{error:'ROLE_NOT_FOUND'});
   const role=platformRoleFor(orgRole);
   const hash=await hashPassword(body.password);
   const result=await db.query(`INSERT INTO public.mc_accounts(name,codename,password_hash,role,org_role)
     VALUES($1,$2,$3,$4,$5) RETURNING id,name,codename,role,org_role,is_active,created_at,last_login_at`,[name,codename,hash,role,orgRole]);
   await audit(actor,result.rows[0],'ADMIN_CREATED_ACCOUNT');
   return respond(res,201,{user:profile(result.rows[0])});
  }
  const id=String(body.id||body.accountId||'');
  if(!UUID.test(id))return respond(res,400,{error:'INVALID_ACCOUNT_ID'});
  const isSelf=id===actor.id;
  if(isSelf && !(req.method==='PATCH'&&body.action==='orgRole'&&actor.is_system_admin))return respond(res,403,{error:'CANNOT_MODIFY_OWN_ACCOUNT'});
  const client=await db.connect();
  try{
   await client.query('BEGIN');
   const found=await client.query('SELECT id,codename,role,org_role,is_active,is_system_admin FROM public.mc_accounts WHERE id=$1 FOR UPDATE',[id]);
   if(!found.rows.length){await client.query('ROLLBACK');return respond(res,404,{error:'ACCOUNT_NOT_FOUND'});}
   const target=found.rows[0];
   if(target.is_system_admin && !isSelf){await client.query('ROLLBACK');return respond(res,403,{error:'SYSTEM_ADMIN_PROTECTED'});}
   if(target.role==='admin'&&!(isSelf&&target.is_system_admin&&body.action==='orgRole')){
    const count=await client.query("SELECT count(*)::int AS n FROM public.mc_accounts WHERE role='admin' AND is_active=true");
    if(count.rows[0].n<=1){await client.query('ROLLBACK');return respond(res,409,{error:'LAST_ADMIN_PROTECTED'});}
   }
   let event=''; 
   if(req.method==='DELETE'){
     const linked=await client.query('SELECT count(*)::int AS n FROM public.mc_contributions WHERE account_id=$1',[id]);
     if(linked.rows[0].n>0){await client.query('ROLLBACK');return respond(res,409,{error:'ACCOUNT_HAS_HISTORY'});}
     await audit(actor,target,'ADMIN_DELETED_ACCOUNT',client);
     await client.query('DELETE FROM public.mc_accounts WHERE id=$1',[id]);
     event='DELETED';
   }else{
     const op=String(body.action||'');
     if(op==='block'||op==='unblock'){
       const active=op==='unblock';
       await client.query('UPDATE public.mc_accounts SET is_active=$2,updated_at=now() WHERE id=$1',[id,active]);
       if(!active)await client.query('UPDATE public.mc_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[id]);
       event=active?'ADMIN_UNBLOCKED_ACCOUNT':'ADMIN_BLOCKED_ACCOUNT';
     }else if(op==='resetPassword'){
       if(!passwordPolicy(body.password,target.codename)){await client.query('ROLLBACK');return respond(res,400,{error:'WEAK_PASSWORD'});}
       const hash=await hashPassword(body.password);
       await client.query('UPDATE public.mc_accounts SET password_hash=$2,password_revision=password_revision+1,updated_at=now(),failed_signins=0,locked_until=NULL WHERE id=$1',[id,hash]);
       await client.query('UPDATE public.mc_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[id]);
       event='ADMIN_RESET_PASSWORD';
     }else if(op==='orgRole'&&typeof body.orgRole==='string'&&(body.orgRole!=='admin_sistema'||(isSelf&&target.is_system_admin))){
       const newRole=body.orgRole.trim();
       const roleExists=await client.query('SELECT code FROM public.mc_org_roles WHERE code=$1',[newRole]);
       if(!roleExists.rows.length){await client.query('ROLLBACK');return respond(res,400,{error:'ROLE_NOT_FOUND'});}
       await client.query('UPDATE public.mc_accounts SET role=$2,org_role=$3,updated_at=now() WHERE id=$1',
          [id,target.is_system_admin?'admin':platformRoleFor(newRole),newRole]);
       await client.query('UPDATE public.mc_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL AND token_hash<>$2',
          [id,isSelf?actor.token_hash:'']);
       event='ADMIN_CHANGED_ORG_ROLE';
     }else{
       await client.query('ROLLBACK');return respond(res,400,{error:'INVALID_ACTION'});
     }
     await audit(actor,target,event,client);
   }
   await client.query('COMMIT');
   return respond(res,200,{ok:true,action:event});
  }catch(err){try{await client.query('ROLLBACK')}catch{};throw err}
  finally{await client.release();}
 }catch(err){serverError(res,err);}
}
