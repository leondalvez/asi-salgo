/**
 * Salidas de la comunidad (Salen): publicar planes y sumarse con Me sumo.
 * Persistencia: PostgreSQL si hay DATABASE_URL; si no, JSON local.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { esCiudadValida } = require('./ciudades');
const { geocodificarItems } = require('./geocoder');
const db = require('./db');

const ARCHIVO = path.join(__dirname, '..', 'data', 'salidas-comunidad.json');
const MAX_SALIDAS = 120;
const MAX_SUMADOS_POR_SALIDA = 40;

const SEMILLAS = [
    {
        id: 'demo-rosario-1',
        organizador: 'Camila#2847',
        perfilId: 'demo-camila',
        titulo: 'Recital al atardecer en el río',
        descripcion: 'Busco gente para ir sin apuro, capaz tomamos algo después cerca del parque.',
        ciudad: 'rosario',
        fechaInicio: null,
        lugar: 'Costanera',
        direccion: 'Costanera Este, Rosario',
        lat: -32.9442,
        lng: -60.6505,
        eventoId: null,
        creado: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sumados: [
            { nombre: 'Camila#2847', perfilId: 'demo-camila', fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), esOrganizador: true },
            { nombre: 'Nico#9103', perfilId: 'demo-nico', fecha: new Date(Date.now() - 90 * 60 * 1000).toISOString(), esOrganizador: false },
            { nombre: 'Lu#5521', perfilId: 'demo-lu', fecha: new Date(Date.now() - 40 * 60 * 1000).toISOString(), esOrganizador: false }
        ]
    },
    {
        id: 'demo-rosario-2',
        organizador: 'Martín#3310',
        perfilId: 'demo-martin',
        titulo: 'Museo + café después',
        descripcion: 'Plan tranqui para el sábado. Sumate si te pinta mirar la muestra y charlar.',
        ciudad: 'rosario',
        fechaInicio: null,
        lugar: 'Centro',
        direccion: 'Centro, Rosario',
        lat: -32.9468,
        lng: -60.6393,
        eventoId: null,
        creado: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        sumados: [
            { nombre: 'Martín#3310', perfilId: 'demo-martin', fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), esOrganizador: true },
            { nombre: 'Juli#7782', perfilId: 'demo-juli', fecha: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), esOrganizador: false }
        ]
    }
];

const SQL_SALIDA_BASE = `
  SELECT
    s.id,
    s.perfil_id,
    s.organizador,
    s.titulo,
    s.descripcion,
    s.ciudad,
    s.fecha_inicio,
    s.lugar,
    s.direccion,
    s.lat,
    s.lng,
    s.evento_id,
    s.creado,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'nombre', ss.nombre,
            'perfilId', ss.perfil_id,
            'fecha', ss.fecha,
            'esOrganizador', ss.es_organizador
          )
          ORDER BY ss.fecha
        )
        FROM salida_sumados ss
        WHERE ss.salida_id = s.id
      ),
      '[]'::json
    ) AS sumados
  FROM salidas s
`;

function limpiarTexto(texto = '', maximo = 280) {
    return texto
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function nuevoId() {
    return crypto.randomBytes(6).toString('hex');
}

function normalizarNombreVisible(nombre) {
    return limpiarTexto(nombre, 48);
}

function mismaPersona(persona, perfilId, nombreVisible) {
    if (perfilId && persona.perfilId) {
        return persona.perfilId === perfilId;
    }
    const nombreA = (persona.nombre || '').toLowerCase();
    const nombreB = (nombreVisible || '').toLowerCase();
    return nombreA && nombreB && nombreA === nombreB;
}

function filaASalida(fila) {
    const sumados = Array.isArray(fila.sumados) ? fila.sumados : [];
    return {
        id: fila.id,
        perfilId: fila.perfil_id || null,
        organizador: fila.organizador,
        titulo: fila.titulo,
        descripcion: fila.descripcion || '',
        ciudad: fila.ciudad,
        fechaInicio: fila.fecha_inicio instanceof Date
            ? fila.fecha_inicio.toISOString()
            : fila.fecha_inicio || null,
        lugar: fila.lugar || '',
        direccion: fila.direccion || '',
        lat: fila.lat ?? null,
        lng: fila.lng ?? null,
        eventoId: fila.evento_id || null,
        creado: fila.creado instanceof Date ? fila.creado.toISOString() : fila.creado,
        sumados: sumados.map((persona) => ({
            nombre: persona.nombre,
            perfilId: persona.perfilId || persona.perfil_id || null,
            fecha: persona.fecha instanceof Date ? persona.fecha.toISOString() : persona.fecha,
            esOrganizador: Boolean(persona.esOrganizador ?? persona.es_organizador)
        })),
        totalSumados: sumados.length
    };
}

function conTotalSumados(salida) {
    return {
        ...salida,
        totalSumados: (salida.sumados || []).length
    };
}

function leerTodasJson() {
    try {
        const contenido = fs.readFileSync(ARCHIVO, 'utf-8');
        const datos = JSON.parse(contenido);
        if (Array.isArray(datos) && datos.length) return datos;
    } catch (error) {
        /* archivo nuevo */
    }
    const semillas = SEMILLAS.map((item) => ({ ...item }));
    guardarTodasJson(semillas);
    return semillas;
}

