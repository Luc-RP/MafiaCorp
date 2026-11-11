// MafiaCorp • PostgreSQL authentication core (server only)
import { Pool } from 'pg';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { permissionsFor } from './org-roles.js';

const scrypt=promisify(scryptCallback);
const SESSION_COOKIE='__Host-mc_session';
const TTL=7*24*60*60;
let pool;

export function configured(){return Boolean(process.env.DATABASE_URL && process.env.AIVEN_CA_CERT);}

export function database(){
  if(!configured())throw new Error('DATABASE_NOT_CONFIGURED');
  if(!pool){
    const url=new URL(process.env.DATABASE_URL);
    if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('INVALID_DATABASE_URL');
    ['sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat'].forEach(k=>url.searchParams.delete(k));
    const ca=process.env.AIVEN_CA_CERT.replace(/\\n/g,'\n');
    if(!ca.includes('-----BEGIN CERTIFICATE-----'))throw new Error('INVALID_CA_CERT');
    pool=new Pool({
      connectionString:url.toString(),
      ssl:{ca,rejectUnauthorized:true,servername:url.hostname},
      max:1,
      idleTimeoutMillis:1000,
      maxLifetimeSeconds:15,
      allowExitOnIdle:true,
      connectionTimeoutMillis:4500,
      statement_timeout:10000,
      query_timeout:12000
    });
    pool.on('error',()=>{}); // The next query reports failures without exposing credentials.
  }
  return pool;
}

export function respond(res,status,body){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.status(status).json(body);
}

export function verifyOrigin(req){
  if(!['POST','PATCH','PUT','DELETE'].includes(req.method))return true;
  const origin=req.headers.origin;
  if(!origin)return false;
  try{
    const url=new URL(origin);
    return url.protocol==='https:' && url.host===req.headers.host;
  }catch{return false;}
}

export function jsonBody(req){
  const length=Number(req.headers['content-length']||0);
  if(length>8192)throw Object.assign(new Error('BODY_TOO_LARGE'),{status:413});
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!b||typeof b!=='object'||Array.isArray(b))throw Object.assign(new Error('INVALID_BODY'),{status:400});
  return b;
}

