/**
 * Header y footer del sitio, compartidos por todas las páginas. Se inyectan
 * vía JS (en vez de duplicar el HTML en cada archivo) para mantener una
 * navegación consistente con un solo punto de mantenimiento.
 */

const PAGINAS_NAV = [
    { id: 'inicio', href: 'index.html', label: 'Inicio', detalle: 'Bienvenida' },
    { id: 'viaje', href: 'viaje.html', label: 'El viaje', detalle: 'Tu salida', cta: true },
    { id: 'mapa', href: 'mapa.html', label: 'Mapa', detalle: 'Lugares cerca' },
    { id: 'salen', href: 'salen.html', label: 'Salen', detalle: 'Comunidad' },
    { id: 'sobre', href: 'sobre.html', label: 'Sobre', detalle: 'El proyecto' },
    { id: 'contacto', href: 'contacto.html', label: 'Contacto', detalle: 'Sumate' }
];

const ICONOS_NAV = {
    inicio: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="nav-icono-trazo" cx="12" cy="12" r="7.5" />
            <path class="nav-icono-trazo nav-icono-anim" d="M12 12 V7.5" />
            <circle class="nav-icono-detalle" cx="12" cy="12" r="1.4" />
        </svg>`,
    viaje: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <rect class="nav-icono-trazo" x="5" y="4" width="14" height="16" rx="2" />
            <path class="nav-icono-trazo nav-icono-anim nav-icono-puerta-izq" d="M5 8 V16" />
            <path class="nav-icono-trazo nav-icono-anim nav-icono-puerta-der" d="M19 8 V16" />
            <path class="nav-icono-detalle nav-icono-luz" d="M12 10 V14" />
        </svg>`,
    mapa: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <path class="nav-icono-trazo nav-icono-anim" d="M12 4 C8.5 4 6 7 6 10.5 C6 15.5 12 20 12 20 C12 20 18 15.5 18 10.5 C18 7 15.5 4 12 4 Z" />
            <circle class="nav-icono-detalle" cx="12" cy="10.5" r="2.2" />
        </svg>`,
    sobre: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <path class="nav-icono-trazo" d="M4 17 H20" />
            <circle class="nav-icono-detalle nav-icono-estacion" cx="6" cy="17" r="2" />
            <circle class="nav-icono-detalle nav-icono-estacion" cx="10" cy="17" r="2" />
            <circle class="nav-icono-detalle nav-icono-estacion" cx="14" cy="17" r="2" />
            <circle class="nav-icono-detalle nav-icono-estacion" cx="18" cy="17" r="2" />
            <path class="nav-icono-trazo nav-icono-anim nav-icono-caminante" d="M5 11 Q8 8 11 11 T17 11" />
        </svg>`,
    contacto: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <rect class="nav-icono-trazo" x="4" y="6" width="16" height="12" rx="2" />
            <path class="nav-icono-trazo nav-icono-anim" d="M4 8 L12 13 L20 8" />
        </svg>`,
    salen: `
        <svg class="nav-sitio__icono" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="nav-icono-detalle" cx="9" cy="10" r="2.5" />
            <circle class="nav-icono-detalle" cx="16" cy="10" r="2.5" />
            <path class="nav-icono-trazo nav-icono-anim" d="M5 17 Q12 13 19 17" />
            <path class="nav-icono-trazo" d="M12 6 V9" />
            <path class="nav-icono-detalle" d="M12 4 V6 M11 5 H13" />
        </svg>`
};

function leerPerfilNav() {
    try {
        const datos = JSON.parse(localStorage.getItem('asi-salgo-perfil') || 'null');
        if (!datos?.nombreVisible) return null;
        return datos;
    } catch {
        return null;
    }
}

function paginaADestino(paginaActual) {
    const pagina = PAGINAS_NAV.find((item) => item.id === paginaActual);
    return pagina?.href || 'index.html';
}

function construirChipPerfil(paginaActual) {
    const perfil = leerPerfilNav();
    const dest = paginaADestino(paginaActual);

    if (perfil) {
        return `
            <a class="nav-sitio__perfil" href="entrar.html?dest=${encodeURIComponent(dest)}&cambiar=1" title="Tu nombre en la comunidad">
                <span class="nav-sitio__perfil-inicial" aria-hidden="true">${perfil.nombre.charAt(0).toUpperCase()}</span>
                <span class="nav-sitio__perfil-nombre">${perfil.nombreVisible}</span>
            </a>`;
    }

    if (paginaActual === 'entrar') {
        return '';
    }

    return `
        <a class="nav-sitio__perfil nav-sitio__perfil--entrar" href="entrar.html?dest=${encodeURIComponent(dest)}">
            Entrá
        </a>`;
}

function construirNav(paginaActual) {
    const enlaces = PAGINAS_NAV.map((pagina) => {
        const activo = pagina.id === paginaActual;
        const clases = [
            'nav-sitio__link',
            activo ? 'activo' : '',
            pagina.cta ? 'nav-sitio__link--cta' : ''
        ]
            .filter(Boolean)
            .join(' ');

        return `
            <a class="${clases}" href="${pagina.href}" data-nav="${pagina.id}"${
            activo ? ' aria-current="page"' : ''
        }>
                ${ICONOS_NAV[pagina.id] || ''}
                <span class="nav-sitio__texto">
                    <span class="nav-sitio__etiqueta">${pagina.label}</span>
                    <span class="nav-sitio__detalle">${pagina.detalle}</span>
                </span>
            </a>`;
    }).join('');

    const logoPuerta = window.PuertaApi?.renderLogo?.() || `
        <svg class="puerta-svg puerta-svg--logo" viewBox="0 0 32 34" aria-hidden="true">
            <rect class="puerta-luz" x="6.5" y="5.5" width="19" height="23" rx="1" />
            <g class="puerta-grupo puerta-grupo--izq">
                <rect class="puerta-hoja" x="0" y="-11" width="9" height="22" rx="0.5" />
            </g>
            <g class="puerta-grupo puerta-grupo--der">
                <rect class="puerta-hoja" x="-9" y="-11" width="9" height="22" rx="0.5" />
            </g>
            <line class="puerta-union" x1="16" y1="7" x2="16" y2="27" />
            <rect class="puerta-marco" x="4" y="3" width="24" height="28" rx="3" />
        </svg>`;

    return `
        <div class="nav-sitio__contenido">
            <a class="nav-sitio__marca" href="index.html">
                ${logoPuerta}
                <span class="nav-sitio__marca-texto">
                    <span class="nav-sitio__marca-nombre">
                        Así Salgo<span class="nav-sitio__marca-suave">!</span>
                    </span>
                    ${paginaActual === 'viaje' ? '' : '<span class="nav-sitio__marca-tag">Menos scroll. Más ciudad.</span>'}
                </span>
            </a>
            <button class="nav-sitio__disparador" type="button" aria-expanded="false" aria-controls="nav-sitio-menu">
                <span class="lector">Abrir menú</span>
                <span class="nav-sitio__icono-menu" aria-hidden="true"><span></span><span></span><span></span></span>
            </button>
            ${construirChipPerfil(paginaActual)}
            <nav class="nav-sitio__menu" id="nav-sitio-menu" aria-label="Navegación principal">
                <div class="nav-sitio__grupo">${enlaces}</div>
            </nav>
        </div>
    `;
}

function construirPie() {
    const enlaces = PAGINAS_NAV.map(
        (pagina) => `<a href="${pagina.href}">${pagina.label}</a>`
    ).join('');

    return `
        <div class="pie-sitio__contenido">
            <div class="pie-sitio__marca">
                ${window.PuertaApi?.renderLogo?.() || ''}
                <div>
                    <strong>Así Salgo!</strong>
                    <span>La app para dejar las apps.</span>
                </div>
            </div>
            <nav class="pie-sitio__enlaces" aria-label="Enlaces de pie de página">
                ${enlaces}
            </nav>
            <p class="pie-sitio__nota">
                Proyecto Final · Tecnicatura Universitaria en Informática Aplicada al Diseño Multimedial y Web ·
                Universidad Nacional del Litoral.
            </p>
        </div>
    `;
}

function prepararAccesibilidad() {
    const main = document.querySelector('main');
    if (!main) return;

    if (!main.id) {
        main.id = 'contenido-principal';
    }

    if (!main.hasAttribute('role')) {
        main.setAttribute('role', 'main');
    }

    if (!main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
    }

    if (document.querySelector('.skip-link')) return;

    const skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = `#${main.id}`;
    skip.textContent = 'Saltar al contenido';
    skip.addEventListener('click', (evento) => {
        evento.preventDefault();
        main.focus({ preventScroll: false });
    });
    document.body.insertBefore(skip, document.body.firstChild);
}

