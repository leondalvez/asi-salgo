-- =============================================================================
-- ASÍ SALGO! — PASO 1: CREAR TABLA DE PERFILES
-- =============================================================================
-- Dónde ejecutar esto:
--   1. Entrá a https://supabase.com y abrí TU proyecto
--   2. Menú izquierdo: SQL Editor
--   3. Botón: + New query
--   4. Copiá TODO este archivo (desde la línea de abajo hasta el final)
--   5. Pegá en el editor
--   6. Botón verde: Run   (o Ctrl + Enter)
--   7. Abajo debe decir: Success. No rows returned
--
-- Después ejecutá el archivo: 002-verificar-perfiles.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS perfiles (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  codigo          TEXT NOT NULL,
  nombre_visible  TEXT NOT NULL,
  creado          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (nombre, codigo)
);

CREATE INDEX IF NOT EXISTS idx_perfiles_nombre_codigo
  ON perfiles (LOWER(nombre), codigo);
