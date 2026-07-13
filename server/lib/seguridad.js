/**
 * Cabeceras, CORS restrictivo, límite de body y validación de URLs externas.
 */

const MAX_CUERPO_JSON = 32 * 1024;

const ORIGENES_BASE = [
    'https://asi-salgo.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

function listarOrigenesPermitidos() {
    const extra = (process.env.ORIGENES_PERMITIDOS || process.env.ORIGEN_PERMITIDO || '')
        .split(',')
        .map((valor) => valor.trim())
        .filter(Boolean);

    return [...new Set([...ORIGENES_BASE, ...extra])];
}

function origenPermitido(origen) {
    if (!origen || typeof origen !== 'string') return null;
    const limpio = origen.trim();
    return listarOrigenesPermitidos().includes(limpio) ? limpio : null;
}

/** POST con Origin ajeno a la lista → rechazar (CORS no bloquea el request en el servidor). */
function rechazarOrigenEscritura(req) {
    const origen = req.headers.origin;
    if (!origen) return false;
    return !origenPermitido(origen);
}

function cabecerasSeguridad() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' https://unpkg.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https://*.basemaps.cartocdn.com https://*.openstreetmap.org",
            "connect-src 'self' https://*.basemaps.cartocdn.com",
            'frame-ancestors \'none\''
        ].join('; ')
    };
}

function cabecerasCors(req, { escritura = false } = {}) {
    const origen = origenPermitido(req.headers.origin);
    if (!origen) return {};

    return {
        'Access-Control-Allow-Origin': origen,
        'Access-Control-Allow-Methods': escritura ? 'POST, OPTIONS' : 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin'
    };
}

function combinarCabeceras(req, extra = {}, { escritura = false } = {}) {
    return {
        ...cabecerasSeguridad(),
        ...cabecerasCors(req, { escritura }),
        ...extra
    };
}

function esUrlSegura(url) {
    if (!url || typeof url !== 'string') return null;

    const limpia = url.trim();
    if (!limpia) return null;

    try {
        const parsed = new URL(limpia);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return limpia;
        }
    } catch {
        /* URL inválida */
    }

    return null;
}

function leerCuerpo(req, maximo = MAX_CUERPO_JSON) {
    return new Promise((resolve, reject) => {
        let datos = '';
        let tamano = 0;

        req.on('data', (chunk) => {
            tamano += chunk.length;
            if (tamano > maximo) {
                const error = new Error('Cuerpo demasiado grande.');
                error.codigo = 413;
                reject(error);
                req.destroy();
                return;
            }
            datos += chunk;
        });

        req.on('end', () => resolve(datos));
        req.on('error', reject);
    });
}

module.exports = {
    MAX_CUERPO_JSON,
    listarOrigenesPermitidos,
    origenPermitido,
    rechazarOrigenEscritura,
    cabecerasSeguridad,
    cabecerasCors,
    combinarCabeceras,
    esUrlSegura,
    leerCuerpo
};
