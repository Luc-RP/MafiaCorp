-- BLACK INVESTIGATION / LOCKDOWN DE POLÍTICAS INSEGURAS
-- NÃO EXECUTADO. REVISAR E PLANEJAR MIGRAÇÃO DO LOGIN ANTES DE APLICAR.
-- O HTML original usa login local (não Supabase Auth); esta ação interromperá
-- a leitura/gravação do aplicativo antigo até a instalação de políticas novas.
-- NÃO APAGA DADOS OU ARQUIVOS. Execute apenas no projeto Supabase correto.
BEGIN;
-- Tabela do estado único herdada do script fornecido:
ALTER TABLE public.bi_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bi_state_all" ON public.bi_state;
REVOKE ALL PRIVILEGES ON TABLE public.bi_state FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.bi_state FROM authenticated;

-- Remover permissões abertas aplicadas ao bucket no setup legado.
DROP POLICY IF EXISTS "attachments_read" ON storage.objects;
DROP POLICY IF EXISTS "attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;

-- Nenhuma política permissiva nova é criada aqui.
-- A nova aplicação deverá usar Auth e RLS baseada em membros antes de ativar acesso.
COMMIT;
