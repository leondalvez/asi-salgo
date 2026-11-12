-- =============================================================================
-- ASÍ SALGO! — PASO 7 (OPCIONAL): SALIDAS DE DEMO
-- =============================================================================
-- Solo para probar Salen con datos iniciales. Requiere perfiles demo opcionales.
-- =============================================================================

INSERT INTO perfiles (id, nombre, codigo, nombre_visible)
VALUES
  ('demo-camila', 'Camila', '2847', 'Camila#2847'),
  ('demo-martin', 'Martín', '3310', 'Martín#3310'),
  ('demo-nico', 'Nico', '9103', 'Nico#9103'),
  ('demo-lu', 'Lu', '5521', 'Lu#5521'),
  ('demo-juli', 'Juli', '7782', 'Juli#7782')
ON CONFLICT (id) DO NOTHING;

INSERT INTO salidas (
  id, perfil_id, organizador, titulo, descripcion, ciudad,
  lugar, direccion, lat, lng, creado
)
VALUES
  (
    'demo-rosario-1',
    'demo-camila',
    'Camila#2847',
    'Recital al atardecer en el río',
    'Busco gente para ir sin apuro, capaz tomamos algo después cerca del parque.',
    'rosario',
    'Costanera',
    'Costanera Este, Rosario',
    -32.9442,
    -60.6505,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'demo-rosario-2',
    'demo-martin',
    'Martín#3310',
    'Museo + café después',
    'Plan tranqui para el sábado. Sumate si te pinta mirar la muestra y charlar.',
    'rosario',
    'Centro',
    'Centro, Rosario',
    -32.9468,
    -60.6393,
    NOW() - INTERVAL '5 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO salida_sumados (salida_id, perfil_id, nombre, es_organizador, fecha)
VALUES
  ('demo-rosario-1', 'demo-camila', 'Camila#2847', TRUE, NOW() - INTERVAL '2 hours'),
  ('demo-rosario-1', 'demo-nico', 'Nico#9103', FALSE, NOW() - INTERVAL '90 minutes'),
  ('demo-rosario-1', 'demo-lu', 'Lu#5521', FALSE, NOW() - INTERVAL '40 minutes'),
  ('demo-rosario-2', 'demo-martin', 'Martín#3310', TRUE, NOW() - INTERVAL '5 hours'),
  ('demo-rosario-2', 'demo-juli', 'Juli#7782', FALSE, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

SELECT s.id, s.titulo, count(ss.id) AS sumados
FROM salidas s
LEFT JOIN salida_sumados ss ON ss.salida_id = s.id
GROUP BY s.id;
