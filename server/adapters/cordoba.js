const { rangoMomento, algunaFechaEnRango } = require('../lib/fechas');
const { inferirAptoNinos } = require('./rosario');

const BASE = 'https://gobiernoabierto.cordoba.gob.ar/api/actividad-publica/';
const TOKEN = '00000000000000000000000000000000';

function limpiarHtml(texto = '') {
    return texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferirGratis(precios = []) {
    if (!precios.length) return null;
    if (
        precios.length === 1 &&
        precios[0].grupo?.nombre === 'Todos' &&
        precios[0].valor === '0.00'
    ) {
        return true;
    }
    const valores = precios.map((p) => Number(p.valor)).filter(Number.isFinite);
    if (!valores.length) return null;
    if (valores.every((v) => v === 0)) return true;
    if (valores.some((v) => v > 0)) return false;
    return null;
}

function normalizarActividad(act) {
    const lugar = act.lugar || {};
    return {
        id: `cordoba-actividad-${act.id}`,
        titulo: act.titulo || 'Actividad cultural',
        descripcion: limpiarHtml(act.descripcion || ''),
        fechaInicio: act.inicia || null,
        fechaFin: act.termina || act.inicia || null,
        lugar: lugar.nombre || null,
        direccion: lugar.direccion || null,
        lat: lugar.latitud ?? null,
        lng: lugar.longitud ?? null,
        etiquetas: (act.tipos || []).map((t) => t.nombre).filter(Boolean),
        ciudad: 'cordoba',
        gratis: inferirGratis(act.precios),
        aptoNinos: inferirAptoNinos(act.titulo, act.descripcion),
        fuente: 'agenda-municipal-cordoba',
        tipo: 'evento',
        link: act.id
            ? `https://modernizacionmunicba.github.io/agenda-cultural-de-cordoba/www/actividad.html#actID-${act.id}`
            : null
    };
}

async function fetchPaginaActividades(page = 1) {
    const params = new URLSearchParams({
        audiencia_id: '4',
        page: String(page),
        page_size: '40',
        format: 'json',
        token: TOKEN
    });

    const respuesta = await fetch(`${BASE}?${params}`, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'AsiSalgo/1.0 (+university-project)'
        },
        signal: AbortSignal.timeout(20000)
    });

    if (!respuesta.ok) {
        throw new Error(`Córdoba API ${respuesta.status}`);
    }

    return respuesta.json();
}

async function fetchAgendaCordoba(momento) {
    const rango = rangoMomento(momento);
    const acumulado = [];
    let page = 1;
    let paginas = 1;

    while (page <= paginas && page <= 4) {
        const payload = await fetchPaginaActividades(page);
        const resultados = payload.results || payload.actividades || [];
        paginas = Math.min(payload.count ? Math.ceil(payload.count / 40) : 1, 4);

        for (const act of resultados) {
            const evento = normalizarActividad(act);
            if (algunaFechaEnRango([evento.fechaInicio, evento.fechaFin], rango)) {
                acumulado.push(evento);
            }
        }

        if (!payload.next) break;
        page += 1;
    }

    return acumulado;
}

async function fetchEventosCordoba({ momento }) {
    try {
        const eventos = await fetchAgendaCordoba(momento);
        if (eventos.length) {
            return {
                eventos,
                fuente: 'agenda-municipal-cordoba',
                aviso: null
            };
        }
    } catch (error) {
        console.warn('[cordoba] agenda municipal no disponible:', error.message);
        return {
            eventos: [],
            fuente: 'agenda-municipal-cordoba',
            aviso:
                'La API abierta de Córdoba no respondió (puede estar fuera de servicio). Te sugerimos espacios culturales del Mapa Cultural nacional.'
        };
    }

    return {
        eventos: [],
        fuente: 'agenda-municipal-cordoba',
        aviso:
            'No encontramos actividades en la agenda municipal de Córdoba para este momento. Te sugerimos espacios culturales cercanos.'
    };
}

module.exports = {
    fetchEventosCordoba
};
