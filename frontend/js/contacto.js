const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarFormulario(datos) {
    const errores = {};
    if (!datos.email || !REGEX_EMAIL.test(datos.email)) {
        errores.email = 'Ingresá un email válido para poder avisarte.';
    }
    return errores;
}

function mostrarErrores(errores) {
    const campoEmail = document.querySelector('#error-email');
    const inputEmail = document.querySelector('#campo-email');

    if (campoEmail) campoEmail.textContent = errores.email || '';
    if (inputEmail) inputEmail.setAttribute('aria-invalid', errores.email ? 'true' : 'false');
}

async function enviarSuscripcion(datos) {
    const respuesta = await fetch(`${window.location.origin}/api/suscripciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });

    if (!respuesta.ok) {
        const error = await respuesta.json().catch(() => ({}));
        throw new Error(error.error || 'No pudimos guardar tu suscripción.');
    }

    return respuesta.json();
}

function inicializarFormularioContacto() {
    const formulario = document.querySelector('#form-contacto');
    if (!formulario) return;

    window.CiudadesApi?.poblarSelect(document.querySelector('#campo-ciudad'), { valorInicial: 'rosario' });

    const botonEnviar = document.querySelector('#btn-enviar');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const datosFormulario = new FormData(formulario);
        const datos = {
            nombre: (datosFormulario.get('nombre') || '').toString().trim(),
            email: (datosFormulario.get('email') || '').toString().trim(),
            ciudad: datosFormulario.get('ciudad'),
            intereses: datosFormulario.getAll('intereses')
        };

        const errores = validarFormulario(datos);
        mostrarErrores(errores);

        if (Object.keys(errores).length) {
            document.querySelector('#campo-email')?.focus();
            return;
        }

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando…';

        try {
            await enviarSuscripcion(datos);
            window.Toast?.mostrar('¡Listo! Te vamos a avisar de las próximas salidas.', { tipo: 'exito' });
            formulario.reset();
            mostrarErrores({});
        } catch (error) {
            window.Toast?.mostrar(error.message || 'Algo falló. Probá de nuevo en un rato.', { tipo: 'error' });
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.innerHTML = 'Sumarme a las salidas <span aria-hidden="true">→</span>';
        }
    });

    document.querySelector('#campo-email')?.addEventListener('input', () => mostrarErrores({}));
}

document.addEventListener('DOMContentLoaded', inicializarFormularioContacto);
