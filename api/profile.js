/* Perfil próprio autenticado, incluindo avatar JPEG reduzido. */
import {database,configured,respond,verifyOrigin,userFromRequest,profile,rateLimit,serverError,audit} from '../server/auth-core.js';
const CODENAME=/^[\p{L}\p{N}._ -]{3,48}$/u;
export default async function handler(req,res){
 if(!configured())return respond(res,503,{error:'AUTH_NOT_CONFIGURED'});
 if(!['GET','PATCH'].includes(req.method))return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
 if(!verifyOrigin(req))return respond(res,403,{error:'INVALID_ORIGIN'});
 try{
  const actor=await userFromRequest(req);
  if(!actor)return respond(res,401,{error:'UNAUTHENTICATED'});
  if(req.method==='GET')return respond(res,200,{user:profile(actor)});
  await rateLimit(req,'profile_update',40);
  const size=Number(req.headers['content-length']||0);
  if(size>92000)return respond(res,413,{error:'PHOTO_TOO_LARGE'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||Array.isArray(body))return respond(res,400,{error:'INVALID_BODY'});
  const name=String(body.name||'').trim(),codename=String(body.codename||'').trim();
  if(name.length<2||name.length>120||!CODENAME.test(codename))return respond(res,400,{error:'INVALID_PROFILE'});
  let photo=actor.avatar_data||null;
  if(Object.prototype.hasOwnProperty.call(body,'avatarData')){
   if(body.avatarData===null)photo=null;
   else{
    photo=String(body.avatarData||'');
    if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo)||photo.length>85000)return respond(res,400,{error:'INVALID_PHOTO'});
    const binary=Buffer.from(photo.slice('data:image/jpeg;base64,'.length),'base64');
    if(binary.length>64000||binary.length<4||binary[0]!==255||binary[1]!==216||binary[2]!==255)return respond(res,400,{error:'INVALID_PHOTO'});
   }
  }
  await database().query('UPDATE public.mc_accounts SET name=$2,codename=$3,avatar_data=$4,updated_at=now() WHERE id=$1',[actor.id,name,codename,photo]);
  await audit(actor,{id:actor.id,codename},'PROFILE_UPDATED');
  const updated=await userFromRequest(req);
  return respond(res,200,{user:profile(updated)});
 }catch(err){serverError(res,err);}
}