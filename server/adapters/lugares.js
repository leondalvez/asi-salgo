const { etiquetasParaPlan } = require('../lib/planLugares');

const BASE_LUGARES =
    'http://ws.rosario.gov.ar/ubicaciones/public/geojson/lugaresDatosUtiles/all/true/0';

const TIPO_POR_ETIQUETA = {
    parques: 'parque',
    plazas: 'plaza',
    deporte: 'deporte',
    turismo: 'punto-turistico'
};

const TODAS_ETIQUETAS = ['parques', 'plazas', 'deporte', 'turismo'];

async function convertirCoordenadas(x, y) {
    try {
        const respuesta = await fetch(
            `https://ws.rosario.gob.ar/ubicaciones/public/coordenadaLatLon/${x}/${y}/`,
            { signal: AbortSignal.timeout(8000) }
        );
        if (!respuesta.ok) return { lat: null, lng: null };
        const datos = await respuesta.json();
        return { lat: datos.latitud ?? null, lng: datos.longitud ?? null };
    } catch {
        return { lat: null, lng: null };
    }
}

function barrioPrincipal(propiedades) {
    const barrio = propiedades.divs_admin?.find((item) => item.nombreTipo === 'Barrio');
    return barrio?.valor || null;
}

async function fetchLugaresPorEtiqueta(etiqueta, limite = 20) {
    const respuesta = await fetch(`${BASE_LUGARES}/${etiqueta}`, {
        signal: AbortSignal.timeout(20000)
    });
    if (!respuesta.ok) return [];

    const geojson = await respuesta.json();
    return (geojson.features || []).slice(0, limite);
}

function normalizarLugar(feature, etiqueta) {
    const props = feature.properties || {};
    const [x, y] = feature.geometry?.coordinates || [];

    return {
        id: `lugar-${etiqueta}-${props.id}`,
        titulo: props.name || 'Lugar',
        descripcion: (props.descripcion || '').replace(/\s+/g, ' ').trim(),
        direccion: props.direccion || null,
        barrio: barrioPrincipal(props),
        etiqueta,
        tipo: TIPO_POR_ETIQUETA[etiqueta] || 'lugar',
        transporte: (props.lineas_tup || []).slice(0, 4),
        ciudad: 'rosario',
        fuente: 'datos-utiles-rosario',
        lat: null,
        lng: null,
        _x: x,
        _y: y
    };
}

async function fetchLugaresRosario({ plan, energia, limite = 4 }) {
    const etiquetas = etiquetasParaPlan(plan, energia);
    const acumulado = [];
    const vistos = new Set();

    for (const etiqueta of etiquetas) {
        if (acumulado.length >= limite) break;
        const features = await fetchLugaresPorEtiqueta(etiqueta, 15);
        for (const feature of features) {
            const id = feature.properties?.id;
            if (!id || vistos.has(id)) continue;
            vistos.add(id);
            acumulado.push(normalizarLugar(feature, etiqueta));
            if (acumulado.length >= limite) break;
        }
    }

    for (const lugar of acumulado) {
        if (lugar._x && lugar._y) {
            const coords = await convertirCoordenadas(lugar._x, lugar._y);
            lugar.lat = coords.lat;
            lugar.lng = coords.lng;
        }
        delete lugar._x;
        delete lugar._y;
    }

    return acumulado;
}

