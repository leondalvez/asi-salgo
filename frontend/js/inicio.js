function inicializarCtaPuerta() {
    if (window.PuertaApi?.enlazarEnlace) {
        window.PuertaApi.enlazarEnlace('#cta-iniciar-viaje');
    }
}

document.addEventListener('DOMContentLoaded', inicializarCtaPuerta);
