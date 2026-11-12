const fs = require('fs');
const path = require('path');

function limpiarValor(valor = '') {
    const texto = valor.trim();
    if ((texto.startsWith('"') && texto.endsWith('"')) || (texto.startsWith("'") && texto.endsWith("'"))) {
        return texto.slice(1, -1);
    }
    return texto;
}

function cargarEnvLocal() {
    const ruta = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(ruta)) return;

    const contenido = fs.readFileSync(ruta, 'utf-8');
    const lineas = contenido.split(/\r?\n/);

    for (const linea of lineas) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('#')) continue;

        const indice = limpia.indexOf('=');
        if (indice <= 0) continue;

        const clave = limpia.slice(0, indice).trim();
        const valor = limpiarValor(limpia.slice(indice + 1));

        if (!clave || process.env[clave] != null) continue;
        process.env[clave] = valor;
    }
}

module.exports = { cargarEnvLocal };
