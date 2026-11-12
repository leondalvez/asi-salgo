-- =============================================================================
-- ASÍ SALGO! — PASO 9: VERIFICAR SUSCRIPCIONES
-- =============================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('suscripciones');

SELECT email, nombre, ciudad, intereses, fecha
FROM suscripciones
ORDER BY fecha DESC
LIMIT 20;
