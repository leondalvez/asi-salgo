/**
 * Perfiles de la comunidad: nombre autopercibido + código único (ej. Camila#4821).
 * Sin contraseñas: el código permite recuperar la identidad en otro dispositivo.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ARCHIVO = path.join(__dirname, '..', 'data', 'perfiles-comunidad.json');

function limpiarTexto(texto = '', maximo = 40) {
    return texto
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function leerTodos() {
    try {
        const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf-8'));
        if (Array.isArray(datos)) return datos;
    } catch (error) {
        /* archivo nuevo */
    }
    return [];
}

function guardarTodos(perfiles) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(perfiles, null, 2), 'utf-8');
}

function generarCodigo(perfiles) {
    for (let intento = 0; intento < 60; intento += 1) {
        const codigo = String(Math.floor(1000 + Math.random() * 9000));
        const ocupado = perfiles.some((perfil) => perfil.codigo === codigo);
        if (!ocupado) return codigo;
    }
    return crypto.randomBytes(2).toString('hex');
}

function normalizarNombre(nombre) {
    const limpio = limpiarTexto(nombre, 32);
    return limpio.replace(/#\d+$/, '').trim();
}

function formatearNombreVisible(nombre, codigo) {
    return `${nombre}#${codigo}`;
}

function registrarPerfil(nombre) {
    const nombreLimpio = normalizarNombre(nombre);
    if (!nombreLimpio || nombreLimpio.length < 2) {
        const err = new Error('Escribí un nombre de al menos 2 letras.');
        err.codigo = 400;
        throw err;
    }

    const perfiles = leerTodos();
    const codigo = generarCodigo(perfiles);
    const perfil = {
        id: crypto.randomBytes(8).toString('hex'),
        nombre: nombreLimpio,
        codigo,
        nombreVisible: formatearNombreVisible(nombreLimpio, codigo),
        creado: new Date().toISOString()
    };

    perfiles.push(perfil);
    guardarTodos(perfiles);
    return perfil;
}

function ingresarPerfil(nombre, codigo) {
    const nombreLimpio = normalizarNombre(nombre);
    const codigoLimpio = String(codigo || '')
        .replace(/\D/g, '')
        .slice(0, 6);

    if (!nombreLimpio || !codigoLimpio) {
        const err = new Error('Ingresá tu nombre y tu código.');
        err.codigo = 400;
        throw err;
    }

    const perfiles = leerTodos();
    const perfil = perfiles.find(
        (item) =>
            item.nombre.toLowerCase() === nombreLimpio.toLowerCase() &&
            item.codigo === codigoLimpio
    );

    if (!perfil) {
        const err = new Error(
            'No encontramos ese nombre con ese código. Revisá los datos o creá un perfil nuevo.'
        );
        err.codigo = 404;
        throw err;
    }

    return perfil;
}

module.exports = {
    registrarPerfil,
    ingresarPerfil
};
