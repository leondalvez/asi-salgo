const PALABRAS_POR_PLAN = {
    'Al aire libre': ['aire', 'parque', 'rio', 'plaza', 'naturaleza', 'outdoor', 'jardin'],
    'Mirar arte': ['arte', 'museo', 'muestra', 'exposicion', 'galeria', 'visual'],
    'Bajar las revoluciones': ['calma', 'lectura', 'biblioteca', 'meditacion', 'pausa'],
    'Música en vivo': ['musica', 'concierto', 'banda', 'recital', 'jazz', 'rock', 'folklore'],
    'Teatro y escena': ['teatro', 'escena', 'danza', 'obra', 'performance', 'circo'],
    'Algo para celebrar': ['festival', 'fiesta', 'celebrar', 'feria', 'encuentro'],
    'Ir con alguien': ['familia', 'pareja', 'compartir', 'amigos'],
    'Conocer gente': ['taller', 'encuentro', 'comunidad', 'social', 'club'],
    'Conversar sin apuro': ['charla', 'cafe', 'debate', 'literatura', 'cultura'],
    'Dejarme sorprender': ['sorpresa', 'imprevisto', 'nuevo', 'descubrir'],
    'Recorrer un rincón nuevo': ['barrio', 'recorrido', 'ruta', 'paseo', 'historia'],
    'Algo fuera de horario': ['noche', 'nocturno', 'after', 'medianoche']
};

function textoBusqueda(evento) {
    return [
        evento.titulo,
        evento.descripcion,
        ...(evento.etiquetas || []),
        evento.lugar,
        evento.barrio
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
}

function puntajeEvento(evento, plan) {
    const palabras = PALABRAS_POR_PLAN[plan];
    if (!palabras?.length) return 0;

    const texto = textoBusqueda(evento);
    return palabras.reduce((total, palabra) => {
        const normalizada = palabra
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '');
        return total + (texto.includes(normalizada) ? 1 : 0);
    }, 0);
}

function ordenarPorRelevancia(eventos, plan) {
    return [...eventos].sort((a, b) => puntajeEvento(b, plan) - puntajeEvento(a, plan));
}

module.exports = {
    ordenarPorRelevancia,
    puntajeEvento
};
