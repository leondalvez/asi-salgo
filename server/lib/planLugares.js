const ETIQUETAS_POR_PLAN = {
    'Al aire libre': ['parques', 'plazas', 'turismo'],
    'Bajar las revoluciones': ['parques', 'plazas'],
    'Recorrer un rincón nuevo': ['turismo', 'plazas'],
    'Conversar sin apuro': ['plazas'],
    'Ir con alguien': ['parques', 'deporte', 'plazas'],
    'Conocer gente': ['deporte', 'plazas'],
    'Algo fuera de horario': ['plazas', 'turismo'],
    'Dejarme sorprender': ['turismo', 'plazas', 'parques']
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
