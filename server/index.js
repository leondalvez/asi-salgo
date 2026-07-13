const http = require('http');
const path = require('path');
const fs = require('fs');
const { fetchEventosCiudad } = require('./lib/fetchEventosCiudad');
const { fetchClima } = require('./adapters/clima');
const { fetchComplementos, fetchLugaresParaMapa } = require('./adapters/lugares');
const { esCiudadValida, listarCiudades, IDS_CIUDADES } = require('./lib/ciudades');
const { ordenarPorRelevancia } = require('./lib/relevancia');
const { geocodificarEventos } = require('./lib/geocoder');
const { agregarSuscripcion } = require('./lib/suscripciones');
const { crearCompartido, obtenerCompartido } = require('./lib/compartir');
const { crearSalida, listarSalidas, sumarse, enriquecerCoordenadasSalidas } = require('./lib/salidasComunidad');
const { registrarPerfil, ingresarPerfil } = require('./lib/perfiles');
const { probarConexion, estaConfigurada } = require('./lib/db');
const {
    enriquecerConDistancia,
    filtrarPorDistancia,
    ordenarPorCercania
} = require('./lib/geo');
const {
    rechazarOrigenEscritura,
    combinarCabeceras,
    esUrlSegura,
    leerCuerpo
} = require('./lib/seguridad');

const PUERTO = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Una request que falla no debería tirar abajo el servidor para todos los
// demás usuarios. Node por defecto termina el proceso ante una rejection sin
// catch; acá la registramos y seguimos vivos.
process.on('unhandledRejection', (error) => {
    console.error('[unhandledRejection]', error);
});

process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
});

/**
 * Corre una promesa con un tope de tiempo: si no resuelve a tiempo, sigue
 * la request con lo que se haya logrado hasta ahí (no cancela la promesa
 * original, solo deja de esperarla).
 */
function conLimiteDeTiempo(promesa, ms, valorPorDefecto) {
    return new Promise((resolve) => {
        const cronometro = setTimeout(() => resolve(valorPorDefecto), ms);
        promesa.then(
            (valor) => {
                clearTimeout(cronometro);
                resolve(valor);
            },
            () => {
                clearTimeout(cronometro);
                resolve(valorPorDefecto);
            }
        );
    });
}

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8'
};

function enviarJson(respuesta, codigo, datos, req, { escritura = false } = {}) {
    const cuerpo = JSON.stringify(datos);
    respuesta.writeHead(
        codigo,
        combinarCabeceras(req, { 'Content-Type': 'application/json; charset=utf-8' }, { escritura })
    );
    respuesta.end(cuerpo);
}

function rechazarEscritura(req, respuesta) {
    if (!rechazarOrigenEscritura(req)) return false;
    enviarJson(respuesta, 403, { error: 'Origen no permitido.' }, req, { escritura: true });
    return true;
}

async function leerJson(req, respuesta) {
    try {
        const cuerpo = await leerCuerpo(req);
        return cuerpo ? JSON.parse(cuerpo) : {};
    } catch (error) {
        if (error.codigo === 413) {
            enviarJson(respuesta, 413, { error: 'La solicitud es demasiado grande.' }, req, { escritura: true });
            return null;
        }
        if (error instanceof SyntaxError) {
            enviarJson(respuesta, 400, { error: 'JSON inválido.' }, req, { escritura: true });
            return null;
        }
        throw error;
    }
}

function servirArchivo(rutaSolicitada, respuesta, req) {
    const rutaSegura = path.normalize(rutaSolicitada).replace(/^(\.\.[/\\])+/, '');
    const rutaCompleta = path.join(FRONTEND_DIR, rutaSegura);

    if (!rutaCompleta.startsWith(FRONTEND_DIR)) {
        respuesta.writeHead(403, combinarCabeceras(req));
        respuesta.end('Forbidden');
        return;
    }

    fs.readFile(rutaCompleta, (error, contenido) => {
        if (error) {
            respuesta.writeHead(404, combinarCabeceras(req));
            respuesta.end('Not found');
            return;
        }

        const extension = path.extname(rutaCompleta).toLowerCase();
        const cabeceras = { 'Content-Type': MIME[extension] || 'application/octet-stream' };
        if (extension === '.html') {
            cabeceras['Cache-Control'] = 'no-cache, must-revalidate';
        }
        respuesta.writeHead(200, combinarCabeceras(req, cabeceras));
        respuesta.end(contenido);
    });
}

