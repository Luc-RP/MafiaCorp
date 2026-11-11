-- MafiaCorp 004 • Administrador fora da hierarquia RP
-- Não exclui contas nem revoga sessões.
ALTER TABLE public.mc_accounts
  DROP CONSTRAINT mc_accounts_org_role_valid,
  ADD CONSTRAINT mc_accounts_org_role_valid
    CHECK (org_role IN ('admin_sistema','lider_01','lider_02','lider_03','gerente_geral','gerente_farm','gerente_acao','estrategista','logistica','elite','membro'));

-- A mudança do único administrador é aplicada separadamente com verificação do codinome e papel.
-- UPDATE public.mc_accounts SET org_role='admin_sistema', updated_at=now()
-- WHERE codename_normalized='luc' AND role='admin' AND org_role='lider_01';
