const API_BASE = window.location.origin;
const MAX_DESCRIPCION = 90;
const MAX_TITULO = 64;

const iconosEtiqueta = {
    evento: '◉',
    parque: '🌳',
    plaza: '⬡',
    deporte: '◎',
    'punto-turistico': '◇',
    cultural: '◈',
    lugar: '○'
};

const iconosMeta = {
    entradaGratis: '🟢',
    entradaPaga: '🎟️',
    peques: '👨‍👩‍👧',
    distancia: '📍',
    etiqueta: '🏷️'
};

const CIUDAD_ETIQUETA = window.CiudadesApi?.CIUDAD_ETIQUETA || {
    rosario: 'Rosario',
    'buenos-aires': 'Buenos Aires'
};

/** Cache en memoria para enlazar botones de compartir con el evento completo. */
const cacheSalidas = new Map();

function registrarSalida(evento, contexto = {}) {
    if (!evento?.id) return;
    cacheSalidas.set(evento.id, { evento, contexto });
}

function obtenerSalidaCache(id) {
    return cacheSalidas.get(id) || null;
}

function textoLimpio(texto = '') {
    return texto.replace(/\s+/g, ' ').trim();
}

function iconoPuertaSumo() {
    return window.PuertaApi?.renderIcono() || '';
}

function accionesTarjeta(evento, enlaceLlegar) {
    if (!evento?.id) {
        return enlaceLlegar
            ? `<div class="evento-card__acciones">
                <a class="evento-card__opcion" href="${enlaceLlegar}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">🧭</span><span>Llegar</span></a>
               </div>`
            : '';
    }

    const id = escaparHtml(evento.id);

    return `
        <div class="evento-card__acciones">
            <a class="evento-card__opcion" href="${enlaceLlegar}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">🧭</span><span>Llegar</span></a>
            <button class="evento-card__opcion evento-card__opcion--compartir" type="button"
                data-compartir-toggle data-evento-id="${id}"
                aria-expanded="false" aria-controls="redes-${id}">
                <span aria-hidden="true">↗</span><span>Compartir</span>
            </button>
            <button class="evento-card__opcion evento-card__opcion--salen" type="button"
                data-publicar-salida data-evento-id="${id}">
                ${iconoPuertaSumo()}<span>Me sumo</span>
            </button>
        </div>
        <div class="evento-card__redes" id="redes-${id}" data-evento-id="${id}" hidden>
            <span class="evento-card__redes-etiqueta">Invitar</span>
            <button class="evento-card__red-social evento-card__red-social--sistema" type="button"
                data-compartir="sistema" data-evento-id="${id}"><span aria-hidden="true">📲</span><span>Compartir…</span></button>
            <button class="evento-card__red-social evento-card__red-social--whatsapp" type="button"
                data-compartir="whatsapp" data-evento-id="${id}"><span aria-hidden="true">💬</span><span>WhatsApp</span></button>
        </div>
    `;
}

function escaparHtml(texto = '') {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function esUrlSegura(url) {
    if (!url || typeof url !== 'string') return null;

    const limpia = url.trim();
    if (!limpia) return null;

    try {
        const parsed = new URL(limpia);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return limpia;
        }
    } catch {
        /* URL inválida */
    }

    return null;
}

function recortarTexto(texto = '', maximo) {
    const limpio = texto.replace(/\s+/g, ' ').trim();
    if (!limpio) return '';
    if (limpio.length <= maximo) return limpio;
    return `${limpio.slice(0, maximo - 1).trim()}…`;
}

