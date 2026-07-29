# Servidor — Así Salgo!

Proceso Node que sirve el frontend y expone la API REST.
Sin frameworks: módulo nativo `http`.

## Ejecutar

```bash
cd server
npm install
npm start
```

http://localhost:3000

Modo desarrollo (reinicia al guardar):

```bash
npm run dev
```

## Fuentes de datos

| Dato | Rosario | Buenos Aires |
|------|---------|--------------|
| Eventos | Agenda municipal | Linda BA |
| Clima | Open-Meteo | Open-Meteo |
| Lugares | Datos útiles municipales | OpenStreetMap / Overpass |

Si la agenda de Rosario no responde, la app sigue con clima y espacios públicos.

## API

### Health

```http
GET /api/health
```

Respuesta incluye `ok`, `ciudades` y `almacenamiento` (`postgresql` o `json_local`).

### Eventos

```http
GET /api/eventos?ciudad=rosario&momento=hoy&plan=Al%20aire%20libre&energia=desenchufarme&distancia=cerca&lat=-32.95&lng=-60.64
```

Parámetros principales:

- `ciudad`: `rosario` | `buenos-aires`
- `momento`: `hoy` | `manana` | `finde`
- `plan`, `energia`: opcionales; mejoran el orden
- `distancia`: `cerca` | `barrio` | `ciudad` (requiere `lat` y `lng`)
- `limite`: máximo de eventos (default 6, tope 12)

### Lugares

```http
GET /api/lugares?ciudad=rosario&etiquetas=parques,plazas
```

### Comunidad

```http
GET  /api/salen
POST /api/salen
POST /api/salen/:id/sumo
POST /api/perfiles/registrar
POST /api/perfiles/ingresar
```

## Geocodificación

Muchos eventos de Rosario no traen coordenadas. `lib/geocoder.js` consulta Nominatim
solo cuando hay ubicación del usuario, agrupa por dirección, cachea en memoria y
limita consultas por request.

## PostgreSQL (opcional)

1. Ejecutar `sql/001-crear-tabla-perfiles.sql` en Supabase.
2. Copiar `.env.example` a `.env` y completar `DATABASE_URL`.
3. Reiniciar el servidor.
4. Verificar con `/api/health` → `"almacenamiento": "postgresql"`.

Sin `DATABASE_URL`, los perfiles se guardan en JSON local (`data/`).

## Deploy (Render Free)

- Root Directory: `server`
- Build: `npm install`
- Start: `node index.js`
- Health check: `/api/health`

El archivo `render.yaml` en la raíz del proyecto describe esa configuración.

**Limitación del plan free:** tras ~15 min sin visitas el servicio duerme; la primera
carga puede tardar 30–60 s.
