const CLAVE_PUBLICAR = 'asi-salgo-publicar';

const CENTRO_POR_CIUDAD = window.CiudadesApi?.CENTRO_POR_CIUDAD || {
    rosario: [-32.9468, -60.6393],
    'santa-fe': [-31.6333, -60.7],
    cordoba: [-31.4201, -64.1888],
    mendoza: [-32.8908, -68.8272],
    'buenos-aires': [-34.6037, -58.3816]
};

const CIUDAD_ETIQUETA = window.CiudadesApi?.CIUDAD_ETIQUETA || {
    rosario: 'Rosario',
    'santa-fe': 'Santa Fe',
    cordoba: 'Córdoba',
    mendoza: 'Mendoza',
    'buenos-aires': 'Buenos Aires'
};

function escaparHtml(texto = '') {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const estadoMapaSalen = {
    salidas: [],
    lugaresCulturales: [],
    ciudad: 'rosario'
};

let mapaSalen = null;
let capaComunidad = null;
let capaCultural = null;

function inicializarMapaSalen() {
    const contenedor = document.querySelector('#mapa-salen');
    if (!contenedor || typeof L === 'undefined') return;

    mapaSalen = L.map('mapa-salen', { scrollWheelZoom: false }).setView(CENTRO_POR_CIUDAD.rosario, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(mapaSalen);

    capaComunidad = L.layerGroup().addTo(mapaSalen);
    capaCultural = L.layerGroup();
}

function iconoMapaSalen(color) {
    return L.divIcon({
        className: 'marcador-lugar marcador-lugar--comunidad',
        html: `<span style="background:${color}"></span>`,
        iconSize: [18, 18],
        popupAnchor: [0, -8]
    });
}

function popupSalida(salida) {
    const total = (salida.sumados || []).length;
    const donde = salida.direccion || salida.lugar || CIUDAD_ETIQUETA[salida.ciudad] || '';
    const enlace = `https://www.google.com/maps/dir/?api=1&destination=${salida.lat},${salida.lng}&travelmode=walking`;
    return `
        <div class="popup-lugar">
            <strong>${escaparHtml(salida.titulo)}</strong>
            <p>Organiza ${escaparHtml(salida.organizador)} · ${total} ${total === 1 ? 'persona' : 'personas'}</p>
            ${donde ? `<p>${escaparHtml(donde)}</p>` : ''}
            <a href="${enlace}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        </div>
    `;
}

function popupLugarCultural(lugar) {
    const enlace = `https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}&travelmode=walking`;
    return `
        <div class="popup-lugar">
            <strong>${escaparHtml(lugar.titulo || 'Espacio cultural')}</strong>
            <p>${escaparHtml((lugar.descripcion || '').slice(0, 110) || 'Teatro, cine o centro cultural de referencia.')}</p>
            <a href="${enlace}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        </div>
    `;
}

function ajustarVistaMapaSalen() {
    if (!mapaSalen) return;

    const capasActivas = [];
    if (document.querySelector('#capa-comunidad')?.checked) {
        capasActivas.push(...capaComunidad.getLayers());
    }
    if (document.querySelector('#capa-cultural')?.checked) {
        capasActivas.push(...capaCultural.getLayers());
    }

    if (!capasActivas.length) {
        const ciudad = document.querySelector('#filtro-ciudad')?.value || estadoMapaSalen.ciudad || 'rosario';
        mapaSalen.setView(CENTRO_POR_CIUDAD[ciudad] || CENTRO_POR_CIUDAD.rosario, 12);
        return;
    }

    const grupo = L.featureGroup(capasActivas);
    mapaSalen.fitBounds(grupo.getBounds().pad(0.18), { maxZoom: 15 });
}

function renderizarMapaSalen() {
    if (!mapaSalen) return;

    capaComunidad.clearLayers();
    capaCultural.clearLayers();

    const mostrarComunidad = document.querySelector('#capa-comunidad')?.checked !== false;
    const mostrarCultural = document.querySelector('#capa-cultural')?.checked === true;

    if (mostrarComunidad) {
        estadoMapaSalen.salidas
            .filter((salida) => salida.lat != null && salida.lng != null)
            .forEach((salida) => {
                L.marker([salida.lat, salida.lng], { icon: iconoMapaSalen('#7eb8da') })
                    .bindPopup(popupSalida(salida))
                    .addTo(capaComunidad);
            });
    }

    if (mostrarCultural) {
        if (!mapaSalen.hasLayer(capaCultural)) {
            capaCultural.addTo(mapaSalen);
        }
        estadoMapaSalen.lugaresCulturales.forEach((lugar) => {
            L.marker([lugar.lat, lugar.lng], { icon: iconoMapaSalen('#c49ad9') })
                .bindPopup(popupLugarCultural(lugar))
                .addTo(capaCultural);
        });
    } else if (mapaSalen.hasLayer(capaCultural)) {
        mapaSalen.removeLayer(capaCultural);
    }

    ajustarVistaMapaSalen();
}

async function cargarCapaCultural() {
    const ciudad = document.querySelector('#filtro-ciudad')?.value || 'rosario';
    const ciudadFinal = ciudad || 'rosario';
    estadoMapaSalen.ciudad = ciudadFinal;

    const params = new URLSearchParams({
        ciudad: ciudadFinal,
        etiquetas: 'cultural',
        limite: '16'
    });

    try {
        const respuesta = await fetch(`${window.location.origin}/api/lugares?${params}`);
        if (!respuesta.ok) return;
        const datos = await respuesta.json();
        estadoMapaSalen.lugaresCulturales = (datos.lugares || []).filter(
            (lugar) => lugar.lat != null && lugar.lng != null
        );
    } catch {
        estadoMapaSalen.lugaresCulturales = [];
    }
}

function actualizarEstadoMapaSalen() {
    const estado = document.querySelector('#estado-mapa-salen');
    if (!estado) return;

    const conCoords = estadoMapaSalen.salidas.filter((salida) => salida.lat != null && salida.lng != null).length;
    const partes = [`${conCoords} ${conCoords === 1 ? 'plan' : 'planes'} en el mapa`];

    if (document.querySelector('#capa-cultural')?.checked) {
        partes.push(`${estadoMapaSalen.lugaresCulturales.length} espacios culturales`);
    }

    estado.textContent = partes.join(' · ');
}

async function refrescarMapaSalen() {
    renderizarMapaSalen();
    actualizarEstadoMapaSalen();
}

async function onCambioCapasMapa() {
    const estado = document.querySelector('#estado-mapa-salen');
    if (document.querySelector('#capa-cultural')?.checked && !estadoMapaSalen.lugaresCulturales.length) {
        if (estado) estado.textContent = 'Cargando espacios culturales…';
        await cargarCapaCultural();
    }
    await refrescarMapaSalen();
}

function formatearFechaRelativa(fechaIso) {
    if (!fechaIso) return 'Recién publicado';
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return 'Hace un rato';

    const diffMs = Date.now() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Recién';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function leerPerfilActivo() {
    return window.PerfilApi?.leerPerfil() || null;
}

function obtenerIdentidad() {
    const perfil = leerPerfilActivo();
    if (!perfil) return null;
    return {
        perfilId: perfil.id,
        nombreVisible: perfil.nombreVisible,
        nombre: perfil.nombre
    };
}

function mismaPersona(persona, identidad) {
    if (!identidad) return false;
    if (persona.perfilId && identidad.perfilId) {
        return persona.perfilId === identidad.perfilId;
    }
    return (persona.nombre || '').toLowerCase() === identidad.nombreVisible.toLowerCase();
}

function actualizarBannerPerfil() {
    const banner = document.querySelector('#salen-perfil');
    const perfil = leerPerfilActivo();
    if (!banner) return;

    if (!perfil) {
        banner.innerHTML = `
            <p class="salen-perfil__texto">Para sumarte o publicar necesitás elegir cómo te llamamos.</p>
            <a class="salen-perfil__cta" href="${window.PerfilApi?.urlEntrar('salen.html') || 'entrar.html?dest=salen.html'}">
                Entrá a la comunidad
            </a>`;
        return;
    }

    banner.innerHTML = `
        <div class="salen-perfil__datos">
            <span class="salen-perfil__etiqueta">Entraste como</span>
            <strong class="salen-perfil__nombre">${escaparHtml(perfil.nombreVisible)}</strong>
        </div>
        <a class="salen-perfil__cambiar" href="entrar.html?dest=salen.html&cambiar=1">Cambiar</a>`;
}

function leerBorradorEvento() {
    try {
        const datos = sessionStorage.getItem(CLAVE_PUBLICAR);
        if (!datos) return null;
        sessionStorage.removeItem(CLAVE_PUBLICAR);
        return JSON.parse(datos);
    } catch {
        return null;
    }
}

function crearTarjetaSalida(salida, identidad) {
    const sumados = salida.sumados || [];
    const total = sumados.length;
    const yaSumado = identidad ? sumados.some((persona) => mismaPersona(persona, identidad)) : false;
    const esOrganizador = identidad ? mismaPersona({ nombre: salida.organizador, perfilId: salida.perfilId }, identidad) : false;
    const chips = sumados
        .slice(0, 8)
        .map((persona) => {
            const clase = persona.esOrganizador ? 'salen-chip salen-chip--organiza' : 'salen-chip';
            return `<span class="${clase}">${escaparHtml(persona.nombre)}</span>`;
        })
        .join('');
    const mas = total > 8 ? `<span class="salen-chip salen-chip--mas">+${total - 8}</span>` : '';

    let botonSumo = '';
    if (!identidad) {
        botonSumo = `<a class="salen-sumo salen-sumo--entrar" href="${window.PerfilApi?.urlEntrar('salen.html') || 'entrar.html?dest=salen.html'}">Entrá para sumarte</a>`;
    } else if (esOrganizador) {
        botonSumo = '<span class="salen-ya-sumado">Vos organizás esta salida</span>';
    } else if (yaSumado) {
        botonSumo = '<span class="salen-ya-sumado">Ya te sumaste</span>';
    } else {
        botonSumo = `<button class="salen-sumo" type="button" data-sumo-id="${escaparHtml(salida.id)}">Me sumo</button>`;
    }

    const donde = salida.direccion || salida.lugar || CIUDAD_ETIQUETA[salida.ciudad] || '';

    return `
        <article class="salen-card">
            <div class="salen-card__meta">
                <span class="salen-card__ciudad">${escaparHtml(CIUDAD_ETIQUETA[salida.ciudad] || salida.ciudad)}</span>
                <span>${formatearFechaRelativa(salida.creado)}</span>
                <span>${total} ${total === 1 ? 'persona' : 'personas'}</span>
            </div>
            <h3 class="salen-card__titulo">${escaparHtml(salida.titulo)}</h3>
            ${salida.descripcion ? `<p class="salen-card__descripcion">${escaparHtml(salida.descripcion)}</p>` : ''}
            <p class="salen-card__organiza">
                Organiza <strong>${escaparHtml(salida.organizador)}</strong>
                ${donde ? `· ${escaparHtml(donde)}` : ''}
            </p>
            <div class="salen-card__personas" aria-label="Quién se sumó">
                ${chips || '<span class="salen-chip salen-chip--vacio">Sé la primera persona en sumarte</span>'}
                ${mas}
            </div>
            <div class="salen-card__acciones">${botonSumo}</div>
        </article>
    `;
}

async function cargarSalidas() {
    const ciudad = document.querySelector('#filtro-ciudad')?.value || '';
    const estado = document.querySelector('#estado-feed');
    const lista = document.querySelector('#lista-salen');
    const identidad = obtenerIdentidad();

    estado.textContent = 'Cargando salidas…';

    const params = new URLSearchParams();
    if (ciudad) params.set('ciudad', ciudad);

    try {
        const respuesta = await fetch(`${window.location.origin}/api/salen?${params}`);
        if (!respuesta.ok) throw new Error('No pudimos cargar la comunidad.');

        const datos = await respuesta.json();
        const salidas = datos.salidas || [];
        estadoMapaSalen.salidas = salidas;
        estadoMapaSalen.ciudad = ciudad || 'rosario';

        if (!salidas.length) {
            lista.innerHTML = `
                <p class="salen-vacio">
                    Todavía no hay planes publicados en esta ciudad.
                    Sé la primera persona en contar a dónde vas.
                </p>`;
            estado.textContent = 'Sin planes por ahora.';
            await refrescarMapaSalen();
            return;
        }

        lista.innerHTML = salidas.map((salida) => crearTarjetaSalida(salida, identidad)).join('');
        estado.textContent = `${salidas.length} ${salidas.length === 1 ? 'plan activo' : 'planes activos'}.`;
        await refrescarMapaSalen();
    } catch (error) {
        lista.innerHTML = `<p class="salen-vacio">${escaparHtml(error.message)}</p>`;
        estado.textContent = 'Error al cargar.';
        estadoMapaSalen.salidas = [];
        await refrescarMapaSalen();
    }
}

function pedirEntrada() {
    window.Toast?.mostrar('Primero elegí cómo te llamamos en la comunidad.', { tipo: 'info' });
    window.location.href = window.PerfilApi?.urlEntrar('salen.html') || 'entrar.html?dest=salen.html';
}

async function sumarseASalida(id) {
    const identidad = obtenerIdentidad();
    if (!identidad) {
        pedirEntrada();
        return;
    }

    const boton = document.querySelector(`[data-sumo-id="${id}"]`);
    if (boton) {
        boton.disabled = true;
        boton.textContent = 'Sumando…';
    }

    try {
        const respuesta = await fetch(`${window.location.origin}/api/salen/${id}/sumo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: identidad.nombreVisible,
                nombreVisible: identidad.nombreVisible,
                perfilId: identidad.perfilId
            })
        });

        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => ({}));
            throw new Error(error.error || 'No pudimos sumarte.');
        }

        const datos = await respuesta.json();
        if (datos.yaEstaba) {
            window.Toast?.mostrar('Ya figurás en este plan.', { tipo: 'info' });
        } else {
            window.Toast?.mostrar(`¡Listo, ${identidad.nombre}! Te sumaste a la salida.`, { tipo: 'exito' });
        }
        await cargarSalidas();
    } catch (error) {
        window.Toast?.mostrar(error.message, { tipo: 'error' });
        if (boton) {
            boton.disabled = false;
            boton.textContent = 'Me sumo';
        }
    }
}

async function publicarSalida(evento) {
    evento.preventDefault();

    const identidad = obtenerIdentidad();
    if (!identidad) {
        pedirEntrada();
        return;
    }

    const formulario = evento.target;
    const datosFormulario = new FormData(formulario);
    const boton = document.querySelector('#btn-publicar-salida');

    const payload = {
        organizador: identidad.nombreVisible,
        nombreVisible: identidad.nombreVisible,
        perfilId: identidad.perfilId,
        titulo: (datosFormulario.get('titulo') || '').toString().trim(),
        descripcion: (datosFormulario.get('descripcion') || '').toString().trim(),
        ciudad: datosFormulario.get('ciudad'),
        lugar: (datosFormulario.get('lugar') || '').toString().trim(),
        direccion: (datosFormulario.get('lugar') || '').toString().trim(),
        eventoId: formulario.dataset.eventoId || null
    };

    if (!payload.titulo) {
        window.Toast?.mostrar('Contanos a dónde vas.', { tipo: 'error' });
        document.querySelector('#pub-titulo')?.focus();
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Publicando…';

    try {
        const respuesta = await fetch(`${window.location.origin}/api/salen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => ({}));
            throw new Error(error.error || 'No pudimos publicar tu salida.');
        }

        window.Toast?.mostrar('Tu salida ya está visible para la comunidad.', { tipo: 'exito' });
        formulario.reset();
        delete formulario.dataset.eventoId;
        document.querySelector('#filtro-ciudad').value = payload.ciudad;
        await cargarSalidas();
        document.querySelector('#lista-salen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        window.Toast?.mostrar(error.message, { tipo: 'error' });
    } finally {
        boton.disabled = false;
        boton.innerHTML = 'Publicar mi salida <span aria-hidden="true">→</span>';
    }
}

function aplicarBorradorEvento(evento) {
    if (!evento) return;

    const titulo = document.querySelector('#pub-titulo');
    const descripcion = document.querySelector('#pub-descripcion');
    const ciudad = document.querySelector('#pub-ciudad');
    const lugar = document.querySelector('#pub-lugar');
    const formulario = document.querySelector('#form-publicar-salida');

    if (titulo) titulo.value = evento.titulo || '';
    if (descripcion) descripcion.value = (evento.descripcion || '').slice(0, 320);
    if (ciudad) ciudad.value = evento.ciudad && CIUDAD_ETIQUETA[evento.ciudad] ? evento.ciudad : 'rosario';
    if (lugar) lugar.value = evento.lugar || evento.direccion || '';
    if (formulario && evento.id) formulario.dataset.eventoId = evento.id;

    window.Toast?.mostrar('Trajimos el evento que elegiste. Revisá y publicá.', { tipo: 'info' });
}

function inicializarSalen() {
    window.CiudadesApi?.poblarSelect(document.querySelector('#filtro-ciudad'), {
        valorInicial: 'rosario',
        incluirTodas: true
    });
    window.CiudadesApi?.poblarSelect(document.querySelector('#pub-ciudad'), { valorInicial: 'rosario' });

    inicializarMapaSalen();
    actualizarBannerPerfil();
    aplicarBorradorEvento(leerBorradorEvento());

    if (window.location.hash === '#publicar') {
        document.querySelector('#publicar')?.scrollIntoView({ behavior: 'smooth' });
    }

    document.querySelector('#filtro-ciudad')?.addEventListener('change', async () => {
        estadoMapaSalen.lugaresCulturales = [];
        await cargarSalidas();
    });

    document.querySelector('#capas-mapa-salen')?.addEventListener('change', onCambioCapasMapa);

    document.querySelector('#lista-salen')?.addEventListener('click', (eventoClick) => {
        const boton = eventoClick.target.closest('[data-sumo-id]');
        if (!boton) return;
        sumarseASalida(boton.dataset.sumoId);
    });

    document.querySelector('#form-publicar-salida')?.addEventListener('submit', publicarSalida);

    cargarSalidas();
}

document.addEventListener('DOMContentLoaded', inicializarSalen);

/** Permite que El Viaje guarde un evento para publicar acá. */
window.SalenApi = {
    guardarEventoParaPublicar(evento) {
        sessionStorage.setItem(CLAVE_PUBLICAR, JSON.stringify(evento));
    }
};
