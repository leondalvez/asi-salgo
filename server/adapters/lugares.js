const { etiquetasParaPlan } = require('../lib/planLugares');
const { obtenerCiudad } = require('../lib/ciudades');
const { fetchEspaciosCiudad } = require('./sinca');

const BASE_LUGARES =
    'http://ws.rosario.gov.ar/ubicaciones/public/geojson/lugaresDatosUtiles/all/true/0';

const TIPO_POR_ETIQUETA = {
    parques: 'parque',
    plazas: 'plaza',
    deporte: 'deporte',
    turismo: 'punto-turistico',
    cultural: 'cultural'
};

const TODAS_ETIQUETAS = ['parques', 'plazas', 'deporte', 'turismo', 'cultural'];

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

async function fetchLugaresOverpass({ ciudadId, lat, lng, etiquetas, limite = 12, radio = 4500 }) {
    const consultas = etiquetas
        .map((etiqueta) => OVERPASS_FILTRO_POR_ETIQUETA[etiqueta])
        .filter(Boolean)
        .map((filtro) => `node${filtro}(around:${radio},${lat},${lng});`)
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
                id: `lugar-${ciudadId}-${item.id}`,
                titulo: item.tags?.name || 'Espacio público',
                descripcion: item.tags?.description || 'Espacio público para salir cerca tuyo.',
                direccion: item.tags?.['addr:street'] || null,
                barrio: item.tags?.['addr:suburb'] || null,
                etiqueta,
                tipo: TIPO_POR_ETIQUETA[etiqueta] || 'lugar',
                transporte: [],
                ciudad: ciudadId,
                fuente: 'openstreetmap',
                lat: item.lat ?? null,
                lng: item.lon ?? null
            };
        });
    } catch {
        return [];
    }
}

async function fetchLugaresCiudadGenerica({ ciudad, plan, energia, limite = 4 }) {
    const config = obtenerCiudad(ciudad);
    if (!config) return [];

    const etiquetas = etiquetasParaPlan(plan, energia);
    const overpass = await fetchLugaresOverpass({
        ciudadId: ciudad,
        lat: config.lat,
        lng: config.lng,
        etiquetas,
        limite: limite + 2,
        radio: 5000
    });

    const acumulado = overpass.filter((l) => l.lat != null && l.lng != null);

    if (acumulado.length < limite) {
        const sinca = await fetchEspaciosCiudad(ciudad, { limite: limite - acumulado.length });
        const vistos = new Set(acumulado.map((l) => l.titulo));
        for (const lugar of sinca) {
            if (acumulado.length >= limite) break;
            if (vistos.has(lugar.titulo)) continue;
            acumulado.push(lugar);
        }
    }

    return acumulado.slice(0, limite);
}

async function fetchLugaresBuenosAires({ limite = 4 }) {
    const config = obtenerCiudad('buenos-aires');
    return fetchLugaresOverpass({
        ciudadId: 'buenos-aires',
        lat: config.lat,
        lng: config.lng,
        etiquetas: ['parques'],
        limite,
        radio: 3000
    });
}

async function fetchComplementos({ ciudad, plan, energia, limite = 4 }) {
    const config = obtenerCiudad(ciudad);
    if (!config) return [];

    if (config.lugares === 'rosario') {
        return fetchLugaresRosario({ plan, energia, limite });
    }
    if (config.lugares === 'buenos-aires') {
        return fetchLugaresBuenosAires({ limite });
    }
    return fetchLugaresCiudadGenerica({ ciudad, plan, energia, limite });
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
    turismo: '["tourism"~"^(attraction|museum|viewpoint|gallery)$"]',
    cultural:
        '["amenity"~"^(theatre|cinema|arts_centre|library|community_centre)$"]'
};

function etiquetaDesdeTagsOsm(tags = {}) {
    if (['theatre', 'cinema', 'arts_centre', 'library', 'community_centre'].includes(tags.amenity)) {
        return 'cultural';
    }
    if (tags.tourism) return 'turismo';
    if (['pitch', 'sports_centre', 'stadium'].includes(tags.leisure)) return 'deporte';
    if (tags.place === 'square') return 'plazas';
    return 'parques';
}

async function fetchLugaresParaMapaBuenosAires({ etiquetas = TODAS_ETIQUETAS, limite = 24 } = {}) {
    const config = obtenerCiudad('buenos-aires');
    return fetchLugaresOverpass({
        ciudadId: 'buenos-aires',
        lat: config.lat,
        lng: config.lng,
        etiquetas,
        limite,
        radio: 4000
    });
}

async function fetchLugaresParaMapaGenerico(ciudad, { etiquetas = TODAS_ETIQUETAS, limite = 24 } = {}) {
    const config = obtenerCiudad(ciudad);
    if (!config) return [];

    const overpass = await fetchLugaresOverpass({
        ciudadId: ciudad,
        lat: config.lat,
        lng: config.lng,
        etiquetas,
        limite: Math.ceil(limite * 0.7),
        radio: 5000
    });

    const acumulado = overpass.filter((l) => l.lat != null && l.lng != null);

    if (acumulado.length < limite && etiquetas.includes('cultural')) {
        const sinca = await fetchEspaciosCiudad(ciudad, { limite: limite - acumulado.length });
        const vistos = new Set(acumulado.map((l) => l.titulo));
        for (const lugar of sinca) {
            if (acumulado.length >= limite) break;
            if (vistos.has(lugar.titulo)) continue;
            acumulado.push(lugar);
        }
    }

    return acumulado.slice(0, limite);
}

async function fetchLugaresParaMapa({ ciudad, etiquetas, limite = 24 } = {}) {
    const etiquetasFinales = etiquetas?.length ? etiquetas : TODAS_ETIQUETAS;
    const config = obtenerCiudad(ciudad);

    if (!config) return [];
    if (config.lugares === 'rosario') {
        return fetchLugaresParaMapaRosario({ etiquetas: etiquetasFinales, limite });
    }
    if (config.lugares === 'buenos-aires') {
        return fetchLugaresParaMapaBuenosAires({ etiquetas: etiquetasFinales, limite });
    }
    return fetchLugaresParaMapaGenerico(ciudad, { etiquetas: etiquetasFinales, limite });
}

module.exports = {
    fetchComplementos,
    fetchLugaresRosario,
    fetchLugaresParaMapa
};
