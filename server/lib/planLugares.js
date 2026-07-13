const ETIQUETAS_POR_PLAN = {
    'Al aire libre': ['parques', 'plazas', 'turismo'],
    'Bajar las revoluciones': ['parques', 'plazas'],
    'Recorrer un rincón nuevo': ['turismo', 'cultural', 'plazas'],
    'Conversar sin apuro': ['plazas', 'cultural'],
    'Ir con alguien': ['parques', 'deporte', 'plazas', 'cultural'],
    'Conocer gente': ['deporte', 'plazas', 'cultural'],
    'Algo fuera de horario': ['plazas', 'turismo', 'cultural'],
    'Dejarme sorprender': ['turismo', 'cultural', 'plazas', 'parques'],
    'Mirar arte': ['cultural', 'turismo'],
    'Música en vivo': ['cultural', 'plazas'],
    'Teatro y escena': ['cultural', 'plazas']
};

const ETIQUETAS_POR_ENERGIA = {
    desenchufarme: ['parques', 'plazas'],
    conectar: ['plazas', 'deporte'],
    misterio: ['turismo', 'plazas']
};

function etiquetasParaPlan(plan, energia) {
    const porPlan = ETIQUETAS_POR_PLAN[plan];
    if (porPlan?.length) return porPlan;

    const porEnergia = energia ? ETIQUETAS_POR_ENERGIA[energia] : null;
    if (porEnergia?.length) return porEnergia;

    return ['plazas', 'parques'];
}

module.exports = {
    etiquetasParaPlan
};
