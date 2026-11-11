-- MafiaCorp | 006 | Eventos locais para futura integração Discord
-- Nenhum webhook, token ou mensagem é enviado por esta tabela.
CREATE TABLE IF NOT EXISTS public.mc_event_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_key varchar(150) NOT NULL UNIQUE,
  event_type varchar(40) NOT NULL CHECK (event_type IN (
    'activity_marked','mission_submitted','mission_approved','mission_rejected','qg_panel_closed'
  )),
  actor_id uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
  subject_account_id uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  delivery_attempts integer NOT NULL DEFAULT 0,
  last_delivery_error text
);
CREATE INDEX IF NOT EXISTS mc_outbox_pending
 ON public.mc_event_outbox(occurred_at)
 WHERE delivered_at IS NULL;
