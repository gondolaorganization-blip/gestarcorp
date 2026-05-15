export function formatFecha(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMoneda(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(val);
}

export function healthColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

export function healthBg(score) {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function estadoBadge(estado) {
  const map = {
    ACTIVA: 'badge-green', INACTIVA: 'badge-gray', DISUELTA: 'badge-red',
    SUSPENDIDA: 'badge-yellow', ACTIVO: 'badge-green', INACTIVO: 'badge-gray',
    PAGADO: 'badge-green', VENCIDO: 'badge-red', PENDIENTE: 'badge-yellow', EXENTO: 'badge-gray',
    ABIERTA: 'badge-yellow', EN_PROCESO: 'badge-blue', RESUELTA: 'badge-green', CERRADA: 'badge-gray',
    MENSUAL: 'badge-blue', ANUAL: 'badge-purple', FUNDADOR: 'badge-purple',
  };
  return map[estado] || 'badge-gray';
}