async function fetchLugaresBuenosAires({ limite = 4 }) {
    try {
        const respuesta = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`
            [out:json][timeout:15];
            node["leisure"="park"](around:3000,-34.6037,-58.3816);
            out body 8;
        `)}`, { signal: AbortSignal.timeout(18000) });

        if (!respuesta.ok) return [];

        const datos = await respuesta.json();
        return (datos.elements || []).slice(0, limite).map((item) => ({
            id: `lugar-ba-${item.id}`,
            titulo: item.tags?.name || 'Espacio verde',
            descripcion: item.tags?.description || 'Parque o plaza para salir al aire libre.',
            direccion: null,
            barrio: item.tags?.['addr:street'] || null,
            etiqueta: 'parques',
            tipo: 'parque',
            transporte: [],
            ciudad: 'buenos-aires',
            fuente: 'openstreetmap',
            lat: item.lat ?? null,
            lng: item.lon ?? null
        }));
    } catch {
        return [];
    }
}

async function fetchComplementos({ ciudad, plan, energia, limite = 4 }) {
    if (ciudad === 'buenos-aires') {
        return fetchLugaresBuenosAires({ limite });
    }
    return fetchLugaresRosario({ plan, energia, limite });
}

/**
 * A diferencia de fetchComplementos (que elige etiquetas según plan/energía
 * para sugerir 4 lugares puntuales), esto es para poblar un mapa completo:
 * usa directamente las etiquetas pedidas (o las 4 por defecto) con un límite
 * más alto, sin depender del cuestionario de "El Viaje".
 */
async function fetchLugaresParaMapaRosario({ etiquetas = TODAS_ETIQUETAS, limite = 24 } = {}) {
    const porEtiqueta = Math.max(4, Math.ceil(limite / Math.max(etiquetas.length, 1)));
    const acumulado = [];
    const vistos = new Set();

    for (const etiqueta of etiquetas) {
        const features = await fetchLugaresPorEtiqueta(etiqueta, porEtiqueta);
        for (const feature of features) {
            const id = feature.properties?.id;
            if (!id || vistos.has(id)) continue;
            vistos.add(id);
            acumulado.push(normalizarLugar(feature, etiqueta));
        }
    }

    // Las coordenadas de Infomapas vienen en un sistema local (x/y) y hay que
    // convertirlas una por una; en paralelo para no demorar segundos por cada
    // lugar del mapa.
    await Promise.all(
        acumulado.map(async (lugar) => {
            if (lugar._x && lugar._y) {
                const coords = await convertirCoordenadas(lugar._x, lugar._y);
                lugar.lat = coords.lat;
                lugar.lng = coords.lng;
            }
            delete lugar._x;
            delete lugar._y;
        })
    );

    return acumulado.filter((lugar) => lugar.lat != null && lugar.lng != null).slice(0, limite);
}

const OVERPASS_FILTRO_POR_ETIQUETA = {
    parques: '["leisure"~"^(park|garden)$"]',
    plazas: '["place"="square"]',
    deporte: '["leisure"~"^(pitch|sports_centre|stadium)$"]',
    turismo: '["tourism"~"^(attraction|museum|viewpoint|gallery)$"]'
};

function etiquetaDesdeTagsOsm(tags = {}) {
    if (tags.tourism) return 'turismo';
    if (['pitch', 'sports_centre', 'stadium'].includes(tags.leisure)) return 'deporte';
    if (tags.place === 'square') return 'plazas';
    return 'parques';
}

async function fetchLugaresParaMapaBuenosAires({ etiquetas = TODAS_ETIQUETAS, limite = 24 } = {}) {
    const consultas = etiquetas
        .map((etiqueta) => OVERPASS_FILTRO_POR_ETIQUETA[etiqueta])
        .filter(Boolean)
        .map((filtro) => `node${filtro}(around:4000,-34.6037,-58.3816);`)
        .join('\n');

    if (!consultas) return [];

    try {
        const respuesta = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(`
            [out:json][timeout:20];
            (
                ${consultas}
            );
            out body ${limite};
        `)}`,
            { signal: AbortSignal.timeout(18000) }
        );

        if (!respuesta.ok) return [];

        const datos = await respuesta.json();
        return (datos.elements || []).slice(0, limite).map((item) => {
            const etiqueta = etiquetaDesdeTagsOsm(item.tags);
            return {
                id: `lugar-ba-${item.id}`,
                titulo: item.tags?.name || 'Espacio público',
                descripcion: item.tags?.description || 'Espacio público para salir cerca tuyo.',
                direccion: item.tags?.['addr:street'] || null,
                barrio: item.tags?.['addr:suburb'] || null,
                etiqueta,
                tipo: TIPO_POR_ETIQUETA[etiqueta] || 'lugar',
                transporte: [],
                ciudad: 'buenos-aires',
                fuente: 'openstreetmap',
                lat: item.lat ?? null,
                lng: item.lon ?? null
            };
        });
    } catch {
        return [];
    }
}

async function fetchLugaresParaMapa({ ciudad, etiquetas, limite = 24 } = {}) {
    const etiquetasFinales = etiquetas?.length ? etiquetas : TODAS_ETIQUETAS;
    if (ciudad === 'buenos-aires') {
        return fetchLugaresParaMapaBuenosAires({ etiquetas: etiquetasFinales, limite });
    }
    return fetchLugaresParaMapaRosario({ etiquetas: etiquetasFinales, limite });
}

module.exports = {
    fetchComplementos,
    fetchLugaresRosario,
    fetchLugaresParaMapa
};
