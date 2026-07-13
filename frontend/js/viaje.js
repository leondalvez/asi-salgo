/**
 * El Viaje
 * Tres decisiones de baja carga cognitiva. Las opciones del segundo paso
 * cambian según la intención elegida, y los filtros finales son opcionales.
 */

const experiencias = {
    desenchufarme: {
        etiqueta: 'Desenchufarme',
        color: '#79c995',
        opciones: [
            ['Al aire libre', 'Parques, río y movimiento suave.', 'aire'],
            ['Mirar arte', 'Museos, muestras y recorridos tranquilos.', 'arte'],
            ['Bajar las revoluciones', 'Un espacio para estar sin apuro.', 'pausa']
        ]
    },
    sentirlo: {
        etiqueta: 'Sentirlo',
        color: '#d98c7d',
        opciones: [
            ['Música en vivo', 'Una fecha, un ritmo, una emoción compartida.', 'musica'],
            ['Teatro y escena', 'Historias que pasan frente a vos.', 'escena'],
            ['Algo para celebrar', 'Una salida con energía alta.', 'celebrar']
        ]
    },
    conectar: {
        etiqueta: 'Conectar',
        color: '#d8be67',
        opciones: [
            ['Ir con alguien', 'Un plan simple para compartir.', 'compartir'],
            ['Conocer gente', 'Talleres, juegos y encuentros abiertos.', 'gente'],
            ['Conversar sin apuro', 'Cultura, café y comunidad.', 'conversar']
        ]
    },
    misterio: {
        etiqueta: 'Misterio',
        color: '#a99ac7',
        opciones: [
            ['Dejarme sorprender', 'Una propuesta fuera de tu circuito.', 'sorpresa'],
            ['Recorrer un rincón nuevo', 'Una excusa para cambiar de barrio.', 'barrio'],
            ['Algo fuera de horario', 'Una salida distinta a lo habitual.', 'noche']
        ]
    }
};

const respuestas = {
    energia: null,
    plan: null,
    momento: 'hoy',
    distancia: 'cerca',
    ciudad: 'rosario'
};

const CIUDADES = window.CiudadesApi?.CIUDAD_ETIQUETA || {
    rosario: 'Rosario',
    'buenos-aires': 'Buenos Aires'
};

const viaje = document.querySelector('#viaje');
const estado = document.querySelector('#estado-viaje');
const opcionesPlan = document.querySelector('#opciones-plan');

const trazosPlan = {
    aire: ['M8 39 C20 28 31 29 43 38 C54 46 66 46 80 34', 'M47 36 C37 29 38 17 50 11 C59 21 57 31 47 36 Z'],
    arte: ['M17 14 H71 V70 H17 Z', 'M31 49 C31 32 54 28 58 43 C62 56 45 62 39 52 C35 45 43 39 49 43'],
    pausa: ['M13 30 C27 20 42 20 56 30 C66 37 74 37 81 32', 'M18 48 C31 39 44 39 57 48 C66 54 72 54 78 50'],
    musica: ['M10 48 H23 L30 31 L39 58 L50 20 L61 48 H80', 'M19 67 C35 76 60 75 75 63'],
    escena: ['M15 16 C31 30 31 54 16 69', 'M73 16 C57 30 57 54 72 69', 'M31 64 Q44 73 57 64'],
    celebrar: ['M44 10 V25 M44 63 V78 M10 44 H25 M63 44 H78', 'M20 20 L31 31 M57 57 L68 68 M68 20 L57 31 M31 57 L20 68'],
    compartir: ['M18 47 C18 31 38 26 47 40 C56 26 76 31 76 47 C76 63 59 69 47 77 C35 69 18 63 18 47 Z', 'M31 47 H63'],
    gente: ['M20 57 C25 43 39 42 45 54 M49 54 C56 42 70 43 75 57', 'M35 27 A9 9 0 1 1 34.9 27 M61 27 A9 9 0 1 1 60.9 27'],
    conversar: ['M12 20 H58 Q68 20 68 30 V48 Q68 58 58 58 H35 L22 69 V58 H22 Q12 58 12 48 Z', 'M30 33 H54 M30 44 H49'],
    sorpresa: ['M19 36 L44 20 L69 36 L44 52 Z', 'M19 36 V62 L44 78 L69 62 V36 M44 52 V78'],
    barrio: ['M9 65 H79', 'M14 65 V42 L27 31 L40 42 V65 M48 65 V31 L61 19 L74 31 V65', 'M20 51 H28 M55 42 H66'],
    noche: ['M61 17 C40 18 31 36 38 52 C44 67 62 72 77 61 C65 64 52 57 49 45 C45 33 50 23 61 17 Z', 'M19 24 H25 M22 21 V27']
};

/*
 * Pequeños detalles vivos por plan: el mismo lenguaje de "escena" que las
 * tarjetas de energía (pájaro, foco, nota, brillo, chispa, punto de diálogo),
 * pero a escala de sub-tarjeta. Apagados en reposo, se encienden al elegirlos.
 */
