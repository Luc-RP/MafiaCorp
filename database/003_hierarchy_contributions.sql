-- MafiaCorp | 003 | Hierarquia / metas coletivas | PostgreSQL 18
-- Adição sem apagar contas, sessões ou informações preexistentes.
ALTER TABLE public.mc_accounts ADD COLUMN IF NOT EXISTS org_role varchar(32) NOT NULL DEFAULT 'membro';
ALTER TABLE public.mc_accounts ADD CONSTRAINT mc_accounts_org_role_valid CHECK (org_role IN ('lider_01','lider_02','lider_03','gerente_geral','gerente_farm','gerente_acao','estrategista','logistica','elite','membro'));
CREATE UNIQUE INDEX IF NOT EXISTS mc_unique_command_posts ON public.mc_accounts(org_role) WHERE org_role IN ('lider_01','lider_02','lider_03','gerente_geral','gerente_farm','gerente_acao');
CREATE TABLE IF NOT EXISTS public.mc_daily_activity (
  account_id uuid NOT NULL REFERENCES public.mc_accounts(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  marked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(account_id,activity_date)
);
CREATE TABLE IF NOT EXISTS public.mc_contributions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES public.mc_accounts(id) ON DELETE CASCADE,
 activity_date date NOT NULL,
 mission_type varchar(20) NOT NULL,
 points smallint NOT NULL,
 note varchar(400),
 evidence_data text,
 status varchar(15) NOT NULL DEFAULT 'pendente',
 reviewed_by uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT mc_contrib_mission_valid CHECK (mission_type IN ('aeronave','caminhao','submarino','cargueiro')),
 CONSTRAINT mc_contrib_points_valid CHECK ((mission_type='aeronave' AND points=10) OR (mission_type<>'aeronave' AND points=5)),
 CONSTRAINT mc_contrib_status_valid CHECK (status IN ('pendente','aprovado','rejeitado')),
 CONSTRAINT mc_contrib_evidence_valid CHECK (evidence_data IS NULL OR char_length(evidence_data)<=170000)
);
CREATE INDEX IF NOT EXISTS mc_contrib_date_status ON public.mc_contributions(activity_date,status,account_id);
CREATE INDEX IF NOT EXISTS mc_contrib_account_date ON public.mc_contributions(account_id,activity_date DESC);
CREATE TABLE IF NOT EXISTS public.mc_qg_panels (
  activity_date date PRIMARY KEY,
  production_choice varchar(250),
  closed_by uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
  closed_at timestamptz
);