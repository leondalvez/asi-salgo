const { rangoMomento, algunaFechaEnRango } = require('../lib/fechas');
const { inferirAptoNinos } = require('./rosario');

const LINDA_BASE = 'https://linda.buenosaires.gob.ar/api/frontend/events/filter';

const CUANDO_POR_MOMENTO = {
    hoy: 'hoy',
    manana: 'esta-semana',
    finde: 'este-finde',
    // Linda no tiene un rango mensual propio; "esta-semana" es lo más amplio
    // que ofrece su API. Para Buenos Aires "este mes" muestra esa semana,
    // con un aviso aclarando la limitación (ver fetchEventosBuenosAires).
    'este-mes': 'esta-semana'
};

const CATEGORIA_POR_PLAN = {
    'Mirar arte': 'Arte y cultura',
    'Música en vivo': 'Música',
    'Teatro y escena': 'Arte y cultura',
    'Al aire libre': 'Entretenimiento',
    'Conversar sin apuro': 'Arte y cultura'
};

function limpiarHtml(texto = '') {
    return texto.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function fechasEvento(evento) {
    const fechas = [...(evento.fechasDelEvento || [])];
    if (evento.fechaInicio) fechas.push(evento.fechaInicio);
    if (evento.fechaFin) fechas.push(evento.fechaFin);
    return fechas;
}

function inferirGratis(evento) {
    if (evento.precio == null || evento.precio === '') return null;
    const precio = Number(evento.precio);
    if (!Number.isFinite(precio)) return null;
    return precio === 0;
}

/**
 * Linda expone categorías ("Infantil" incluida) que ya usamos para filtrar
 * la consulta (ver CATEGORIA_POR_PLAN). Cuando el propio evento trae esa
 * categoría es la señal más confiable; si no viene, caemos al mismo
 * heurístico de texto que usamos para Rosario.
 */
function esCategoriaInfantil(evento) {
    const categorias = [evento.category, evento.categoria, ...(evento.categories || [])]
        .filter(Boolean)
        .map((valor) => String(valor).toLowerCase());
    return categorias.some((valor) => valor.includes('infantil'));
}

function normalizarEvento(evento) {
    const ubicacion = evento.ubicacion || {};

    return {
        id: `ba-${evento.id}`,
        titulo: evento.title || 'Evento cultural',
        descripcion: limpiarHtml(evento.description),
        fechaInicio: evento.fechaInicio || evento.fechasDelEvento?.[0] || null,
        fechaFin: evento.fechaFin || null,
        lugar: ubicacion.titulo || ubicacion.direccion || evento.direccion || null,
        direccion: ubicacion.direccion || evento.direccion || null,
        lat: ubicacion.latitud ?? null,
        lng: ubicacion.longitud ?? null,
        etiquetas: evento.etiquetas || [],
        ciudad: 'buenos-aires',
        gratis: inferirGratis(evento),
        aptoNinos: esCategoriaInfantil(evento)
            ? true
            : inferirAptoNinos(evento.title, evento.description),
        fuente: 'linda-buenos-aires',
        tipo: 'evento',
        link: evento.link || `https://linda.buenosaires.gob.ar/eventos/${evento.id}`
    };
}

async function fetchLinda({ momento, plan }) {
    const params = new URLSearchParams();
    params.set('cuando', CUANDO_POR_MOMENTO[momento] || 'hoy');

    const categoria = CATEGORIA_POR_PLAN[plan];
    if (categoria) params.set('category', categoria);

    const respuesta = await fetch(`${LINDA_BASE}?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000)
    });

    if (!respuesta.ok) {
        throw new Error(`Linda API ${respuesta.status}`);
    }

    const payload = await respuesta.json();
    return (payload.events || []).map(normalizarEvento);
}

function filtrarPorMomento(eventos, momento) {
    const rango = rangoMomento(momento);
    return eventos.filter((evento) => {
        const fechas = fechasEvento(evento);
        if (!fechas.length) return momento !== 'manana';
        return algunaFechaEnRango(fechas, rango);
    });
}

async function fetchEventosBuenosAires({ momento, plan }) {
    try {
        const categoria = CATEGORIA_POR_PLAN[plan];
        let eventos = await fetchLinda({ momento, plan });

        if (momento === 'manana') {
            eventos = filtrarPorMomento(eventos, 'manana');
            if (!eventos.length) {
                const params = new URLSearchParams({ cuando: 'esta-semana' });
                if (categoria) params.set('category', categoria);
                const respuestaSemana = await fetch(`${LINDA_BASE}?${params}`, {
                    headers: { Accept: 'application/json' },
                    signal: AbortSignal.timeout(20000)
                }).catch(() => null);
                if (respuestaSemana?.ok) {
                    const payloadSemana = await respuestaSemana.json();
                    eventos = filtrarPorMomento(
                        (payloadSemana.events || []).map(normalizarEvento),
                        'manana'
                    );
                }
            }
        }

        if (eventos.length < 3 && categoria) {
            const params = new URLSearchParams();
            params.set('cuando', CUANDO_POR_MOMENTO[momento] || 'hoy');
            const respuestaAmpliada = await fetch(`${LINDA_BASE}?${params}`, {
                headers: { Accept: 'application/json' },
                signal: AbortSignal.timeout(20000)
            }).catch(() => null);
            if (respuestaAmpliada?.ok) {
                const payloadAmpliado = await respuestaAmpliada.json();
                const ampliado = (payloadAmpliado.events || []).map(normalizarEvento);
                const ids = new Set(eventos.map((evento) => evento.id));
                for (const evento of ampliado) {
                    if (!ids.has(evento.id)) eventos.push(evento);
                }
            }
        }

        return {
            eventos,
            fuente: 'linda-buenos-aires',
            aviso:
                momento === 'este-mes'
                    ? 'La agenda de Buenos Aires solo permite ver hasta una semana hacia adelante: te mostramos lo de esta semana.'
                    : null
        };
    } catch (error) {
        console.warn('[buenos-aires] Linda no disponible:', error.message);
        return {
            eventos: [],
            fuente: 'linda-buenos-aires',
            aviso: 'La agenda de Buenos Aires no respondió. Te sugerimos planes en espacios públicos cerca tuyo.'
        };
    }
}

module.exports = {
    fetchEventosBuenosAires
};
