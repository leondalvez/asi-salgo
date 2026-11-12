-- =============================================================================
-- ASÍ SALGO! — PASO 4: SALIDAS DE COMUNIDAD (Salen)
-- =============================================================================
-- Ejecutar en Supabase → SQL Editor → New query → Run
-- Requiere la tabla perfiles (001-crear-tabla-perfiles.sql).
-- =============================================================================

CREATE TABLE IF NOT EXISTS salidas (
  id            TEXT PRIMARY KEY,
  perfil_id     TEXT REFERENCES perfiles (id) ON DELETE SET NULL,
  organizador   TEXT NOT NULL,
  titulo        TEXT NOT NULL,
  descripcion   TEXT NOT NULL DEFAULT '',
  ciudad        TEXT NOT NULL DEFAULT 'rosario',
  fecha_inicio  TIMESTAMPTZ,
  lugar         TEXT NOT NULL DEFAULT '',
  direccion     TEXT NOT NULL DEFAULT '',
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  evento_id     TEXT,
  creado        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salidas_ciudad_creado
  ON salidas (ciudad, creado DESC);

CREATE INDEX IF NOT EXISTS idx_salidas_coords
  ON salidas (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

CREATE TABLE IF NOT EXISTS salida_sumados (
  id              SERIAL PRIMARY KEY,
  salida_id       TEXT NOT NULL REFERENCES salidas (id) ON DELETE CASCADE,
  perfil_id       TEXT,
  nombre          TEXT NOT NULL,
  es_organizador  BOOLEAN NOT NULL DEFAULT FALSE,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salida_sumados_salida
  ON salida_sumados (salida_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salida_sumados_perfil_unico
  ON salida_sumados (salida_id, perfil_id)
  WHERE perfil_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salida_sumados_nombre_unico
  ON salida_sumados (salida_id, lower(nombre));
