# Así Salgo! — Memoria de desarrollo

**Proyecto:** Trabajo Práctico — Aplicación Web  
**Autor:** Leonardo Dalvez  
**Repositorio:** https://github.com/leondalvez/asi-salgo  
**Producción:** https://asi-salgo.onrender.com  
**Última actualización:** julio 2026

---

## 1. Qué es el proyecto

**Así Salgo!** es una aplicación web para armar y compartir salidas presenciales en **Rosario** y **Buenos Aires**. No es una red social: no hay likes, no hay scroll infinito ni feed algorítmico. La idea es ayudar a decidir *a dónde salir hoy*, *con qué energía* y *con quién*, usando datos reales de la ciudad y una capa comunitaria donde cada persona puede publicar un plan y otras pueden sumarse con un **Me sumo**.

El sitio tiene nueve pantallas principales: Home, Entrar (identidad), El Viaje (cuestionario), Mapa de lugares, Salen (comunidad), Sobre, Contacto, Este mes y Con Peques.

**Ciudades soportadas (julio 2026):** Rosario, Santa Fe, Córdoba, Mendoza y Buenos Aires. No todas tienen la misma profundidad de datos: priorizamos fuentes abiertas y gratuitas, y somos explícitos cuando una ciudad no publica agenda en API.

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

| Ciudad | Eventos con fecha | Lugares / complementos | Notas |
|--------|-------------------|------------------------|-------|
| **Rosario** | Sí — agenda municipal JSON | Datos útiles municipales | Fuente principal del TP |
| **Santa Fe** | Sí — iCal municipal (`?ical=1`) | Overpass + SINCA | Pedido de docentes; API REST de eventos requiere login |
| **Buenos Aires** | Sí — Linda | Overpass | Rango mensual limitado en Linda |
| **Córdoba** | Intentamos API histórica; hoy caída | Overpass + SINCA | Aviso al usuario si no hay agenda |
| **Mendoza** | No hay API viva gratuita | Overpass + SINCA | Mostramos espacios culturales, no cartelera en tiempo real |

---

## 5. Evolución del trabajo (qué fuimos sumando)

### Fase 1 — MVP local
- Home, El Viaje con cuestionario (energía → plan → momento).
- Adapters Rosario y Buenos Aires.
- Tarjetas de eventos con clima y complementos (lugares públicos).

### Fase 2 — Mapa y accesos directos
- **Mapa de Salidas** (`mapa.html`) con Leaflet.
- Páginas **Este mes** y **Con Peques** sin repetir el cuestionario.
- Filtro por cercanía con geocodificación Nominatim (los eventos de Rosario no traen lat/lng nativos).

### Fase 3 — Comunidad y compartir
- Pantalla **Entrar** (nombre + código).
- **Salen**: feed, publicar plan, Me sumo.
- Botón **Voy a salir** desde El Viaje hacia Salen.
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
- Planes de El Viaje enriquecidos con sedes culturales para Rosario.

### Fase 6 — Expansión nacional (ciudades que lo permiten)
- **Santa Fe**, **Córdoba** y **Mendoza** sumadas al selector de ciudad.
- Santa Fe: parser iCal de `agenda.santafeciudad.gov.ar` (7+ eventos verificados en prueba local).
- Córdoba: adapter con fallback cuando la API histórica no responde.
- Mendoza: sin agenda viva; complementos vía Mapa Cultural (SINCA) + OpenStreetMap.
- Registro central `server/lib/ciudades.js` + `GET /api/ciudades`.

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
| Profesores preguntan por Santa Fe / Córdoba / Mendoza | Solo Rosario y BA al inicio | Investigación de APIs; Santa Fe vía iCal; Córdoba/Mendoza con avisos + SINCA/OSM |
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
- URL pública con HTTPS.
- Perfiles persistentes en PostgreSQL.
- El Viaje, mapa de lugares, comunidad Salen, compartir, Este mes, Con Peques.
- Mapa comunitario en Salen con capa cultural.

### Pendiente para cerrar el TP
- `og:image` en PNG 1200×630 para todas las páginas.
- Medición formal con PageSpeed Insights.
- Testing cross-browser y tablet (768–1024 px).
- Auditoría de accesibilidad (Tab, contraste, Lighthouse).
- Pulir fallos menores que aún aparecen en algunas secciones en producción.
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
| `server/sql/` | Scripts para Supabase |
| `canvases/asi-salgo-checklist.canvas.tsx` | Checklist vivo de cumplimiento del TP |

---

*Este documento se actualiza a medida que avanzamos el proyecto. La idea es que cualquier docente pueda seguir el hilo de las decisiones técnicas y de producto sin leer todo el código.*
