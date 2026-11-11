/* MafiaCorp • performance RP por integrante, somente leitura e com autorização no servidor. */
import {database,configured,respond,userFromRequest,serverError} from '../server/auth-core.js';
import {permissionsFor,businessDate} from '../server/org-roles.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIRST='2026-11-01';
const LAST='2030-12-31';
function bad(status,code){throw Object.assign(new Error(code),{status});}
export default async function handler(req,res){
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(req.method!=='GET')return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
 try{
  const actor=await userFromRequest(req);
  if(!actor)return respond(res,401,{error:'UNAUTHENTICATED'});
  const permissions=permissionsFor(actor);
  const id=String(req.query?.accountId||actor.id);
  if(!UUID.test(id))return respond(res,400,{error:'INVALID_ACCOUNT_ID'});
  if(id!==actor.id&&!permissions.canViewAll&&!permissions.canReview)return respond(res,403,{error:'FORBIDDEN'});
  const year=Number(req.query?.year||businessDate().slice(0,4));
  if(!Number.isInteger(year)||year<2026||year>2030)return respond(res,400,{error:'INVALID_YEAR'});
  const start=year===2026?FIRST:year+'-01-01';
  const end=year+'-12-31';
  const db=database(),client=await db.connect();
  let user,daily;
  try{
   user=await client.query(`SELECT a.id,a.codename,a.name,a.org_role,a.avatar_data,a.is_active,
      r.label AS role_label FROM public.mc_accounts a
      LEFT JOIN public.mc_org_roles r ON r.code=a.org_role WHERE a.id=$1 LIMIT 1`,[id]);
   if(!user.rows.length)bad(404,'ACCOUNT_NOT_FOUND');
   daily=await client.query(`SELECT to_char(COALESCE(c.activity_date,a.activity_date),'YYYY-MM-DD') AS day,
     COALESCE(c.approved,0)::int AS approved,COALESCE(c.pending,0)::int AS pending,
     COALESCE(c.rejected,0)::int AS rejected,COALESCE(c.missions,0)::int AS missions,
     (a.activity_date IS NOT NULL) AS active
     FROM (
       SELECT activity_date,
       SUM(points) FILTER(WHERE status='aprovado') AS approved,
       SUM(points) FILTER(WHERE status='pendente') AS pending,
       SUM(points) FILTER(WHERE status='rejeitado') AS rejected,
       COUNT(*) AS missions FROM public.mc_contributions
       WHERE account_id=$1 AND activity_date BETWEEN $2::date AND $3::date
       GROUP BY activity_date
     ) c FULL JOIN (
       SELECT activity_date FROM public.mc_daily_activity
       WHERE account_id=$1 AND activity_date BETWEEN $2::date AND $3::date
     ) a ON a.activity_date=c.activity_date
     ORDER BY COALESCE(c.activity_date,a.activity_date)`,[id,start,end]);
  }finally{await client.release();}
  const rows=daily.rows.map(r=>({day:r.day,approved:Number(r.approved)||0,pending:Number(r.pending)||0,
    rejected:Number(r.rejected)||0,missions:Number(r.missions)||0,active:r.active===true}));
  const approved=rows.reduce((n,d)=>n+d.approved,0),activeDays=rows.filter(d=>d.active).length;
  const goalDays=rows.filter(d=>d.active&&d.approved>=20).length;
  const pending=rows.reduce((n,d)=>n+d.pending,0);
  const person=user.rows[0];
  return respond(res,200,{year,from:FIRST,to:LAST,today:businessDate(),
    target:20,person:{id:person.id,name:person.name,codename:person.codename,
      orgRole:person.org_role,roleLabel:person.role_label,avatarData:person.avatar_data||null,
      isActive:person.is_active},
    summary:{approved,pending,activeDays,goalDays,completionRate:activeDays?Math.round(100*goalDays/activeDays):null,
      meanApproved:activeDays?Math.round(10*approved/activeDays)/10:null},
    days:rows});
 }catch(err){serverError(res,err);}
}
