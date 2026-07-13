# Así Salgo! — Memoria de desarrollo

**Proyecto:** Trabajo Práctico — Aplicación Web  
**Autor:** Leonardo Dalvez  
**Repositorio:** https://github.com/leondalvez/asi-salgo  
**Producción:** https://asi-salgo.onrender.com  
**Última actualización:** julio 2026 (revisión de comunicación: microcopy y nomenclatura)

---

## 1. Qué es el proyecto

**Así Salgo!** es una aplicación web para armar y compartir salidas presenciales en **Rosario** y **Buenos Aires**. No es una red social: no hay likes, no hay scroll infinito ni feed algorítmico. La idea es ayudar a decidir *a dónde salir hoy*, *con qué energía* y *con quién*, usando datos reales de la ciudad y una capa comunitaria donde cada persona puede publicar un plan y otras pueden sumarse con un **Me sumo**.

El sitio tiene nueve pantallas principales: Home, Entrar (identidad), El viaje (cuestionario), Mapa de lugares, Salen (comunidad), Sobre, Contacto, Este mes y Con peques.

**Ciudades activas (julio 2026):** Rosario y Buenos Aires. Santa Fe, Córdoba y Mendoza quedaron fuera del selector por falta de APIs estables en tier gratuito; los adapters siguen en el repo para reactivarlos cuando haya fuente confiable o presupuesto para API paga.

---

## 2. Stack técnico y por qué lo elegimos

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend | HTML, CSS y JavaScript vanilla | Cumple el TP sin frameworks; carga liviana en hosting gratis |
| Backend | Node.js (`server/index.js`) | Sirve el frontend, expone API REST y concentra las integraciones externas |
| Mapas | Leaflet + tiles oscuros CARTO | Gratis, coherente con el diseño dark del sitio |
| Base de datos | Supabase PostgreSQL (solo perfiles) | Persistencia real en producción sin costo; el resto sigue en JSON local por ahora |
| Hosting | Render.com Free | HTTPS incluido, deploy desde GitHub, $0 |

**Restricción explícita del proyecto:** no gastar en infraestructura. Todo el stack corre en tiers gratuitos.

---

## 3. Decisiones de diseño y producto

### 3.1 Sin likes, con “Me sumo”

La guía de marca del proyecto rechaza mecánicas de retención tipo red social. En su lugar, la sección **A dónde salen** permite publicar un plan real (“voy al recital del sábado”) y que otras personas se sumen con un clic, sin ranking ni contador de popularidad visible más allá de quién ya dijo que va.

### 3.2 Identidad sin contraseñas

Para la comunidad usamos **nombre autopercibido + código único** (ej. `Camila#4821`). No pedimos mail ni contraseña en Salen: reduce fricción y evita manejar credenciales sensibles en un TP. Los perfiles sí persisten en PostgreSQL para poder recuperar el código en otro dispositivo.

### 3.3 Eventos gratuitos y con entrada paga

Mostramos ambos tipos. La app **no vende entradas**: solo informa y permite compartir la salida. Cuando la fuente trae precio o link de venta (agenda municipal, Linda BA), mostramos el badge **Entrada paga** o **Gratis** y, si existe, un enlace **Ver más** hacia la fuente original.

### 3.4 APIs solo gratuitas

Descartamos scrapear sitios comerciales (Passline, Ticketek, etc.) por tres motivos: violan términos de uso, se rompen seguido y no aportan estabilidad para una entrega académica. Priorizamos datos abiertos municipales y servicios con política de uso clara (Open-Meteo, Nominatim, Overpass).

### 3.5 Compartir sin perfiles oficiales de marca

No linkeamos cuentas institucionales de Instagram o similares (decisión de marca). Sí ofrecemos **Compartir** por WhatsApp e Instagram *desde el plan del usuario*, con página OG dinámica en `/compartir/:id`.

---

## 4. APIs y fuentes de datos consumidas

