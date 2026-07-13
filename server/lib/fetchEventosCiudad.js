const { fetchEventosRosario } = require('../adapters/rosario');
const { fetchEventosBuenosAires } = require('../adapters/buenosAires');
const { fetchEventosSantaFe } = require('../adapters/santaFe');
const { fetchEventosCordoba } = require('../adapters/cordoba');
const { fetchEventosMendoza } = require('../adapters/mendoza');
const { obtenerCiudad } = require('./ciudades');

async function fetchEventosCiudad({ ciudad, momento, plan }) {
    const config = obtenerCiudad(ciudad);
    if (!config) {
        throw new Error('Ciudad no soportada');
    }

    switch (config.eventos) {
        case 'rosario':
            return fetchEventosRosario({ momento });
        case 'buenos-aires':
            return fetchEventosBuenosAires({ momento, plan });
        case 'santa-fe':
            return fetchEventosSantaFe({ momento });
        case 'cordoba':
            return fetchEventosCordoba({ momento });
        case 'mendoza':
            return fetchEventosMendoza({ momento });
        default:
            return { eventos: [], fuente: 'desconocida', aviso: 'Ciudad sin fuente de eventos configurada.' };
    }
}

module.exports = {
    fetchEventosCiudad
};
