const fs = require('fs');
const { esCiudadValida } = require('./ciudades');
const path = require('path');
const crypto = require('crypto');
const { geocodificarItems } = require('./geocoder');

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
            { nombre: 'Nico#9103', perfilId: 'demo-nico', fecha: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
            { nombre: 'Lu#5521', perfilId: 'demo-lu', fecha: new Date(Date.now() - 40 * 60 * 1000).toISOString() }
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
        sumados: [{ nombre: 'Juli#7782', perfilId: 'demo-juli', fecha: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }]
    }
];

function limpiarTexto(texto = '', maximo = 280) {
    return texto
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function leerTodas() {
    try {
        const contenido = fs.readFileSync(ARCHIVO, 'utf-8');
        const datos = JSON.parse(contenido);
        if (Array.isArray(datos) && datos.length) return datos;
    } catch (error) {
        /* archivo nuevo */
    }
    guardarTodas(SEMILLAS.map((item) => ({ ...item })));
    return SEMILLAS.map((item) => ({ ...item }));
}

function guardarTodas(salidas) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(salidas, null, 2), 'utf-8');
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

function crearSalida(datos) {
    const { valido, error, salida } = validarPublicar(datos);
    if (!valido) {
        const err = new Error(error);
        err.codigo = 400;
        throw err;
    }

    const registros = leerTodas();
    const registro = {
        id: nuevoId(),
        ...salida,
        creado: new Date().toISOString(),
        sumados: [{
            nombre: salida.organizador,
            perfilId: salida.perfilId,
            fecha: new Date().toISOString(),
            esOrganizador: true
        }]
    };

    registros.unshift(registro);
    guardarTodas(registros.slice(0, MAX_SALIDAS));
    return registro;
}

function listarSalidas({ ciudad } = {}) {
    let salidas = leerTodas();
    if (ciudad && esCiudadValida(ciudad)) {
        salidas = salidas.filter((item) => item.ciudad === ciudad);
    }
    return salidas
        .map((item) => ({
            ...item,
            totalSumados: (item.sumados || []).length
        }))
        .sort((a, b) => new Date(b.creado).getTime() - new Date(a.creado).getTime());
}

function sumarse(id, datos) {
    const nombreVisible = normalizarNombreVisible(datos.nombre || datos.nombreVisible);
    const perfilId = limpiarTexto(datos.perfilId, 32) || null;

    if (!nombreVisible) {
        const err = new Error('Necesitás un perfil en la comunidad para sumarte.');
        err.codigo = 400;
        throw err;
    }

    const registros = leerTodas();
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
        return { salida, yaEstaba: true };
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
    guardarTodas(registros);

    return { salida, yaEstaba: false };
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

    const registros = leerTodas();
    let huboCambios = false;

    for (const salida of pendientes) {
        if (salida.lat == null || salida.lng == null) continue;
        const indice = registros.findIndex((item) => item.id === salida.id);
        if (indice === -1) continue;
        registros[indice].lat = salida.lat;
        registros[indice].lng = salida.lng;
        huboCambios = true;
    }

    if (huboCambios) {
        guardarTodas(registros);
    }

    return salidas;
}

module.exports = {
    crearSalida,
    listarSalidas,
    sumarse,
    enriquecerCoordenadasSalidas
};
