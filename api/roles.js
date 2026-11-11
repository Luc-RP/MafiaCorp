/* MafiaCorp • catálogo de cargos centralizados e edição de níveis (somente comando). */
import {database,configured,respond,verifyOrigin,jsonBody,userFromRequest,rateLimit,audit,serverError} from '../server/auth-core.js';
import {ROLE_DEFS,ASSIGNABLE_VIEWS,permission} from '../server/org-roles.js';
const CODE=/^[a-z][a-z0-9_]{2,31}$/;
const RESERVED=new Set(Object.keys(ROLE_DEFS));
function info(row){return {code:row.code,label:row.label,section:row.section,summary:row.summary,
  accessPercent:row.access_percent,views:row.allowed_views,canViewAll:row.can_view_all,
  canReview:row.can_review,canManagePanel:row.can_manage_panel,canSubmit:row.can_submit,
  builtin:row.is_builtin};}
function validate(body,code){
 const label=String(body.label||'').trim(),section=String(body.section||'').trim()||'Setores';
 const summary=String(body.summary||'').trim();
 const access=Number(body.accessPercent);
 if(label.length<3||label.length>80||section.length>60||summary.length>500||!Number.isInteger(access)||access<0||access>95)throw Object.assign(new Error('INVALID_ROLE'),{status:400});
 if(!Array.isArray(body.views)||body.views.length>40)throw Object.assign(new Error('INVALID_VIEWS'),{status:400});
 const views=Array.from(new Set(['perfil','dashboard','hierarquia','roster','contribuicoes',...body.views]));
 if(views.some(x=>typeof x!=='string'||!ASSIGNABLE_VIEWS.includes(x)))throw Object.assign(new Error('INVALID_VIEWS'),{status:400});
 return {code,label,section,summary,access,views,viewAll:body.canViewAll===true,
   review:body.canReview===true,panel:body.canManagePanel===true,submit:body.canSubmit!==false};
}
export default async function handler(req,res){
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!verifyOrigin(req))return respond(res,403,{error:'INVALID_ORIGIN'});
 try{
  const actor=await userFromRequest(req);
  if(!actor)return respond(res,401,{error:'UNAUTHENTICATED'});
  const db=database();
  if(req.method==='GET'){
   const all=await db.query('SELECT code,label,section,summary,access_percent,allowed_views,can_view_all,can_review,can_manage_panel,can_submit,is_builtin FROM public.mc_org_roles ORDER BY is_builtin DESC,access_percent DESC,label ASC');
   return respond(res,200,{roles:all.rows.map(info),catalog:ASSIGNABLE_VIEWS});
  }
  if(!permission(actor,'canAssignRoles'))return respond(res,403,{error:'FORBIDDEN'});
  await rateLimit(req,'roles_mutation',40);
  const body=jsonBody(req);
  if(req.method==='POST'){
   const code=String(body.code||'').trim().toLowerCase();
   if(!CODE.test(code)||RESERVED.has(code))return respond(res,400,{error:'INVALID_ROLE_CODE'});
   const r=validate(body,code);
   await db.query(`INSERT INTO public.mc_org_roles
   (code,label,section,summary,access_percent,allowed_views,can_view_all,can_review,can_manage_panel,can_submit,created_by)
   VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11)`,
   [r.code,r.label,r.section,r.summary,r.access,JSON.stringify(r.views),r.viewAll,r.review,r.panel,r.submit,actor.id]);
   await audit(actor,null,'ROLE_CREATED');
   return respond(res,201,{ok:true,code:r.code});
  }
  const code=String(body.code||'').trim();
  if(!CODE.test(code)||RESERVED.has(code))return respond(res,403,{error:'BUILTIN_ROLE_LOCKED'});
  const row=await db.query('SELECT code,is_builtin FROM public.mc_org_roles WHERE code=$1',[code]);
  if(!row.rows.length)return respond(res,404,{error:'ROLE_NOT_FOUND'});
  if(row.rows[0].is_builtin)return respond(res,403,{error:'BUILTIN_ROLE_LOCKED'});
  if(req.method==='PATCH'){
   const r=validate(body,code);
   await db.query(`UPDATE public.mc_org_roles SET label=$2,section=$3,summary=$4,
   access_percent=$5,allowed_views=$6::jsonb,can_view_all=$7,can_review=$8,
   can_manage_panel=$9,can_submit=$10 WHERE code=$1`,
   [code,r.label,r.section,r.summary,r.access,JSON.stringify(r.views),r.viewAll,r.review,r.panel,r.submit]);
   await audit(actor,null,'ROLE_UPDATED');
   return respond(res,200,{ok:true});
  }
  const count=await db.query('SELECT count(*)::int AS n FROM public.mc_accounts WHERE org_role=$1',[code]);
  if(count.rows[0].n>0)return respond(res,409,{error:'ROLE_IN_USE'});
  await db.query('DELETE FROM public.mc_org_roles WHERE code=$1 AND is_builtin=false',[code]);
  await audit(actor,null,'ROLE_DELETED');
  return respond(res,200,{ok:true});
 }catch(error){serverError(res,error);}
}