export function passwordPolicy(password,codename=''){
  if(typeof password!=='string'||password.length<8||password.length>128)return false;
  const classes=[/[a-z]/.test(password),/[A-Z]/.test(password),/[0-9]/.test(password),/[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  if(classes<3)return false;
  if(/^(password|senha|123456|qwerty|admin|mafiacorp)/i.test(password.replace(/[^a-z0-9]/gi,'')))return false;
  if(codename.length>=4 && password.toLocaleLowerCase('pt-BR').includes(codename.toLocaleLowerCase('pt-BR')))return false;
  return true;
}

export function profile(row){
  return {id:row.id,name:row.name,codename:row.codename,username:row.codename,
    role:row.role,orgRole:row.org_role||'membro',isSystemAdmin:!!row.is_system_admin,
    avatarData:row.avatar_data||null,permissions:permissionsFor(row),
    isActive:row.is_active,createdAt:row.created_at,lastAccess:row.last_login_at};
}

export async function hashPassword(password){
  const salt=randomBytes(18);
  const derived=await scrypt(password,salt,64,{N:16384,r:8,p:1,maxmem:64*1024*1024});
  return 'scrypt:16384:8:1:'+salt.toString('hex')+':'+derived.toString('hex');
}
export async function checkPassword(password,encoded){
  if(typeof encoded!=='string')return false;
  const parts=encoded.split(':');
  if(parts.length!==6||parts[0]!=='scrypt')return false;
  const [N,r,p]=parts.slice(1,4).map(Number);
  if(N!==16384||r!==8||p!==1)return false;
  const salt=Buffer.from(parts[4],'hex'),correct=Buffer.from(parts[5],'hex');
  if(salt.length!==18||correct.length!==64)return false;
  const computed=await scrypt(password,salt,64,{N,r,p,maxmem:64*1024*1024});
  return timingSafeEqual(correct,computed);
}
export function tokenHash(token){return createHash('sha256').update(token).digest('hex');}
function readCookie(req){
  const raw=String(req.headers.cookie||'').split(';').map(x=>x.trim());
  for(const c of raw){
    if(c.startsWith(SESSION_COOKIE+'=')){
      const token=c.slice(SESSION_COOKIE.length+1);
      if(/^[a-f0-9]{64}$/.test(token))return token;
    }
  }
  return '';
}
export function setCookie(res,token){
  const attrs=['Path=/','HttpOnly','Secure','SameSite=Lax'];
  res.setHeader('Set-Cookie',SESSION_COOKIE+'='+token+'; '+attrs.join('; ')+'; Max-Age='+TTL);
}
export function clearCookie(res){
  res.setHeader('Set-Cookie',SESSION_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

export async function createSession(account,res,client=database()){
  const token=randomBytes(32).toString('hex');
  await client.query('INSERT INTO public.mc_sessions (account_id,token_hash,password_revision,expires_at) VALUES ($1,$2,$3,now()+interval \'7 days\')',
    [account.id,tokenHash(token),account.password_revision]);
  setCookie(res,token);
}
export async function userFromRequest(req,client=database()){
  const token=readCookie(req);if(!token)return null;
  const result=await client.query(`SELECT a.id,a.name,a.codename,a.role,a.org_role,a.is_system_admin,a.avatar_data,
    a.is_active,a.created_at,a.last_login_at,a.password_revision,s.token_hash,
    r.code AS role_code,r.label AS role_label,r.section AS role_section,
    r.summary AS role_summary,r.access_percent AS role_access,r.allowed_views AS role_views,
    r.can_view_all AS role_can_view_all,r.can_review AS role_can_review,
    r.can_manage_panel AS role_can_manage_panel,r.can_submit AS role_can_submit
    FROM public.mc_sessions s JOIN public.mc_accounts a ON a.id=s.account_id
    LEFT JOIN public.mc_org_roles r ON r.code=a.org_role
    WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()
    AND a.is_active=true AND s.password_revision=a.password_revision LIMIT 1`,[tokenHash(token)]);
  return result.rows[0]||null;
}
export async function revokeSession(req,res){
  const token=readCookie(req);
  if(token)await database().query('UPDATE public.mc_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL',[tokenHash(token)]);
  clearCookie(res);
}
export async function audit(actor,target,event,client=database()){
  await client.query('INSERT INTO public.mc_auth_audit(actor_id,target_id,target_codename,event_type) VALUES ($1,$2,$3,$4)',
    [actor?.id||null,target?.id||null,target?.codename||null,event]);
}
export async function rateLimit(req,scope,limit=12){
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,100);
  const slot=Math.floor(Date.now()/(10*60*1000));
  const key=tokenHash(scope+':'+ip+':'+slot);
  const r=await database().query(`INSERT INTO public.mc_request_limits(key_hash,hits) VALUES($1,1)
    ON CONFLICT(key_hash) DO UPDATE SET hits=mc_request_limits.hits+1 RETURNING hits`,[key]);
  if(r.rows[0].hits>limit)throw Object.assign(new Error('RATE_LIMITED'),{status:429});
}
export async function dbHealth(){
  if(!configured())return false;
  try{await database().query('SELECT 1');return true}catch{return false}
}
export function serverError(res,error){
  if(error?.code==='23505')return respond(res,409,{error:error.constraint==='mc_unique_command_posts'?'ROLE_OCCUPIED':'CODENAME_IN_USE'});
  if(error?.status)return respond(res,error.status,{error:error.message});
  // No SQL details, URL or environment variables in the client response.
  console.error('MafiaCorp auth error',error?.code||error?.name||'unknown');
  return respond(res,503,{error:'SERVICE_UNAVAILABLE'});
}
