/**
 * Registro central de ciudades soportadas. Cada entrada define coordenadas,
 * contexto de geocodificación y qué adapter de eventos/lugares usar.
 */

const CIUDADES = {
    rosario: {
        id: 'rosario',
        nombre: 'Rosario',
        provincia: 'Santa Fe',
        lat: -32.9468,
        lng: -60.6393,
        eventos: 'rosario',
        lugares: 'rosario'
    },
    'buenos-aires': {
        id: 'buenos-aires',
        nombre: 'Buenos Aires',
        provincia: 'Ciudad Autónoma de Buenos Aires',
        lat: -34.6037,
        lng: -58.3816,
        eventos: 'buenos-aires',
        lugares: 'buenos-aires'
    },
    'santa-fe': {
        id: 'santa-fe',
        nombre: 'Santa Fe',
        provincia: 'Santa Fe',
        lat: -31.6333,
        lng: -60.7,
        eventos: 'santa-fe',
        lugares: 'overpass'
    },
    cordoba: {
        id: 'cordoba',
        nombre: 'Córdoba',
        provincia: 'Córdoba',
        lat: -31.4201,
        lng: -64.1888,
        eventos: 'cordoba',
        lugares: 'overpass'
    },
    mendoza: {
        id: 'mendoza',
        nombre: 'Mendoza',
        provincia: 'Mendoza',
        lat: -32.8908,
        lng: -68.8272,
        eventos: 'mendoza',
        lugares: 'overpass'
    }
};

const IDS_CIUDADES = Object.keys(CIUDADES);

function esCiudadValida(ciudad) {
    return IDS_CIUDADES.includes(ciudad);
}

function obtenerCiudad(ciudad) {
    return CIUDADES[ciudad] || null;
}

function contextoGeocoder(ciudad) {
    const config = obtenerCiudad(ciudad);
    if (!config) return 'Argentina';
    return `${config.nombre}, ${config.provincia}`;
}

function listarCiudades() {
    return IDS_CIUDADES.map((id) => ({
        id,
        nombre: CIUDADES[id].nombre,
        provincia: CIUDADES[id].provincia,
        lat: CIUDADES[id].lat,
        lng: CIUDADES[id].lng,
        eventosEnVivo: ['rosario', 'buenos-aires', 'santa-fe', 'cordoba'].includes(id)
    }));
}

module.exports = {
    CIUDADES,
    IDS_CIUDADES,
    esCiudadValida,
    obtenerCiudad,
    contextoGeocoder,
    listarCiudades
};
