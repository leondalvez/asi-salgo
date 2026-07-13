/**
 * Mapa de Salidas: parques, plazas, deporte y turismo de Rosario o Buenos
 * Aires, en un mapa Leaflet con tiles oscuros (coherentes con el resto del
 * sitio). Reusa crearTarjetaComplemento / escaparHtml / CIUDAD_ETIQUETA de
 * js/eventos.js, que se cargan antes que este script y quedan en el ámbito
 * global (no son módulos).
 */

const CENTRO_POR_CIUDAD = window.CiudadesApi?.CENTRO_POR_CIUDAD || {
    rosario: [-32.9468, -60.6393],
    'santa-fe': [-31.6333, -60.7],
    cordoba: [-31.4201, -64.1888],
    mendoza: [-32.8908, -68.8272],
    'buenos-aires': [-34.6037, -58.3816]
};

const COLOR_POR_TIPO = {
    parque: '#79c995',
    plaza: '#d8be67',
    deporte: '#d98c7d',
    'punto-turistico': '#a99ac7',
    cultural: '#c49ad9',
    lugar: '#9aa097',
    comunidad: '#7eb8da'
};

const estadoMapa = {
    ciudad: 'rosario',
    etiquetas: ['parques', 'plazas', 'deporte', 'turismo'],
    ubicacion: null
};

let mapaLeaflet = null;
let capaMarcadores = null;

function inicializarMapaLeaflet() {
    mapaLeaflet = L.map('mapa', { scrollWheelZoom: false }).setView(CENTRO_POR_CIUDAD.rosario, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> colaboradores &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(mapaLeaflet);

    capaMarcadores = L.layerGroup().addTo(mapaLeaflet);
}

function iconoLugar(tipo) {
    const color = COLOR_POR_TIPO[tipo] || COLOR_POR_TIPO.lugar;
    return L.divIcon({
        className: 'marcador-lugar',
        html: `<span style="background:${color}"></span>`,
        iconSize: [16, 16],
        popupAnchor: [0, -6]
    });
}

function popupLugar(lugar) {
    const enlace = `https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}&travelmode=walking`;
    return `
        <div class="popup-lugar">
            <strong>${escaparHtml(lugar.titulo || 'Lugar')}</strong>
            <p>${escaparHtml(recortarTexto(lugar.descripcion || '', 110) || 'Espacio público para salir cerca tuyo.')}</p>
            <a href="${enlace}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        </div>
    `;
}

function renderizarMapa(lugares) {
    capaMarcadores.clearLayers();
    const conCoordenadas = lugares.filter((lugar) => lugar.lat != null && lugar.lng != null);

    conCoordenadas.forEach((lugar) => {
        L.marker([lugar.lat, lugar.lng], { icon: iconoLugar(lugar.tipo) })
            .bindPopup(popupLugar(lugar))
            .addTo(capaMarcadores);
    });

    if (conCoordenadas.length) {
        const grupo = L.featureGroup(capaMarcadores.getLayers());
        mapaLeaflet.fitBounds(grupo.getBounds().pad(0.2), { maxZoom: 15 });
    } else {
        mapaLeaflet.setView(CENTRO_POR_CIUDAD[estadoMapa.ciudad] || CENTRO_POR_CIUDAD.rosario, 12);
    }
}

function renderizarListaLugares(lugares) {
    const contenedor = document.querySelector('#lista-lugares-mapa');
    if (!lugares.length) {
        contenedor.innerHTML = `
            <p class="eventos-vacio">No encontramos lugares para estas categorías. Probá con otras.</p>
        `;
        return;
    }

    contenedor.innerHTML = lugares
        .map((lugar) => crearTarjetaComplemento(lugar, { ciudad: estadoMapa.ciudad, ubicacion: estadoMapa.ubicacion }))
        .join('');
}

function mostrarAvisoMapa(mensaje) {
    const aviso = document.querySelector('#aviso-mapa');
    if (!mensaje) {
        aviso.hidden = true;
        aviso.textContent = '';
        return;
    }
    aviso.hidden = false;
    aviso.textContent = mensaje;
}

async function buscarLugaresMapa() {
    const estado = document.querySelector('#estado-mapa');
    estado.textContent = 'Buscando lugares en el mapa...';
    mostrarAvisoMapa(null);

    const params = new URLSearchParams({
        ciudad: estadoMapa.ciudad,
        etiquetas: estadoMapa.etiquetas.join(',')
    });
    if (estadoMapa.ubicacion?.lat != null) {
        params.set('lat', String(estadoMapa.ubicacion.lat));
        params.set('lng', String(estadoMapa.ubicacion.lng));
    }

    try {
        const respuesta = await fetch(`${window.location.origin}/api/lugares?${params}`);
        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => ({}));
            throw new Error(error.error || 'No pudimos cargar el mapa.');
        }
        const payload = await respuesta.json();
        renderizarMapa(payload.lugares || []);
        renderizarListaLugares(payload.lugares || []);
        if (payload.aviso) mostrarAvisoMapa(payload.aviso);
        estado.textContent = `${payload.lugares?.length || 0} lugares encontrados.`;
    } catch (error) {
        renderizarListaLugares([]);
        mostrarAvisoMapa(error.message || 'No pudimos cargar el mapa de salidas.');
        estado.textContent = 'No pudimos cargar el mapa.';
        window.Toast?.mostrar(error.message || 'No pudimos cargar el mapa de salidas.', { tipo: 'error' });
    }
}

function elegirCiudadMapa(boton) {
    document.querySelectorAll('#chips-ciudad-mapa .chip').forEach((chip) => {
        chip.classList.toggle('seleccionado', chip === boton);
    });
    estadoMapa.ciudad = boton.dataset.ciudad;
    mapaLeaflet.setView(CENTRO_POR_CIUDAD[estadoMapa.ciudad] || CENTRO_POR_CIUDAD.rosario, 13);
    buscarLugaresMapa();
}

function actualizarCategoriasMapa() {
    const marcadas = Array.from(document.querySelectorAll('#categorias-mapa input:checked')).map(
        (input) => input.value
    );
    estadoMapa.etiquetas = marcadas.length ? marcadas : ['parques', 'plazas', 'deporte', 'turismo'];
    buscarLugaresMapa();
}

async function usarUbicacionMapa(boton) {
    boton.disabled = true;
    try {
        estadoMapa.ubicacion = await window.EventosApi.obtenerUbicacion();
        mapaLeaflet.setView([estadoMapa.ubicacion.lat, estadoMapa.ubicacion.lng], 14);
        window.Toast?.mostrar('Ubicación activada: ordenamos por cercanía.', { tipo: 'exito' });
        buscarLugaresMapa();
    } catch {
        window.Toast?.mostrar('No pudimos acceder a tu ubicación.', { tipo: 'info' });
    } finally {
        boton.disabled = false;
    }
}

function inicializarMapa() {
    window.CiudadesApi?.renderizarChipsCiudad(document.querySelector('#chips-ciudad-mapa'), {
        ciudadInicial: estadoMapa.ciudad
    });
    inicializarMapaLeaflet();

    document.addEventListener('click', (evento) => {
        const chip = evento.target.closest('#chips-ciudad-mapa .chip');
        const ubicacionBtn = evento.target.closest('#usar-ubicacion-mapa');

        if (chip) elegirCiudadMapa(chip);
        if (ubicacionBtn) usarUbicacionMapa(ubicacionBtn);
    });

    document.querySelector('#categorias-mapa')?.addEventListener('change', actualizarCategoriasMapa);

    buscarLugaresMapa();
}

document.addEventListener('DOMContentLoaded', inicializarMapa);
