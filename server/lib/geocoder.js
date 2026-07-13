/**
 * Geocodificación gratuita (OpenStreetMap Nominatim) para eventos que no
 * traen lat/lng propios (hoy, todos los de la agenda de Rosario y algunos
 * de Buenos Aires). Sin esto, el filtro "por cercanía" nunca podía aplicarse
 * a esos eventos.
 *
 * Respeta la política de uso de Nominatim: máximo 1 consulta/segundo y un
 * User-Agent identificable. Además:
 *  - Agrupa eventos por dirección/lugar antes de consultar, porque muchos
 *    eventos culturales comparten sede (un museo puede tener 10 actividades).
 *  - Cachea resultados en memoria durante la vida del proceso.
 *  - Limita cuántas direcciones *nuevas* consulta por request, para no
 *    demorar la respuesta más de unos segundos.
 */

const { contextoGeocoder } = require('./ciudades');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const INTERVALO_MINIMO_MS = 1100;
const MAX_CONSULTAS_NUEVAS_POR_REQUEST = 6;

const cache = new Map();
let ultimaConsulta = 0;

function normalizarClave(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function esperarTurno() {
    const espera = ultimaConsulta + INTERVALO_MINIMO_MS - Date.now();
    if (espera > 0) {
        await new Promise((resolve) => setTimeout(resolve, espera));
    }
    ultimaConsulta = Date.now();
}

async function consultarNominatim(consulta) {
    await esperarTurno();

    const params = new URLSearchParams({
        q: consulta,
        format: 'json',
        limit: '1',
        countrycodes: 'ar'
    });

    try {
        const respuesta = await fetch(`${NOMINATIM_URL}?${params}`, {
            headers: {
                'User-Agent': 'AsiSalgo/1.0 (+proyecto universitario; sin fines comerciales)',
                'Accept-Language': 'es'
            },
            signal: AbortSignal.timeout(6000)
        });

        if (!respuesta.ok) return null;

        const resultados = await respuesta.json();
        const primero = resultados?.[0];
        if (!primero) return null;

        const lat = Number(primero.lat);
        const lng = Number(primero.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return { lat, lng };
    } catch (error) {
        console.warn('[geocoder] Nominatim falló:', error.message);
        return null;
    }
}

/**
 * Agrega coordenadas a los eventos que no las tengan, agrupando por
 * dirección/lugar para minimizar consultas de red repetidas.
 * Muta y devuelve el mismo array recibido.
 */
async function geocodificarEventos(eventos, ciudad) {
    const contexto = contextoGeocoder(ciudad);
    const grupos = new Map();

    for (const evento of eventos) {
        if (evento.lat != null && evento.lng != null) continue;

        const texto = evento.direccion || evento.lugar;
        if (!texto) continue;

        const consulta = `${texto}, ${contexto}, Argentina`;
        const clave = normalizarClave(consulta);

        if (!grupos.has(clave)) {
            grupos.set(clave, { consulta, eventos: [] });
        }
        grupos.get(clave).eventos.push(evento);
    }

    let consultasNuevas = 0;

    for (const [clave, grupo] of grupos) {
        let coordenadas;

        if (cache.has(clave)) {
            coordenadas = cache.get(clave);
        } else {
            if (consultasNuevas >= MAX_CONSULTAS_NUEVAS_POR_REQUEST) continue;
            consultasNuevas += 1;
            coordenadas = await consultarNominatim(grupo.consulta);
            cache.set(clave, coordenadas);
        }

        if (!coordenadas) continue;

        for (const evento of grupo.eventos) {
            evento.lat = coordenadas.lat;
            evento.lng = coordenadas.lng;
            evento.geocodificado = true;
        }
    }

    return eventos;
}

/**
 * Misma lógica que geocodificarEventos, pero para cualquier ítem con
 * direccion/lugar (salidas comunitarias, etc.).
 */
async function geocodificarItems(items, ciudad, { maxConsultas = 6 } = {}) {
    const contexto = contextoGeocoder(ciudad);
    const grupos = new Map();

    for (const item of items) {
        if (item.lat != null && item.lng != null) continue;

        const texto = item.direccion || item.lugar;
        if (!texto) continue;

        const consulta = `${texto}, ${contexto}, Argentina`;
        const clave = normalizarClave(consulta);

        if (!grupos.has(clave)) {
            grupos.set(clave, { consulta, items: [] });
        }
        grupos.get(clave).items.push(item);
    }

    let consultasNuevas = 0;

    for (const [clave, grupo] of grupos) {
        let coordenadas;

        if (cache.has(clave)) {
            coordenadas = cache.get(clave);
        } else {
            if (consultasNuevas >= maxConsultas) continue;
            consultasNuevas += 1;
            coordenadas = await consultarNominatim(grupo.consulta);
            cache.set(clave, coordenadas);
        }

        if (!coordenadas) continue;

        for (const item of grupo.items) {
            item.lat = coordenadas.lat;
            item.lng = coordenadas.lng;
            item.geocodificado = true;
        }
    }

    return items;
}

module.exports = {
    geocodificarEventos,
    geocodificarItems
};
