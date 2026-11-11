/* MafiaCorp QG metas e contribuições: validação e autorização no PostgreSQL. */
import {database,configured,respond,verifyOrigin,userFromRequest,rateLimit,serverError} from '../server/auth-core.js';
import {ROLE_DEFS,MISSION_POINTS,MISSION_LABELS,permissionsFor,businessDate} from '../server/org-roles.js';
import {inTransaction,recordEvent} from '../server/event-outbox.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
function error(status,code){return Object.assign(new Error(code),{status});}
function parse(req){
 const sz=Number(req.headers['content-length']||0);
 if(sz>180000)throw error(413,'UPLOAD_TOO_LARGE');
 const obj=typeof req.body==='string'?JSON.parse(req.body):req.body;
 if(!obj||typeof obj!=='object'||Array.isArray(obj))throw error(400,'INVALID_BODY');
 return obj;
}
function dateArg(raw){
 if(!raw)return businessDate();
 const d=String(raw);
 if(!DATE.test(d)||!Number.isFinite(new Date(d+'T12:00:00Z').getTime())||d>businessDate())throw error(400,'INVALID_DATE');
 return d;
}
async function overview(actor,date){
 const db=database(),access=permissionsFor(actor);
 const client=await db.connect();
 let members,progress,entries,panel,activity,roles;
 try{
 [members,progress,entries,panel,activity,roles]=[
  await client.query("SELECT a.id,a.name,a.codename,a.org_role,a.is_active,a.avatar_data,r.label AS role_label FROM public.mc_accounts a LEFT JOIN public.mc_org_roles r ON r.code=a.org_role WHERE a.org_role<>'admin_sistema' ORDER BY CASE WHEN a.org_role LIKE 'lider_%' THEN 1 WHEN a.org_role='gerente_geral' THEN 2 ELSE 3 END,a.codename LIMIT 500"),
  await client.query("SELECT account_id,coalesce(sum(points) FILTER (WHERE status='aprovado'),0)::int AS approved,coalesce(sum(points) FILTER (WHERE status='pendente'),0)::int AS pending FROM public.mc_contributions WHERE activity_date=$1 GROUP BY account_id",[date]),
  await client.query("SELECT c.id,c.account_id,a.codename,c.mission_type,c.points,c.note,c.status,c.created_at,c.reviewed_at,(c.evidence_data IS NOT NULL) AS has_evidence FROM public.mc_contributions c JOIN public.mc_accounts a ON a.id=c.account_id WHERE c.activity_date=$1 AND ($2::boolean OR c.account_id=$3) ORDER BY c.created_at DESC LIMIT 300",[date,access.canViewAll,actor.id]),
  await client.query("SELECT production_choice,closed_at FROM public.mc_qg_panels WHERE activity_date=$1",[date]),
  await client.query("SELECT account_id FROM public.mc_daily_activity WHERE activity_date=$1",[date]),
  await client.query("SELECT code,label,section,summary,access_percent,is_builtin FROM public.mc_org_roles ORDER BY access_percent DESC,label")
 ];
 }finally{await client.release();}
 const approved=progress.rows.reduce((sum,row)=>sum+Number(row.approved||0),0);
 const own=progress.rows.find(x=>x.account_id===actor.id);
 const activityIds=new Set(activity.rows.map(x=>x.account_id));
 const membersOut=members.rows.map(x=>{
  const p=progress.rows.find(r=>r.account_id===x.id);
  return {id:x.id,name:x.name,codename:x.codename,orgRole:x.org_role,roleLabel:x.role_label,avatarData:x.avatar_data||null,active:x.is_active,
    activeToday:activityIds.has(x.id),
    approved:access.canViewAll||x.id===actor.id?Number(p?.approved||0):null,
    pending:access.canViewAll||x.id===actor.id?Number(p?.pending||0):null};
 });
 return {date,missionPoints:MISSION_POINTS,missionLabels:MISSION_LABELS,dayGoal:20,collectiveGoal:100,
   collectiveApproved:approved,collectivePercent:Math.min(100,approved),
   ownApproved:Number(own?.approved||0),ownPending:Number(own?.pending||0),ownActive:activityIds.has(actor.id),
   members:membersOut,contributions:entries.rows.map(x=>({
    id:x.id,accountId:x.account_id,codename:x.codename,missionType:x.mission_type,
    points:x.points,note:x.note,status:x.status,createdAt:x.created_at,reviewedAt:x.reviewed_at,hasEvidence:x.has_evidence
   })),panel:panel.rows[0]||null,permissions:access,
   roles:Object.fromEntries(roles.rows.map(r=>[r.code,{label:r.label,section:r.section,summary:r.summary,access:r.access_percent,builtin:r.is_builtin}]))};
}
export default async function handler(req,res){
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!verifyOrigin(req))return respond(res,403,{error:'INVALID_ORIGIN'});
 try{
  const actor=await userFromRequest(req);
  if(!actor)return respond(res,401,{error:'UNAUTHENTICATED'});
  const db=database(),access=permissionsFor(actor);
  if(req.method==='GET'){
    const action=String(req.query?.action||'overview');
    if(action==='roles')return respond(res,200,{roles:ROLE_DEFS,permissions:access});
    if(action==='evidence'){
      const id=String(req.query?.id||'');
      if(!UUID.test(id))return respond(res,400,{error:'INVALID_ID'});
      const r=await db.query("SELECT account_id,evidence_data FROM public.mc_contributions WHERE id=$1",[id]);
      if(!r.rows.length)return respond(res,404,{error:'NOT_FOUND'});
      if(!access.canReview&&r.rows[0].account_id!==actor.id)return respond(res,403,{error:'FORBIDDEN'});
      return respond(res,200,{image:r.rows[0].evidence_data||null});
    }
    return respond(res,200,await overview(actor,dateArg(req.query?.date)));
  }
  await rateLimit(req,'contributions',65);
  const body=parse(req);
  const action=String(body.action||'');
  const today=businessDate();
  if(action==='activity'){
    if(!access.canSubmit)return respond(res,403,{error:'ADMIN_EXEMPT'});
    await inTransaction(db,async client=>{
      const activity=await client.query("INSERT INTO public.mc_daily_activity(account_id,activity_date) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING account_id",[actor.id,today]);
      if(activity.rows.length)await recordEvent(client,'activity_marked','activity:'+actor.id+':'+today,actor.id,actor.id,{day:today});
    });
    return respond(res,200,{ok:true,activeDate:today});
  }
  if(action==='submit'){
    if(!access.canSubmit)return respond(res,403,{error:'ADMIN_EXEMPT'});
    const kind=String(body.missionType||'');
    if(!Object.prototype.hasOwnProperty.call(MISSION_POINTS,kind))return respond(res,400,{error:'INVALID_MISSION'});
    const note=String(body.note||'').trim();
    const image=body.evidenceData==null?null:String(body.evidenceData);
    if(!note&&!image)return respond(res,400,{error:'EVIDENCE_REQUIRED'});
    if(note.length>400)return respond(res,400,{error:'NOTE_TOO_LONG'});
    if(image){
      if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)||image.length>145000)return respond(res,400,{error:'INVALID_EVIDENCE'});
      const data=Buffer.from(image.slice('data:image/jpeg;base64,'.length),'base64');
      if(data.length>110000||data.length<4||data[0]!==255||data[1]!==216||data[2]!==255)return respond(res,400,{error:'INVALID_EVIDENCE'});
    }
    const result=await inTransaction(db,async client=>{
      const activity=await client.query("INSERT INTO public.mc_daily_activity(account_id,activity_date) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING account_id",[actor.id,today]);
      if(activity.rows.length)await recordEvent(client,'activity_marked','activity:'+actor.id+':'+today,actor.id,actor.id,{day:today});
      const saved=await client.query("INSERT INTO public.mc_contributions(account_id,activity_date,mission_type,points,note,evidence_data) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,points",[actor.id,today,kind,MISSION_POINTS[kind],note||null,image]);
      const mission=saved.rows[0];
      await recordEvent(client,'mission_submitted','mission:submitted:'+mission.id,actor.id,actor.id,{day:today,missionType:kind,points:mission.points,status:'pendente'});
      return mission;
    });
    return respond(res,201,{ok:true,contribution:result});
  }
  if(action==='review'){
    if(!access.canReview)return respond(res,403,{error:'FORBIDDEN'});
    const id=String(body.id||'');
    if(!UUID.test(id)||!['aprovado','rejeitado'].includes(body.status))return respond(res,400,{error:'INVALID_REVIEW'});
    const reviewed=await inTransaction(db,async client=>{
      const result=await client.query("UPDATE public.mc_contributions SET status=$2,reviewed_by=$3,reviewed_at=now() WHERE id=$1 AND status='pendente' AND account_id<>$3 RETURNING id,account_id,activity_date,points,mission_type",[id,body.status,actor.id]);
      if(!result.rows.length)return null;
      const row=result.rows[0],action=body.status==='aprovado'?'mission_approved':'mission_rejected';
      const day=typeof row.activity_date==='string'?row.activity_date:row.activity_date.toISOString().slice(0,10);
      await recordEvent(client,action,action+':'+id,actor.id,row.account_id,{day,points:row.points,missionType:row.mission_type,status:body.status});
      return row;
    });
    if(!reviewed)return respond(res,409,{error:'NOT_PENDING_OR_SELF'});
    return respond(res,200,{ok:true});
  }
  if(action==='production'){
    if(!access.canManagePanel)return respond(res,403,{error:'FORBIDDEN'});
    const date=dateArg(body.date),choice=String(body.productionChoice||'').trim();
    if(choice.length<3||choice.length>250)return respond(res,400,{error:'INVALID_PRODUCTION'});
    const completed=await inTransaction(db,async client=>{
      const total=await client.query("SELECT coalesce(sum(points),0)::int AS total FROM public.mc_contributions WHERE activity_date=$1 AND status='aprovado'",[date]);
      if(total.rows[0].total<100)return false;
      await client.query("INSERT INTO public.mc_qg_panels(activity_date,production_choice,closed_by,closed_at) VALUES($1,$2,$3,now()) ON CONFLICT(activity_date) DO UPDATE SET production_choice=excluded.production_choice,closed_by=excluded.closed_by,closed_at=now()",[date,choice,actor.id]);
      await recordEvent(client,'qg_panel_closed','qg:closed:'+date,actor.id,null,{day:date,approved:total.rows[0].total});
      return true;
    });
    if(!completed)return respond(res,409,{error:'PANEL_BELOW_100'});
    return respond(res,200,{ok:true});
  }
  return respond(res,400,{error:'UNKNOWN_ACTION'});
 }catch(err){serverError(res,err);}
}
