/**
 * Perfiles de la comunidad: nombre autopercibido + código único (ej. Camila#4821).
 * Persistencia: PostgreSQL (Supabase) si hay DATABASE_URL; si no, JSON local.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const ARCHIVO = path.join(__dirname, '..', 'data', 'perfiles-comunidad.json');

function limpiarTexto(texto = '', maximo = 40) {
    return texto
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function normalizarNombre(nombre) {
    const limpio = limpiarTexto(nombre, 32);
    return limpio.replace(/#\d+$/, '').trim();
}

function formatearNombreVisible(nombre, codigo) {
    return `${nombre}#${codigo}`;
}

function filaAPerfil(fila) {
    return {
        id: fila.id,
        nombre: fila.nombre,
        codigo: fila.codigo,
        nombreVisible: fila.nombre_visible,
        creado: fila.creado instanceof Date ? fila.creado.toISOString() : fila.creado
    };
}

function generarIdCorto() {
    return crypto.randomBytes(4).toString('hex');
}

function generarCodigo() {
    return String(Math.floor(1000 + Math.random() * 9000));
}

async function codigoDisponible(codigo) {
    if (db.estaConfigurada()) {
        const { rows } = await db.consultar(
            'select 1 from public.perfiles where codigo = $1 limit 1',
            [codigo]
        );
        return rows.length === 0;
    }

    const perfiles = leerTodosJson();
    return !perfiles.some((perfil) => perfil.codigo === codigo);
}

async function generarCodigoUnico() {
    for (let intento = 0; intento < 60; intento += 1) {
        const codigo = generarCodigo();
        if (await codigoDisponible(codigo)) return codigo;
    }
    return crypto.randomBytes(2).toString('hex').slice(0, 4);
}

function leerTodosJson() {
    try {
        const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf-8'));
        if (Array.isArray(datos)) return datos;
    } catch (error) {
        /* archivo nuevo */
    }
    return [];
}

function guardarTodosJson(perfiles) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(perfiles, null, 2), 'utf-8');
}

async function registrarPerfil(nombre) {
    const nombreLimpio = normalizarNombre(nombre);
    if (!nombreLimpio || nombreLimpio.length < 2) {
        const err = new Error('Escribí un nombre de al menos 2 letras.');
        err.codigo = 400;
        throw err;
    }

    const codigo = await generarCodigoUnico();
    const perfil = {
        id: generarIdCorto(),
        nombre: nombreLimpio,
        codigo,
        nombreVisible: formatearNombreVisible(nombreLimpio, codigo),
        creado: new Date().toISOString()
    };

    if (db.estaConfigurada()) {
        const { rows } = await db.consultar(
            `insert into public.perfiles (id, nombre, codigo, nombre_visible, creado)
             values ($1, $2, $3, $4, $5)
             returning id, nombre, codigo, nombre_visible, creado`,
            [perfil.id, perfil.nombre, perfil.codigo, perfil.nombreVisible, perfil.creado]
        );
        return filaAPerfil(rows[0]);
    }

    const perfiles = leerTodosJson();
    perfiles.push(perfil);
    guardarTodosJson(perfiles);
    return perfil;
}

async function ingresarPerfil(nombre, codigo) {
    const nombreLimpio = normalizarNombre(nombre);
    const codigoLimpio = String(codigo || '')
        .replace(/\D/g, '')
        .slice(0, 6);

    if (!nombreLimpio || !codigoLimpio) {
        const err = new Error('Ingresá tu nombre y tu código.');
        err.codigo = 400;
        throw err;
    }

    if (db.estaConfigurada()) {
        const { rows } = await db.consultar(
            `select id, nombre, codigo, nombre_visible, creado
             from public.perfiles
             where lower(nombre) = lower($1) and codigo = $2
             limit 1`,
            [nombreLimpio, codigoLimpio]
        );

        if (!rows.length) {
            const err = new Error(
                'No encontramos ese nombre con ese código. Revisá los datos o creá un perfil nuevo.'
            );
            err.codigo = 404;
            throw err;
        }

        return filaAPerfil(rows[0]);
    }

    const perfiles = leerTodosJson();
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
