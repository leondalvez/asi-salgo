-- =============================================================================
-- ASÍ SALGO! — PASO 2: VERIFICAR QUE LA TABLA EXISTE
-- =============================================================================
-- Mismo lugar: Supabase → SQL Editor → New query → pegar → Run
--
-- Resultado esperado:
--   - Primera consulta: 1 fila con table_name = perfiles
--   - Segunda consulta: 0 filas (tabla vacía, está bien)
-- =============================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'perfiles';

SELECT id, nombre, codigo, nombre_visible, creado
FROM perfiles
ORDER BY creado DESC
LIMIT 10;
