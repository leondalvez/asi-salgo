# Diario de trabajo — Así Salgo!

Registro cronológico de avances. Cada entrada resume qué se hizo, qué se decidió
y qué queda pendiente. Complementa la `Memoria-de-Desarrollo.md` (que ordena por
temas); acá el orden es por día.

> **Estrategia de entrega:** escalonar los commits (1–2 por día) para mostrar
> avance sostenido hacia el 50% del mes. No todo lo trabajado se sube el mismo día.

---

## 2026-07-13 — Comunicación + inicio del sistema responsive

### Hecho
- **Revisión de comunicación (microcopy):** títulos a *sentence case*, convención
  **El viaje** en texto mayúscula/minúscula (reservando `EL VIAJE` para eyebrows),
  `Mapa de salidas` y `con peques` en minúscula, y `<title>` unificados al patrón
  `Página — Así Salgo!`. *(Commiteado: `5a3085d`.)*
- **Inicio de la optimización responsive (sin commit todavía):**
  - Reescritura de `frontend/css/responsive.css` con un sistema de **3 tiers + TV**
    documentado y sin superposiciones:
    - Móvil: `< 768px`
    - Tablet: `768–1199px`
    - Escritorio: `≥ 1200px`
    - TV / ultra-wide: `≥ 1600px` (más ancho útil + tipografía mayor)
  - Limpieza en `frontend/css/viaje.css`: se eliminó el bloque `@media (max-width:1023px)`
    **duplicado** del de responsive y el bloque muerto `@media (max-width:420px)` que
    tocaba `.titulo-viaje` (ya inexistente) y reinflaba las tarjetas peleándose con el 2×2.
  - Se resolvió el conflicto de la toolbar sticky (antes `top` valía 52/56/58 según el
    archivo): ahora es sticky solo en móvil y estática desde tablet.

### Decisiones
- Un único breakpoint por tier como fuente de verdad en `responsive.css`.
- Tablet arranca en 768 (antes había cortes en 641/720/769/1023 mezclados).
- Escritorio pasa de 1100 a **1200** para que 1024–1199 use el layout de tablet (más seguro).
- Se agrega tier **TV (≥1600)**: sube el contenedor a 1320px y el `font-size` base a 17px.

### Pendiente (próximos días)
- Limpiar CSS muerto de `.titulo-viaje` en `viaje.css` (estilos sin elemento).
- Auditoría visual con capturas en 360 / 768 / 1024 / 1440 / 1920 y ajustar detalles.
- Revisar `salen.css`, `mapa.css`, `entrar.css` para que respeten los mismos tiers.

### Segunda sesión — Puerta animada y menú (nav)
- **Puerta del logo:** antes abría con una rotación 2D (`rotate`) que se veía como
  agujas de reloj. Ahora abre en **3D con `rotateY`** (mismo lenguaje que el CTA),
  y la **luz sale con el color de la sección** (`--color-card`) más un halo del mismo
  tono (`drop-shadow`). Verificado en navegador: verde por defecto y **lavanda** al
  elegir *Misterio* en El viaje. (`puerta.js` + `puerta.css`.)
- **Menú (título/subtítulo):** los subtítulos largos (ej. "Lugares cerca") se partían
  en dos líneas y descuadraban la píldora. Se agregó `white-space: nowrap` a etiqueta
  y detalle, `flex-shrink: 0` al link, y se **alinearon los breakpoints del nav a los
  tiers**:
  - `< 768`  → hamburguesa con título + subtítulo (menú desplegable).
  - `768–1199` → barra completa **sin** subtítulo (no entra cómodo) + tagline oculto.
  - `≥ 1200` → barra con subtítulo y `max-width` mayor (1080), tagline visible.
  - `≥ 1600` (TV) → barra 1220.
- Se movió el `max-width` de nav/pie desde `responsive.css` a `nav.css` (una sola fuente).

### Estado git
- **No commiteado** (según estrategia de escalonar). Cambios locales en
  `frontend/css/responsive.css`, `frontend/css/viaje.css`, `frontend/css/nav.css`,
  `frontend/css/puerta.css`, `frontend/js/puerta.js` y este diario.
