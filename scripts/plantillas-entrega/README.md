# Así Salgo!

Aplicación web para decidir a dónde salir hoy en Rosario y Buenos Aires.
El usuario elige energía, tipo de plan y distancia; la app propone salidas
reales (agenda cultural, clima y espacios públicos) y permite publicar un
plan para que otras personas se sumen con **Me sumo**.

| | |
|---|---|
| **Autor** | Leonardo Dalvez |
| **Materia** | Proyecto Final — Tecnicatura Universitaria en Informática Aplicada al Diseño Multimedial y Web (UNL) |
| **Producción** | https://asi-salgo.onrender.com |

## Requisitos

- Node.js 18 o superior

No hace falta base de datos ni API keys para ejecutarlo en local.

## Cómo ejecutarlo

```bash
cd server
npm install
npm start
```

Abrir en el navegador: http://localhost:3000

Si el puerto 3000 está ocupado:

```bash
set PORT=3001
npm start
```

(En PowerShell: `$env:PORT=3001; npm start`)

### Base de datos (opcional)

Por defecto los perfiles de comunidad se guardan en JSON local (`server/data/`).
Para usar PostgreSQL (Supabase):

1. Copiar `server/.env.example` como `server/.env`
2. Completar `DATABASE_URL`
3. Ejecutar el SQL de `server/sql/001-crear-tabla-perfiles.sql` en Supabase
4. Volver a correr `npm start`

Detalle en [`server/README.md`](server/README.md).

## Qué incluye este proyecto

| Carpeta | Contenido |
|---------|-----------|
| `frontend/` | HTML, CSS y JavaScript del cliente |
| `server/` | Servidor Node: archivos estáticos + API REST |
| `server/adapters/` | Conexión a cada fuente externa (Rosario, BA, clima, lugares) |
| `server/lib/` | Geo, seguridad, perfiles, comunidad, geocoder |
| `server/sql/` | Scripts para la tabla de perfiles |
| `docs/` | Memoria de desarrollo y checklist de evidencias |
| `Concepto/` | Guía de marca y planificación del proyecto |

## Pantallas

Home, Entrar, El viaje, Mapa de salidas, Salen, Sobre, Contacto, Este mes y Con peques.

## API (resumen)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor y tipo de almacenamiento |
| GET | `/api/eventos` | Salidas según ciudad, momento, plan, energía y distancia |
| GET | `/api/lugares` | Espacios públicos para el mapa |
| GET / POST | `/api/salen` | Listar y publicar planes de comunidad |
| POST | `/api/perfiles/registrar` | Crear identidad (nombre + código) |
| POST | `/api/perfiles/ingresar` | Recuperar perfil con nombre y código |

Parámetros y ejemplos: [`server/README.md`](server/README.md).

## Documentación para la evaluación

- [`docs/Memoria-de-Desarrollo.md`](docs/Memoria-de-Desarrollo.md) — decisiones técnicas, arquitectura y estado del avance
- [`docs/entrega-evidencias.md`](docs/entrega-evidencias.md) — checklist de pruebas
- [`Concepto/Guia-de-Marca.md`](Concepto/Guia-de-Marca.md) — criterios de producto y tono
- Comentarios en cabecera de los módulos principales (`server/index.js`, adapters, `lib/`)

## Nota sobre el hosting gratuito

Render Free duerme el servicio tras unos minutos sin visitas. La primera carga
puede tardar 30–60 segundos; no es un error de la aplicación.
