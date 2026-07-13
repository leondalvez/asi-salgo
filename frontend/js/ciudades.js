/**
 * Catálogo compartido de ciudades soportadas (espejo del backend).
 * Mantener sincronizado con server/lib/ciudades.js
 *
 * Solo Rosario y Buenos Aires por ahora; otras ciudades quedan en server/adapters/
 * para una fase posterior con APIs más completas.
 *
 * Encapsulado en IIFE para no chocar con const globales de eventos.js,
 * viaje.js, mapa.js o salen.js cuando todos cargan en la misma página.
 */
(function () {
    const CIUDADES = [
        { id: 'rosario', nombre: 'Rosario', lat: -32.9468, lng: -60.6393, eventosEnVivo: true },
        { id: 'buenos-aires', nombre: 'Buenos Aires', lat: -34.6037, lng: -58.3816, eventosEnVivo: true }
    ];

    const CIUDAD_ETIQUETA = Object.fromEntries(CIUDADES.map((c) => [c.id, c.nombre]));

    const CENTRO_POR_CIUDAD = Object.fromEntries(CIUDADES.map((c) => [c.id, [c.lat, c.lng]]));

    function poblarSelect(select, { valorInicial, incluirTodas = false, etiquetaTodas = 'Todas' } = {}) {
        if (!select) return;
        select.innerHTML = '';

        if (incluirTodas) {
            const opcion = document.createElement('option');
            opcion.value = '';
            opcion.textContent = etiquetaTodas;
            select.appendChild(opcion);
        }

        for (const ciudad of CIUDADES) {
            const opcion = document.createElement('option');
            opcion.value = ciudad.id;
            opcion.textContent = ciudad.nombre;
            if (valorInicial === ciudad.id) opcion.selected = true;
            select.appendChild(opcion);
        }
    }

    function crearBotonCiudad(ciudad, { seleccionado = false } = {}) {
        return `
        <button type="button" class="chip${seleccionado ? ' seleccionado' : ''}" data-ciudad="${ciudad.id}">
            <svg class="chip-arte" viewBox="0 0 28 28" aria-hidden="true">
                <path class="chip-trazo" pathLength="100" d="M4 23 H24 M7 23 V12 L14 7 L21 12 V23" />
            </svg>
            ${ciudad.nombre}
        </button>`;
    }

    function renderizarChipsCiudad(contenedor, { ciudadInicial = 'rosario' } = {}) {
        if (!contenedor) return;
        contenedor.innerHTML = CIUDADES.map((ciudad) =>
            crearBotonCiudad(ciudad, { seleccionado: ciudad.id === ciudadInicial })
        ).join('');
    }

    window.CiudadesApi = {
        CIUDADES,
        CIUDAD_ETIQUETA,
        CENTRO_POR_CIUDAD,
        poblarSelect,
        renderizarChipsCiudad,
        nombreCiudad(id) {
            return CIUDAD_ETIQUETA[id] || id;
        }
    };
})();