async function manejarEventos(url, respuesta, req) {
    const ciudad = url.searchParams.get('ciudad') || 'rosario';
    const momento = url.searchParams.get('momento') || 'hoy';
    const plan = url.searchParams.get('plan') || '';
    const energia = url.searchParams.get('energia') || '';
    const perfil = url.searchParams.get('perfil') || '';
    const limite = Math.min(Number(url.searchParams.get('limite') || 6), 12);
    const distancia = url.searchParams.get('distancia') || 'ciudad';
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const tieneUbicacion = Number.isFinite(lat) && Number.isFinite(lng);

    if (!esCiudadValida(ciudad)) {
        enviarJson(respuesta, 400, {
            error: 'Ciudad no soportada',
            ciudades: IDS_CIUDADES
        }, req);
        return;
    }

    try {
        const [resultado, clima, complementosRaw] = await Promise.all([
            fetchEventosCiudad({ ciudad, momento, plan }),
            fetchClima(ciudad).catch((error) => {
                console.warn('[clima]', error.message);
                return null;
            }),
            fetchComplementos({ ciudad, plan, energia, limite: 5 }).catch((error) => {
                console.warn('[complementos]', error.message);
                return [];
            })
        ]);

        let eventos = ordenarPorRelevancia(resultado.eventos, plan);
        let complementos = complementosRaw;
        let aviso = resultado.aviso;

        if (perfil === 'peques') {
            const totalAntes = eventos.length;
            eventos = eventos.filter((evento) => evento.aptoNinos === true);
            if (!eventos.length && totalAntes > 0) {
                aviso = [
                    aviso,
                    'No encontramos eventos marcados como aptos para infancias en este momento: te mostramos espacios públicos cerca tuyo mientras tanto.'
                ]
                    .filter(Boolean)
                    .join(' ');
            }
        }

        if (tieneUbicacion) {
            // Muchos eventos (sobre todo de Rosario) no traen coordenadas propias.
            // Geocodificamos por dirección/lugar antes de calcular distancias,
            // limitado a los candidatos más relevantes y con un tope de tiempo
            // total para no demorar la respuesta más de lo razonable.
            const candidatos = eventos.slice(0, Math.max(limite * 2, 12));
            await conLimiteDeTiempo(
                geocodificarEventos(candidatos, ciudad).catch((error) => {
                    console.warn('[geocoder]', error.message);
                }),
                8000
            );

            eventos = enriquecerConDistancia(eventos, lat, lng);
            complementos = enriquecerConDistancia(complementos, lat, lng);
            eventos = filtrarPorDistancia(eventos, distancia, lat, lng);
            complementos = filtrarPorDistancia(complementos, distancia, lat, lng);
            eventos = ordenarPorCercania(eventos);
            complementos = ordenarPorCercania(complementos);
        }

        eventos = eventos.slice(0, limite);
        complementos = complementos.slice(0, 4);

        enviarJson(respuesta, 200, {
            ciudad,
            momento,
            plan,
            perfil,
            distancia,
            ubicacion: tieneUbicacion ? { lat, lng } : null,
            total: eventos.length,
            fuente: resultado.fuente,
            aviso,
            clima,
            complementos,
            eventos
        }, req);
    } catch (error) {
        console.error('[api/eventos]', error);
        enviarJson(respuesta, 502, {
            error: 'No pudimos armar tu salida en este momento.',
            detalle: error.message
        }, req);
    }
}

const ETIQUETAS_VALIDAS = ['parques', 'plazas', 'deporte', 'turismo', 'cultural'];

