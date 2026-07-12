function inicioDia(fecha) {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
}

function finDia(fecha) {
    const copia = new Date(fecha);
    copia.setHours(23, 59, 59, 999);
    return copia;
}

function rangoMomento(momento, referencia = new Date()) {
    const hoy = inicioDia(referencia);

    if (momento === 'manana') {
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        return { desde: manana, hasta: finDia(manana) };
    }

    if (momento === 'finde') {
        const desde = new Date(hoy);
        const dia = desde.getDay();
        const diasHastaSabado = (6 - dia + 7) % 7;
        desde.setDate(desde.getDate() + diasHastaSabado);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 1);
        return { desde: inicioDia(desde), hasta: finDia(hasta) };
    }

    if (momento === 'este-mes') {
        const ultimoDia = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
        return { desde: hoy, hasta: finDia(ultimoDia) };
    }

    return { desde: hoy, hasta: finDia(hoy) };
}

function formatearRosario(fecha) {
    return fecha.toISOString().slice(0, 10);
}

function coincideConRango(fechaIso, rango) {
    if (!fechaIso) return false;
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return false;
    return fecha >= rango.desde && fecha <= rango.hasta;
}

function algunaFechaEnRango(fechas, rango) {
    return fechas.some((fecha) => coincideConRango(fecha, rango));
}

module.exports = {
    rangoMomento,
    formatearRosario,
    coincideConRango,
    algunaFechaEnRango
};