| Fuente | Uso en la app | Costo |
|--------|---------------|-------|
| `ws.rosario.gob.ar` — ocurrencias | Agenda cultural Rosario (incluye eventos con ticket) | $0 |
| `ws.rosario.gov.ar` — lugaresDatosUtiles | Parques, plazas, deporte, turismo, cultural | $0 |
| `agenda.santafeciudad.gov.ar` — iCal | Agenda municipal Santa Fe (feed público Events Manager) | $0 |
| Linda BA (`linda.buenosaires.gob.ar`) | Eventos Buenos Aires | $0 |
| `gobiernoabierto.cordoba.gob.ar` — actividad pública | Intentamos agenda Córdoba; hoy suele responder 404 | $0 |
| `datos.cultura.gob.ar` — SINCA | Centros culturales por provincia (Mapa Cultural nacional) | $0 |
| OpenStreetMap / Overpass | Parques, plazas, deporte, cultura en ciudades sin datos municipales | $0 |
| Open-Meteo | Clima en tarjetas de resultados | $0 |
| Nominatim (OSM) | Geocodificar eventos y salidas sin coordenadas | $0 |
| Supabase PostgreSQL | Tabla `perfiles` | $0 (free tier) |

### Cobertura por ciudad (honesta)

| Ciudad | Estado en app | Notas |
|--------|---------------|-------|
| **Rosario** | Activa | Agenda municipal JSON + datos útiles |
| **Buenos Aires** | Activa | Linda BA + Overpass |
| **Santa Fe** | Desactivada (código conservado) | iCal municipal; sin selector en UI |
| **Córdoba** | Desactivada (código conservado) | API histórica inestable |
| **Mendoza** | Desactivada (código conservado) | Sin cartelera API gratuita viva |

---

## 5. Evolución del trabajo (qué fuimos sumando)

### Fase 1 — MVP local
- Home, El viaje con cuestionario (energía → plan → momento).
- Adapters Rosario y Buenos Aires.
- Tarjetas de eventos con clima y complementos (lugares públicos).

### Fase 2 — Mapa y accesos directos
- **Mapa de salidas** (`mapa.html`) con Leaflet.
- Páginas **Este mes** y **Con peques** sin repetir el cuestionario.
- Filtro por cercanía con geocodificación Nominatim (los eventos de Rosario no traen lat/lng nativos).

### Fase 3 — Comunidad y compartir
- Pantalla **Entrar** (nombre + código).
- **Salen**: feed, publicar plan, Me sumo.
- Botón **Voy a salir** desde El viaje hacia Salen.
- Compartir por WhatsApp / Instagram + vista `/compartir/:id`.

### Fase 4 — Producción con persistencia
- Deploy en **Render.com** (`render.yaml`: `npm install` + `node index.js`).
- **Supabase PostgreSQL** para perfiles (`DATABASE_URL` en Render).
- Scripts SQL en `server/sql/` para crear y verificar la tabla.
- Health check: `GET /api/health` → `almacenamiento: postgresql`.

### Fase 5 — Cultura, mapa comunitario y eventos comerciales
- Etiqueta **`cultural`** en datos útiles de Rosario (teatros, cines, centros).
- Extracción de **links de entrada** desde la agenda municipal cuando vienen en el campo `ticket`.
- **Mapa en Salen**: planes geocodificados + capa opcional de espacios culturales.
- Planes de El viaje enriquecidos con sedes culturales para Rosario.

### Fase 6 — Símbolo puerta, comunidad en mapa y cierre de TP
- **Puerta** como identidad visual: logo del nav, CTA de inicio y botón **Me sumo** (antes “Voy a salir”) con animación de apertura.
- Mapa en Salen con marcadores de compañeros, popup y enfoque tras sumarse.
- Recorte a **Rosario y Buenos Aires** en UI (adapters de otras ciudades conservados en repo).
- Fix: `frontend/js/ciudades.js` en IIFE — redeclaraciones globales rompían `viaje.js` y las tarjetas de El viaje no respondían.
- OG image PNG 1200×630, meta sociales en 9 páginas, skip link y ajustes tablet.

