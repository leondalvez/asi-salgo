/**
 * Registro central de ciudades soportadas. Cada entrada define coordenadas,
 * contexto de geocodificación y qué adapter de eventos/lugares usar.
 *
 * Por ahora solo Rosario y Buenos Aires (APIs gratuitas estables). Los adapters
 * de Santa Fe, Córdoba y Mendoza quedan en server/adapters/ para reactivarlos
 * más adelante si sumamos una fuente paga o municipal confiable.
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
        eventosEnVivo: id === 'rosario' || id === 'buenos-aires'
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
