/**
 * "¿A dónde salgo este mes?" — la vía directa a la agenda del mes, sin pasar
 * por el cuestionario de energía/plan de El Viaje. Reusa EventosApi
 * (js/eventos.js) tal cual, solo que con momento fijo en "este-mes".
 */

const estadoMes = {
    ciudad: 'rosario',
    ubicacion: null
};

function mostrarCargaMes() {
    const contenedor = document.querySelector('#lista-eventos');
    document.querySelector('#lista-complementos').innerHTML = '';
    document.querySelector('#seccion-complementos').hidden = true;
    document.querySelector('#contexto-clima').hidden = true;
    contenedor.innerHTML = `
        <p class="eventos-cargando" aria-live="polite">
            Buscando la agenda del mes...
            <span class="resultado__pulso" aria-hidden="true"><i></i><i></i><i></i></span>
        </p>
    `;
}

async function buscarMes() {
    const estado = document.querySelector('#estado-mes');
    mostrarCargaMes();
    estado.textContent = 'Buscando la agenda del mes...';

    try {
        const payload = await window.EventosApi.buscarEventos({
            ciudad: estadoMes.ciudad,
            momento: 'este-mes',
            plan: '',
            distancia: 'ciudad',
            energia: '',
            ubicacion: estadoMes.ubicacion
        });
        window.EventosApi.renderizarEventos(document.querySelector('#lista-eventos'), payload);
        estado.textContent = 'Agenda del mes lista.';
    } catch (error) {
        document.querySelector('#lista-eventos').innerHTML =
            `<p class="eventos-error">${error.message}</p>`;
        estado.textContent = 'No pudimos cargar la agenda del mes.';
        window.Toast?.mostrar(error.message || 'No pudimos cargar la agenda del mes.', { tipo: 'error' });
    }
}

function elegirCiudadMes(boton) {
    document.querySelectorAll('#chips-ciudad .chip').forEach((chip) => {
        chip.classList.toggle('seleccionado', chip === boton);
    });
    estadoMes.ciudad = boton.dataset.ciudad;
    buscarMes();
}

async function usarUbicacionMes(boton) {
    boton.disabled = true;
    try {
        estadoMes.ubicacion = await window.EventosApi.obtenerUbicacion();
        window.Toast?.mostrar('Ubicación activada: ordenamos por cercanía.', { tipo: 'exito' });
        buscarMes();
    } catch {
        window.Toast?.mostrar('No pudimos acceder a tu ubicación.', { tipo: 'info' });
    } finally {
        boton.disabled = false;
    }
}

function inicializarMes() {
    document.addEventListener('click', (evento) => {
        const chip = evento.target.closest('#chips-ciudad .chip');
        const ubicacionBtn = evento.target.closest('#usar-ubicacion');

        if (chip) elegirCiudadMes(chip);
        if (ubicacionBtn) usarUbicacionMes(ubicacionBtn);
    });

    buscarMes();
}

document.addEventListener('DOMContentLoaded', inicializarMes);
