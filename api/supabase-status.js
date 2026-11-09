// Checagem de conectividade, sem retornar nem alterar registros do banco.
// NÃO constitui autenticação, autorização ou auditoria de políticas RLS.
module.exports = async function supabaseStatus(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=90');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({error:'method_not_allowed'});
  const rawUrl = process.env.BI_SUPABASE_URL;
  const key = process.env.BI_SUPABASE_PUBLISHABLE_KEY;
  if (!rawUrl || !key) return res.status(200).json({configured:false,reachable:false,securityReady:false,mode:'demo_only'});
  let base;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname)) throw new Error('URL inválida');
    base = parsed.origin;
  } catch {
    return res.status(200).json({configured:false,reachable:false,securityReady:false,mode:'invalid_config'});
  }
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 4500);
  try {
    // Consulta somente um ID, sem ler o conteúdo (que pode ser sigiloso).
    const response = await fetch(base + '/rest/v1/bi_state?select=id&limit=1', {
      method: 'GET',
      headers: { apikey:key, accept:'application/json' },
      signal:controller.signal
    });
    return res.status(200).json({
      configured:true,
      reachable:response.status >= 200 && response.status < 500,
      dataApiAccessible:response.ok,
      securityReady:false,
      mode:'health_check_only'
    });
  } catch {
    return res.status(200).json({configured:true,reachable:false,securityReady:false,mode:'health_check_only'});
  } finally { clearTimeout(timer); }
};