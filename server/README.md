# Así Salgo! — servidor de eventos

Proxy liviano para consumir fuentes públicas de **Rosario** y **Buenos Aires** y servir el frontend.

## Fuentes conectadas

| Dato | Rosario | Buenos Aires |
|------|---------|--------------|
| Eventos culturales | Agenda municipal (`ws.rosario.gob.ar`) | Linda (`linda.buenosaires.gob.ar`) |
| Clima | Open-Meteo (sin API key) | Open-Meteo |
| Planes cerca | Datos útiles municipales (parques, plazas, deporte, turismo) | OpenStreetMap / Overpass (parques) |

Cuando la agenda de Rosario no responde, la app sigue funcionando con **clima + espacios públicos** según el plan elegido en El Viaje.

## Geo-referenciación por cercanía

Buenos Aires (Linda) ya trae `latitud`/`longitud` en la mayoría de sus eventos. Rosario, en cambio, no incluye coordenadas en su agenda cultural, así que el filtro "por cercanía" no podía aplicarse a esos eventos.

Para resolverlo, `lib/geocoder.js` geocodifica por dirección/lugar usando **OpenStreetMap Nominatim** (gratis, sin API key):

- Solo se activa cuando el usuario compartió su ubicación (`lat`/`lng` en la request), para no agregar latencia si no hace falta.
- Agrupa eventos por dirección antes de consultar (una sede cultural suele tener varias actividades) y cachea resultados en memoria durante la vida del proceso.
- Respeta la política de uso de Nominatim (máx. 1 consulta/segundo, `User-Agent` identificable) y limita a 10 direcciones *nuevas* por request para acotar el tiempo de respuesta.
- Si Nominatim no responde o no encuentra la dirección, el evento simplemente queda sin distancia (se sigue mostrando, solo no participa del orden por cercanía).

## Requisitos

- Node.js 18 o superior

## Cómo correrlo

```bash
cd server
npm start
```

Abrí [http://localhost:3000](http://localhost:3000)

Si el puerto 3000 ya está ocupado, cerrá el proceso anterior o usá `PORT=3001 npm start`.

## API

```http
GET /api/eventos?ciudad=rosario&momento=hoy&plan=Al%20aire%20libre&energia=desenchufarme&distancia=cerca&lat=-32.95&lng=-60.64
GET /api/eventos?ciudad=buenos-aires&momento=finde&plan=Mirar%20arte
GET /api/health
```

### Parámetros

- `ciudad`: `rosario` | `buenos-aires`
- `momento`: `hoy` | `manana` | `finde`
- `plan`: texto del plan elegido en El Viaje (opcional, mejora orden y complementos)
- `energia`: `desenchufarme` | `conectar` | `misterio` (opcional, afecta complementos)
- `distancia`: `cerca` | `barrio` | `ciudad` (requiere `lat` y `lng`)
- `limite`: cantidad máxima de eventos (default 6, máx 12)

### Respuesta

Incluye `eventos`, `clima`, `complementos`, `aviso` y `ubicacion`.

## Probar con amigos en la red local

1. Averiguá tu IP local (`ipconfig` en Windows).
2. Iniciá el servidor: `npm start`
3. Compartí `http://TU_IP:3000` en la misma Wi‑Fi.

## Nota sobre Rosario

La agenda municipal puede responder con error 500. En ese caso no usamos espacios culturales como reemplazo: mostramos **planes en espacios públicos** y el **clima actual** para decidir si conviene salir.

Contacto documentado del WS municipal: `equipoweb@rosario.gob.ar`

## Próximo paso (TP)

Este proxy Node reemplaza temporalmente el backend Java planificado. La interfaz unificada ya está pensada para migrar a JAX-RS + PostGIS más adelante.

## Deploy gratuito (sin pagar hosting)

El proyecto está listo para subir **sin base de datos paga**: un solo proceso Node sirve el frontend y la API. No hay dependencias en `package.json` (solo módulos nativos de Node).

### Opción A — Render.com Free (recomendada para el TP)

URL fija con HTTPS, por ejemplo `https://asi-salgo.onrender.com`.

1. Creá una cuenta gratis en [render.com](https://render.com).
2. Subí el proyecto a **GitHub** (cuenta gratis). Si no tenés Git instalado: [git-scm.com](https://git-scm.com/download/win).
3. En Render: **New → Web Service** → conectá el repo.
4. Configuración:
   - **Root Directory:** `server`
   - **Build Command:** (vacío o `echo ok`)
   - **Start Command:** `node index.js`
   - **Plan:** Free
5. Render inyecta `PORT` automáticamente; el server ya usa `process.env.PORT`.
6. Health check: `/api/health`

También podés importar el `render.yaml` de la raíz del repo (Blueprint).

**Limitaciones del tier gratis (no son bugs):**

- Tras ~15 min sin visitas el servicio **duerme**. El primer acceso puede tardar **30–60 s**.
- El disco es **efímero**: suscripciones, perfiles y salidas publicadas se reinician al redeploy. Para el TP alcanza; la comunidad arranca con datos demo automáticos.
- La carpeta `server/data/` está en `.gitignore` a propósito (datos locales). En producción free se generan archivos nuevos al usarse.

### Opción B — Cloudflare Tunnel (demo desde tu PC, $0)

HTTPS público mientras tu notebook esté prendida. Útil para la defensa oral si Render duerme.

```powershell
# Con el server corriendo en otra terminal: cd server && npm start
winget install Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:3000
```

Te da una URL tipo `https://xxxx.trycloudflare.com`. Copiá el link y abrilo; el túnel cierra cuando apagás la PC o Ctrl+C.

### Opción C — Misma red WiFi ($0)

`ipconfig` → compartí `http://TU_IP:3000` con quien esté en la misma red. Sin HTTPS.

### Qué NO hace falta pagar

| Recurso | Alternativa gratis actual |
|---------|---------------------------|
| Base de datos | JSON en `server/data/` |
| APIs eventos/clima/mapas | Municipales + Open-Meteo + OSM |
| HTTPS | Render o Cloudflare Tunnel |
| Dominio propio | Subdominio `.onrender.com` |
| Supabase | Solo si la cátedra exige PostgreSQL (free tier también es $0) |

### Checklist antes de presentar

- [ ] Probar `GET /api/health` en la URL pública
- [ ] Recorrer: Entrar → Home → El Viaje → Salen → Mapa
- [ ] Captura de PageSpeed Insights (gratis)
- [ ] Video corto de respaldo por si el servicio está dormido al abrir