async function manejarLugares(url, respuesta, req) {
    const ciudad = url.searchParams.get('ciudad') || 'rosario';
    const etiquetasParam = url.searchParams.get('etiquetas') || '';
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const tieneUbicacion = Number.isFinite(lat) && Number.isFinite(lng);

    if (!esCiudadValida(ciudad)) {
        enviarJson(respuesta, 400, {
            error: 'Ciudad no soportada',
            ciudades: IDS_CIUDADES
        }, req);
        return;
    }

    const etiquetas = etiquetasParam
        .split(',')
        .map((valor) => valor.trim())
        .filter((valor) => ETIQUETAS_VALIDAS.includes(valor));

    try {
        let lugares = await conLimiteDeTiempo(
            fetchLugaresParaMapa({ ciudad, etiquetas, limite: 24 }),
            15000,
            []
        );

        if (tieneUbicacion) {
            lugares = enriquecerConDistancia(lugares, lat, lng);
            lugares = ordenarPorCercania(lugares);
        }

        enviarJson(respuesta, 200, {
            ciudad,
            ubicacion: tieneUbicacion ? { lat, lng } : null,
            total: lugares.length,
            aviso: lugares.length
                ? null
                : 'No pudimos traer lugares en este momento. Probá de nuevo en unos minutos.',
            lugares
        }, req);
    } catch (error) {
        console.error('[api/lugares]', error);
        enviarJson(respuesta, 502, {
            error: 'No pudimos cargar el mapa de salidas en este momento.',
            detalle: error.message
        }, req);
    }
}

const CIUDAD_ETIQUETA = {
    rosario: 'Rosario',
    'buenos-aires': 'Buenos Aires'
};

