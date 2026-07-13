/**
 * Puerta compartida: logo, inicio del viaje y Me sumo.
 * Misma forma, misma apertura: invitar a salir y sumarse.
 */
(function () {
    const DURACION_APERTURA_MS = 560;

    const MARCADO = `
        <rect class="puerta-luz" x="7" y="6" width="18" height="22" rx="1" />
        <rect class="puerta-hoja puerta-hoja--izq" x="7" y="6" width="9.5" height="22" rx="0.5" />
        <rect class="puerta-hoja puerta-hoja--der" x="15.5" y="6" width="9.5" height="22" rx="0.5" />
        <rect class="puerta-marco" x="4" y="3" width="24" height="28" rx="3" />
    `;

    const MARCADO_LOGO = `
        <rect class="puerta-luz" x="6.5" y="5.5" width="19" height="23" rx="1" />
        <g class="puerta-grupo puerta-grupo--izq">
            <rect class="puerta-hoja" x="0" y="-11" width="9" height="22" rx="0.5" />
        </g>
        <g class="puerta-grupo puerta-grupo--der">
            <rect class="puerta-hoja" x="-9" y="-11" width="9" height="22" rx="0.5" />
        </g>
        <line class="puerta-union" x1="16" y1="7" x2="16" y2="27" />
        <rect class="puerta-marco" x="4" y="3" width="24" height="28" rx="3" />
    `;

    function render(clases = 'puerta-svg') {
        return `<svg class="${clases}" viewBox="0 0 32 34" aria-hidden="true">${MARCADO}</svg>`;
    }

    function renderLogo() {
        return `<svg class="puerta-svg puerta-svg--logo" viewBox="0 0 32 34" aria-hidden="true">${MARCADO_LOGO}</svg>`;
    }

    function renderIcono(clasesExtra = '') {
        return render(`puerta-svg puerta-svg--icono${clasesExtra ? ` ${clasesExtra}` : ''}`);
    }

    function renderCta() {
        return render('puerta-svg cta-principal__puerta');
    }

    function prefiereMenosMovimiento() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function iniciarApertura(elemento) {
        if (!elemento || elemento.classList.contains('abriendo')) return false;
        elemento.classList.add('abriendo');
        return true;
    }

    function enlazarEnlace(selector) {
        const enlace = document.querySelector(selector);
        if (!enlace || prefiereMenosMovimiento()) return;

        enlace.addEventListener('click', (evento) => {
            if (!iniciarApertura(enlace)) return;
            evento.preventDefault();
            window.setTimeout(() => {
                window.location.href = enlace.href;
            }, DURACION_APERTURA_MS);
        });
    }

    function ejecutarConPuerta(boton, accion) {
        if (!boton) return;

        if (prefiereMenosMovimiento() || !iniciarApertura(boton)) {
            accion();
            return;
        }

        window.setTimeout(accion, DURACION_APERTURA_MS);
    }

    window.PuertaApi = {
        DURACION_APERTURA_MS,
        render,
        renderLogo,
        renderIcono,
        renderCta,
        iniciarApertura,
        enlazarEnlace,
        ejecutarConPuerta
    };
})();