function guardarTodasJson(salidas) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(salidas, null, 2), 'utf-8');
}

function validarPublicar(datos) {
    const organizador = normalizarNombreVisible(datos.organizador || datos.nombreVisible);
    const perfilId = limpiarTexto(datos.perfilId, 32) || null;
    const titulo = limpiarTexto(datos.titulo, 120);

    if (!organizador) {
        return { valido: false, error: 'Necesitás un perfil en la comunidad para publicar.' };
    }
    if (!titulo) {
        return { valido: false, error: 'La salida necesita un título.' };
    }

    return {
        valido: true,
        salida: {
            organizador,
            perfilId,
            titulo,
            descripcion: limpiarTexto(datos.descripcion, 320),
            ciudad: esCiudadValida(datos.ciudad) ? datos.ciudad : 'rosario',
            fechaInicio: datos.fechaInicio || null,
            lugar: limpiarTexto(datos.lugar, 120),
            direccion: limpiarTexto(datos.direccion, 160),
            eventoId: limpiarTexto(datos.eventoId, 80) || null,
            lat: datos.lat ?? null,
            lng: datos.lng ?? null
        }
    };
}

async function obtenerSalidaPorId(id, cliente = null) {
    const consulta = `${SQL_SALIDA_BASE} WHERE s.id = $1 LIMIT 1`;
    const parametros = [id];

    if (cliente) {
        const { rows } = await cliente.query(consulta, parametros);
        return rows.length ? filaASalida(rows[0]) : null;
    }

    const { rows } = await db.consultar(consulta, parametros);
    return rows.length ? filaASalida(rows[0]) : null;
}

