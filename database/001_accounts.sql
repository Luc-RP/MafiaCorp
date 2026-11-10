-- MafiaCorp | Gate DB-01 | PostgreSQL 18 / Aiven
-- Aplicado com sucesso em 2026-11-10 no serviço Aiven mafiacorp (defaultdb).
-- Nunca coloque senhas ou tokens de sessão em SQL ou no repositório.
-- Execute UMA instrução por chamada no editor da Aiven.

CREATE TABLE IF NOT EXISTS public.mc_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(120) NOT NULL,
    codename varchar(48) NOT NULL,
    codename_normalized varchar(48) GENERATED ALWAYS AS (lower(btrim(codename))) STORED UNIQUE,
    password_hash text NOT NULL,
    role varchar(24) NOT NULL DEFAULT 'observador'
        CHECK (role IN ('admin','chefe','investigador','observador')),
    is_active boolean NOT NULL DEFAULT true,
    password_revision integer NOT NULL DEFAULT 1,
    failed_signins integer NOT NULL DEFAULT 0,
    locked_until timestamptz,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT mc_accounts_name_valid CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
    CONSTRAINT mc_accounts_codename_valid CHECK (char_length(btrim(codename)) BETWEEN 3 AND 48),
    CONSTRAINT mc_accounts_revision_valid CHECK (password_revision > 0)
);

CREATE TABLE IF NOT EXISTS public.mc_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES public.mc_accounts(id) ON DELETE CASCADE,
    token_hash char(64) NOT NULL UNIQUE,
    password_revision integer NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mc_sessions_account_expiry_idx
    ON public.mc_sessions (account_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS mc_sessions_expiry_idx
    ON public.mc_sessions (expires_at);

CREATE TABLE IF NOT EXISTS public.mc_auth_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
    target_id uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
    target_codename varchar(48),
    event_type varchar(48) NOT NULL,
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mc_auth_audit_created_idx
    ON public.mc_auth_audit (created_at DESC);
