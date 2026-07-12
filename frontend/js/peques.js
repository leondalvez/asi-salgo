/**
 * "Con Peques" — variante de acceso directo (como js/mes.js) que fija
 * perfil=peques en cada búsqueda, dejando elegir cuándo y en qué ciudad.
 */

const estadoPeques = {
    ciudad: 'rosario',
    momento: 'hoy',
    ubicacion: null
};

function mostrarCargaPeques() {
    const contenedor = document.querySelector('#lista-eventos');
    document.querySelector('#lista-complementos').innerHTML = '';
    document.querySelector('#seccion-complementos').hidden = true;
    document.querySelector('#contexto-clima').hidden = true;
    contenedor.innerHTML = `
        <p class="eventos-cargando" aria-live="polite">
            Buscando salidas para ir con peques...
            <span class="resultado__pulso" aria-hidden="true"><i></i><i></i><i></i></span>
        </p>
    `;
}

async function buscarPeques() {
    const estado = document.querySelector('#estado-peques');
    mostrarCargaPeques();
    estado.textContent = 'Buscando salidas para ir con peques...';

    try {
        const payload = await window.EventosApi.buscarEventos({
            ciudad: estadoPeques.ciudad,
            momento: estadoPeques.momento,
            plan: '',
            distancia: 'ciudad',
            energia: '',
            perfil: 'peques',
            ubicacion: estadoPeques.ubicacion
        });
        window.EventosApi.renderizarEventos(document.querySelector('#lista-eventos'), payload);
        estado.textContent = 'Listo: estas son las salidas con peques.';
    } catch (error) {
        document.querySelector('#lista-eventos').innerHTML =
            `<p class="eventos-error">${error.message}</p>`;
        estado.textContent = 'No pudimos cargar salidas con peques.';
        window.Toast?.mostrar(error.message || 'No pudimos cargar salidas con peques.', { tipo: 'error' });
    }
}

function elegirChipPeques(boton) {
    const grupo = boton.closest('.chips');
    const tipo = boton.dataset.momento ? 'momento' : 'ciudad';

    grupo.querySelectorAll('.chip').forEach((chip) => {
        chip.classList.toggle('seleccionado', chip === boton);
    });
    estadoPeques[tipo] = boton.dataset[tipo];
    buscarPeques();
}

async function usarUbicacionPeques(boton) {
    boton.disabled = true;
    try {
        estadoPeques.ubicacion = await window.EventosApi.obtenerUbicacion();
        window.Toast?.mostrar('Ubicación activada: ordenamos por cercanía.', { tipo: 'exito' });
        buscarPeques();
    } catch {
        window.Toast?.mostrar('No pudimos acceder a tu ubicación.', { tipo: 'info' });
    } finally {
        boton.disabled = false;
    }
}

function inicializarPeques() {
    document.addEventListener('click', (evento) => {
        const chip = evento.target.closest('#chips-momento-peques .chip, #chips-ciudad-peques .chip');
        const ubicacionBtn = evento.target.closest('#usar-ubicacion-peques');

        if (chip) elegirChipPeques(chip);
        if (ubicacionBtn) usarUbicacionPeques(ubicacionBtn);
    });

    buscarPeques();
}

document.addEventListener('DOMContentLoaded', inicializarPeques);
