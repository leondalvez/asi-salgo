/**
 * Suscripciones a novedades (Contacto / A Dónde Salen).
 * Persistencia: PostgreSQL (Supabase) si hay DATABASE_URL; si no, JSON local.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const ARCHIVO = path.join(__dirname, '..', 'data', 'suscripciones.json');
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limpiarTexto(valor = '', maximo = 80) {
    return valor
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function normalizarIntereses(intereses) {
    if (!Array.isArray(intereses)) return [];
    return intereses
        .filter((item) => typeof item === 'string')
        .map((item) => limpiarTexto(item, 32))
        .filter(Boolean)
        .slice(0, 8);
}

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

function construirRegistro(datos, email) {
    return {
        nombre: limpiarTexto(datos.nombre, 80),
        email,
        ciudad: datos.ciudad === 'buenos-aires' ? 'buenos-aires' : 'rosario',
        intereses: normalizarIntereses(datos.intereses),
        fecha: new Date().toISOString()
    };
}

async function agregarSuscripcion(datos) {
    const { valido, error, email } = validar(datos);
    if (!valido) {
        const err = new Error(error);
        err.codigo = 400;
        throw err;
    }

    const registro = construirRegistro(datos, email);

    if (db.estaConfigurada()) {
        const { rows } = await db.consultar(
            `insert into public.suscripciones (email, nombre, ciudad, intereses, fecha)
             values ($1, $2, $3, $4::jsonb, $5)
             on conflict (email)
             do update set
               nombre = excluded.nombre,
               ciudad = excluded.ciudad,
               intereses = excluded.intereses,
               fecha = excluded.fecha
             returning email, nombre, ciudad, intereses, fecha`,
            [
                registro.email,
                registro.nombre,
                registro.ciudad,
                JSON.stringify(registro.intereses),
                registro.fecha
            ]
        );

        return {
            email: rows[0].email,
            nombre: rows[0].nombre,
            ciudad: rows[0].ciudad,
            intereses: Array.isArray(rows[0].intereses) ? rows[0].intereses : registro.intereses,
            fecha: rows[0].fecha instanceof Date ? rows[0].fecha.toISOString() : rows[0].fecha
        };
    }

    const suscripciones = leerTodas();
    const existente = suscripciones.find((s) => s.email === email);

    if (existente) {
        Object.assign(existente, registro);
    } else {
        suscripciones.push(registro);
    }

    guardarTodas(suscripciones);
    return registro;
}

module.exports = { agregarSuscripcion };
