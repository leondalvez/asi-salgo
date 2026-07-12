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

## Supabase / PostgreSQL (perfiles de comunidad)

Los perfiles (`Camila#4821`) se guardan en **PostgreSQL** cuando existe la variable `DATABASE_URL`. Si no está configurada, el server usa JSON local (`server/data/`) para desarrollo.

### 1. Crear la tabla en Supabase

1. Entrá a [supabase.com](https://supabase.com) → tu proyecto.
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Abrí en tu proyecto el archivo `server/sql/001-crear-tabla-perfiles.sql`.
4. Copiá **todo** el SQL (desde `CREATE TABLE` hasta el `CREATE INDEX`) y pegá en Supabase.
5. Clic **Run** → debe decir **Success**.
6. Opcional: ejecutá `002-verificar-perfiles.sql` para confirmar que la tabla existe.

### 2. Obtener la connection string

1. **Project Settings** (engranaje) → **Database**.
2. En **Connection string**, elegí **URI**.
3. Marcá **Use connection pooling** → modo **Session** (recomendado para Render).
4. Copiá la URI y reemplazá `[YOUR-PASSWORD]` por la contraseña de la base (la definiste al crear el proyecto; si la olvidaste: **Reset database password** en la misma pantalla).

Ejemplo de forma (no uses este valor literal):

```
postgresql://postgres.abcdefgh:[TU-CLAVE]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 3. Variable en Render

1. Render → tu servicio **asi-salgo** → **Environment**.
2. **Add Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** la URI completa (con la contraseña ya puesta).
3. **Save Changes** → Render redeploya solo.

### 4. Variable en local (opcional)

```powershell
cd server
copy .env.example .env
# Editá .env y pegá tu DATABASE_URL
npm install
npm start
```

En Windows PowerShell también podés:

```powershell
$env:DATABASE_URL="postgresql://..."
npm start
```

### 5. Verificar que conectó

Abrí:

```
https://TU-URL.onrender.com/api/health
```

Deberías ver:

```json
{
  "ok": true,
  "ciudades": ["rosario", "buenos-aires"],
  "almacenamiento": "postgresql"
}
```

Si dice `"almacenamiento": "json_local"` o `"sin DATABASE_URL"`, la variable no llegó al server.

### Flujo de registro (sin cambiar el frontend)

1. Usuario elige nombre en `entrar.html`.
2. `POST /api/perfiles/registrar` → `INSERT` en tabla `perfiles`.
3. Respuesta con `id`, `nombre`, `codigo`, `nombreVisible`.
4. El navegador guarda eso en `localStorage` (`asi-salgo-perfil`).
5. En otro dispositivo: **Ya tengo código** → `POST /api/perfiles/ingresar` → `SELECT` por nombre + código.

## Deploy gratuito (sin pagar hosting)

El proyecto usa Node + el paquete `pg` para PostgreSQL. Un solo proceso sirve el frontend y la API.

### Opción A — Render.com Free (recomendada para el TP)

URL fija con HTTPS, por ejemplo `https://asi-salgo.onrender.com`.

1. Creá una cuenta gratis en [render.com](https://render.com).
2. Subí el proyecto a **GitHub** (cuenta gratis). Si no tenés Git instalado: [git-scm.com](https://git-scm.com/download/win).
3. En Render: **New → Web Service** → conectá el repo.
4. Configuración:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Plan:** Free
5. Render inyecta `PORT` automáticamente; el server ya usa `process.env.PORT`.
6. Health check: `/api/health`

También podés importar el `render.yaml` de la raíz del repo (Blueprint).

**Limitaciones del tier gratis (no son bugs):**

- Tras ~15 min sin visitas el servicio **duerme**. El primer acceso puede tardar **30–60 s**.
- El disco de Render es **efímero** para JSON; los **perfiles** persisten en Supabase si configuraste `DATABASE_URL`.
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
