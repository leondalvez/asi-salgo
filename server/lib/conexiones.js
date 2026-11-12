/**
 * Conexiones entre perfiles: agregar a otra persona de la comunidad por nombre + código.
 * Persistencia: PostgreSQL si hay DATABASE_URL; si no, JSON local.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const ARCHIVO = path.join(__dirname, '..', 'data', 'conexiones.json');
const ARCHIVO_PERFILES = path.join(__dirname, '..', 'data', 'perfiles-comunidad.json');
const MAX_CONEXIONES = 200;

function leerTodasJson() {
    try {
        const datos = JSON.parse(fs.readFileSync(ARCHIVO, 'utf-8'));
        if (Array.isArray(datos)) return datos;
    } catch (error) {
        /* archivo nuevo */
    }
    return [];
}

function guardarTodasJson(conexiones) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(conexiones, null, 2), 'utf-8');
}

function filaAConexion(fila) {
    return {
        perfilId: fila.perfil_id,
        conectadoId: fila.conectado_id,
        nombreVisible: fila.nombre_visible,
        creado: fila.creado instanceof Date ? fila.creado.toISOString() : fila.creado
    };
}

function buscarPerfilJson(nombre, codigo) {
    try {
        const perfiles = JSON.parse(fs.readFileSync(ARCHIVO_PERFILES, 'utf-8'));
        if (!Array.isArray(perfiles)) return null;
        return perfiles.find(
            (item) =>
                item.nombre?.toLowerCase() === nombre.toLowerCase() &&
                item.codigo === codigo
        ) || null;
    } catch (error) {
        return null;
    }
}

async function buscarPerfilPorNombreCodigo(nombre, codigo) {
    const { rows } = await db.consultar(
        `select id, nombre, codigo, nombre_visible, creado
         from public.perfiles
         where lower(nombre) = lower($1) and codigo = $2
         limit 1`,
        [nombre, codigo]
    );
    return rows.length ? rows[0] : null;
}

async function agregarConexion(perfilId, { conectadoId, nombre, codigo } = {}) {
    if (!perfilId) {
        const err = new Error('Necesitás un perfil activo.');
        err.codigo = 400;
        throw err;
    }

    let destinoId = conectadoId || null;

    if (db.estaConfigurada()) {
        if (!destinoId) {
            const nombreLimpio = (nombre || '').toString().trim();
            const codigoLimpio = String(codigo || '').replace(/\D/g, '').slice(0, 6);
            if (!nombreLimpio || !codigoLimpio) {
                const err = new Error('Ingresá el nombre y el código de la persona.');
                err.codigo = 400;
                throw err;
            }

            const perfil = await buscarPerfilPorNombreCodigo(nombreLimpio, codigoLimpio);
            if (!perfil) {
                const err = new Error('No hay ningún perfil con ese nombre y código.');
                err.codigo = 404;
                throw err;
            }
            destinoId = perfil.id;
        }

        if (destinoId === perfilId) {
            const err = new Error('No podés agregarte a vos mismo.');
            err.codigo = 400;
            throw err;
        }

        const duplicado = await db.consultar(
            `select 1 from public.conexiones
             where perfil_id = $1 and conectado_id = $2
             limit 1`,
            [perfilId, destinoId]
        );
        if (duplicado.rows.length) {
            const err = new Error('Ya tenés agregada a esta persona.');
            err.codigo = 409;
            throw err;
        }

        const conteo = await db.consultar(
            `select count(*)::int as total from public.conexiones where perfil_id = $1`,
            [perfilId]
        );
        if (conteo.rows[0].total >= MAX_CONEXIONES) {
            const err = new Error('Llegaste al límite de conexiones.');
            err.codigo = 409;
            throw err;
        }

        const { rows } = await db.consultar(
            `insert into public.conexiones (perfil_id, conectado_id)
             values ($1, $2)
             returning perfil_id, conectado_id, creado`,
            [perfilId, destinoId]
        );

        const perfilDestino = await db.consultar(
            `select nombre_visible from public.perfiles where id = $1 limit 1`,
            [destinoId]
        );

        return {
            perfilId: rows[0].perfil_id,
            conectadoId: rows[0].conectado_id,
            nombreVisible: perfilDestino.rows[0]?.nombre_visible || destinoId,
            creado: rows[0].creado instanceof Date ? rows[0].creado.toISOString() : rows[0].creado
        };
    }

    // JSON local
    let destinoNombreVisible = '';
    if (!destinoId) {
        const nombreLimpio = (nombre || '').toString().trim();
        const codigoLimpio = String(codigo || '').replace(/\D/g, '').slice(0, 6);
        if (!nombreLimpio || !codigoLimpio) {
            const err = new Error('Ingresá el nombre y el código de la persona.');
            err.codigo = 400;
            throw err;
        }
        const perfil = buscarPerfilJson(nombreLimpio, codigoLimpio);
        if (!perfil) {
            const err = new Error('No hay ningún perfil con ese nombre y código.');
            err.codigo = 404;
            throw err;
        }
        destinoId = perfil.id;
        destinoNombreVisible = perfil.nombreVisible;
    }

    if (destinoId === perfilId) {
        const err = new Error('No podés agregarte a vos mismo.');
        err.codigo = 400;
        throw err;
    }

    const conexiones = leerTodasJson();
    const existente = conexiones.find(
        (item) => item.perfilId === perfilId && item.conectadoId === destinoId
    );
    if (existente) {
        const err = new Error('Ya tenés agregada a esta persona.');
        err.codigo = 409;
        throw err;
    }

    const registro = {
        perfilId,
        conectadoId: destinoId,
        nombreVisible: destinoNombreVisible || (nombre || '').toString().trim(),
        creado: new Date().toISOString()
    };
    conexiones.push(registro);
    guardarTodasJson(conexiones.slice(-MAX_CONEXIONES));
    return registro;
}

async function listarConexiones(perfilId) {
    if (!perfilId) {
        const err = new Error('Falta el perfil.');
        err.codigo = 400;
        throw err;
    }

    if (db.estaConfigurada()) {
        const { rows } = await db.consultar(
            `select c.perfil_id, c.conectado_id, c.creado, p.nombre_visible
             from public.conexiones c
             join public.perfiles p on p.id = c.conectado_id
             where c.perfil_id = $1
             order by c.creado desc
             limit $2`,
            [perfilId, MAX_CONEXIONES]
        );

        return rows.map((fila) => ({
            perfilId: fila.perfil_id,
            conectadoId: fila.conectado_id,
            nombreVisible: fila.nombre_visible,
            creado: fila.creado instanceof Date ? fila.creado.toISOString() : fila.creado
        }));
    }

    return leerTodasJson()
        .filter((item) => item.perfilId === perfilId)
        .sort((a, b) => new Date(b.creado).getTime() - new Date(a.creado).getTime());
}

module.exports = {
    agregarConexion,
    listarConexiones
};
