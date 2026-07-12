const { rangoMomento, formatearRosario, algunaFechaEnRango } = require('../lib/fechas');

const AGENDA_BASE = 'https://ws.rosario.gob.ar/web/api/v1.0';

async function fetchJson(url, options = {}) {
    const respuesta = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'AsiSalgo/1.0 (+university-project)',
            ...options.headers
        },
        signal: AbortSignal.timeout(20000)
    });

    if (!respuesta.ok) {
        throw new Error(`Rosario API ${respuesta.status}: ${url}`);
    }

    return respuesta.json();
}

function mapaIncluidos(payload) {
    const mapa = new Map();
    for (const item of payload.included || []) {
        mapa.set(`${item.type}:${item.id}`, item);
    }
    return mapa;
}

function resolverLugar(relacion, incluidos) {
    if (!relacion?.data) return null;
    const item = incluidos.get(`${relacion.data.type}:${relacion.data.id}`);
    if (!item) return null;

    return {
        nombre: item.attributes?.name || null,
        direccion: item.attributes?.adress || item.attributes?.address || null,
        informacion: item.attributes?.information || null
    };
}

function limpiarHtml(texto = '') {
    return texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const REGEX_APTO_NINOS =
    /\b(ni[nñ]os?|ni[nñ]as?|infanci?as?|infantiles?|infantil|familiar(es)?|toda la familia|en familia|chicxs|para chicos|para chicas)\b/i;

/**
 * Igual de conservador que inferirGratis: solo afirmamos "apto para
 * infancias" cuando el texto lo menciona explícitamente. La ausencia de la
 * palabra no significa que el evento no sea apto, así que nunca devolvemos
 * false (para no ocultar eventos por error), solo true o null.
 */
function inferirAptoNinos(titulo = '', descripcion = '') {
    const texto = `${titulo || ''} ${descripcion || ''}`;
    return REGEX_APTO_NINOS.test(texto) ? true : null;
}

function inferirGratis(ticket = '', ticketValue = '') {
    const texto = `${ticket || ''} ${ticketValue || ''}`.replace(/\s+/g, ' ').trim();
    if (!texto) return null;

    const esGratis = /\b(gratis|gratuit[oa]s?|sin cargo|entrada libre|libre y gratuita)\b/i.test(texto);
    const esPago = /\$\s*\d|ars\s*\d|\bprecio\b|\babono\b|entrada\s+\$/i.test(texto);

    // Señales mixtas (ej. "gratis para menores, $500 general") o ausencia total
    // de señal clara: mejor no afirmar nada que afirmar mal.
    if (esGratis && !esPago) return true;
    if (esPago && !esGratis) return false;
    return null;
}

function normalizarOcurrencia(item, incluidos) {
    const attrs = item.attributes || {};
    const lugar = resolverLugar(item.relationships?.place, incluidos);
    const fechaInicio = attrs.dateFull?.value || null;
    const fechaFin = attrs.dateFull?.value2 || fechaInicio;

    return {
        id: `rosario-ocurrencia-${item.id}`,
        titulo: attrs.name || 'Actividad cultural',
        descripcion: limpiarHtml(attrs.text?.value || attrs.summary?.value || ''),
        fechaInicio,
        fechaFin,
        lugar: lugar?.nombre || attrs.eventual_name || null,
        direccion: lugar?.direccion || attrs.eventual_direccion || null,
        lat: null,
        lng: null,
        etiquetas: [],
        ciudad: 'rosario',
        gratis: inferirGratis(attrs.ticket, attrs.ticket_value),
        aptoNinos: inferirAptoNinos(
            attrs.name,
            `${attrs.text?.value || ''} ${attrs.summary?.value || ''}`
        ),
        fuente: 'agenda-municipal-rosario',
        tipo: 'evento'
    };
}

async function fetchAgendaRosario(momento) {
    const rango = rangoMomento(momento);
    const desde = formatearRosario(rango.desde);
    const hasta = formatearRosario(rango.hasta);
    const url =
        `${AGENDA_BASE}/ocurrencias?sort=dateFull` +
        `&filter[dateFull][value]=${desde}` +
        `&filter[dateFull][operator]=%3E%3D` +
        `&filter[dateFull][value2]=${hasta}` +
        `&filter[dateFull][operator2]=%3C%3D` +
        `&range=80&include=place`;

    const payload = await fetchJson(url);
    const incluidos = mapaIncluidos(payload);

    return (payload.data || [])
        .map((item) => normalizarOcurrencia(item, incluidos))
        .filter((evento) => algunaFechaEnRango([evento.fechaInicio, evento.fechaFin], rango));
}

async function fetchEventosRosario({ momento }) {
    try {
        const eventos = await fetchAgendaRosario(momento);
        if (eventos.length) {
            return {
                eventos,
                fuente: 'agenda-municipal-rosario',
                aviso: null
            };
        }
    } catch (error) {
        console.warn('[rosario] agenda municipal no disponible:', error.message);
    }

    return {
        eventos: [],
        fuente: 'agenda-municipal-rosario',
        aviso: 'La agenda municipal no respondió. Te sugerimos planes en espacios públicos cerca tuyo.'
    };
}

module.exports = {
    fetchEventosRosario,
    inferirAptoNinos
};
