const { rangoMomento, algunaFechaEnRango } = require('../lib/fechas');
const { parsearIcal } = require('../lib/ical');
const { inferirAptoNinos } = require('./rosario');

const ICAL_URL = 'https://agenda.santafeciudad.gov.ar/?ical=1';

function limpiarHtml(texto = '') {
    return texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferirGratis(texto = '') {
    if (!texto) return null;
    const esGratis = /\b(gratis|gratuit[oa]s?|sin cargo|entrada libre)\b/i.test(texto);
    const esPago = /\$\s*\d|ars\s*\d|\babono\b|entrada\s+\$/i.test(texto);
    if (esGratis && !esPago) return true;
    if (esPago && !esGratis) return false;
    return null;
}

function eventoEnRango(evento, rango) {
    const fechas = [evento.fechaInicio, evento.fechaFin].filter(Boolean);
    if (!fechas.length) return false;
    return algunaFechaEnRango(fechas, rango);
}

function normalizarEvento(item) {
    const descripcion = limpiarHtml(item.descripcion);
    return {
        id: `santa-fe-${item.uid || item.titulo.slice(0, 24)}`,
        titulo: item.titulo || 'Actividad cultural',
        descripcion,
        fechaInicio: item.fechaInicio,
        fechaFin: item.fechaFin || item.fechaInicio,
        lugar: item.lugar || null,
        direccion: item.lugar || null,
        lat: null,
        lng: null,
        etiquetas: [],
        ciudad: 'santa-fe',
        gratis: inferirGratis(`${item.titulo} ${descripcion}`),
        aptoNinos: inferirAptoNinos(item.titulo, descripcion),
        fuente: 'agenda-municipal-santa-fe',
        tipo: 'evento',
        link: item.link || null
    };
}

async function fetchAgendaSantaFe(momento) {
    const respuesta = await fetch(ICAL_URL, {
        headers: {
            Accept: 'text/calendar',
            'User-Agent': 'AsiSalgo/1.0 (+university-project)'
        },
        signal: AbortSignal.timeout(25000)
    });

    if (!respuesta.ok) {
        throw new Error(`Santa Fe iCal ${respuesta.status}`);
    }

    const texto = await respuesta.text();
    const rango = rangoMomento(momento);

    return parsearIcal(texto)
        .map(normalizarEvento)
        .filter((evento) => eventoEnRango(evento, rango));
}

async function fetchEventosSantaFe({ momento }) {
    try {
        const eventos = await fetchAgendaSantaFe(momento);
        if (eventos.length) {
            return {
                eventos,
                fuente: 'agenda-municipal-santa-fe',
                aviso: null
            };
        }
    } catch (error) {
        console.warn('[santa-fe] agenda municipal no disponible:', error.message);
        return {
            eventos: [],
            fuente: 'agenda-municipal-santa-fe',
            aviso: 'La agenda de Santa Fe no respondió. Te sugerimos espacios culturales cerca tuyo.'
        };
    }

    return {
        eventos: [],
        fuente: 'agenda-municipal-santa-fe',
        aviso: 'No encontramos actividades en la agenda municipal para este momento. Probá otro rango o mirá espacios culturales.'
    };
}

module.exports = {
    fetchEventosSantaFe
};