const accentesPlan = {
    aire: ['<path class="escena-pajaro" d="M68 12 L72 8 L76 12" />'],
    arte: ['<path class="escena-foco" d="M30 2 L42 15 L18 15 Z" />'],
    pausa: ['<circle class="escena-brillo" cx="68" cy="16" r="9" />'],
    musica: ['<path class="escena-nota" d="M68 12 V26 A4 4 0 1 1 64 22" />'],
    escena: ['<path class="escena-foco" d="M44 4 L57 28 L31 28 Z" />'],
    celebrar: [
        '<path class="escena-estrella" d="M14 12 L15 15 L18 16 L15 17 L14 20 L13 17 L10 16 L13 15 Z" />',
        '<circle class="escena-estrella escena-estrella--2" cx="74" cy="68" r="1.4" />'
    ],
    compartir: [
        '<circle class="escena-punto" cx="30" cy="32" r="1.8" />',
        '<circle class="escena-punto escena-punto--2" cx="64" cy="32" r="1.8" />'
    ],
    gente: [
        '<circle class="escena-punto" cx="44" cy="15" r="1.7" />',
        '<circle class="escena-punto escena-punto--2" cx="48" cy="15" r="1.7" />',
        '<circle class="escena-punto escena-punto--3" cx="52" cy="15" r="1.7" />'
    ],
    conversar: [
        '<circle class="escena-punto" cx="30" cy="12" r="1.6" />',
        '<circle class="escena-punto escena-punto--2" cx="36" cy="12" r="1.6" />',
        '<circle class="escena-punto escena-punto--3" cx="42" cy="12" r="1.6" />'
    ],
    sorpresa: [
        '<circle class="escena-brillo" cx="44" cy="46" r="14" />',
        '<path class="escena-estrella" d="M44 8 L45 11 L48 12 L45 13 L44 16 L43 13 L40 12 L43 11 Z" />'
    ],
    barrio: ['<circle class="escena-brillo" cx="61" cy="50" r="6" />'],
    noche: [
        '<circle class="escena-brillo" cx="55" cy="42" r="15" />',
        '<path class="escena-estrella" d="M14 38 L15 41 L18 42 L15 43 L14 46 L13 43 L10 42 L13 41 Z" />'
    ]
};

function crearArtePlan(clave) {
    return `
        <svg class="arte-plan" viewBox="0 0 88 88" aria-hidden="true">
            ${trazosPlan[clave].map((trazo, indice) => `
                <path class="arte-plan__trazo arte-plan__trazo--${indice + 1}"
                    pathLength="100" d="${trazo}" />
            `).join('')}
            ${(accentesPlan[clave] || []).join('')}
        </svg>
    `;
}

