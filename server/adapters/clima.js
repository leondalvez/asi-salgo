const CIUDADES = {
    rosario: { lat: -32.9468, lng: -60.6393, nombre: 'Rosario' },
    'buenos-aires': { lat: -34.6037, lng: -58.3816, nombre: 'Buenos Aires' }
};

const CLIMA_TEXTO = {
    0: 'Cielo despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla',
    51: 'Llovizna ligera',
    53: 'Llovizna',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia',
    65: 'Lluvia intensa',
    80: 'Chaparrones',
    95: 'Tormenta'
};

function consejoSalida(codigo, temperatura, precipitacion) {
    if ([61, 63, 65, 80, 95].includes(codigo) || precipitacion > 0.5) {
        return 'Mejor plan bajo techo o con paraguas.';
    }
    if (temperatura < 10) {
        return 'Salí abrigado: hace frío.';
    }
    if (temperatura > 28) {
        return 'Hace calor: buscá sombra y agua.';
    }
    if ([0, 1, 2].includes(codigo)) {
        return 'Buen momento para salir a la calle.';
    }
    return 'Podés salir, pero mirá el cielo.';
}

async function fetchClima(ciudad) {
    const config = CIUDADES[ciudad] || CIUDADES.rosario;
    const params = new URLSearchParams({
        latitude: String(config.lat),
        longitude: String(config.lng),
        current: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
        timezone: 'America/Argentina/Buenos_Aires',
        forecast_days: '1'
    });

    const respuesta = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
        signal: AbortSignal.timeout(12000)
    });

    if (!respuesta.ok) {
        throw new Error(`Clima ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const actual = datos.current || {};
    const codigo = actual.weather_code ?? 3;
    const temperatura = actual.temperature_2m ?? null;

    return {
        ciudad: config.nombre,
        temperatura,
        unidad: '°C',
        estado: CLIMA_TEXTO[codigo] || 'Condición variable',
        codigo,
        precipitacion: actual.precipitation ?? 0,
        vientoKmh: actual.wind_speed_10m ?? null,
        consejo: consejoSalida(codigo, temperatura, actual.precipitation ?? 0),
        fuente: 'open-meteo'
    };
}

module.exports = {
    fetchClima
};
