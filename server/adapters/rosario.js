const { rangoMomento, formatearRosario, algunaFechaEnRango } = require('../lib/fechas');

const AGENDA_BASES = [
    'https://ws.rosario.gob.ar/web/api/v1.0',
    'https://ws.rosario.gov.ar/web/api/v1.0'
];
const TIMEOUT_ROSARIO_MS = 9000;
const REINTENTOS_ROSARIO = 2;
const CACHE_TTL_MS = 15 * 60 * 1000;
const cacheRosarioPorMomento = new Map();

const estadoRosario = {
    ultimoIntentoAt: null,
    ultimoOkAt: null,
    ultimoErrorAt: null,
    ultimoError: null,
    ultimoFuente: null,
    ultimaCantidad: 0,
    ultimoDuracionMs: null
};

async function fetchJson(url, options = {}) {
    const respuesta = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'User-Agent': 'AsiSalgo/1.0 (+university-project)',
            ...options.headers
        },
        signal: AbortSignal.timeout(options.timeoutMs || TIMEOUT_ROSARIO_MS)
    });

    if (!respuesta.ok) {
        throw new Error(`Rosario API ${respuesta.status}: ${url}`);
    }

    return respuesta.json();
}

async function fetchConReintento(url, intentos = REINTENTOS_ROSARIO) {
    let ultimoError;

    for (let i = 0; i < intentos; i += 1) {
        try {
            return await fetchJson(url);
        } catch (error) {
            ultimoError = error;
        }
    }

    throw ultimoError;
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

function textoEntrada(ticket = '', ticketValue = '') {
    return `${ticket || ''} ${ticketValue || ''}`.replace(/\s+/g, ' ').trim();
}

function inferirGratis(ticket = '', ticketValue = '') {
    const texto = textoEntrada(ticket, ticketValue);
    if (!texto) return null;

    const esGratis = /\b(gratis|gratuit[oa]s?|sin cargo|entrada libre|libre y gratuita)\b/i.test(texto);
    const esPago = /\$\s*\d|ars\s*\d|\bprecio\b|\babono\b|entrada\s+\$/i.test(texto);

    // Señales mixtas (ej. "gratis para menores, $500 general") o ausencia total
    // de señal clara: mejor no afirmar nada que afirmar mal.
    if (esGratis && !esPago) return true;
    if (esPago && !esGratis) return false;
    return null;
}

/**
 * La agenda municipal suele incluir eventos comerciales con URL de venta
 * (Passline, Ticketek, etc.) embebida en el campo de entrada. No vendemos
 * entradas: solo exponemos el link para que quien salga pueda ver más info.
 */
function extraerLinkEntrada(ticket = '', ticketValue = '') {
    const texto = textoEntrada(ticket, ticketValue);
    if (!texto) return null;

    const match = texto.match(/https?:\/\/[^\s<>"']+/i);
    if (!match) return null;

    return match[0].replace(/[),.;]+$/, '');
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
        tipo: 'evento',
        link: extraerLinkEntrada(attrs.ticket, attrs.ticket_value)
    };
}

function construirUrlFiltrada(base, desde, hasta) {
    return (
        `${base}/ocurrencias?sort=dateFull` +
        `&filter[dateFull][value]=${desde}` +
        `&filter[dateFull][operator]=%3E%3D` +
        `&filter[dateFull][value2]=${hasta}` +
        `&filter[dateFull][operator2]=%3C%3D` +
        `&range=80&include=place`
    );
}

function construirUrlAmplia(base) {
    return `${base}/ocurrencias?sort=dateFull&range=120&include=place`;
}

function normalizarYFiltrar(payload, rango) {
    const incluidos = mapaIncluidos(payload);

    return (payload.data || [])
        .map((item) => normalizarOcurrencia(item, incluidos))
        .filter((evento) => algunaFechaEnRango([evento.fechaInicio, evento.fechaFin], rango));
}

function leerCacheRosario(momento) {
    const cache = cacheRosarioPorMomento.get(momento);
    if (!cache) return null;
    if (Date.now() - cache.timestamp > CACHE_TTL_MS) {
        cacheRosarioPorMomento.delete(momento);
        return null;
    }
    return cache.eventos;
}

function guardarCacheRosario(momento, eventos) {
    if (!Array.isArray(eventos) || !eventos.length) return;
    cacheRosarioPorMomento.set(momento, { eventos, timestamp: Date.now() });
}

function obtenerDiagnosticoRosario() {
    const ahora = Date.now();
    const cache = Array.from(cacheRosarioPorMomento.entries()).map(([momento, valor]) => ({
        momento,
        cantidad: Array.isArray(valor.eventos) ? valor.eventos.length : 0,
        edadMs: ahora - valor.timestamp,
        ttlRestanteMs: Math.max(CACHE_TTL_MS - (ahora - valor.timestamp), 0)
    }));

    return {
        estado: { ...estadoRosario },
        cacheTtlMs: CACHE_TTL_MS,
        cache
    };
}

async function fetchAgendaRosario(momento) {
    const rango = rangoMomento(momento);
    const desde = formatearRosario(rango.desde);
    const hasta = formatearRosario(rango.hasta);

    const errores = [];

    for (const base of AGENDA_BASES) {
        try {
            const payload = await fetchConReintento(construirUrlFiltrada(base, desde, hasta));
            return normalizarYFiltrar(payload, rango);
        } catch (errorFiltrada) {
            errores.push(errorFiltrada);
            try {
                const payloadAmplio = await fetchConReintento(construirUrlAmplia(base));
                return normalizarYFiltrar(payloadAmplio, rango);
            } catch (errorAmplia) {
                errores.push(errorAmplia);
            }
        }
    }

    throw errores[errores.length - 1] || new Error('Rosario API no disponible');
}

async function fetchEventosRosario({ momento }) {
    const inicio = Date.now();
    estadoRosario.ultimoIntentoAt = new Date().toISOString();

    try {
        const eventos = await fetchAgendaRosario(momento);
        if (eventos.length) {
            guardarCacheRosario(momento, eventos);
            estadoRosario.ultimoOkAt = new Date().toISOString();
            estadoRosario.ultimoError = null;
            estadoRosario.ultimoFuente = 'agenda-municipal-rosario';
            estadoRosario.ultimaCantidad = eventos.length;
            estadoRosario.ultimoDuracionMs = Date.now() - inicio;
            return {
                eventos,
                fuente: 'agenda-municipal-rosario',
                aviso: null
            };
        }
    } catch (error) {
        console.warn('[rosario] agenda municipal no disponible:', error.message);
        estadoRosario.ultimoErrorAt = new Date().toISOString();
        estadoRosario.ultimoError = error.message;

        const cache = leerCacheRosario(momento);
        if (cache?.length) {
            estadoRosario.ultimoFuente = 'agenda-municipal-rosario-cache';
            estadoRosario.ultimaCantidad = cache.length;
            estadoRosario.ultimoDuracionMs = Date.now() - inicio;
            return {
                eventos: cache,
                fuente: 'agenda-municipal-rosario-cache',
                aviso: 'La agenda municipal está inestable. Te mostramos la última agenda disponible hace unos minutos.'
            };
        }
    }

    estadoRosario.ultimoFuente = 'fallback-publico';
    estadoRosario.ultimaCantidad = 0;
    estadoRosario.ultimoDuracionMs = Date.now() - inicio;
    return {
        eventos: [],
        fuente: 'agenda-municipal-rosario',
        aviso: 'La agenda municipal no respondió. Te sugerimos planes en espacios públicos cerca tuyo.'
    };
}

module.exports = {
    fetchEventosRosario,
    inferirAptoNinos,
    obtenerDiagnosticoRosario
};