function mostrarPaso(numero) {
    document.querySelectorAll('.paso').forEach((paso) => {
        const activo = paso.dataset.paso === String(numero);
        paso.hidden = !activo;
        paso.classList.toggle('activo', activo);
    });

    document.querySelectorAll('.progreso__paso').forEach((paso, indice) => {
        paso.classList.toggle('activo', indice + 1 === numero);
    });

    const pasoVisual = Math.min(numero, 3);
    document.querySelectorAll('.progreso__linea').forEach((linea, indice) => {
        linea.style.setProperty('--relleno', pasoVisual > indice + 1 ? '100%' : '0%');
    });

    document.body.dataset.viajePaso = String(numero);

    const seccion = document.querySelector(`.paso[data-paso="${numero}"]`);
    const titulo = seccion?.querySelector('h2, h1');
    if (titulo) {
        titulo.tabIndex = -1;
        titulo.focus({ preventScroll: true });
    }

    if (window.scrollY > 8) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderizarPlanes() {
    const experiencia = experiencias[respuestas.energia];
    document.querySelector('#ayuda-plan').textContent =
        `Para ${experiencia.etiqueta.toLowerCase()}, ¿qué formato te entusiasma más?`;

    opcionesPlan.innerHTML = experiencia.opciones.map(([titulo, descripcion, arte]) => `
        <button type="button" class="opcion-plan" data-plan="${titulo}">
            ${crearArtePlan(arte)}
            <span class="opcion-plan__texto">
                <strong>${titulo}</strong>
                <small>${descripcion}</small>
            </span>
        </button>
    `).join('');
}

function elegirEnergia(boton) {
    respuestas.energia = boton.dataset.energia;
    const experiencia = experiencias[respuestas.energia];

    document.querySelectorAll('.card-viaje').forEach((card) => {
        card.classList.toggle('seleccionada', card === boton);
    });
    viaje.style.setProperty('--color-card', experiencia.color);
    document.documentElement.style.setProperty('--color-card', experiencia.color);
    estado.textContent = `${experiencia.etiqueta} elegido. Ahora definimos el formato.`;
    renderizarPlanes();

    window.setTimeout(() => mostrarPaso(2), 260);
}

function elegirChip(boton) {
    const grupo = boton.closest('.chips');
    const tipo = boton.dataset.momento
        ? 'momento'
        : boton.dataset.distancia
            ? 'distancia'
            : 'ciudad';

    grupo.querySelectorAll('.chip').forEach((chip) => {
        chip.classList.toggle('seleccionado', chip === boton);
    });
    respuestas[tipo] = boton.dataset[tipo];
    actualizarCiudadVisible();
}

function actualizarCiudadVisible() {
    const etiqueta = document.querySelector('#ciudad-actual');
    const chipCiudad = document.querySelector('.ciudad-chip-label');
    const nombre = CIUDADES[respuestas.ciudad] || 'Rosario';

    if (etiqueta) etiqueta.textContent = nombre;
    if (chipCiudad) chipCiudad.textContent = nombre;
}

function mostrarCargaEventos() {
    const contenedor = document.querySelector('#lista-eventos');
    document.querySelector('#lista-complementos').innerHTML = '';
    document.querySelector('#seccion-complementos').hidden = true;
    document.querySelector('#contexto-clima').hidden = true;
    contenedor.innerHTML = `
        <p class="eventos-cargando" aria-live="polite">
            Buscando eventos, clima y planes cerca...
            <span class="resultado__pulso" aria-hidden="true"><i></i><i></i><i></i></span>
        </p>
    `;
}

async function mostrarResultado() {
    const momento = {
        hoy: 'hoy',
        manana: 'mañana',
        finde: 'este finde'
    }[respuestas.momento];
    const distancia = {
        cerca: 'a 15 minutos',
        barrio: 'por tu barrio',
        ciudad: `en toda ${CIUDADES[respuestas.ciudad] || 'la ciudad'}`
    }[respuestas.distancia];

    document.querySelector('#resumen-resultado').textContent =
        `${respuestas.plan} para ${momento}, ${distancia}.`;
    estado.textContent = 'Buscando salidas disponibles...';
    mostrarPaso(4);
    mostrarCargaEventos();

    try {
        let ubicacion = null;
        try {
            ubicacion = await window.EventosApi.obtenerUbicacion();
        } catch {
            ubicacion = null;
        }

        const payload = await window.EventosApi.buscarEventos({
            ciudad: respuestas.ciudad,
            momento: respuestas.momento,
            plan: respuestas.plan,
            distancia: respuestas.distancia,
            energia: respuestas.energia,
            ubicacion
        });
        window.EventosApi.renderizarEventos(document.querySelector('#lista-eventos'), payload);
        estado.textContent = 'Tu recorrido está listo.';
    } catch (error) {
        document.querySelector('#lista-eventos').innerHTML =
            `<p class="eventos-error">${error.message}</p>`;
        document.querySelector('#lista-complementos').innerHTML = '';
        document.querySelector('#seccion-complementos').hidden = true;
        document.querySelector('#contexto-clima').hidden = true;
        estado.textContent = 'No pudimos cargar tu salida.';
    }
}

function reiniciarViaje() {
    respuestas.energia = null;
    respuestas.plan = null;
    respuestas.momento = 'hoy';
    respuestas.distancia = 'cerca';
    respuestas.ciudad = 'rosario';
    viaje.style.removeProperty('--color-card');
    document.documentElement.style.removeProperty('--color-card');
    document.querySelectorAll('.card-viaje').forEach((card) => card.classList.remove('seleccionada'));
    document.querySelectorAll('.chip').forEach((chip) => {
        const esInicial =
            chip.dataset.momento === 'hoy' ||
            chip.dataset.distancia === 'cerca' ||
            chip.dataset.ciudad === 'rosario';
        chip.classList.toggle('seleccionado', esInicial);
    });
    actualizarCiudadVisible();
    document.querySelector('#lista-eventos').innerHTML = '';
    document.querySelector('#lista-complementos').innerHTML = '';
    document.querySelector('#seccion-complementos').hidden = true;
    document.querySelector('#contexto-clima').hidden = true;
    document.querySelector('#nota-fuente').hidden = true;
    estado.textContent = 'El viaje se reinició.';
    mostrarPaso(1);
}

window.CiudadesApi?.renderizarChipsCiudad(document.querySelector('#chips-ciudad-viaje'), {
    ciudadInicial: respuestas.ciudad
});
actualizarCiudadVisible();
document.body.dataset.viajePaso = '1';

document.addEventListener('click', (evento) => {
    const energia = evento.target.closest('.card-viaje');
    const plan = evento.target.closest('.opcion-plan');
    const chip = evento.target.closest('.chip');
    const volver = evento.target.closest('[data-volver]');

    if (energia) elegirEnergia(energia);
    if (plan) {
        respuestas.plan = plan.dataset.plan;
        estado.textContent = `${respuestas.plan} elegido. Elegí cuándo y qué tan lejos.`;
        mostrarPaso(3);
    }
    if (chip) elegirChip(chip);
    if (volver) mostrarPaso(Number(volver.dataset.volver));
    if (evento.target.closest('#descubrir')) mostrarResultado();
    if (evento.target.closest('[data-reiniciar]')) reiniciarViaje();
});
