const { obtenerCiudad } = require('../lib/ciudades');

const RECURSO_CENTROS = '0e9a431c-b4f7-455b-aa1a-f419b5740900';
const BASE = 'https://datos.cultura.gob.ar/api/3/action/datastore_search';

function normalizarEspacio(registro, ciudadId) {
    const lat = Number(registro.Latitud);
    const lng = Number(registro.Longitud);

    return {
        id: `sinca-${ciudadId}-${registro.Cod_Loc || registro.Nombre}`,
        titulo: registro.Nombre || 'Espacio cultural',
        descripcion:
            (registro.InfoAdicional || registro.Categoria || 'Espacio cultural del Mapa Cultural nacional.')
                .toString()
                .replace(/\s+/g, ' ')
                .trim(),
        direccion: registro.Domicilio || null,
        barrio: registro.Localidad || null,
        etiqueta: 'cultural',
        tipo: 'cultural',
        transporte: [],
        ciudad: ciudadId,
        fuente: 'mapa-cultural-sinca',
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        link: registro.Web || null
    };
}

async function fetchEspaciosPorProvincia(provincia, { limite = 8 } = {}) {
    const params = new URLSearchParams({
        resource_id: RECURSO_CENTROS,
        limit: String(Math.min(limite, 20)),
        filters: JSON.stringify({ Provincia: provincia })
    });

    const respuesta = await fetch(`${BASE}?${params}`, {
        headers: { Accept: 'application/json', 'User-Agent': 'AsiSalgo/1.0 (+university-project)' },
        signal: AbortSignal.timeout(20000)
    });

    if (!respuesta.ok) return [];

    const datos = await respuesta.json();
    return (datos.result?.records || [])
        .map((registro) => normalizarEspacio(registro, 'generico'))
        .filter((lugar) => lugar.lat != null && lugar.lng != null);
}

async function fetchEspaciosCiudad(ciudadId, { limite = 6 } = {}) {
    const config = obtenerCiudad(ciudadId);
    if (!config) return [];

    const espacios = await fetchEspaciosPorProvincia(config.provincia, { limite: limite * 2 });
    return espacios
        .map((lugar) => ({ ...lugar, ciudad: ciudadId }))
        .slice(0, limite);
}

module.exports = {
    fetchEspaciosCiudad,
    fetchEspaciosPorProvincia
};
