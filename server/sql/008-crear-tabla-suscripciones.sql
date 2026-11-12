-- =============================================================================
-- ASÍ SALGO! — PASO 8: SUSCRIPCIONES (CONTACTO)
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor → New query → Run
-- Este script es idempotente (se puede correr más de una vez).
-- =============================================================================

CREATE TABLE IF NOT EXISTS suscripciones (
  email       TEXT PRIMARY KEY,
  nombre      TEXT NOT NULL DEFAULT '',
  ciudad      TEXT NOT NULL DEFAULT 'rosario',
  intereses   JSONB NOT NULL DEFAULT '[]'::jsonb,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_ciudad_fecha
  ON suscripciones (ciudad, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_suscripciones_fecha
  ON suscripciones (fecha DESC);
