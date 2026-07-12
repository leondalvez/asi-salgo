/**
 * Suscripciones a novedades (sección Contacto / A Dónde Salen). Sin base de
 * datos: alcanza con un JSON local para el alcance de este proyecto. Si más
 * adelante se migra a Supabase/Postgres, esta es la única pieza a reemplazar.
 */

const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, '..', 'data', 'suscripciones.json');
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function leerTodas() {
    try {
        const contenido = fs.readFileSync(ARCHIVO, 'utf-8');
        return JSON.parse(contenido);
    } catch (error) {
        return [];
    }
}

function guardarTodas(suscripciones) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(suscripciones, null, 2), 'utf-8');
}

function validar(datos) {
    const email = (datos.email || '').toString().trim().toLowerCase();
    if (!email || !REGEX_EMAIL.test(email)) {
        return { valido: false, error: 'Ingresá un email válido.' };
    }
    return { valido: true, email };
}

function agregarSuscripcion(datos) {
    const { valido, error, email } = validar(datos);
    if (!valido) {
        const err = new Error(error);
        err.codigo = 400;
        throw err;
    }

    const suscripciones = leerTodas();
    const existente = suscripciones.find((s) => s.email === email);
    const registro = {
        nombre: (datos.nombre || '').toString().trim().slice(0, 80),
        email,
        ciudad: datos.ciudad === 'buenos-aires' ? 'buenos-aires' : 'rosario',
        intereses: Array.isArray(datos.intereses)
            ? datos.intereses.filter((i) => typeof i === 'string').slice(0, 8)
            : [],
        fecha: new Date().toISOString()
    };

    if (existente) {
        Object.assign(existente, registro);
    } else {
        suscripciones.push(registro);
    }

    guardarTodas(suscripciones);
    return registro;
}

module.exports = { agregarSuscripcion };
