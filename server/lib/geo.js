const RADIO_KM = {
    cerca: 2,
    barrio: 5,
    ciudad: 30
};

function distanciaKm(lat1, lon1, lat2, lon2) {
    const radioTierra = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;

    return radioTierra * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function enriquecerConDistancia(eventos, lat, lng) {
    if (lat == null || lng == null) return eventos;

    return eventos.map((evento) => ({
        ...evento,
        distanciaKm:
            evento.lat != null && evento.lng != null
                ? Math.round(distanciaKm(lat, lng, evento.lat, evento.lng) * 10) / 10
                : null
    }));
}

function filtrarPorDistancia(eventos, modo, lat, lng) {
    if (lat == null || lng == null) return eventos;

    const radio = RADIO_KM[modo];
    if (!radio) return eventos;

    const conDistancia = eventos.filter(
        (evento) => evento.distanciaKm != null && evento.distanciaKm <= radio
    );

    return conDistancia.length ? conDistancia : eventos;
}

function ordenarPorCercania(eventos) {
    return [...eventos].sort((a, b) => {
        if (a.distanciaKm == null && b.distanciaKm == null) return 0;
        if (a.distanciaKm == null) return 1;
        if (b.distanciaKm == null) return -1;
        return a.distanciaKm - b.distanciaKm;
    });
}

module.exports = {
    RADIO_KM,
    enriquecerConDistancia,
    filtrarPorDistancia,
    ordenarPorCercania
};