function escaparHtml(texto = '') {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatearFechaCompartida(fechaIso) {
    if (!fechaIso) return 'Fecha a confirmar';
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return 'Fecha a confirmar';
    return fecha.toLocaleString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function urlBase(req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PUERTO}`;
    const protocolo = req.headers['x-forwarded-proto'] || 'http';
    return `${protocolo}://${host}`;
}

function construirHtmlCompartido(registro, base) {
    const { evento } = registro;
    const titulo = evento.titulo || 'Una salida para compartir';
    const ciudad = CIUDAD_ETIQUETA[evento.ciudad] || 'la ciudad';
    const donde = evento.direccion || evento.lugar || ciudad;
    const descripcionOg = [
        formatearFechaCompartida(evento.fechaInicio),
        donde,
        'Invitación de Así Salgo!'
    ].join(' · ');
    const descripcion = evento.descripcion || 'Una salida real para salir de la pantalla y disfrutar la ciudad.';
    const url = `${base}/compartir/${registro.id}`;
    const imagen = `${base}/og-salida.png`;
    const mapsParams = new URLSearchParams({
        api: '1',
        destination:
            evento.lat != null && evento.lng != null
                ? `${evento.lat},${evento.lng}`
                : `${donde}, ${ciudad}`,
        travelmode: 'walking'
    });
    const maps = `https://www.google.com/maps/dir/?${mapsParams}`;
    const entrada =
        evento.gratis === true ? 'Entrada gratis' : evento.gratis === false ? 'Entrada paga' : '';
    const linkEvento = esUrlSegura(evento.link);

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escaparHtml(titulo)} — Así Salgo!</title>
    <meta name="description" content="${escaparHtml(descripcionOg)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escaparHtml(`Salimos: ${titulo}`)}">
    <meta property="og:description" content="${escaparHtml(descripcionOg)}">
    <meta property="og:image" content="${escaparHtml(imagen)}">
    <meta property="og:url" content="${escaparHtml(url)}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        :root { color-scheme: dark; }
        body {
            margin: 0;
            min-height: 100vh;
            font-family: Inter, system-ui, sans-serif;
            background: #10131a;
            color: #f4f7fb;
            display: grid;
            place-items: center;
            padding: 24px;
        }
        .tarjeta {
            width: min(560px, 100%);
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 18px;
            padding: 28px;
            background: linear-gradient(180deg, rgba(255,255,255,.04), transparent);
        }
        .eyebrow {
            color: #9fd9cc;
            font-size: .78rem;
            letter-spacing: .08em;
            text-transform: uppercase;
            margin: 0 0 10px;
        }
        h1 { margin: 0 0 12px; font-size: 1.6rem; line-height: 1.25; }
        p { margin: 0 0 14px; color: #a8b3c2; line-height: 1.55; }
        dl { margin: 18px 0 24px; display: grid; gap: 12px; }
        dt { color: #7f8b9b; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
        dd { margin: 4px 0 0; color: #e8edf4; }
        .acciones { display: flex; flex-wrap: wrap; gap: 12px; }
        a {
            color: #9fd9cc;
            text-decoration: none;
            font-weight: 600;
            font-size: .92rem;
        }
        a:hover, a:focus-visible { text-decoration: underline; }
        .cta {
            display: inline-flex;
            margin-top: 22px;
            padding: 12px 18px;
            border-radius: 999px;
            background: #9fd9cc;
            color: #10131a;
            font-weight: 600;
        }
        .cta:hover, .cta:focus-visible { text-decoration: none; filter: brightness(1.05); }
    </style>
</head>
<body>
    <article class="tarjeta">
        <p class="eyebrow">Te invitaron a salir</p>
        <h1>${escaparHtml(titulo)}</h1>
        <p>${escaparHtml(descripcion)}</p>
        <dl>
            <div>
                <dt>Cuándo</dt>
                <dd>${escaparHtml(formatearFechaCompartida(evento.fechaInicio))}</dd>
            </div>
            <div>
                <dt>Dónde</dt>
                <dd>${escaparHtml(donde)}</dd>
            </div>
            ${entrada ? `<div><dt>Entrada</dt><dd>${escaparHtml(entrada)}</dd></div>` : ''}
        </dl>
        <div class="acciones">
            <a href="${escaparHtml(maps)}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
            ${linkEvento ? `<a href="${escaparHtml(linkEvento)}" target="_blank" rel="noopener noreferrer">Ver más del evento</a>` : ''}
        </div>
        <a class="cta" href="/viaje.html">Encontrá tu propia salida en Así Salgo!</a>
    </article>
</body>
</html>`;
}

async function manejarCrearCompartir(req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const registro = crearCompartido(datos);
        const base = urlBase(req);
        enviarJson(respuesta, 201, {
            ok: true,
            id: registro.id,
            url: `${base}/compartir/${registro.id}`
        }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos preparar el link.' }, req, {
            escritura: true
        });
    }
}

function manejarPaginaCompartir(id, req, respuesta) {
    const registro = obtenerCompartido(id);
    if (!registro) {
        respuesta.writeHead(404, combinarCabeceras(req, { 'Content-Type': 'text/html; charset=utf-8' }));
        respuesta.end('<!DOCTYPE html><html lang="es"><body><p>Esta invitación ya no está disponible.</p><p><a href="/viaje.html">Ir a Así Salgo!</a></p></body></html>');
        return;
    }

    const html = construirHtmlCompartido(registro, urlBase(req));
    respuesta.writeHead(200, combinarCabeceras(req, { 'Content-Type': 'text/html; charset=utf-8' }));
    respuesta.end(html);
}

async function manejarSalenListado(url, respuesta, req) {
    const ciudad = url.searchParams.get('ciudad') || '';
    let salidas = listarSalidas({ ciudad: ciudad || undefined });
    await conLimiteDeTiempo(
        enriquecerCoordenadasSalidas(salidas, { maxConsultas: 4 }).catch((error) => {
            console.warn('[salen/geocoder]', error.message);
        }),
        8000
    );
    enviarJson(respuesta, 200, { total: salidas.length, salidas }, req);
}

async function manejarSalenPublicar(req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const salida = crearSalida(datos);
        enviarJson(respuesta, 201, { ok: true, salida }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos publicar tu salida.' }, req, {
            escritura: true
        });
    }
}

async function manejarPerfilRegistrar(req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const perfil = await registrarPerfil(datos.nombre);
        enviarJson(respuesta, 201, { ok: true, perfil }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos crear tu perfil.' }, req, {
            escritura: true
        });
    }
}

async function manejarPerfilIngresar(req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const perfil = await ingresarPerfil(datos.nombre, datos.codigo);
        enviarJson(respuesta, 200, { ok: true, perfil }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos encontrar tu perfil.' }, req, {
            escritura: true
        });
    }
}

async function manejarSalenSumo(id, req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const resultado = sumarse(id, datos);
        enviarJson(respuesta, 200, {
            ok: true,
            yaEstaba: resultado.yaEstaba,
            salida: resultado.salida
        }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos sumarte a esta salida.' }, req, {
            escritura: true
        });
    }
}

async function manejarSuscripcion(req, respuesta) {
    if (rechazarEscritura(req, respuesta)) return;

    try {
        const datos = await leerJson(req, respuesta);
        if (!datos) return;

        const registro = agregarSuscripcion(datos);
        enviarJson(respuesta, 201, { ok: true, suscripcion: { email: registro.email } }, req, { escritura: true });
    } catch (error) {
        const codigo = error.codigo || 400;
        enviarJson(respuesta, codigo, { error: error.message || 'No pudimos guardar tu suscripción.' }, req, {
            escritura: true
        });
    }
}

const servidor = http.createServer(async (req, respuesta) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
        if (rechazarOrigenEscritura(req)) {
            respuesta.writeHead(403, combinarCabeceras(req));
            respuesta.end();
            return;
        }

        respuesta.writeHead(204, combinarCabeceras(req, {}, { escritura: true }));
        respuesta.end();
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
        const baseDatos = estaConfigurada() ? await probarConexion() : { ok: false, motivo: 'json_local' };
        enviarJson(respuesta, 200, {
            ok: true,
            ciudades: IDS_CIUDADES,
            almacenamiento: baseDatos.ok ? 'postgresql' : baseDatos.motivo
        }, req);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/ciudades') {
        enviarJson(respuesta, 200, { ciudades: listarCiudades() }, req);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/eventos') {
        await manejarEventos(url, respuesta, req);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/lugares') {
        await manejarLugares(url, respuesta, req);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/suscripciones') {
        await manejarSuscripcion(req, respuesta);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/compartir') {
        await manejarCrearCompartir(req, respuesta);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/perfiles/registrar') {
        await manejarPerfilRegistrar(req, respuesta);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/perfiles/ingresar') {
        await manejarPerfilIngresar(req, respuesta);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/salen') {
        await manejarSalenListado(url, respuesta, req);
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/salen') {
        await manejarSalenPublicar(req, respuesta);
        return;
    }

    const matchSumo = url.pathname.match(/^\/api\/salen\/([a-f0-9]{12})\/sumo$/);
    if (req.method === 'POST' && matchSumo) {
        await manejarSalenSumo(matchSumo[1], req, respuesta);
        return;
    }

    const matchCompartir = url.pathname.match(/^\/compartir\/([a-f0-9]{10})$/);
    if (req.method === 'GET' && matchCompartir) {
        manejarPaginaCompartir(matchCompartir[1], req, respuesta);
        return;
    }

    if (req.method === 'GET') {
        const ruta = url.pathname === '/' ? '/index.html' : url.pathname;
        servirArchivo(ruta, respuesta, req);
        return;
    }

    try {
        await leerCuerpo(req);
    } catch (error) {
        if (error.codigo === 413) {
            enviarJson(respuesta, 413, { error: 'La solicitud es demasiado grande.' }, req, { escritura: true });
            return;
        }
    }

    respuesta.writeHead(405, combinarCabeceras(req));
    respuesta.end('Method not allowed');
});

servidor.listen(PUERTO, () => {
    console.log(`Así Salgo! listo en http://localhost:${PUERTO}`);
    console.log('API eventos: http://localhost:' + PUERTO + '/api/eventos?ciudad=rosario&momento=hoy');
});
