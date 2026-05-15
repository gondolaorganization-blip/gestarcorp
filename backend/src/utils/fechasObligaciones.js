import { setYear, setMonth, setDate, addYears } from 'date-fns';

// Aviso de operación y declaración de renta — siempre 31 de marzo
export function vencimientoAvisoOperacion(anio) {
  return new Date(`${anio}-03-31T23:59:59.000Z`);
}

export function vencimientoDeclaracionRenta(anio) {
  return new Date(`${anio}-03-31T23:59:59.000Z`);
}

// Tasa única — vence el último día del mes de constitución de cada año
// Si la sociedad se constituyó el 15 de mayo, la tasa vence el 31 de mayo de cada año
export function vencimientoTasaUnica(anio, fechaConstitucion) {
  if (!fechaConstitucion) return new Date(`${anio}-03-31T23:59:59.000Z`);
  const mes = new Date(fechaConstitucion).getUTCMonth(); // 0-indexed
  // Último día del mes de constitución en el año dado
  const primerDiaSiguiente = new Date(Date.UTC(anio, mes + 1, 1));
  const ultimoDia = new Date(primerDiaSiguiente.getTime() - 1);
  return ultimoDia;
}

// Declaración municipal — por defecto 31 de enero (varía por municipio)
export function vencimientoDeclaracionMunicipal(anio) {
  return new Date(`${anio}-01-31T23:59:59.000Z`);
}

export function calcularFechaVence(tipo, anio, fechaConstitucion) {
  switch (tipo) {
    case 'AVISO_OPERACION':      return vencimientoAvisoOperacion(anio);
    case 'DECLARACION_RENTA':    return vencimientoDeclaracionRenta(anio);
    case 'TASA_UNICA':           return vencimientoTasaUnica(anio, fechaConstitucion);
    case 'DECLARACION_MUNICIPAL': return vencimientoDeclaracionMunicipal(anio);
    default:                     return null;
  }
}

// Genera las 4 obligaciones estándar para un año dado
export function generarObligacionesAnuales(sociedadId, anio, fechaConstitucion) {
  return [
    {
      sociedadId, tipo: 'AVISO_OPERACION', anio,
      entidad: 'Ministerio de Comercio e Industrias (MICI)',
      descripcion: 'Aviso de Operación Anual',
      fechaVence: vencimientoAvisoOperacion(anio),
      estado: 'PENDIENTE',
    },
    {
      sociedadId, tipo: 'TASA_UNICA', anio,
      entidad: 'Registro Público de Panamá',
      descripcion: 'Tasa Única Anual',
      fechaVence: vencimientoTasaUnica(anio, fechaConstitucion),
      estado: 'PENDIENTE',
    },
    {
      sociedadId, tipo: 'DECLARACION_RENTA', anio,
      entidad: 'Dirección General de Ingresos (DGI)',
      descripcion: 'Declaración Jurada de Renta Anual',
      fechaVence: vencimientoDeclaracionRenta(anio),
      estado: 'PENDIENTE',
    },
    {
      sociedadId, tipo: 'DECLARACION_MUNICIPAL', anio,
      entidad: 'Municipio de Panamá',
      descripcion: 'Declaración Anual Municipal',
      fechaVence: vencimientoDeclaracionMunicipal(anio),
      estado: 'PENDIENTE',
    },
  ];
}
