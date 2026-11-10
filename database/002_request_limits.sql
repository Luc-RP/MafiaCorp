-- MafiaCorp • PostgreSQL 18 / Aiven
-- Migração adicional aplicada em 2026-11-10, sem apagar registros.
CREATE TABLE IF NOT EXISTS public.mc_request_limits (
    key_hash char(64) PRIMARY KEY,
    window_start timestamptz NOT NULL DEFAULT now(),
    hits integer NOT NULL DEFAULT 0
);
