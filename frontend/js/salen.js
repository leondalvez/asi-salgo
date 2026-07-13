const CLAVE_PUBLICAR = 'asi-salgo-publicar';

const CENTRO_POR_CIUDAD = window.CiudadesApi?.CENTRO_POR_CIUDAD || {
    rosario: [-32.9468, -60.6393],
    'buenos-aires': [-34.6037, -58.3816]
};

const CIUDAD_ETIQUETA = window.CiudadesApi?.CIUDAD_ETIQUETA || {
    rosario: 'Rosario',
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
const marcadoresSalida = new Map();

function iconoPuertaMeSumo() {
    return window.PuertaApi?.renderIcono() || '';
}

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

function iconoMapaSalen(total) {
    const etiqueta = total > 0 ? `<b class="marcador-comunidad__total">${total}</b>` : '';
    return L.divIcon({
        className: 'marcador-lugar marcador-lugar--comunidad',
        html: `<span class="marcador-comunidad"><i></i>${etiqueta}</span>`,
        iconSize: [22, 22],
        popupAnchor: [0, -10]
    });
}

function listarCompanerosHtml(sumados = []) {
    if (!sumados.length) {
        return '<p class="popup-lugar__companeros popup-lugar__companeros--vacio">Todavía nadie se sumó. Sé la primera persona.</p>';
    }

    const items = sumados
        .map((persona) => {
            const clase = persona.esOrganizador ? 'popup-companero popup-companero--organiza' : 'popup-companero';
            const rol = persona.esOrganizador ? ' · organiza' : '';
            return `<li class="${clase}">${escaparHtml(persona.nombre)}${rol}</li>`;
        })
        .join('');

    return `
        <div class="popup-lugar__companeros">
            <span class="popup-lugar__companeros-titulo">Compañeros de salida</span>
            <ul>${items}</ul>
        </div>`;
}

function popupSalida(salida) {
    const sumados = salida.sumados || [];
    const total = sumados.length;
    const donde = salida.direccion || salida.lugar || CIUDAD_ETIQUETA[salida.ciudad] || '';
    const enlace = `https://www.google.com/maps/dir/?api=1&destination=${salida.lat},${salida.lng}&travelmode=walking`;
    return `
        <div class="popup-lugar">
            <strong>${escaparHtml(salida.titulo)}</strong>
            <p>Organiza ${escaparHtml(salida.organizador)} · ${total} ${total === 1 ? 'persona' : 'personas'}</p>
            ${donde ? `<p>${escaparHtml(donde)}</p>` : ''}
            ${listarCompanerosHtml(sumados)}
            <a href="${enlace}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
        </div>
    `;
}

function enfocarSalidaEnMapa(id, { abrirPopup = true } = {}) {
    const marcador = marcadoresSalida.get(id);
    if (!marcador || !mapaSalen) return false;

    mapaSalen.setView(marcador.getLatLng(), Math.max(mapaSalen.getZoom(), 14), { animate: true });
    if (abrirPopup) marcador.openPopup();

    const icono = marcador.getElement()?.querySelector('.marcador-comunidad');
    if (icono) {
        icono.classList.remove('marcador-comunidad--pulso');
        void icono.offsetWidth;
        icono.classList.add('marcador-comunidad--pulso');
    }

    document.querySelector('#mapa-salen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
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
    marcadoresSalida.clear();

    const mostrarComunidad = document.querySelector('#capa-comunidad')?.checked !== false;
    const mostrarCultural = document.querySelector('#capa-cultural')?.checked === true;

    if (mostrarComunidad) {
        estadoMapaSalen.salidas
            .filter((salida) => salida.lat != null && salida.lng != null)
            .forEach((salida) => {
                const total = (salida.sumados || []).length;
                const marcador = L.marker([salida.lat, salida.lng], {
                    icon: iconoMapaSalen(total)
                })
                    .bindPopup(popupSalida(salida))
                    .addTo(capaComunidad);
                marcadoresSalida.set(salida.id, marcador);
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
        botonSumo = `<a class="salen-sumo salen-sumo--entrar" href="${window.PerfilApi?.urlEntrar('salen.html') || 'entrar.html?dest=salen.html'}">${iconoPuertaMeSumo()}<span>Entrá para sumarte</span></a>`;
    } else if (esOrganizador) {
        botonSumo = '<span class="salen-ya-sumado">Vos organizás esta salida</span>';
    } else if (yaSumado) {
        botonSumo = '<span class="salen-ya-sumado">Ya te sumaste — mirá el mapa</span>';
    } else {
        botonSumo = `<button class="salen-sumo" type="button" data-sumo-id="${escaparHtml(salida.id)}">${iconoPuertaMeSumo()}<span>Me sumo</span></button>`;
    }

    const tieneMapa = salida.lat != null && salida.lng != null;
    const verMapa = tieneMapa
        ? `<button class="salen-ver-mapa" type="button" data-mapa-id="${escaparHtml(salida.id)}">Ver en el mapa</button>`
        : '';

    const donde = salida.direccion || salida.lugar || CIUDAD_ETIQUETA[salida.ciudad] || '';

    return `
        <article class="salen-card" data-salida-id="${escaparHtml(salida.id)}">
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
            <div class="salen-card__acciones">
                ${botonSumo}
                ${verMapa}
            </div>
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
    const ejecutar = async () => {
        if (boton) {
            boton.disabled = true;
            const etiqueta = boton.querySelector('span');
            if (etiqueta) etiqueta.textContent = 'Sumando…';
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
                window.Toast?.mostrar(`¡Listo, ${identidad.nombre}! Abrimos la puerta a tu salida.`, { tipo: 'exito' });
            }
            await cargarSalidas();
            enfocarSalidaEnMapa(id);
        } catch (error) {
            window.Toast?.mostrar(error.message, { tipo: 'error' });
            if (boton) {
                boton.disabled = false;
                boton.classList.remove('abriendo');
                const etiqueta = boton.querySelector('span');
                if (etiqueta) etiqueta.textContent = 'Me sumo';
            }
        }
    };

    if (window.PuertaApi?.ejecutarConPuerta && boton) {
        window.PuertaApi.ejecutarConPuerta(boton, ejecutar);
    } else {
        await ejecutar();
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

        const datos = await respuesta.json();
        window.Toast?.mostrar('Tu salida ya está visible para la comunidad.', { tipo: 'exito' });
        formulario.reset();
        delete formulario.dataset.eventoId;
        document.querySelector('#filtro-ciudad').value = payload.ciudad;
        await cargarSalidas();
        if (datos.salida?.id) {
            enfocarSalidaEnMapa(datos.salida.id);
        } else {
            document.querySelector('#lista-salen')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
        const botonSumo = eventoClick.target.closest('[data-sumo-id]');
        if (botonSumo) {
            sumarseASalida(botonSumo.dataset.sumoId);
            return;
        }

        const botonMapa = eventoClick.target.closest('[data-mapa-id]');
        if (botonMapa) {
            enfocarSalidaEnMapa(botonMapa.dataset.mapaId);
        }
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
