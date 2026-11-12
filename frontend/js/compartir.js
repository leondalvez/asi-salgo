/**
 * Compartir una salida por WhatsApp o por Web Share API (cuando existe).
 * Si el navegador no soporta share nativo, copiamos la invitación y
 * mostramos un asistente con accesos a Instagram, Facebook y X.
 *
 * Encapsulado en IIFE para no chocar con const globales de eventos.js
 * (p. ej. CIUDAD_ETIQUETA) cuando ambos scripts cargan en la misma página.
 */
(function () {
    const CIUDAD_ETIQUETA = {
        rosario: 'Rosario',
        'buenos-aires': 'Buenos Aires'
    };

    function formatearFechaCompartir(fechaIso) {
        if (!fechaIso) return 'Fecha a confirmar';
        const fecha = new Date(fechaIso);
        if (Number.isNaN(fecha.getTime())) return 'Fecha a confirmar';
        return fecha.toLocaleString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function textoEntrada(evento) {
        if (evento.gratis === true) return 'Entrada gratis';
        if (evento.gratis === false) return 'Entrada paga';
        return null;
    }

    function armarMensaje(evento, url) {
        const ciudad = CIUDAD_ETIQUETA[evento.ciudad] || 'la ciudad';
        const donde = evento.direccion || evento.lugar || ciudad;
        const entrada = textoEntrada(evento);
        const lineas = [
            '¡Salimos! Te invito a esta salida:',
            '',
            `*${evento.titulo}*`,
            `Cuándo: ${formatearFechaCompartir(evento.fechaInicio)}`,
            `Dónde: ${donde}`
        ];

        if (entrada) lineas.push(entrada);
        if (evento.aptoNinos) lineas.push('Apto para ir con peques');
        if (evento.descripcion) lineas.push('', evento.descripcion.slice(0, 180));

        lineas.push('', 'Lo encontré en Así Salgo! — menos scroll, más ciudad.', url);
        return lineas.join('\n');
    }

    async function crearEnlaceCompartido(evento) {
        const respuesta = await fetch(`${window.location.origin}/api/compartir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ evento })
        });

        if (!respuesta.ok) {
            const error = await respuesta.json().catch(() => ({}));
            throw new Error(error.error || 'No pudimos preparar el link para compartir.');
        }

        const datos = await respuesta.json();
        return datos.url;
    }

    function abrirWhatsApp(mensaje) {
        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    async function copiarTexto(texto) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(texto);
            return;
        }

        const area = document.createElement('textarea');
        area.value = texto;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
    }

    async function invitarPorWhatsApp(evento) {
        const url = await crearEnlaceCompartido(evento);
        abrirWhatsApp(armarMensaje(evento, url));
        return url;
    }

    async function compartirConSistema(evento) {
        const url = await crearEnlaceCompartido(evento);
        const mensaje = armarMensaje(evento, url);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Salimos: ${evento.titulo}`,
                    text: mensaje,
                    url
                });
                return { modo: 'nativo', url, mensaje };
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return { modo: 'cancelado', url, mensaje };
                }
            }
        }

        await copiarTexto(mensaje);
        return { modo: 'fallback', url, mensaje };
    }

    let estadoAsistenteFallback = null;

    function cerrarAsistenteFallback() {
        if (!estadoAsistenteFallback?.raiz) return;
        estadoAsistenteFallback.raiz.hidden = true;
        document.body.classList.remove('modal-abierto');
    }

    function asegurarAsistenteFallback() {
        if (estadoAsistenteFallback?.raiz) return estadoAsistenteFallback;

        const raiz = document.createElement('div');
        raiz.className = 'compartir-modal';
        raiz.hidden = true;
        raiz.innerHTML = `
            <div class="compartir-modal__fondo" data-fallback-cerrar></div>
            <section class="compartir-modal__panel" role="dialog" aria-modal="true" aria-labelledby="compartir-fallback-titulo">
                <button class="compartir-modal__cerrar" type="button" data-fallback-cerrar aria-label="Cerrar asistente">×</button>
                <p class="compartir-modal__eyebrow">Compartir</p>
                <h3 id="compartir-fallback-titulo">Tu navegador no tiene share nativo</h3>
                <p class="compartir-modal__descripcion">Copiamos la invitación. Podés abrir una red y pegar el texto.</p>
                <div class="compartir-modal__preview" data-fallback-preview></div>
                <div class="compartir-modal__acciones-principales">
                    <button class="compartir-modal__accion" type="button" data-fallback-copiar>Copiar invitación</button>
                    <button class="compartir-modal__accion compartir-modal__accion--ok" type="button" data-fallback-listo>Listo</button>
                </div>
                <div class="compartir-modal__enlaces">
                    <a class="compartir-modal__red" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a class="compartir-modal__red" href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a>
                    <a class="compartir-modal__red" href="https://x.com/" target="_blank" rel="noopener noreferrer">X</a>
                </div>
            </section>
        `;

        document.body.appendChild(raiz);

        const botonCopiar = raiz.querySelector('[data-fallback-copiar]');
        const botonListo = raiz.querySelector('[data-fallback-listo]');

        raiz.addEventListener('click', (evento) => {
            if (evento.target.closest('[data-fallback-cerrar]')) {
                cerrarAsistenteFallback();
            }
        });

        botonCopiar?.addEventListener('click', async () => {
            if (!estadoAsistenteFallback?.mensaje) return;
            try {
                await copiarTexto(estadoAsistenteFallback.mensaje);
                window.Toast?.mostrar('Invitación copiada. Elegí una red y pegala.', { tipo: 'exito' });
            } catch (error) {
                window.Toast?.mostrar('No pudimos copiar. Probá de nuevo.', { tipo: 'error' });
            }
        });

        botonListo?.addEventListener('click', () => {
            cerrarAsistenteFallback();
        });

        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && !raiz.hidden) {
                cerrarAsistenteFallback();
            }
        });

        estadoAsistenteFallback = {
            raiz,
            mensaje: '',
            preview: raiz.querySelector('[data-fallback-preview]')
        };

        return estadoAsistenteFallback;
    }

    function mostrarAsistenteFallback(mensaje) {
        const asistente = asegurarAsistenteFallback();
        asistente.mensaje = mensaje;
        if (asistente.preview) {
            asistente.preview.textContent = mensaje;
        }
        asistente.raiz.hidden = false;
        document.body.classList.add('modal-abierto');
    }

    function selectorSeguroParaId(id = '') {
        if (window.CSS?.escape) return `#redes-${window.CSS.escape(id)}`;
        return `#redes-${String(id).replace(/[^a-zA-Z0-9_-]/g, '\\$&')}`;
    }

    function cerrarMenusCompartir(exceptoId = null) {
        document.querySelectorAll('[data-compartir-toggle]').forEach((boton) => {
            const id = boton.dataset.eventoId;
            const panel = document.querySelector(selectorSeguroParaId(id));
            const abierto = id === exceptoId;
            boton.setAttribute('aria-expanded', String(abierto));
            boton.classList.toggle('activo', abierto);
            if (panel) {
                panel.hidden = !abierto;
                panel.style.display = abierto ? 'flex' : 'none';
            }
        });
    }

    function alternarMenuCompartir(boton) {
        const id = boton.dataset.eventoId;
        const panel = document.querySelector(selectorSeguroParaId(id));
        if (!panel) return;

        const vaAbrir = panel.hidden;
        cerrarMenusCompartir(vaAbrir ? id : null);
    }

    function enlazarBotonesCompartir(contenedor, obtenerEvento) {
        if (!contenedor || contenedor.dataset.compartirListo === 'true') return;
        contenedor.dataset.compartirListo = 'true';

        contenedor.querySelectorAll('[data-compartir-toggle]').forEach((boton) => {
            const id = boton.dataset.eventoId;
            const panel = contenedor.querySelector(selectorSeguroParaId(id));
            boton.setAttribute('aria-expanded', 'false');
            boton.classList.remove('activo');
            if (panel) {
                panel.hidden = true;
                panel.style.display = 'none';
            }
        });

        contenedor.addEventListener('click', async (eventoClick) => {
            const toggle = eventoClick.target.closest('[data-compartir-toggle]');
            if (toggle) {
                alternarMenuCompartir(toggle);
                return;
            }

            const boton = eventoClick.target.closest('[data-compartir]');
            if (!boton || boton.disabled) return;

            const id = boton.dataset.eventoId;
            const modo = boton.dataset.compartir;
            const payload = obtenerEvento(id);
            if (!payload?.evento) {
                window.Toast?.mostrar('No encontramos esa salida para compartir.', { tipo: 'error' });
                return;
            }

            boton.disabled = true;
            const etiquetaOriginal = boton.textContent;
            boton.textContent = 'Preparando…';

            try {
                if (modo === 'whatsapp') {
                    await invitarPorWhatsApp(payload.evento);
                    window.Toast?.mostrar('Abrimos WhatsApp con tu invitación.', { tipo: 'exito' });
                    cerrarMenusCompartir();
                } else if (modo === 'sistema') {
                    const resultado = await compartirConSistema(payload.evento);
                    if (resultado.modo === 'cancelado') return;
                    if (resultado.modo === 'nativo') {
                        window.Toast?.mostrar('Se abrió el menú nativo para compartir.', { tipo: 'exito' });
                    } else {
                        window.Toast?.mostrar('Invitación copiada. Elegí red para pegarla.', { tipo: 'info' });
                        mostrarAsistenteFallback(resultado.mensaje);
                    }
                    cerrarMenusCompartir();
                }
            } catch (error) {
                window.Toast?.mostrar(error.message || 'No pudimos compartir esta salida.', { tipo: 'error' });
            } finally {
                boton.disabled = false;
                boton.textContent = etiquetaOriginal;
            }
        });
    }

    if (!document.documentElement.dataset.compartirClicFuera) {
        document.documentElement.dataset.compartirClicFuera = 'true';
        document.addEventListener('click', (eventoClick) => {
            if (eventoClick.target.closest('[data-compartir-toggle], [data-compartir], .evento-card__redes')) {
                return;
            }
            cerrarMenusCompartir();
        });
    }

    window.CompartirApi = {
        armarMensaje,
        crearEnlaceCompartido,
        invitarPorWhatsApp,
        compartirConSistema,
        enlazarBotonesCompartir
    };
})();
