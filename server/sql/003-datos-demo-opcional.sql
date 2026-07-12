-- =============================================================================
-- ASÍ SALGO! — PASO 3 (OPCIONAL): DATOS DE PRUEBA
-- =============================================================================
-- Solo para probar en Supabase Table Editor. Borrá después si querés.
-- =============================================================================

INSERT INTO perfiles (id, nombre, codigo, nombre_visible)
VALUES ('demo0001', 'Camila', '2847', 'Camila#2847')
ON CONFLICT (nombre, codigo) DO NOTHING;

SELECT * FROM perfiles;