function descripcionExpandible(texto, fallback = '', maximo = MAX_DESCRIPCION) {
    const base = textoLimpio(texto || fallback);
    if (!base) return '';

    const corta = recortarTexto(base, maximo);
    const esLarga = corta.length < base.length;

    if (!esLarga) {
        return `<p class="evento-card__descripcion">${escaparHtml(base)}</p>`;
    }

    return `
        <details class="evento-card__descripcion-detalle">
            <summary>${escaparHtml(corta)} <span class="evento-card__descripcion-toggle">Ver más</span></summary>
            <p class="evento-card__descripcion evento-card__descripcion--completa">${escaparHtml(base)}</p>
        </details>
    `;
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return 'Consultá horarios en el lugar';
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return 'Fecha a confirmar';

    return fecha.toLocaleString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatearDistancia(km) {
    if (km == null) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`;
}

function enlaceComoLlegar(item, ciudad, ubicacion) {
    const destino =
        item.lat != null && item.lng != null
            ? `${item.lat},${item.lng}`
            : `${item.direccion || item.lugar || item.titulo}, ${CIUDAD_ETIQUETA[ciudad] || ''}`.trim();

    const params = new URLSearchParams({
        api: '1',
        destination: destino,
        travelmode: 'walking'
    });

    if (ubicacion?.lat != null && ubicacion?.lng != null) {
        params.set('origin', `${ubicacion.lat},${ubicacion.lng}`);
    }

    return `https://www.google.com/maps/dir/?${params}`;
}

function etiquetaEntrada(evento) {
    if (evento.gratis === true) return 'Gratis';
    if (evento.gratis === false) return 'Paga';
    return null;
}

function badgeMeta(icono, texto, clase = '') {
    return `<span class="evento-card__badge ${clase}"><span aria-hidden="true">${icono}</span><span>${escaparHtml(texto)}</span></span>`;
}

function etiquetaTipo(tipo = '') {
    const limpio = String(tipo || 'evento').replace(/-/g, ' ').trim();
    if (!limpio) return 'Evento';
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

function crearTarjetaEvento(evento, contexto = {}) {
    registrarSalida(evento, contexto);
    const { ciudad, ubicacion } = contexto;
    const etiquetas = (evento.etiquetas || []).slice(0, 2);
    const entrada = etiquetaEntrada(evento);
    const icono = iconosEtiqueta[evento.tipo] || '◉';
    const titulo = escaparHtml(recortarTexto(evento.titulo, MAX_TITULO));
    const descripcion = descripcionExpandible(evento.descripcion);
    const distancia = formatearDistancia(evento.distanciaKm);
    const direccion = escaparHtml(evento.direccion || evento.lugar || CIUDAD_ETIQUETA[ciudad] || '');
    const ruta = enlaceComoLlegar(evento, ciudad, ubicacion);

    const badges = [
        badgeMeta(icono, etiquetaTipo(evento.tipo), 'evento-card__badge--tipo'),
        entrada
            ? badgeMeta(
                entrada === 'Gratis' ? iconosMeta.entradaGratis : iconosMeta.entradaPaga,
                entrada,
                entrada === 'Gratis' ? 'evento-card__badge--gratis' : 'evento-card__badge--paga'
            )
            : '',
        evento.aptoNinos === true ? badgeMeta(iconosMeta.peques, 'Con peques', 'evento-card__badge--peques') : '',
        distancia ? badgeMeta(iconosMeta.distancia, distancia, 'evento-card__badge--distancia') : '',
        ...etiquetas.map((item) => badgeMeta(iconosMeta.etiqueta, item, 'evento-card__badge--etiqueta'))
    ].filter(Boolean).join('');

    return `
        <article class="evento-card">
            <div class="evento-card__meta">
                ${badges}
            </div>
            <h3 class="evento-card__titulo">${titulo}</h3>
            ${descripcion}
            <dl class="evento-card__datos">
                <div>
                    <dt>Cuándo</dt>
                    <dd>${formatearFecha(evento.fechaInicio)}</dd>
                </div>
                <div>
                    <dt>Dónde</dt>
                    <dd>${direccion}</dd>
                </div>
            </dl>
            ${accionesTarjeta(evento, ruta)}
        </article>
    `;
}

function crearTarjetaComplemento(lugar, contexto = {}) {
    const { ciudad, ubicacion } = contexto;
    const eventoCompartible = {
        id: lugar.id || `lugar-${(lugar.titulo || 'espacio').slice(0, 24)}-${ciudad}`,
        titulo: lugar.titulo || 'Espacio para salir',
        descripcion:
            lugar.descripcion || 'Espacio público para salir sin complicarte.',
        fechaInicio: null,
        lugar: lugar.barrio || null,
        direccion: lugar.direccion || lugar.barrio || null,
        lat: lugar.lat,
        lng: lugar.lng,
        ciudad,
        tipo: lugar.tipo || 'lugar',
        gratis: true,
        link: null
    };
    registrarSalida(eventoCompartible, contexto);
    const icono = iconosEtiqueta[lugar.tipo] || iconosEtiqueta.lugar;
    const titulo = escaparHtml(recortarTexto(lugar.titulo, MAX_TITULO));
    const descripcion = descripcionExpandible(
        lugar.descripcion,
        'Espacio público para salir sin complicarte.'
    );
    const distancia = formatearDistancia(lugar.distanciaKm);
    const direccion = escaparHtml(lugar.direccion || lugar.barrio || CIUDAD_ETIQUETA[ciudad] || '');
    const transporte = (lugar.transporte || []).slice(0, 3).join(' · ');
    const ruta = enlaceComoLlegar(lugar, ciudad, ubicacion);

    return `
        <article class="evento-card evento-card--complemento">
            <div class="evento-card__meta">
                <span class="evento-card__icono" aria-hidden="true">${icono}</span>
                <span>${escaparHtml(lugar.tipo || 'lugar')}</span>
                ${distancia ? `<span>${distancia}</span>` : ''}
            </div>
            <h3 class="evento-card__titulo">${titulo}</h3>
            ${descripcion}
            <dl class="evento-card__datos">
                <div>
                    <dt>Ubicación</dt>
                    <dd>${direccion}</dd>
                </div>
                <div>
                    <dt>Movilidad</dt>
                    <dd>${transporte ? escaparHtml(transporte) : 'Consultá en el mapa'}</dd>
                </div>
            </dl>
            ${accionesTarjeta(eventoCompartible, ruta)}
        </article>
    `;
}

/**
 * Traduce el clima a una de seis "escenas" chicas (mismo lenguaje visual que
 * el resto de la app: trazos que se animan según lo que representan) en vez
 * de un ícono genérico. Usamos el código de Open-Meteo cuando está disponible
 * y la temperatura como respaldo.
 */
function categoriaClima(clima) {
    if (!clima) return 'despejado';

    const codigo = clima.codigo;
    const temperatura = clima.temperatura;
    const esLluvia =
        [51, 53, 55, 61, 63, 65, 80, 95].includes(codigo) || (clima.precipitacion || 0) > 0.5;
    const esNublado = [2, 3, 45, 48].includes(codigo);
    const esFrio = temperatura != null && temperatura < 10;
    const esCalor = temperatura != null && temperatura > 28;

    if (esLluvia) return 'lluvia';
    if (esFrio && esNublado) return 'frio-nublado';
    if (esFrio) return 'frio';
    if (esCalor) return 'calor';
    if (esNublado) return 'nublado';
    return 'despejado';
}

const PIEZAS_CLIMA = {
    sol: `
        <circle class="clima-trazo clima-trazo--sol" cx="18" cy="15" r="6" />
        <path class="clima-rayo" d="M18 4 V7 M18 23 V26 M26 15 H29 M7 15 H10" />
        <path class="clima-rayo clima-rayo--diagonal"
            d="M23.9 9.1 L26.1 6.9 M12.1 9.1 L9.9 6.9 M23.9 20.9 L26.1 23.1 M12.1 20.9 L9.9 23.1" />
    `,
    nube: `
        <path class="clima-trazo clima-trazo--nube"
            d="M7 23 C3 23 2 19 6 17.5 C5 12.5 13 10.5 16 14.5 C21 10.5 28 14.5 26 19.5 C30 20 29 25 25 25 H9 C7 25 6 24 7 23 Z" />
    `,
    gotas: `
        <path class="clima-gota" d="M11 27 V32" />
        <path class="clima-gota clima-gota--2" d="M17 28 V34" />
        <path class="clima-gota clima-gota--3" d="M23 27 V32" />
    `,
    copo: '<path class="clima-copo" d="M18 6 V26 M9 11 L27 21 M27 11 L9 21" />',
    copoChico: '<path class="clima-copo clima-copo--chico" d="M27 27 V31 M25.3 28 L28.7 30 M28.7 28 L25.3 30" />',
    ondas: `
        <path class="clima-onda" d="M8 29 Q13 25 18 29 Q23 33 28 29" />
        <path class="clima-onda clima-onda--2" d="M9 34 Q13.5 31 18 34 Q22.5 37 27 34" />
    `
};

function contenidoIconoClima(categoria) {
    switch (categoria) {
        case 'lluvia':
            return PIEZAS_CLIMA.nube + PIEZAS_CLIMA.gotas;
        case 'frio':
            return PIEZAS_CLIMA.copo + PIEZAS_CLIMA.copoChico;
        case 'frio-nublado':
            return PIEZAS_CLIMA.nube + PIEZAS_CLIMA.copoChico;
        case 'calor':
            return PIEZAS_CLIMA.sol + PIEZAS_CLIMA.ondas;
        case 'nublado':
            return PIEZAS_CLIMA.nube;
        default:
            return PIEZAS_CLIMA.sol;
    }
}

function renderizarClima(contenedor, clima) {
    if (!contenedor) return;
    if (!clima) {
        contenedor.hidden = true;
        contenedor.innerHTML = '';
        return;
    }

    const categoria = categoriaClima(clima);

    contenedor.hidden = false;
    contenedor.innerHTML = `
        <div class="clima-card">
            <svg class="clima-icono clima-icono--${categoria}" viewBox="0 0 36 38" aria-hidden="true">
                ${contenidoIconoClima(categoria)}
            </svg>
            <p class="clima-card__temp">${clima.temperatura != null ? `${Math.round(clima.temperatura)}${clima.unidad || '°C'}` : '—'}</p>
            <div>
                <p class="clima-card__estado">${escaparHtml(clima.estado || 'Clima actual')}</p>
                <p class="clima-card__consejo">${escaparHtml(clima.consejo || '')}</p>
            </div>
        </div>
    `;
}

function renderizarEventos(contenedor, payload) {
    const {
        eventos = [],
        complementos = [],
        clima,
        aviso,
        fuente,
        ciudad,
        ubicacion
    } = payload;
    const nota = document.querySelector('#nota-fuente');
    const seccionComplementos = document.querySelector('#seccion-complementos');
    const contenedorComplementos = document.querySelector('#lista-complementos');
    const avisos = [];

    renderizarClima(document.querySelector('#contexto-clima'), clima);

    if (aviso) avisos.push(aviso);
    if (!ubicacion) {
        avisos.push('Activá la ubicación para ordenar por cercanía.');
    }
    if (fuente) avisos.push(`Eventos: ${fuente}.`);
    if (complementos.length) {
        avisos.push('Planes cerca: datos públicos de espacios y clima.');
    }

    const contexto = { ciudad, ubicacion };
    const sinEventos = !eventos.length;
    const conComplementos = complementos.length > 0;

    if (sinEventos && conComplementos) {
        contenedor.innerHTML = '';
    } else if (sinEventos) {
        contenedor.innerHTML = `
            <p class="eventos-vacio">
                No hay propuestas disponibles ahora.
                Probá con otro momento, ciudad o distancia.
            </p>
        `;
    } else {
        contenedor.innerHTML = eventos
            .map((evento) => crearTarjetaEvento(evento, contexto))
            .join('');
    }

    if (conComplementos && contenedorComplementos && seccionComplementos) {
        seccionComplementos.hidden = false;
        const titulo = seccionComplementos.querySelector('.complementos__titulo');
        const ayuda = seccionComplementos.querySelector('.complementos__ayuda');
        if (titulo) {
            titulo.textContent = sinEventos ? 'Propuestas para salir hoy' : 'Planes cerca';
        }
        if (ayuda) {
            ayuda.textContent = sinEventos
                ? 'Espacios públicos según tu plan y el clima, sin depender de la agenda cultural.'
                : 'Espacios públicos según tu plan, sin depender de la agenda cultural.';
        }
        contenedorComplementos.innerHTML = complementos
            .map((lugar) => crearTarjetaComplemento(lugar, contexto))
            .join('');
    } else if (seccionComplementos) {
        seccionComplementos.hidden = true;
    }

    nota.hidden = false;
    nota.textContent = avisos.join(' ');

    enlazarCompartirEnContenedores();
    enlazarPublicarSalidaEnContenedores();
}

function enlazarPublicarSalidaEnContenedores() {
    document.querySelectorAll('#lista-eventos, #lista-complementos').forEach((nodo) => {
        if (!nodo || nodo.dataset.salenListo === 'true') return;
        nodo.dataset.salenListo = 'true';
        nodo.addEventListener('click', (eventoClick) => {
            const boton = eventoClick.target.closest('[data-publicar-salida]');
            if (!boton) return;

            const irAPublicar = () => {
                const payload = obtenerSalidaCache(boton.dataset.eventoId);
                if (payload?.evento) {
                    sessionStorage.setItem('asi-salgo-publicar', JSON.stringify(payload.evento));
                }
                window.location.href = 'salen.html#publicar';
            };

            if (window.PuertaApi?.ejecutarConPuerta) {
                window.PuertaApi.ejecutarConPuerta(boton, irAPublicar);
            } else {
                irAPublicar();
            }
        });
    });
}

function enlazarCompartirEnContenedores() {
    if (!window.CompartirApi?.enlazarBotonesCompartir) return;
    const obtener = (id) => obtenerSalidaCache(id);
    document.querySelectorAll('#lista-eventos, #lista-complementos').forEach((nodo) => {
        window.CompartirApi.enlazarBotonesCompartir(nodo, obtener);
    });
}

function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no disponible'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                resolve({
                    lat: posicion.coords.latitude,
                    lng: posicion.coords.longitude
                });
            },
            (error) => reject(error),
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 300000
            }
        );
    });
}

async function buscarEventos({ ciudad, momento, plan, distancia, energia, perfil, ubicacion }) {
    const params = new URLSearchParams({
        ciudad,
        momento,
        plan,
        energia: energia || '',
        distancia: distancia || 'ciudad',
        limite: '6'
    });

    if (perfil) params.set('perfil', perfil);

    if (ubicacion?.lat != null && ubicacion?.lng != null) {
        params.set('lat', String(ubicacion.lat));
        params.set('lng', String(ubicacion.lng));
    }

    const respuesta = await fetch(`${API_BASE}/api/eventos?${params}`);

    if (!respuesta.ok) {
        const error = await respuesta.json().catch(() => ({}));
        throw new Error(error.error || 'No pudimos cargar tu salida.');
    }

    return respuesta.json();
}

window.EventosApi = {
    buscarEventos,
    renderizarEventos,
    obtenerUbicacion
};
