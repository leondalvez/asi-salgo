/**
 * Conexión PostgreSQL (Supabase). Si DATABASE_URL no está definida, los módulos
 * que usan datos pueden caer en JSON local para desarrollo sin cuenta.
 */

const { Pool } = require('pg');

let pool;

function obtenerDatabaseUrl() {
    const valor = process.env.DATABASE_URL?.trim();
    if (!valor) return null;

    if (
        valor.includes('<') ||
        valor.includes('>') ||
        valor.includes('YOUR-PASSWORD') ||
        valor.includes('TU_PASSWORD') ||
        valor.includes('PROJECT_REF') ||
        valor.includes('TU_PROJECT_REF')
    ) {
        return null;
    }

    return valor;
}

function estaConfigurada() {
    return Boolean(obtenerDatabaseUrl());
}

function obtenerPool() {
    const connectionString = obtenerDatabaseUrl();
    if (!connectionString) return null;

    if (!pool) {
        pool = new Pool({
            connectionString,
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
        return { ok: false, motivo: 'sin DATABASE_URL válida' };
    }

    try {
        await consultar('select 1 as vivo');
        return { ok: true };
    } catch (error) {
        return { ok: false, motivo: error.message };
    }
}

async function transaccion(callback) {
    const conexion = obtenerPool();
    if (!conexion) {
        const err = new Error('Base de datos no configurada (falta DATABASE_URL).');
        err.codigo = 503;
        throw err;
    }

    const cliente = await conexion.connect();
    try {
        await cliente.query('BEGIN');
        const resultado = await callback(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;
    } finally {
        cliente.release();
    }
}

module.exports = {
    estaConfigurada,
    consultar,
    probarConexion,
    transaccion
};
