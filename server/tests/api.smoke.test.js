const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { servidor } = require('../index');

let baseUrl = '';

test.before(async () => {
    servidor.listen(0, '127.0.0.1');
    await once(servidor, 'listening');
    const direccion = servidor.address();
    baseUrl = `http://127.0.0.1:${direccion.port}`;
});

test.after(async () => {
    if (!servidor.listening) return;
    await new Promise((resolve, reject) => {
        servidor.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
});

test('GET /api/health responde 200 y ok=true', async () => {
    const respuesta = await fetch(`${baseUrl}/api/health`);
    assert.equal(respuesta.status, 200);

    const datos = await respuesta.json();
    assert.equal(datos.ok, true);
    assert.ok(Array.isArray(datos.ciudades));
});

test('GET /api/eventos con ciudad inválida responde 400', async () => {
    const respuesta = await fetch(`${baseUrl}/api/eventos?ciudad=ciudad-invalida`);
    assert.equal(respuesta.status, 400);

    const datos = await respuesta.json();
    assert.equal(datos.error, 'Ciudad no soportada');
    assert.ok(Array.isArray(datos.ciudades));
});
