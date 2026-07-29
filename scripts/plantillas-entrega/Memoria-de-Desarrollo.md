# Así Salgo! — Memoria de desarrollo

**Proyecto:** Proyecto Final — Aplicación Web  
**Autor:** Leonardo Dalvez  
**Repositorio:** https://github.com/leondalvez/asi-salgo  
**Producción:** https://asi-salgo.onrender.com  
**Última actualización:** julio 2026

---

## 1. Qué es el proyecto

**Así Salgo!** es una aplicación web para armar y compartir salidas presenciales en
**Rosario** y **Buenos Aires**. No es una red social: no hay likes, scroll infinito
ni feed algorítmico. La propuesta es ayudar a decidir *a dónde salir hoy*, *con qué
energía* y *con quién*, usando datos reales de la ciudad y una capa comunitaria donde
cada persona puede publicar un plan y otras pueden sumarse con un **Me sumo**.

El sitio tiene nueve pantallas principales: Home, Entrar (identidad), El viaje
(cuestionario), Mapa de lugares, Salen (comunidad), Sobre, Contacto, Este mes y
Con peques.

**Ciudades activas (julio 2026):** Rosario y Buenos Aires. Santa Fe, Córdoba y Mendoza
quedaron fuera del selector por falta de APIs estables en tier gratuito; los adapters
siguen en el código para reactivarlos cuando haya una fuente confiable.

---

## 2. Stack técnico y por qué lo elegí

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend | HTML, CSS y JavaScript vanilla | Cumple el TP sin frameworks; carga liviana en hosting gratis |
| Backend | Node.js (`server/index.js`) | Un solo proceso sirve el frontend y la API REST |
| Mapas | Leaflet + tiles oscuros CARTO | Gratis y coherente con el diseño del sitio |
| Base de datos | Supabase PostgreSQL (solo perfiles) | Persistencia en producción sin costo; el resto puede usar JSON local |
| Hosting | Render.com Free | HTTPS, deploy desde GitHub, $0 |

**Restricción del proyecto:** no gastar en infraestructura. Todo el stack corre en tiers gratuitos.

---

## 3. Decisiones de diseño y producto

### 3.1 Sin likes, con “Me sumo”

La guía de marca rechaza mecánicas de retención tipo red social. En **A dónde salen**
se puede publicar un plan real y otras personas se suman con un clic, sin ranking.

### 3.2 Identidad sin contraseñas

Para la comunidad se usa **nombre autopercibido + código único** (ej. `Camila#4821`).
No se pide mail ni contraseña: baja la fricción y evita manejar credenciales
sensibles en un trabajo académico. Los perfiles persisten en PostgreSQL para poder
recuperar el código en otro dispositivo.

### 3.3 Eventos gratuitos y con entrada paga

Se muestran ambos tipos. La app **no vende entradas**: informa y permite compartir.
Si la fuente trae precio o link de venta, la tarjeta muestra **Entrada paga** o
**Gratis** y, si existe, un enlace **Ver más** a la fuente original.

### 3.4 APIs solo gratuitas

Se descartó scrapear sitios comerciales (Passline, Ticketek, etc.) porque violan
términos de uso, se rompen seguido y no aportan estabilidad para una entrega
académica. Se priorizan datos abiertos municipales y servicios con política de uso
clara (Open-Meteo, Nominatim, Overpass).

### 3.5 Compartir

No hay cuentas institucionales de marca. Sí hay **Compartir** por WhatsApp e
Instagram desde el plan del usuario, con página OG en `/compartir/:id`.

---

## 4. APIs y fuentes de datos

| Fuente | Uso en la app | Costo |
|--------|---------------|-------|
| `ws.rosario.gob.ar` — ocurrencias | Agenda cultural Rosario | $0 |
| `ws.rosario.gov.ar` — lugaresDatosUtiles | Parques, plazas, deporte, turismo, cultural | $0 |
| Linda BA (`linda.buenosaires.gob.ar`) | Eventos Buenos Aires | $0 |
| OpenStreetMap / Overpass | Parques y plazas cuando no hay datos municipales | $0 |
| Open-Meteo | Clima en tarjetas de resultados | $0 |
| Nominatim (OSM) | Geocodificar eventos y salidas sin coordenadas | $0 |
| Supabase PostgreSQL | Tabla `perfiles` | $0 (free tier) |

Adapters de Santa Fe, Córdoba y Mendoza están en el código pero desactivados en la UI.

| Ciudad | Estado | Notas |
|--------|--------|-------|
| **Rosario** | Activa | Agenda municipal + datos útiles |
| **Buenos Aires** | Activa | Linda BA + Overpass |
| Santa Fe / Córdoba / Mendoza | Desactivadas | Código conservado; fuentes inestables o sin API gratis |

