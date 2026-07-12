/**
 * Compartir una salida por WhatsApp, Instagram (vía Web Share API en mobile)
 * o copiando el link. Crea un snapshot en el servidor para que WhatsApp
 * pueda previsualizar la tarjeta con og:title / og:description.
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

    async function invitarPorInstagram(evento) {
        const url = await crearEnlaceCompartido(evento);
        const mensaje = armarMensaje(evento, url);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Salimos: ${evento.titulo}`,
                    text: mensaje,
                    url
                });
                return { url, modo: 'nativo' };
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return { url, modo: 'cancelado' };
                }
            }
        }

        await copiarTexto(mensaje);
        return { url, modo: 'copiado' };
    }

    function cerrarMenusCompartir(exceptoId = null) {
        document.querySelectorAll('[data-compartir-toggle]').forEach((boton) => {
            const id = boton.dataset.eventoId;
            const panel = document.querySelector(`#redes-${CSS.escape(id)}`);
            const abierto = id === exceptoId;
            boton.setAttribute('aria-expanded', String(abierto));
            boton.classList.toggle('activo', abierto);
            if (panel) panel.hidden = !abierto;
        });
    }

    function alternarMenuCompartir(boton) {
        const id = boton.dataset.eventoId;
        const panel = document.querySelector(`#redes-${CSS.escape(id)}`);
        if (!panel) return;

        const vaAbrir = panel.hidden;
        cerrarMenusCompartir(vaAbrir ? id : null);
    }

    function enlazarBotonesCompartir(contenedor, obtenerEvento) {
        if (!contenedor || contenedor.dataset.compartirListo === 'true') return;
        contenedor.dataset.compartirListo = 'true';

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
                } else if (modo === 'instagram') {
                    const resultado = await invitarPorInstagram(payload.evento);
                    if (resultado.modo === 'cancelado') return;
                    if (resultado.modo === 'nativo') {
                        window.Toast?.mostrar('Elegí Instagram u otra app para invitar.', { tipo: 'info' });
                    } else {
                        window.Toast?.mostrar(
                            'Copiamos el mensaje. Pegalo en Instagram para invitar a salir.',
                            { tipo: 'exito' }
                        );
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
        invitarPorInstagram,
        enlazarBotonesCompartir
    };
})();