async function crearSalida(datos) {
    const { valido, error, salida } = validarPublicar(datos);
    if (!valido) {
        const err = new Error(error);
        err.codigo = 400;
        throw err;
    }

    const id = nuevoId();
    const ahora = new Date().toISOString();

    if (db.estaConfigurada()) {
        await db.transaccion(async (cliente) => {
            await cliente.query(
                `insert into public.salidas (
                    id, perfil_id, organizador, titulo, descripcion, ciudad,
                    fecha_inicio, lugar, direccion, lat, lng, evento_id, creado
                ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    id,
                    salida.perfilId,
                    salida.organizador,
                    salida.titulo,
                    salida.descripcion,
                    salida.ciudad,
                    salida.fechaInicio,
                    salida.lugar,
                    salida.direccion,
                    salida.lat,
                    salida.lng,
                    salida.eventoId,
                    ahora
                ]
            );

            await cliente.query(
                `insert into public.salida_sumados (salida_id, perfil_id, nombre, es_organizador, fecha)
                 values ($1, $2, $3, true, $4)`,
                [id, salida.perfilId, salida.organizador, ahora]
            );
        });

        return obtenerSalidaPorId(id);
    }

    const registros = leerTodasJson();
    const registro = {
        id,
        ...salida,
        creado: ahora,
        sumados: [{
            nombre: salida.organizador,
            perfilId: salida.perfilId,
            fecha: ahora,
            esOrganizador: true
        }]
    };

    registros.unshift(registro);
    guardarTodasJson(registros.slice(0, MAX_SALIDAS));
    return conTotalSumados(registro);
}

async function listarSalidas({ ciudad } = {}) {
    if (db.estaConfigurada()) {
        const filtroCiudad = ciudad && esCiudadValida(ciudad) ? ciudad : null;
        const { rows } = await db.consultar(
            `${SQL_SALIDA_BASE}
             WHERE ($1::text IS NULL OR s.ciudad = $1)
             ORDER BY s.creado DESC
             LIMIT $2`,
            [filtroCiudad, MAX_SALIDAS]
        );
        return rows.map(filaASalida);
    }

    let salidas = leerTodasJson();
    if (ciudad && esCiudadValida(ciudad)) {
        salidas = salidas.filter((item) => item.ciudad === ciudad);
    }

    return salidas
        .map(conTotalSumados)
        .sort((a, b) => new Date(b.creado).getTime() - new Date(a.creado).getTime());
}

async function sumarse(id, datos) {
    const nombreVisible = normalizarNombreVisible(datos.nombre || datos.nombreVisible);
    const perfilId = limpiarTexto(datos.perfilId, 32) || null;

    if (!nombreVisible) {
        const err = new Error('Necesitás un perfil en la comunidad para sumarte.');
        err.codigo = 400;
        throw err;
    }

    if (db.estaConfigurada()) {
        const existente = await db.consultar(
            `select id from public.salidas where id = $1 limit 1`,
            [id]
        );
        if (!existente.rows.length) {
            const err = new Error('Esta salida ya no está disponible.');
            err.codigo = 404;
            throw err;
        }

        const duplicado = await db.consultar(
            `select 1 from public.salida_sumados
             where salida_id = $1
               and (
                 ($2::text is not null and perfil_id = $2)
                 or lower(nombre) = lower($3)
               )
             limit 1`,
            [id, perfilId, nombreVisible]
        );
        if (duplicado.rows.length) {
            return { salida: await obtenerSalidaPorId(id), yaEstaba: true };
        }

        const conteo = await db.consultar(
            `select count(*)::int as total from public.salida_sumados where salida_id = $1`,
            [id]
        );
        if (conteo.rows[0].total >= MAX_SUMADOS_POR_SALIDA) {
            const err = new Error('Esta salida ya llegó al cupo de gente sumada.');
            err.codigo = 409;
            throw err;
        }

        const ahora = new Date().toISOString();
        await db.consultar(
            `insert into public.salida_sumados (salida_id, perfil_id, nombre, es_organizador, fecha)
             values ($1, $2, $3, false, $4)`,
            [id, perfilId, nombreVisible, ahora]
        );

        return { salida: await obtenerSalidaPorId(id), yaEstaba: false };
    }

    const registros = leerTodasJson();
    const indice = registros.findIndex((item) => item.id === id);
    if (indice === -1) {
        const err = new Error('Esta salida ya no está disponible.');
        err.codigo = 404;
        throw err;
    }

    const salida = registros[indice];
    const sumados = salida.sumados || [];
    const yaSumado = sumados.some((persona) => mismaPersona(persona, perfilId, nombreVisible));

    if (yaSumado) {
        return { salida: conTotalSumados(salida), yaEstaba: true };
    }

    if (sumados.length >= MAX_SUMADOS_POR_SALIDA) {
        const err = new Error('Esta salida ya llegó al cupo de gente sumada.');
        err.codigo = 409;
        throw err;
    }

    sumados.push({
        nombre: nombreVisible,
        perfilId,
        fecha: new Date().toISOString(),
        esOrganizador: false
    });
    salida.sumados = sumados;
    registros[indice] = salida;
    guardarTodasJson(registros);

    return { salida: conTotalSumados(salida), yaEstaba: false };
}

/**
 * Geocodifica salidas sin coordenadas y persiste el resultado para no
 * repetir consultas a Nominatim en cada visita al mapa de Salen.
 */
async function enriquecerCoordenadasSalidas(salidas, { maxConsultas = 4 } = {}) {
    const pendientes = salidas.filter((item) => item.lat == null || item.lng == null);
    if (!pendientes.length) return salidas;

    const porCiudad = new Map();
    for (const salida of pendientes) {
        const ciudad = salida.ciudad || 'rosario';
        if (!porCiudad.has(ciudad)) porCiudad.set(ciudad, []);
        porCiudad.get(ciudad).push(salida);
    }

    for (const [ciudad, grupo] of porCiudad) {
        await geocodificarItems(grupo, ciudad, { maxConsultas });
    }

    const actualizadas = pendientes.filter((item) => item.lat != null && item.lng != null);
    if (!actualizadas.length) return salidas;

    if (db.estaConfigurada()) {
        for (const salida of actualizadas) {
            await db.consultar(
                `update public.salidas set lat = $2, lng = $3 where id = $1`,
                [salida.id, salida.lat, salida.lng]
            );
        }
        return salidas;
    }

    const registros = leerTodasJson();
    let huboCambios = false;

    for (const salida of actualizadas) {
        const indice = registros.findIndex((item) => item.id === salida.id);
        if (indice === -1) continue;
        registros[indice].lat = salida.lat;
        registros[indice].lng = salida.lng;
        huboCambios = true;
    }

    if (huboCambios) {
        guardarTodasJson(registros);
    }

    return salidas;
}

module.exports = {
    crearSalida,
    listarSalidas,
    sumarse,
    enriquecerCoordenadasSalidas
};
