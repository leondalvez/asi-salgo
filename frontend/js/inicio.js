const DURACION_APERTURA_MS = 560;

function inicializarCtaPuerta() {
    const cta = document.querySelector('#cta-iniciar-viaje');
    if (!cta) return;

    const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereMenosMovimiento) return;

    cta.addEventListener('click', (evento) => {
        if (cta.classList.contains('abriendo')) return;

        evento.preventDefault();
        cta.classList.add('abriendo');

        setTimeout(() => {
            window.location.href = cta.href;
        }, DURACION_APERTURA_MS);
    });
}

document.addEventListener('DOMContentLoaded', inicializarCtaPuerta);