function inicializarNav() {
    prepararAccesibilidad();

    const raiz = document.querySelector('#nav-raiz');
    const pie = document.querySelector('#pie-raiz');
    const paginaActual = document.body.dataset.pagina || '';

    if (raiz) {
        raiz.innerHTML = construirNav(paginaActual);
        raiz.setAttribute('role', 'banner');

        const nav = raiz.querySelector('.nav-sitio') || raiz;
        const disparador = raiz.querySelector('.nav-sitio__disparador');
        const menu = raiz.querySelector('.nav-sitio__menu');

        const cerrarMenu = () => {
            menu?.classList.remove('abierto');
            disparador?.setAttribute('aria-expanded', 'false');
        };

        disparador?.addEventListener('click', () => {
            const abierto = menu.classList.toggle('abierto');
            disparador.setAttribute('aria-expanded', String(abierto));
        });

        menu?.addEventListener('click', (evento) => {
            if (evento.target.closest('a')) cerrarMenu();
        });

        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && menu?.classList.contains('abierto')) {
                cerrarMenu();
                disparador?.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 720) cerrarMenu();
        });

        const marcarDesplazamiento = () => {
            const desplazado = window.scrollY > 12;
            raiz.classList.toggle('nav-sitio--desplazado', desplazado);
        };

        marcarDesplazamiento();
        window.addEventListener('scroll', marcarDesplazamiento, { passive: true });
    }

    if (pie) {
        pie.innerHTML = construirPie();
        pie.setAttribute('role', 'contentinfo');
    }
}

document.addEventListener('DOMContentLoaded', inicializarNav);
