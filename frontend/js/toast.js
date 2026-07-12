/**
 * Notificaciones Toast: reemplazan al alert() nativo para confirmaciones y
 * errores de formularios sin romper la estética minimalista de la app.
 * Se auto-inicializa: cualquier página que incluya este script puede llamar
 * a window.Toast.mostrar(...) sin preparar nada más.
 */

(function () {
    function obtenerContenedor() {
        let contenedor = document.querySelector('#toast-raiz');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'toast-raiz';
            contenedor.className = 'toast-raiz';
            contenedor.setAttribute('aria-live', 'polite');
            contenedor.setAttribute('aria-atomic', 'true');
            document.body.appendChild(contenedor);
        }
        return contenedor;
    }

    function mostrar(mensaje, opciones = {}) {
        const { tipo = 'info', duracion = 4200 } = opciones;
        const contenedor = obtenerContenedor();

        const toast = document.createElement('div');
        toast.className = `toast toast--${tipo}`;
        toast.setAttribute('role', 'status');

        const texto = document.createElement('p');
        texto.className = 'toast__texto';
        texto.textContent = mensaje;

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'toast__cerrar';
        cerrar.setAttribute('aria-label', 'Cerrar aviso');
        cerrar.textContent = '×';

        toast.append(texto, cerrar);
        contenedor.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));

        let cronometro;
        const quitar = () => {
            clearTimeout(cronometro);
            toast.classList.remove('visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        };

        cerrar.addEventListener('click', quitar);
        cronometro = setTimeout(quitar, duracion);
    }

    window.Toast = { mostrar };
})();
