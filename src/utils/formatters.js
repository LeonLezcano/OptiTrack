/**
 * Formatters para OptiTrack
 */
export const Formatters = {
  diopter(val) {
    if (val === null || val === undefined || isNaN(val)) return '0.00';
    const num = Number(val);
    const sign = num > 0 ? '+' : num < 0 ? '' : '';
    return `${sign}${num.toFixed(2)}`;
  },

  axis(val) {
    if (val === null || val === undefined || isNaN(val)) return '0°';
    const num = Math.round(Number(val));
    return `${num}°`;
  },

  distanceMm(val) {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return `${Number(val).toFixed(1)} mm`;
  },

  currencyARS(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(num);
  },

  currencyUSD(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(num);
  },

  date(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  orderStatusBadge(status) {
    const map = {
      'RECETA_INGRESADA': {
        label: 'Receta Ingresada',
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/40',
        icon: '📋'
      },
      'EN_TALLER_CALIBRADO': {
        label: 'En Taller / Biselado',
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/40',
        icon: '⚙️'
      },
      'CONTROL_FRONTOMETRO': {
        label: 'Control Fronto OK',
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/40',
        icon: '🔬'
      },
      'LISTO_PARA_ENTREGA': {
        label: 'Listo para Retiro',
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        icon: '🟢'
      },
      'DELIVERED': {
        label: 'Adaptado y Entregado',
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        icon: '✓'
      }
    };

    return map[status] || {
      label: status || 'Desconocido',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: '•'
    };
  }
};
