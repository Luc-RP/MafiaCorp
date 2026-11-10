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
   const result=await db.query(`SELECT id,name,codename,role,org_role,is_active,created_at,last_login_at,
     password_revision FROM public.mc_accounts ORDER BY created_at ASC LIMIT 1000`);
   return respond(res,200,{users:result.rows.map(profile)});
  }
  await rateLimit(req,'admin_mutation',120);
  const body=req.method==='DELETE'?Object.assign({},req.query||{},req.body||{}):jsonBody(req);
  if(req.method==='POST'){
   const name=String(body.name||'').trim(),codename=String(body.codename||'').trim();
   if(name.length<2||name.length>120||!CODENAME.test(codename)||!passwordPolicy(body.password,codename))return respond(res,400,{error:'INVALID_PROFILE_OR_PASSWORD'});
   const orgRole=ROLE_DEFS[body.orgRole]?body.orgRole:'membro';
   const role=platformRoleFor(orgRole);
   const hash=await hashPassword(body.password);
   const result=await db.query(`INSERT INTO public.mc_accounts(name,codename,password_hash,role,org_role)
     VALUES($1,$2,$3,$4,$5) RETURNING id,name,codename,role,org_role,is_active,created_at,last_login_at`,[name,codename,hash,role,orgRole]);
   await audit(actor,result.rows[0],'ADMIN_CREATED_ACCOUNT');
   return respond(res,201,{user:profile(result.rows[0])});
  }
  const id=String(body.id||body.accountId||'');
  if(!UUID.test(id))return respond(res,400,{error:'INVALID_ACCOUNT_ID'});
  if(id===actor.id)return respond(res,403,{error:'CANNOT_MODIFY_OWN_ACCOUNT'});
  const client=await db.connect();
  try{
   await client.query('BEGIN');
   const found=await client.query('SELECT id,codename,role,org_role,is_active FROM public.mc_accounts WHERE id=$1 FOR UPDATE',[id]);
   if(!found.rows.length){await client.query('ROLLBACK');return respond(res,404,{error:'ACCOUNT_NOT_FOUND'});}
   const target=found.rows[0];
   if(target.role==='admin'){
    const count=await client.query("SELECT count(*)::int AS n FROM public.mc_accounts WHERE role='admin' AND is_active=true");
    if(count.rows[0].n<=1){await client.query('ROLLBACK');return respond(res,409,{error:'LAST_ADMIN_PROTECTED'});}
   }
   let event=''; 
   if(req.method==='DELETE'){
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
     }else if(op==='orgRole'&&ROLE_DEFS[body.orgRole]){
       const newRole=String(body.orgRole);
       await client.query('UPDATE public.mc_accounts SET role=$2,org_role=$3,updated_at=now() WHERE id=$1',[id,platformRoleFor(newRole),newRole]);
       await client.query('UPDATE public.mc_sessions SET revoked_at=now() WHERE account_id=$1 AND revoked_at IS NULL',[id]);
       event='ADMIN_CHANGED_ORG_ROLE';
     }else{
       await client.query('ROLLBACK');return respond(res,400,{error:'INVALID_ACTION'});
     }
     await audit(actor,target,event,client);
   }
   await client.query('COMMIT');
   return respond(res,200,{ok:true,action:event});
  }catch(err){try{await client.query('ROLLBACK')}catch{};throw err}
  finally{client.release();}
 }catch(err){serverError(res,err);}
}
