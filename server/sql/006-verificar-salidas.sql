-- =============================================================================
-- ASÍ SALGO! — PASO 6: VERIFICAR TABLAS DE COMUNIDAD
-- =============================================================================

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('salidas', 'salida_sumados', 'conexiones')
ORDER BY table_name;

SELECT s.id, s.organizador, s.titulo, s.ciudad, s.creado,
       count(ss.id) AS total_sumados
FROM salidas s
LEFT JOIN salida_sumados ss ON ss.salida_id = s.id
GROUP BY s.id
ORDER BY s.creado DESC
LIMIT 10;
