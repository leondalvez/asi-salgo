/**
 * Mendoza no publica hoy una agenda cultural con API REST estable y gratuita
 * (el portal provincial es web; el layer IDE "eventos_puntos" es de emergencias).
 * Este adapter deja explícito el límite y delega los complementos a Overpass +
 * Mapa Cultural nacional (SINCA).
 */

async function fetchEventosMendoza() {
    return {
        eventos: [],
        fuente: 'sin-agenda-viva-mendoza',
        aviso:
            'Mendoza aún no ofrece una agenda cultural en API abierta como Rosario o Santa Fe. Te sugerimos espacios culturales y parques del Mapa Cultural nacional.'
    };
}

module.exports = {
    fetchEventosMendoza
};
