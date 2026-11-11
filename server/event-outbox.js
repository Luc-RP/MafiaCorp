/* Domain event outbox: registros locais, sem integrações externas ou credenciais Discord. */
export async function inTransaction(database,work){
 const client=await database.connect();
 let started=false;
 try{
  await client.query('BEGIN');started=true;
  const value=await work(client);
  await client.query('COMMIT');started=false;
  return value;
 }catch(error){
  if(started)try{await client.query('ROLLBACK');}catch{}
  throw error;
 }finally{await client.release();}
}
export async function recordEvent(client,kind,key,actorId,subjectId,payload){
 await client.query(`INSERT INTO public.mc_event_outbox
 (event_key,event_type,actor_id,subject_account_id,payload)
 VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(event_key) DO NOTHING`,
 [key,kind,actorId||null,subjectId||null,JSON.stringify(payload||{})]);
}
