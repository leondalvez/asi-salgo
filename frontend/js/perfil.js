/**
 * Identidad local de la comunidad: nombre autopercibido + código único.
 * Se guarda en localStorage y se valida contra el servidor al entrar.
 */
(function () {
    const CLAVE_PERFIL = 'asi-salgo-perfil';
    const CLAVE_SALTAR = 'asi-salgo-saltar-entrar';

    function leerPerfil() {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE_PERFIL) || 'null');
            if (!datos || !datos.id || !datos.nombreVisible) return null;
            return datos;
        } catch {
            return null;
        }
    }

    function guardarPerfil(perfil) {
        if (!perfil?.id || !perfil?.nombreVisible) return;
        localStorage.setItem(
            CLAVE_PERFIL,
            JSON.stringify({
                id: perfil.id,
                nombre: perfil.nombre,
                codigo: perfil.codigo,
                nombreVisible: perfil.nombreVisible
            })
        );
        sessionStorage.removeItem(CLAVE_SALTAR);
    }

    function limpiarPerfil() {
        localStorage.removeItem(CLAVE_PERFIL);
    }

    function tienePerfil() {
        return Boolean(leerPerfil());
    }

    function marcarSaltarEntrada() {
        sessionStorage.setItem(CLAVE_SALTAR, '1');
    }

    function saltoEntradaActivo() {
        return sessionStorage.getItem(CLAVE_SALTAR) === '1';
    }

    function urlEntrar(destino = '') {
        const dest = destino || window.location.pathname.split('/').pop() || 'index.html';
        return `entrar.html?dest=${encodeURIComponent(dest)}`;
    }

    function redirigirSiFalta(destino) {
        if (tienePerfil()) return false;
        window.location.replace(urlEntrar(destino));
        return true;
    }

    window.PerfilApi = {
        leerPerfil,
        guardarPerfil,
        limpiarPerfil,
        tienePerfil,
        marcarSaltarEntrada,
        saltoEntradaActivo,
        urlEntrar,
        redirigirSiFalta
    };
})();