### Fase 6 (histórico) — Expansión nacional
- Santa Fe, Córdoba y Mendoza se probaron en desarrollo; hoy **desactivadas** en producción por APIs inestables o sin tier gratuito.

### Fase 7 — Seguridad, responsive y revisión de comunicación
- **Seguridad**: `server/lib/seguridad.js` con CORS restrictivo en POST, cabeceras HTTP (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`), límite de body JSON (32 KB) y validación de URLs externas (`http`/`https`).
- **Proporciones responsive**: `frontend/css/responsive.css` para móvil, tablet y pantallas grandes.
- **Economía de espacio en El viaje (móvil)**: se quitó el hero “Menos scroll. Más ciudad.” del formulario; la toolbar (contexto + progreso) queda sticky y las tarjetas de energía aparecen en grilla 2×2 apenas debajo de la pregunta, sin scroll previo.
- **Revisión de comunicación (microcopy)**: unificación a **sentence case** en títulos, convención **El viaje** (mayúscula/minúscula) reservando `EL VIAJE` para eyebrows, `Mapa de salidas` y `con peques` en minúscula, y `<title>` normalizados al patrón `Página — Así Salgo!`.

---

## 6. Problemas que encontramos y cómo los resolvimos

| Problema | Qué pasaba | Solución |
|----------|------------|----------|
| Agenda municipal intermitente | `ws.rosario.gob.ar` a veces responde 500 | Fallback: mensaje al usuario + sugerencia de espacios públicos vía `lugaresDatosUtiles` |
| Eventos sin coordenadas | Rosario no devuelve lat/lng en ocurrencias | Geocodificación por dirección con Nominatim, cache en memoria y límite de consultas por request |
| Render pide Build Command | Deploy fallaba sin comando de build | `npm install` en `render.yaml` (dependencia `pg` para Supabase) |
| Health decía `json_local` | Faltaba `DATABASE_URL` en Render | Variable de entorno configurada; verificado en producción |
| Cold start Render | Primera visita tras ~15 min tarda ~30 s | Documentado para el informe; no es bug de la app |
| Salidas sin ubicación en mapa | La comunidad publica texto libre (“Costanera”) | Geocodificación al listar + persistencia de lat/lng en JSON |
| Linda sin rango mensual | API solo ofrece hasta “esta semana” | Aviso explícito en Buenos Aires cuando se pide “este mes” |
| Profesores preguntan por Santa Fe / Córdoba / Mendoza | APIs inestables o sin tier gratuito | Adapters en repo; selector limitado a Rosario y BA hasta tener fuente estable |
| Tarjetas de El viaje sin click | `ciudades.js` redeclaraba constantes globales → SyntaxError en scripts siguientes | IIFE en `ciudades.js`; solo `window.CiudadesApi` expuesto |
| Producción servía `viaje.html` viejo | Render cacheaba/servía el HTML previo con el hero “Menos scroll” | Ocultado por CSS + nav condicional, validación del frontend en el build (`render.yaml`) y `Cache-Control: no-cache` para HTML |
| Títulos en “Title Case” | Mayúscula en cada palabra (calco del inglés) se veía poco profesional | Convención sentence case + nomenclatura única (**El viaje**) en todo el sitio |
| JSON efímero en Render | Newsletter y salidas se pierden al redeploy | Perfiles ya en Supabase; migración del resto marcada como opcional |

---

## 7. Arquitectura simplificada

```
Usuario → frontend/ (HTML+CSS+JS)
              ↓ fetch
         server/index.js  (API REST)
              ↓
    ┌─────────┼─────────┬──────────────┐
    adapters/     lib/           Supabase
    rosario.js    geocoder.js    (perfiles)
    buenosAires   perfiles.js
    lugares.js    salidasComunidad.js (JSON)
    clima.js      compartir.js
```

Los **adapters** normalizan cada fuente externa a un formato común de evento o lugar. El frontend solo conoce `/api/eventos`, `/api/lugares`, `/api/salen`, etc.

---

## 8. Criterio para eventos “comerciales pero culturales”

Aceptamos mostrar recitales, obras de teatro o festivales con entrada paga cuando la información viene de **fuentes abiertas y gratuitas** (principalmente la agenda municipal de Rosario y Linda en BA). La tarjeta indica si es gratis o pago; el link externo lleva a la fuente, no a un checkout propio.

No integramos APIs de venta de entradas porque no ofrecen tier gratuito estable ni permiso de uso para un proyecto académico.

---

## 9. Estado actual y trabajo pendiente

### Listo en producción
- URL pública con HTTPS (Render) con deploy automático desde `main`.
- Perfiles persistentes en PostgreSQL (Supabase).
- El viaje, mapa de lugares, comunidad Salen, compartir, Este mes, Con peques.
- Mapa comunitario en Salen con capa cultural y contador de compañeros.
- Símbolo **puerta** (logo, CTA inicio, Me sumo) con animación de apertura.
- Solo **Rosario y Buenos Aires** en el selector de ciudades.
- Fix crítico: `ciudades.js` en IIFE (tarjetas de El viaje responden).
- Revisión de comunicación: títulos en sentence case y nomenclatura unificada (**El viaje**, `Mapa de salidas`, `con peques`).
- `og:image` PNG 1200×630 y meta OG/Twitter en las 9 páginas.
- Accesibilidad: skip link, `role="main"`, landmarks, foco visible.
- Ajustes CSS tablet 768–1024 px.
- Seguridad: CORS restrictivo en POST, cabeceras HTTP, límite body 32 KB, URLs `http`/`https` only.
- Proporciones responsive: `frontend/css/responsive.css` (móvil, tablet, pantallas grandes).

### Pendiente para cerrar el TP (manual / evidencia)
- **Revisar proporciones** en 360 / 768 / 1024 / 1440 px (checklist §3 en `docs/entrega-evidencias.md`).
- Medición formal con [PageSpeed Insights](https://pagespeed.web.dev/) + capturas (ver `docs/entrega-evidencias.md`).
- Testing cross-browser y tablet 768–1024 px con checklist del mismo doc.
- Auditoría Lighthouse accesibilidad con captura (objetivo ≥ 90 en Home).
- Completar casillas de verificación en producción (OG en WhatsApp, hover puerta, formularios).
- Opcional: migrar newsletter y salidas comunidad a Supabase.

---

## 10. Cómo reproducir el entorno

```bash
cd server
cp .env.example .env    # opcional: DATABASE_URL para Supabase local
npm install
node index.js
```

Abrí `http://localhost:3000`. Sin `DATABASE_URL`, los perfiles usan JSON local; con la variable, conectan a Supabase.

En producción, Render ejecuta el mismo `node index.js` desde la carpeta `server/` según `render.yaml`.

---

## 11. Referencias del repositorio

| Documento / carpeta | Contenido |
|---------------------|-----------|
| `Concepto/Guia-de-Marca.md` | Tono, decisiones de UX y anti-patrones |
| `Concepto/Planificación Proyecto Final.txt` | Requisitos de la cátedra |
| `server/README.md` | Deploy, variables de entorno, túnel local |
| `docs/entrega-evidencias.md` | Checklist PageSpeed, tablet, accesibilidad y deploy |
| `server/sql/` | Scripts para Supabase |

---

*Este documento se actualiza a medida que avanzamos el proyecto. La idea es que cualquier docente pueda seguir el hilo de las decisiones técnicas y de producto sin leer todo el código.*