---

## 5. Evolución del trabajo

### Fase 1 — MVP local
- Home y El viaje (energía → plan → momento).
- Adapters Rosario y Buenos Aires.
- Tarjetas con clima y lugares públicos.

### Fase 2 — Mapa y accesos directos
- Mapa de salidas con Leaflet.
- Páginas Este mes y Con peques.
- Filtro por cercanía con geocodificación Nominatim.

### Fase 3 — Comunidad y compartir
- Entrar (nombre + código).
- Salen: feed, publicar plan, Me sumo.
- Compartir con vista `/compartir/:id`.

### Fase 4 — Producción
- Deploy en Render (`render.yaml`).
- Perfiles en Supabase (`DATABASE_URL`).
- Health check: `GET /api/health`.

### Fase 5 — Mapa comunitario y cultura
- Etiqueta cultural en datos de Rosario.
- Mapa en Salen con planes geocodificados.
- Links de entrada cuando la agenda los trae.

### Fase 6 — Identidad visual y recorte de ciudades
- Símbolo puerta (logo, CTA, Me sumo) con animación de apertura.
- Solo Rosario y Buenos Aires en el selector.
- Corrección en `ciudades.js` (IIFE) para que las tarjetas de El viaje respondan.
- Imagen OG y meta sociales.

### Fase 7 — Seguridad, responsive y comunicación
- Módulo `seguridad.js`: CORS en POST, cabeceras HTTP, límite de body, URLs válidas.
- Sistema responsive en tres tiers (móvil / tablet / escritorio) + TV.
- Microcopy unificado: sentence case y nomenclatura **El viaje**.

---

## 6. Problemas técnicos y soluciones

| Problema | Qué pasaba | Solución |
|----------|------------|----------|
| Agenda municipal intermitente | `ws.rosario.gob.ar` a veces responde 500 | Fallback con espacios públicos y aviso al usuario |
| Eventos sin coordenadas | Rosario no trae lat/lng | Geocodificación con Nominatim, cache y límite por request |
| Deploy en Render | Fallaba sin build | `npm install` en `render.yaml` |
| Health en `json_local` | Faltaba `DATABASE_URL` | Variable configurada en Render |
| Cold start | Primera visita tarda ~30 s | Documentado; limitación del plan free |
| Salidas sin ubicación | Texto libre (“Costanera”) | Geocodificación al listar |
| Tarjetas sin click | Redeclaración global en `ciudades.js` | IIFE; se expone solo `window.CiudadesApi` |
| HTML viejo en producción | Cache de HTML | `Cache-Control: no-cache` en archivos `.html` |
| Title Case en títulos | Se veía poco natural en español | Sentence case en todo el sitio |

---

## 7. Arquitectura

```
Usuario → frontend/ (HTML + CSS + JS)
              ↓ fetch
         server/index.js  (API REST + archivos estáticos)
              ↓
    ┌─────────┼─────────┬──────────────┐
    adapters/     lib/           Supabase
    rosario.js    geocoder.js    (perfiles)
    buenosAires   perfiles.js
    lugares.js    salidasComunidad.js
    clima.js      seguridad.js
```

Los **adapters** normalizan cada fuente a un formato común. El frontend solo habla
con `/api/eventos`, `/api/lugares`, `/api/salen`, etc.

---

## 8. Estado actual (avance ~50%)

### Implementado
- Deploy público con HTTPS.
- Perfiles en PostgreSQL.
- El viaje, mapa, comunidad Salen, compartir, Este mes, Con peques.
- Seguridad básica en el servidor.
- Responsive por tiers.
- Documentación de ejecución y memoria técnica.

### Pendiente para el cierre del TP
- Evidencias PageSpeed / Lighthouse con capturas.
- Testing cross-browser completo.
- Migrar newsletter y salidas de comunidad a Supabase (opcional).
- Ampliar la red de salidas con más georreferencia entre usuarios.

---

## 9. Cómo reproducir el entorno

```bash
cd server
npm install
npm start
```

Abrir `http://localhost:3000`. Sin `DATABASE_URL`, los perfiles usan JSON local.

---

## 10. Referencias

| Documento | Contenido |
|-----------|-----------|
| `README.md` | Cómo ejecutar el proyecto |
| `server/README.md` | API, deploy y variables de entorno |
| `Concepto/Guia-de-Marca.md` | Tono y decisiones de UX |
| `docs/entrega-evidencias.md` | Checklist de pruebas |
| `server/sql/` | Scripts para Supabase |
