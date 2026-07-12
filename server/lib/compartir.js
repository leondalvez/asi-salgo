/**
 * Snapshots de salidas compartidas. WhatsApp (y otras apps) necesitan una URL
 * con og:title / og:description servidos en HTML — no alcanza con meta tags
 * puestos por JS en el cliente. Guardamos un JSON local con TTL corto.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ARCHIVO = path.join(__dirname, '..', 'data', 'compartidos.json');
const MAX_REGISTROS = 400;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function leerTodos() {
    try {
        const contenido = fs.readFileSync(ARCHIVO, 'utf-8');
        return JSON.parse(contenido);
    } catch (error) {
        return [];
    }
}

function guardarTodos(registros) {
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(registros, null, 2), 'utf-8');
}

function podar(registros) {
    const ahora = Date.now();
    return registros
        .filter((item) => ahora - new Date(item.creado).getTime() < TTL_MS)
        .slice(-MAX_REGISTROS);
}

function nuevoId() {
    return crypto.randomBytes(5).toString('hex');
}

function limpiarTexto(texto = '', maximo = 280) {
    return texto
        .toString()
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maximo);
}

function validarEvento(evento) {
    if (!evento || typeof evento !== 'object') {
        return { valido: false, error: 'Falta el evento a compartir.' };
    }

    const titulo = limpiarTexto(evento.titulo, 120);
    if (!titulo) {
        return { valido: false, error: 'El evento necesita un título.' };
    }

    return {
        valido: true,
        evento: {
            id: limpiarTexto(evento.id, 80) || `salida-${Date.now()}`,
            titulo,
            descripcion: limpiarTexto(evento.descripcion, 320),
            fechaInicio: evento.fechaInicio || null,
            fechaFin: evento.fechaFin || null,
            lugar: limpiarTexto(evento.lugar, 120),
            direccion: limpiarTexto(evento.direccion, 160),
            lat: Number.isFinite(Number(evento.lat)) ? Number(evento.lat) : null,
            lng: Number.isFinite(Number(evento.lng)) ? Number(evento.lng) : null,
            ciudad: evento.ciudad === 'buenos-aires' ? 'buenos-aires' : 'rosario',
            gratis: evento.gratis === true ? true : evento.gratis === false ? false : null,
            aptoNinos: evento.aptoNinos === true ? true : null,
            tipo: limpiarTexto(evento.tipo, 40) || 'evento',
            link: limpiarTexto(evento.link, 500) || null,
            fuente: limpiarTexto(evento.fuente, 80) || null
        }
    };
}

function crearCompartido(datos) {
    const { valido, error, evento } = validarEvento(datos.evento);
    if (!valido) {
        const err = new Error(error);
        err.codigo = 400;
        throw err;
    }

    const registros = podar(leerTodos());
    const id = nuevoId();
    const registro = {
        id,
        evento,
        creado: new Date().toISOString()
    };

    registros.push(registro);
    guardarTodos(registros);
    return registro;
}

function obtenerCompartido(id) {
    const limpio = (id || '').toString().trim();
    if (!/^[a-f0-9]{10}$/.test(limpio)) return null;
    const registros = podar(leerTodos());
    return registros.find((item) => item.id === limpio) || null;
}

module.exports = {
    crearCompartido,
    obtenerCompartido,
    limpiarTexto
};
