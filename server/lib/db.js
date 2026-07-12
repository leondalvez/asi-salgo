/**
 * Conexión PostgreSQL (Supabase). Si DATABASE_URL no está definida, los módulos
 * que usan datos pueden caer en JSON local para desarrollo sin cuenta.
 */

const { Pool } = require('pg');

let pool;

function estaConfigurada() {
    return Boolean(process.env.DATABASE_URL?.trim());
}

function obtenerPool() {
    if (!estaConfigurada()) return null;

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL.trim(),
            ssl: { rejectUnauthorized: false },
            max: 4,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        });

        pool.on('error', (error) => {
            console.error('[db] Error inesperado en el pool:', error.message);
        });
    }

    return pool;
}

async function consultar(texto, parametros = []) {
    const conexion = obtenerPool();
    if (!conexion) {
        const err = new Error('Base de datos no configurada (falta DATABASE_URL).');
        err.codigo = 503;
        throw err;
    }

    return conexion.query(texto, parametros);
}

async function probarConexion() {
    if (!estaConfigurada()) {
        return { ok: false, motivo: 'sin DATABASE_URL' };
    }

    try {
        await consultar('select 1 as vivo');
        return { ok: true };
    } catch (error) {
        return { ok: false, motivo: error.message };
    }
}

module.exports = {
    estaConfigurada,
    consultar,
    probarConexion
};
