# Así Salgo!

Aplicación web para decidir a dónde salir hoy en Rosario y Buenos Aires, según la
energía con la que estás, el tipo de plan y qué tan cerca querés quedarte. Además
de proponer salidas con datos reales de la ciudad (agenda cultural, clima y
espacios públicos), tiene una parte de comunidad donde una persona publica un plan
y otras se suman con un botón "Me sumo".

- **Autor:** Leonardo Dalvez
- **Materia:** Proyecto Final — Tecnicatura Universitaria en Informática Aplicada al Diseño Multimedial y Web (UNL)
- **Producción:** https://asi-salgo.onrender.com

## Cómo está hecho

Es un proyecto sin frameworks para mantenerlo liviano y poder explicar cada parte:

- **Frontend:** HTML, CSS y JavaScript vanilla (`frontend/`).
- **Backend:** Node.js sin dependencias de framework (`server/index.js`). Un solo
  proceso sirve las páginas y expone la API REST.
- **Datos externos:** agendas municipales de Rosario y Buenos Aires, clima de
  Open-Meteo, parques y espacios públicos de OpenStreetMap y geocodificación con
  Nominatim. Todas gratuitas y sin API key.
- **Base de datos:** PostgreSQL (Supabase) solo para los perfiles de la comunidad.
  Si no hay base configurada, el server guarda esos datos en archivos JSON locales,
  así se puede correr sin configurar nada.

## Requisitos

- Node.js 18 o superior.

No hace falta base de datos ni claves para probarlo en local.

## Cómo ejecutarlo

```bash
cd server
npm install
npm start
```

Después abrir http://localhost:3000

Si el puerto 3000 está ocupado, se puede usar otro: `PORT=3001 npm start`.

### Con base de datos (opcional)

Para que los perfiles persistan en PostgreSQL en vez de JSON local, copiar el
ejemplo de variables y completar la cadena de conexión:

```bash
cd server
cp .env.example .env
# editar .env y pegar DATABASE_URL
npm start
```

El paso a paso completo de Supabase y del deploy en Render está en
[`server/README.md`](server/README.md).

## Estructura del proyecto

```
asi-salgo/
├── frontend/            Páginas, estilos y JS del cliente
│   ├── *.html           Una página por pantalla (home, viaje, mapa, salen, etc.)
│   ├── css/             Estilos (base, responsive, y uno por página)
│   └── js/              Lógica de cada pantalla + navegación compartida
├── server/              Backend Node
│   ├── index.js         Servidor HTTP: sirve el frontend y la API
│   ├── adapters/        Adaptadores por fuente externa (Rosario, BA, clima, lugares)
│   ├── lib/             Utilidades (geo, seguridad, perfiles, comunidad, etc.)
│   └── sql/             Scripts para crear la tabla de perfiles en Supabase
├── docs/                Memoria de desarrollo y checklist de entrega
└── Concepto/            Guía de marca y planificación
```

## API (resumen)

La API vive bajo `/api`. Los endpoints principales:

- `GET /api/eventos` — salidas según ciudad, momento, plan, energía y distancia.
- `GET /api/lugares` — espacios públicos para el mapa.
- `GET /api/salen` / `POST /api/salen` — comunidad: listar y publicar planes.
- `GET /api/health` — estado del server y tipo de almacenamiento.

El detalle de parámetros y respuestas está en [`server/README.md`](server/README.md).

## Pantallas

Home, Entrar (identidad), El viaje (cuestionario de tres pasos), Mapa de lugares,
Salen (comunidad), Sobre, Contacto, Este mes y Con peques.
