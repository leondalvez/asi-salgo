/**
 * Parser mínimo de iCalendar (VEVENT) para feeds públicos como la agenda
 * municipal de Santa Fe (Events Manager). Sin dependencias externas.
 */

function desplegarLineas(texto = '') {
    const lineas = [];
    for (const linea of texto.split(/\r?\n/)) {
        if (/^[ \t]/.test(linea) && lineas.length) {
            lineas[lineas.length - 1] += linea.slice(1);
        } else if (linea.trim()) {
            lineas.push(linea.trim());
        }
    }
    return lineas;
}

function parsearCampo(linea) {
    const separador = linea.indexOf(':');
    if (separador === -1) return null;

    const nombreCompleto = linea.slice(0, separador);
    const valor = linea.slice(separador + 1);
    const nombre = nombreCompleto.split(';')[0].toUpperCase();

    return { nombre, valor, parametros: nombreCompleto };
}

function parsearFechaIcal(valor, parametros = '') {
    if (!valor) return null;

    const esSoloFecha = /VALUE=DATE/i.test(parametros) || /^\d{8}$/.test(valor);
    const limpio = valor.replace(/[^0-9TZ]/g, '');

    if (esSoloFecha && limpio.length >= 8) {
        const y = limpio.slice(0, 4);
        const m = limpio.slice(4, 6);
        const d = limpio.slice(6, 8);
        return `${y}-${m}-${d}T12:00:00-03:00`;
    }

    if (limpio.length >= 15) {
        const y = limpio.slice(0, 4);
        const m = limpio.slice(4, 6);
        const d = limpio.slice(6, 8);
        const h = limpio.slice(9, 11) || '12';
        const min = limpio.slice(11, 13) || '00';
        const sufijo = valor.endsWith('Z') ? 'Z' : '-03:00';
        return `${y}-${m}-${d}T${h}:${min}:00${sufijo}`;
    }

    return null;
}

function decodificarTextoIcal(texto = '') {
    return texto
        .replace(/\\n/gi, '\n')
        .replace(/\\,/g, ',')
        .replace(/\\;/g, ';')
        .replace(/\\\\/g, '\\')
        .trim();
}

function parsearVevent(bloque) {
    const campos = {};
    for (const linea of desplegarLineas(bloque)) {
        const campo = parsearCampo(linea);
        if (!campo) continue;
        campos[campo.nombre] = { valor: campo.valor, parametros: campo.parametros };
    }

    if (!campos.SUMMARY) return null;

    return {
        uid: campos.UID?.valor || null,
        titulo: decodificarTextoIcal(campos.SUMMARY.valor),
        descripcion: decodificarTextoIcal(campos.DESCRIPTION?.valor || ''),
        fechaInicio: parsearFechaIcal(campos.DTSTART?.valor, campos.DTSTART?.parametros),
        fechaFin: parsearFechaIcal(campos.DTEND?.valor, campos.DTEND?.parametros),
        lugar: decodificarTextoIcal(campos.LOCATION?.valor || ''),
        link: campos.URL?.valor || null
    };
}

function parsearIcal(texto = '') {
    const eventos = [];
    const partes = texto.split('BEGIN:VEVENT');

    for (let i = 1; i < partes.length; i += 1) {
        const bloque = partes[i].split('END:VEVENT')[0];
        const evento = parsearVevent(bloque);
        if (evento) eventos.push(evento);
    }

    return eventos;
}

module.exports = {
    parsearIcal,
    parsearFechaIcal
};
