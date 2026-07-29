/**
 * Genera una carpeta de entrega académica en el Escritorio.
 * Copia el código listo para ejecutar y aplica exclusiones.
 *
 * Uso: node scripts/preparar-entrega.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORIGEN = path.resolve(__dirname, '..');
const DESTINO = path.resolve(
    process.env.USERPROFILE || process.env.HOME || '',
    'Desktop',
    'asi-salgo-entrega'
);

const EXCLUIR_DIRS = new Set([
    'node_modules',
    '.git',
    '_defensa',
    'data',
    '.vscode',
    'backend',
    'scripts',
    '_entrega_tmp'
]);

const EXCLUIR_ARCHIVOS = new Set([
    '.env',
    '.DS_Store',
    'diario-de-trabajo.md',
    'preparar-entrega.mjs'
]);

function debeExcluir(nombre, esDir) {
    if (esDir) return EXCLUIR_DIRS.has(nombre);
    if (EXCLUIR_ARCHIVOS.has(nombre)) return true;
    if (nombre.endsWith('.zip')) return true;
    return false;
}

function copiarRecursivo(desde, hacia) {
    fs.mkdirSync(hacia, { recursive: true });
    for (const entrada of fs.readdirSync(desde, { withFileTypes: true })) {
        if (debeExcluir(entrada.name, entrada.isDirectory())) continue;
        const origen = path.join(desde, entrada.name);
        const destino = path.join(hacia, entrada.name);
        if (entrada.isDirectory()) {
            copiarRecursivo(origen, destino);
        } else {
            fs.copyFileSync(origen, destino);
        }
    }
}

function reemplazarEnArchivo(ruta, reemplazos) {
    if (!fs.existsSync(ruta)) return;
    let texto = fs.readFileSync(ruta, 'utf8');
    for (const [buscar, poner] of reemplazos) {
        texto = texto.split(buscar).join(poner);
    }
    fs.writeFileSync(ruta, texto, 'utf8');
}

function ajustarComentariosCodigo(raiz) {
    const archivos = [];
    function recorrer(dir) {
        for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
            const ruta = path.join(dir, entrada.name);
            if (entrada.isDirectory()) recorrer(ruta);
            else if (entrada.name.endsWith('.js')) archivos.push(ruta);
        }
    }
    recorrer(raiz);

    for (const archivo of archivos) {
        let texto = fs.readFileSync(archivo, 'utf8');
        const original = texto;

        // Solo comentarios: no tocar strings de UI al usuario.
        texto = texto.replace(
            /^(\s*\*\s.*)ya usamos para filtrar/gm,
            '$1ya se usan para filtrar'
        );
        texto = texto.replace(
            /^(\s*\*\s.*)que usamos para Rosario\./gm,
            '$1que se usa para Rosario.'
        );
        texto = texto.replace(
            /^(\s*\*\s.*)Usamos el código de Open-Meteo/gm,
            '$1Se usa el código de Open-Meteo'
        );

        if (texto !== original) {
            fs.writeFileSync(archivo, texto, 'utf8');
        }
    }
}

if (fs.existsSync(DESTINO)) {
    fs.rmSync(DESTINO, { recursive: true, force: true });
}

console.log('Origen:', ORIGEN);
console.log('Destino:', DESTINO);
copiarRecursivo(ORIGEN, DESTINO);

// Ajustes menores de tono en comentarios del código copiado.
ajustarComentariosCodigo(path.join(DESTINO, 'frontend', 'js'));
ajustarComentariosCodigo(path.join(DESTINO, 'server'));

// El README y la memoria se sobrescriben después con versiones de entrega.
const readmeEntrega = path.join(ORIGEN, 'scripts', 'plantillas-entrega', 'README.md');
const memoriaEntrega = path.join(ORIGEN, 'scripts', 'plantillas-entrega', 'Memoria-de-Desarrollo.md');
const evidenciasEntrega = path.join(ORIGEN, 'scripts', 'plantillas-entrega', 'entrega-evidencias.md');
const serverReadmeEntrega = path.join(ORIGEN, 'scripts', 'plantillas-entrega', 'server-README.md');

if (fs.existsSync(readmeEntrega)) {
    fs.copyFileSync(readmeEntrega, path.join(DESTINO, 'README.md'));
}
if (fs.existsSync(memoriaEntrega)) {
    fs.mkdirSync(path.join(DESTINO, 'docs'), { recursive: true });
    fs.copyFileSync(memoriaEntrega, path.join(DESTINO, 'docs', 'Memoria-de-Desarrollo.md'));
}
if (fs.existsSync(evidenciasEntrega)) {
    fs.copyFileSync(evidenciasEntrega, path.join(DESTINO, 'docs', 'entrega-evidencias.md'));
}
if (fs.existsSync(serverReadmeEntrega)) {
    fs.copyFileSync(serverReadmeEntrega, path.join(DESTINO, 'server', 'README.md'));
}

// Asegurar que no quedó el diario.
const diario = path.join(DESTINO, 'docs', 'diario-de-trabajo.md');
if (fs.existsSync(diario)) fs.unlinkSync(diario);

console.log('Listo. Carpeta de entrega:', DESTINO);
console.log('Para comprimir (cmd):');
console.log(
    `tar -a -c -f "%USERPROFILE%\\Desktop\\asi-salgo-entrega.zip" -C "%USERPROFILE%\\Desktop" asi-salgo-entrega`
);
