-- =============================================================================
-- ASÍ SALGO! — PASO 5: CONEXIONES ENTRE PERFILES
-- =============================================================================
-- Red de salidas: un perfil puede agregar a otro (por nombre + código).
-- Ejecutar después de 004-crear-tablas-salidas.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS conexiones (
  perfil_id      TEXT NOT NULL REFERENCES perfiles (id) ON DELETE CASCADE,
  conectado_id   TEXT NOT NULL REFERENCES perfiles (id) ON DELETE CASCADE,
  creado         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (perfil_id, conectado_id),
  CHECK (perfil_id <> conectado_id)
);

CREATE INDEX IF NOT EXISTS idx_conexiones_conectado
  ON conexiones (conectado_id);
