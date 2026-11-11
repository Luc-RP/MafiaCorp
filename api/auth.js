/* Authentication and registration API for MafiaCorp (Vercel Node runtime). */
import {database,configured,dbHealth,respond,verifyOrigin,jsonBody,passwordPolicy,
  hashPassword,checkPassword,profile,createSession,userFromRequest,revokeSession,rateLimit,audit,serverError} from '../server/auth-core.js';

const CODENAME=/^[\p{L}\p{N}._ -]{3,48}$/u;
function methodNotAllowed(res,allow){res.setHeader('Allow',allow);respond(res,405,{error:'METHOD_NOT_ALLOWED'});}

export default async function handler(req,res){
 const action=String(req.query?.action||'').trim();
 if(action==='status'&&req.method==='GET'){
   if(!configured())return respond(res,200,{mode:'local',configured:false,online:false});
   const online=await dbHealth();
   return respond(res,online?200:503,{mode:'remote',configured:true,online,registrationOpen:process.env.AUTH_SIGNUP_ENABLED!=='false'});
 }
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(!verifyOrigin(req))return respond(res,403,{error:'INVALID_ORIGIN'});
 try{
   if(action==='me'){
     if(req.method!=='GET')return methodNotAllowed(res,'GET');
     const u=await userFromRequest(req);
     if(!u)return respond(res,401,{error:'UNAUTHENTICATED'});
     return respond(res,200,{user:profile(u)});
   }
   if(action==='register'){
     if(req.method!=='POST')return methodNotAllowed(res,'POST');
     if(process.env.AUTH_SIGNUP_ENABLED==='false')return respond(res,403,{error:'REGISTRATION_CLOSED'});
     await rateLimit(req,'registration',6);
     const body=jsonBody(req),name=String(body.name||'').trim(),codename=String(body.codename||'').trim(),password=body.password;
     if(name.length<2||name.length>120||!CODENAME.test(codename))return respond(res,400,{error:'INVALID_PROFILE'});
     if(!passwordPolicy(password,codename))return respond(res,400,{error:'WEAK_PASSWORD'});
     const passwordHash=await hashPassword(password),db=database();
     const created=await db.query(`INSERT INTO public.mc_accounts(name,codename,password_hash,role,is_active)
       VALUES($1,$2,$3,'observador',true)
       RETURNING id,name,codename,role,org_role,is_active,created_at,last_login_at,password_revision`,
       [name,codename,passwordHash]);
     const account=created.rows[0];
     await createSession(account,res);
     await audit(account,account,'REGISTER');
     return respond(res,201,{user:profile(account)});
   }
   if(action==='login'){
     if(req.method!=='POST')return methodNotAllowed(res,'POST');
     await rateLimit(req,'login',18);
     const body=jsonBody(req),codename=String(body.codename||'').trim(),password=String(body.password||'');
     if(!CODENAME.test(codename)||password.length>128||!password)return respond(res,401,{error:'INVALID_CREDENTIALS'});
     const db=database(),result=await db.query(`SELECT a.id,a.name,a.codename,a.role,a.org_role,a.is_system_admin,a.avatar_data,
       a.is_active,a.password_hash,a.password_revision,a.failed_signins,a.locked_until,
       a.created_at,a.last_login_at,r.code AS role_code,r.label AS role_label,
       r.section AS role_section,r.summary AS role_summary,r.access_percent AS role_access,
       r.allowed_views AS role_views,r.can_view_all AS role_can_view_all,
       r.can_review AS role_can_review,r.can_manage_panel AS role_can_manage_panel
       FROM public.mc_accounts a LEFT JOIN public.mc_org_roles r ON r.code=a.org_role
       WHERE a.codename_normalized=lower(btrim($1)) LIMIT 1`,[codename]);
     const account=result.rows[0];
     if(account?.locked_until && new Date(account.locked_until)>new Date())return respond(res,429,{error:'TRY_LATER'});
     if(!account||!await checkPassword(password,account.password_hash)){
       if(account)await db.query(`UPDATE public.mc_accounts SET failed_signins=failed_signins+1,
         locked_until=CASE WHEN failed_signins>=4 THEN now()+interval '15 minutes' ELSE locked_until END
         WHERE id=$1`,[account.id]);
       return respond(res,401,{error:'INVALID_CREDENTIALS'});
     }
     if(!account.is_active)return respond(res,403,{error:'ACCOUNT_DISABLED'});
     await db.query('UPDATE public.mc_accounts SET failed_signins=0,locked_until=NULL,last_login_at=now() WHERE id=$1',[account.id]);
     account.last_login_at=new Date().toISOString();
     await createSession(account,res);
     await audit(account,account,'LOGIN');
     return respond(res,200,{user:profile(account)});
   }
   if(action==='logout'){
     if(req.method!=='POST')return methodNotAllowed(res,'POST');
     await revokeSession(req,res);return respond(res,200,{ok:true});
   }
   return respond(res,404,{error:'ACTION_NOT_FOUND'});
 }catch(err){serverError(res,err);}
}
