function leerDestino() {
    const params = new URLSearchParams(window.location.search);
    const dest = params.get('dest');
    if (!dest || dest.includes('..') || dest.includes('/')) return 'index.html';
    return dest;
}

function mostrarExito(perfil) {
    const formulario = document.querySelector('#entrar-formulario');
    const exito = document.querySelector('#entrar-exito');
    const inicial = document.querySelector('#exito-inicial');
    const nombre = document.querySelector('#exito-nombre');
    const detalle = document.querySelector('#exito-detalle');

    formulario?.classList.add('oculto');
    exito?.classList.add('visible');

    const letra = (perfil.nombre || '?').charAt(0).toUpperCase();
    if (inicial) inicial.textContent = letra;
    if (nombre) nombre.textContent = perfil.nombreVisible;
    if (detalle) {
        const codigo = document.createElement('em');
        codigo.textContent = `#${perfil.codigo}`;
        detalle.replaceChildren(
            document.createTextNode('Guardá tu código '),
            codigo,
            document.createTextNode(' por si querés volver en otro dispositivo.')
        );
    }
}

function irADestino() {
    window.location.href = leerDestino();
}

function actualizarPreview() {
    const input = document.querySelector('#nombre-nuevo');
    const texto = document.querySelector('#preview-texto');
    if (!input || !texto) return;

    const nombre = input.value.trim();
    texto.textContent = nombre ? `${nombre}#····` : '…';
}

function cambiarVista(vista) {
    document.querySelectorAll('.entrar-tabs__btn').forEach((boton) => {
        const activo = boton.dataset.vista === vista;
        boton.classList.toggle('activo', activo);
        boton.setAttribute('aria-selected', String(activo));
    });

    document.querySelectorAll('.entrar-vista').forEach((panel) => {
        const activo = panel.id === `vista-${vista}`;
        panel.classList.toggle('activa', activo);
        panel.hidden = !activo;
    });
}

async function crearPerfil(evento) {
    evento.preventDefault();

    const input = document.querySelector('#nombre-nuevo');
    const boton = document.querySelector('#btn-crear-perfil');
    const nombre = (input?.value || '').trim();

    if (nombre.length < 2) {
        window.Toast?.mostrar('Escribí al menos 2 letras para tu nombre.', { tipo: 'error' });
        input?.focus();
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Creando…';

    try {
        const respuesta = await fetch(`${window.location.origin}/api/perfiles/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });

        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.error || 'No pudimos crear tu perfil.');

        window.PerfilApi.guardarPerfil(datos.perfil);
        mostrarExito(datos.perfil);
    } catch (error) {
        window.Toast?.mostrar(error.message, { tipo: 'error' });
    } finally {
        boton.disabled = false;
        boton.innerHTML = 'Crear mi nombre <span aria-hidden="true">→</span>';
    }
}

async function ingresarPerfil(evento) {
    evento.preventDefault();

    const nombre = (document.querySelector('#nombre-volver')?.value || '').trim();
    const codigo = (document.querySelector('#codigo-volver')?.value || '').trim();
    const boton = document.querySelector('#btn-ingresar-perfil');

    if (!nombre || !codigo) {
        window.Toast?.mostrar('Completá nombre y código.', { tipo: 'error' });
        return;
    }

    boton.disabled = true;
    boton.textContent = 'Entrando…';

    try {
        const respuesta = await fetch(`${window.location.origin}/api/perfiles/ingresar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, codigo })
        });

        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(datos.error || 'No pudimos encontrar tu perfil.');

        window.PerfilApi.guardarPerfil(datos.perfil);
        mostrarExito(datos.perfil);
    } catch (error) {
        window.Toast?.mostrar(error.message, { tipo: 'error' });
    } finally {
        boton.disabled = false;
        boton.innerHTML = 'Entrar <span aria-hidden="true">→</span>';
    }
}

function inicializarEntrar() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('modo') === 'volver') cambiarVista('volver');

    if (window.PerfilApi.tienePerfil() && !params.get('cambiar')) {
        irADestino();
        return;
    }

    document.querySelector('#nombre-nuevo')?.addEventListener('input', actualizarPreview);
    document.querySelector('#form-nuevo-perfil')?.addEventListener('submit', crearPerfil);
    document.querySelector('#form-ingresar-perfil')?.addEventListener('submit', ingresarPerfil);
    document.querySelector('#btn-continuar')?.addEventListener('click', irADestino);

    document.querySelectorAll('.entrar-tabs__btn').forEach((boton) => {
        boton.addEventListener('click', () => cambiarVista(boton.dataset.vista));
    });

    document.querySelector('#link-saltar')?.addEventListener('click', (evento) => {
        evento.preventDefault();
        window.PerfilApi.marcarSaltarEntrada();
        irADestino();
    });

    actualizarPreview();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarEntrar);
} else {
    inicializarEntrar();
}
