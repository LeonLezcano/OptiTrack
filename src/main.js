/**
 * OptiTrack - Main Controller
 * AiAppFactory Standard
 */
import { OpticalTransposer } from './core/opticalTransposer.js';
import { MaterialsCatalog, LENS_MATERIALS, LENS_TREATMENTS } from './core/materialsCatalog.js';
import { OpticalOrderService } from './services/opticalOrderService.js';
import { ExportService } from './services/exportService.js';
import { OptiTrackCacheService } from './services/optiTrackCache.service.js';
import { WhatsAppOpticNotifierService } from './services/whatsAppOpticNotifier.service.js';
import { Formatters } from './utils/formatters.js';
import { Sanitizer } from './utils/sanitizer.js';

// Estado Central Reactivo
const state = {
  activeTab: 'dashboard',
  orders: [],
  activeOrderIdForQc: null,
  activeOrderIdForDelivery: null,
  lastFocusedElement: null,
  modalsInitialized: false
};

const SVG_ICONS = {
  plus: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  glasses: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="13" r="4"/><circle cx="17.5" cy="13" r="4"/><path d="M10.5 13c.8-1 2.2-1 3 0"/></svg>',
  transpose: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h15l-3-3"/><path d="M21 17H6l3 3"/></svg>',
  target: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="2"/></svg>',
  layers: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>',
  receipt: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
  lock: '<svg aria-hidden="true" class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  download: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  message: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  check: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  trash: '<svg aria-hidden="true" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};

function renderStatusBadge(status) {
  const badge = Formatters.orderStatusBadge(status);
  return `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg} ${badge.border} ${badge.text}">
      <span class="w-2 h-2 rounded-full ${badge.dot} shrink-0" aria-hidden="true"></span>
      <span>${Sanitizer.escapeHTML(badge.label)}</span>
    </span>
  `;
}

function renderDemoBadge(order) {
  if (!order?.isDemo) return '';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">[DEMO]</span>`;
}

function showGlobalError(message) {
  const el = document.getElementById('app-error-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function showStatusMessage(message) {
  const el = document.getElementById('app-status-banner');
  if (!el) return;
  if (!message) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function showModalError(errorElementId, messages) {
  const el = document.getElementById(errorElementId);
  if (!el) return;
  const list = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean);
  if (list.length === 0) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  if (list.length === 1) {
    el.textContent = list[0];
  } else {
    const itemsHtml = list.map(m => `<li>${Sanitizer.escapeHTML(m)}</li>`).join('');
    Sanitizer.safeSetInnerHTML(el, `<p class="font-semibold mb-1">Se detectaron desvíos o errores:</p><ul class="list-disc pl-4 space-y-0.5">${itemsHtml}</ul>`);
  }
  el.classList.remove('hidden');
}

function parseNumericInput(id, { integer = false, required = false, defaultValue = 0, label = '' } = {}) {
  const input = document.getElementById(id);
  const raw = input ? input.value.trim() : '';
  if (raw === '') {
    if (required) {
      throw new Error(`El campo "${label || id}" es obligatorio.`);
    }
    return defaultValue;
  }
  const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`El valor ingresado en "${label || id}" no es numérico.`);
  }
  return parsed;
}

function generatePatientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `PAT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }
  return `PAT-${Date.now().toString(36).slice(-6).toUpperCase()}`;
}

function renderDemoNoticeBanner() {
  const hasDemo = state.orders.some(o => o.isDemo);
  if (!hasDemo) return '';
  return `
    <div class="no-print rounded-2xl border border-amber-500/40 bg-amber-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="text-xs text-amber-200 space-y-0.5">
        <p class="font-semibold">[DEMO / MOCK] Registros de muestra precargados localmente.</p>
        <p class="text-slate-300">Las órdenes marcadas con [DEMO] son datos de prueba almacenados en este navegador.</p>
      </div>
      <button type="button" id="btn-purge-demo" class="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors shrink-0">
        ${SVG_ICONS.trash}
        <span>Purgar Datos [DEMO]</span>
      </button>
    </div>
  `;
}

function attachDemoPurgeListener() {
  document.getElementById('btn-purge-demo')?.addEventListener('click', () => {
    OptiTrackCacheService.purgeData();
    state.orders = [];
    showStatusMessage('Datos de demostración purgados. El espacio de trabajo quedó limpio para recetas reales.');
    switchTab(state.activeTab);
  });
}

// Inicialización de Semilla Demo (Solo si no fue purgada)
function initializeDemoData() {
  OptiTrackCacheService.clearLastStorageError();
  if (OptiTrackCacheService.isPurged()) {
    state.orders = [];
    return;
  }

  const cachedOrders = OptiTrackCacheService.getOrders();
  const storageErr = OptiTrackCacheService.getLastStorageError();
  if (storageErr) {
    showGlobalError(storageErr);
  }

  if (cachedOrders.length > 0) {
    state.orders = cachedOrders;
  } else if (!storageErr) {
    // 1. Orden en Taller [DEMO]
    const order1 = OpticalOrderService.createOrder({
      patientId: 'PAT-4821',
      patientName: 'Federico Santoro',
      patientPhone: '+5493434112233',
      doctorName: 'Dr. Guillermo Bustos',
      doctorLicense: 'MP-OFT-8491',
      odFormula: { sphere: -2.50, cylinder: -0.75, axis: 90, dnpMm: 31.0 },
      oiFormula: { sphere: -2.25, cylinder: -0.50, axis: 85, dnpMm: 31.5 },
      addition: 1.50,
      frameModel: 'Vulk The Edge Black',
      lensMaterial: 'HIGH_INDEX_167',
      treatments: ['AR_MULTI', 'BLUE_CUT'],
      pricing: { totalAmount: 120000, insuranceCoverage: 45000, depositPaid: 40000 },
      insuranceName: 'Swiss Medical'
    });
    const order1Workshop = {
      ...OpticalOrderService.sendToWorkshop(order1, {
        labName: 'Laboratorio de Tallado Óptico Centro',
        slaDays: 3
      }),
      isDemo: true
    };

    // 2. Orden Lista para Retiro con Sello Fronto SHA-256 [DEMO]
    const order2 = OpticalOrderService.createOrder({
      patientId: 'PAT-9912',
      patientName: 'Mariana López',
      patientPhone: '+5493415556677',
      doctorName: 'Dra. Romina Castro',
      doctorLicense: 'MP-OFT-3912',
      odFormula: { sphere: +1.75, cylinder: -0.50, axis: 180, dnpMm: 30.5 },
      oiFormula: { sphere: +2.00, cylinder: 0, axis: 0, dnpMm: 31.0 },
      frameModel: 'Prada Linea Rossa 01VS',
      lensMaterial: 'POLYCARBONATE',
      treatments: ['AR_MULTI'],
      pricing: { totalAmount: 95000, insuranceCoverage: 35000, depositPaid: 30000 },
      insuranceName: 'OSDE 210'
    });
    const order2Workshop = OpticalOrderService.sendToWorkshop(order2, { labName: 'Laboratorio Digital Sur', slaDays: 2 });
    const order2Ready = {
      ...OpticalOrderService.recordLensometerQualityCheck(order2Workshop, {
        odMeasured: { sphere: +1.75, cylinder: -0.50, axis: 180 },
        oiMeasured: { sphere: +2.00, cylinder: 0, axis: 0 },
        opticianName: 'Óptico Gabriel Solari',
        opticianLicense: 'COL-OPT-9912'
      }),
      isDemo: true
    };

    // 3. Orden Entregada y Adaptada ePOD [DEMO]
    const order3 = OpticalOrderService.createOrder({
      patientId: 'PAT-3124',
      patientName: 'Esteban Morales',
      patientPhone: '+5491144223344',
      doctorName: 'Dr. Alejandro Benítez',
      doctorLicense: 'MP-OFT-7123',
      odFormula: { sphere: -4.00, cylinder: -1.25, axis: 15, dnpMm: 32.0 },
      oiFormula: { sphere: -3.75, cylinder: -1.00, axis: 165, dnpMm: 32.0 },
      frameModel: 'Ray-Ban Aviator RB3025',
      lensMaterial: 'ULTRA_HIGH_174',
      treatments: ['AR_MULTI', 'TRANSITIONS'],
      pricing: { totalAmount: 185000, insuranceCoverage: 60000, depositPaid: 65000 },
      insuranceName: 'Galeno Oro'
    });
    const order3Workshop = OpticalOrderService.sendToWorkshop(order3, { labName: 'Laboratorio Digital Sur', slaDays: 2 });
    const order3Ready = OpticalOrderService.recordLensometerQualityCheck(order3Workshop, {
      odMeasured: { sphere: -4.00, cylinder: -1.25, axis: 15 },
      oiMeasured: { sphere: -3.75, cylinder: -1.00, axis: 165 },
      opticianName: 'Óptico Gabriel Solari',
      opticianLicense: 'COL-OPT-9912'
    });
    const order3Delivered = {
      ...OpticalOrderService.deliverOrder(order3Ready, {
        patientSignature: 'SIG_ESTEBAN_MORALES_EPOD',
        finalAmountPaid: 60000
      }),
      isDemo: true
    };

    state.orders = [order1Workshop, order2Ready, order3Delivered];
    OptiTrackCacheService.saveOrders(state.orders);
  }
}

// Renderizadores de Vistas
function renderDashboard() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const totalOrders = state.orders.length;
  const inWorkshop = state.orders.filter(o => o.status === 'EN_TALLER_CALIBRADO').length;
  const readyForPickUp = state.orders.filter(o => o.status === 'LISTO_PARA_ENTREGA').length;
  const totalBalanceDue = state.orders.reduce((sum, o) => sum + (o.pricing?.balanceDue || 0), 0);

  const html = `
    <div class="space-y-6">
      ${renderDemoNoticeBanner()}

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 class="text-white">Panel General de Óptica y Taller</h2>
          <p class="text-xs text-slate-400 mt-1">Resumen operativo de órdenes activas, calibrado de laboratorio y saldos pendientes.</p>
        </div>
      </div>

      <!-- KPIs Superiores -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Órdenes Activas</p>
          <p class="text-3xl font-extrabold text-blue-400 mt-2 tabular-nums">${totalOrders}</p>
          <p class="text-xs text-slate-400 mt-1">Con Receta Oftálmica Digital</p>
        </div>
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">En Taller de Biselado</p>
          <p class="text-3xl font-extrabold text-sky-400 mt-2 tabular-nums">${inWorkshop}</p>
          <p class="text-xs text-slate-400 mt-1">Sobres con SLA en Ejecución</p>
        </div>
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Listas para Retiro</p>
          <p class="text-3xl font-extrabold text-emerald-400 mt-2 tabular-nums">${readyForPickUp}</p>
          <p class="text-xs text-slate-400 mt-1">Control Fronto OK · Notificar WA</p>
        </div>
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Saldos por Cobrar</p>
          <p class="text-2xl font-extrabold text-amber-300 mt-2 tabular-nums">${Formatters.currencyARS(totalBalanceDue)}</p>
          <p class="text-xs text-slate-400 mt-1">A percibir contra entrega</p>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="min-w-0">
            <h3 class="text-white font-bold flex items-center gap-2">
              ${SVG_ICONS.glasses}
              <span>Nueva Receta</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Cargar prescripción OD/OI con transposición automática.</p>
          </div>
          <button type="button" id="btn-quick-new-order" class="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs whitespace-nowrap transition-colors shrink-0">
            + Cargar Receta
          </button>
        </div>
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="min-w-0">
            <h3 class="text-white font-bold flex items-center gap-2">
              ${SVG_ICONS.transpose}
              <span>Transpositor Óptico</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Conversión entre cilindro positivo (+) y negativo (-) con adición.</p>
          </div>
          <button type="button" data-tab="transposer-tool" class="nav-trigger min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs whitespace-nowrap transition-colors shrink-0">
            Abrir Conversor
          </button>
        </div>
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="min-w-0">
            <h3 class="text-white font-bold flex items-center gap-2">
              ${SVG_ICONS.target}
              <span>Control Fronto QC</span>
            </h3>
            <p class="text-xs text-slate-400 mt-1">Auditar dioptrías según norma ISO 8980-1 con SHA-256.</p>
          </div>
          <button type="button" data-tab="lensometer-qc" class="nav-trigger min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs whitespace-nowrap transition-colors shrink-0">
            Auditar Lente
          </button>
        </div>
      </div>

      <!-- Tabla de Órdenes Recientes -->
      <div class="bg-[#121722] p-5 sm:p-6 rounded-2xl border border-slate-800">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 class="font-bold text-white">Órdenes de Trabajo en Curso</h3>
          <span class="text-xs px-2.5 py-1 bg-[#0e131d] text-blue-300 rounded-lg border border-slate-700 font-mono">Trazabilidad de Taller</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-[#0e131d] text-slate-300 uppercase text-xs tracking-wider border-b border-slate-800">
              <tr>
                <th class="py-3 px-3">ID Orden</th>
                <th class="py-3 px-3">Paciente</th>
                <th class="py-3 px-3">Armazón</th>
                <th class="py-3 px-3">Ojo Derecho (OD)</th>
                <th class="py-3 px-3">Ojo Izquierdo (OI)</th>
                <th class="py-3 px-3">Saldo</th>
                <th class="py-3 px-3">Estado</th>
                <th class="py-3 px-3">Sello SHA-256</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/80">
              ${state.orders.length === 0 ? `
                <tr>
                  <td colspan="8" class="py-8 px-4 text-center">
                    <p class="text-sm text-slate-300 font-medium">No hay órdenes registradas aún</p>
                    <p class="text-xs text-slate-400 mt-1">Cargue una receta oftalmológica para iniciar el sobre de taller.</p>
                    <button type="button" id="btn-dash-empty-new-order" class="mt-4 min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors">
                      ${SVG_ICONS.plus}
                      <span>Cargar Primera Receta</span>
                    </button>
                  </td>
                </tr>
              ` : state.orders.map(o => {
                const odStr = `Esf ${Formatters.diopter(o.odFormula?.sphere)} Cil ${Formatters.diopter(o.odFormula?.cylinder)} x ${Formatters.axis(o.odFormula?.axis)}`;
                const oiStr = `Esf ${Formatters.diopter(o.oiFormula?.sphere)} Cil ${Formatters.diopter(o.oiFormula?.cylinder)} x ${Formatters.axis(o.oiFormula?.axis)}`;
                return `
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-3 font-mono tabular-nums text-blue-300 font-bold whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span>${Sanitizer.escapeHTML(o.orderId)}</span>
                        ${renderDemoBadge(o)}
                      </div>
                    </td>
                    <td class="py-3 px-3 font-semibold text-white">${Sanitizer.escapeHTML(o.patientName)}</td>
                    <td class="py-3 px-3 text-slate-300">${Sanitizer.escapeHTML(o.frameModel)}</td>
                    <td class="py-3 px-3 font-mono tabular-nums text-xs text-cyan-300 whitespace-nowrap">${Sanitizer.escapeHTML(odStr)}</td>
                    <td class="py-3 px-3 font-mono tabular-nums text-xs text-cyan-300 whitespace-nowrap">${Sanitizer.escapeHTML(oiStr)}</td>
                    <td class="py-3 px-3 font-mono tabular-nums font-bold ${o.pricing?.balanceDue > 0 ? 'text-amber-300' : 'text-emerald-300'} whitespace-nowrap">
                      ${Formatters.currencyARS(o.pricing?.balanceDue)}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">${renderStatusBadge(o.status)}</td>
                    <td class="py-3 px-3 font-mono tabular-nums text-xs text-slate-300 whitespace-nowrap" title="${Sanitizer.escapeHTML(o.cryptoSeal || 'Pendiente de control frontofocómetro')}">
                      <span class="inline-flex items-center gap-1.5">
                        ${SVG_ICONS.lock}
                        <span>${o.cryptoSeal ? Sanitizer.escapeHTML(o.cryptoSeal.slice(0, 10)) + '...' : 'Pendiente'}</span>
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachDashboardEvents();
  attachDemoPurgeListener();
}

function attachDashboardEvents() {
  document.getElementById('btn-quick-new-order')?.addEventListener('click', () => {
    switchTab('prescriptions');
    openNewOrderModal();
  });

  document.getElementById('btn-dash-empty-new-order')?.addEventListener('click', () => {
    switchTab('prescriptions');
    openNewOrderModal();
  });

  document.querySelectorAll('.nav-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });
}

function renderPrescriptions() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const emptyStateHtml = `
    <div class="bg-[#121722] p-8 rounded-2xl border border-slate-800 text-center space-y-3">
      <div class="w-12 h-12 mx-auto rounded-xl bg-[#0e131d] border border-slate-700 flex items-center justify-center text-sky-400">
        ${SVG_ICONS.glasses}
      </div>
      <h3 class="text-white font-bold">No hay recetas ni sobres de taller cargados</h3>
      <p class="text-xs text-slate-400 max-w-md mx-auto">Registre una nueva prescripción médica OD/OI para calcular automáticamente la transposición de taller y enviar el sobre a biselado.</p>
      <div class="pt-2">
        <button type="button" id="btn-prescriptions-empty-new" class="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors">
          ${SVG_ICONS.plus}
          <span>Cargar Nueva Receta</span>
        </button>
      </div>
    </div>
  `;

  const cardsHtml = state.orders.map(o => {
    const mat = MaterialsCatalog.getMaterial(o.lensMaterial);
    const treatmentNames = (o.treatments || [])
      .map(id => MaterialsCatalog.getTreatment(id)?.name || id)
      .join(', ');

    return `
      <article class="bg-[#121722] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono tabular-nums">${Sanitizer.escapeHTML(o.orderId)}</span>
              ${renderDemoBadge(o)}
            </div>
            <h3 class="font-bold text-white mt-1.5">${Sanitizer.escapeHTML(o.patientName)}</h3>
            <p class="text-xs text-slate-400">Dr/a: ${Sanitizer.escapeHTML(o.doctorName)} (${Sanitizer.escapeHTML(o.doctorLicense || '-')})</p>
          </div>
          ${renderStatusBadge(o.status)}
        </div>

        <!-- Ficha Técnica OD / OI (Aplanada sin tarjeta anidada) -->
        <div class="pt-3 border-t border-slate-800 space-y-2 text-xs">
          <div class="grid grid-cols-5 gap-2 text-slate-400 font-bold pb-1 border-b border-slate-800/80">
            <span>OJO</span>
            <span class="text-right">ESFERA</span>
            <span class="text-right">CILINDRO</span>
            <span class="text-right">EJE</span>
            <span class="text-right">DNP</span>
          </div>
          <div class="grid grid-cols-5 gap-2 font-mono tabular-nums">
            <span class="text-cyan-300 font-bold">OD:</span>
            <span class="text-white text-right">${Formatters.diopter(o.odFormula?.sphere)}</span>
            <span class="text-white text-right">${Formatters.diopter(o.odFormula?.cylinder)}</span>
            <span class="text-white text-right">${Formatters.axis(o.odFormula?.axis)}</span>
            <span class="text-slate-300 text-right">${Formatters.distanceMm(o.odFormula?.dnpMm)}</span>
          </div>
          <div class="grid grid-cols-5 gap-2 font-mono tabular-nums">
            <span class="text-cyan-300 font-bold">OI:</span>
            <span class="text-white text-right">${Formatters.diopter(o.oiFormula?.sphere)}</span>
            <span class="text-white text-right">${Formatters.diopter(o.oiFormula?.cylinder)}</span>
            <span class="text-white text-right">${Formatters.axis(o.oiFormula?.axis)}</span>
            <span class="text-slate-300 text-right">${Formatters.distanceMm(o.oiFormula?.dnpMm)}</span>
          </div>
          ${o.addition > 0 ? `
            <div class="pt-2 border-t border-slate-800/80 flex flex-wrap justify-between gap-2 text-xs text-amber-300 font-mono tabular-nums">
              <span>Adición Presbicia: +${o.addition.toFixed(2)} D</span>
              <span>Cerca: OD ${Formatters.diopter(o.nearFormula?.od?.sphere)} | OI ${Formatters.diopter(o.nearFormula?.oi?.sphere)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Transposición de Taller -->
        <div class="pt-3 border-t border-slate-800 text-xs font-mono tabular-nums text-purple-300 flex flex-wrap justify-between gap-2">
          <span class="text-slate-300 font-sans font-medium">Transposición Taller (OD):</span>
          <span>${Formatters.diopter(o.odTransposed?.sphere)} ${Formatters.diopter(o.odTransposed?.cylinder)} x ${Formatters.axis(o.odTransposed?.axis)}</span>
        </div>

        <!-- Armazón y Material -->
        <div class="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div class="flex justify-between gap-3">
            <span>Armazón:</span>
            <strong class="text-white text-right">${Sanitizer.escapeHTML(o.frameModel)}</strong>
          </div>
          <div class="flex justify-between gap-3">
            <span>Cristal:</span>
            <span class="text-slate-200 text-right">${Sanitizer.escapeHTML(mat.name)}</span>
          </div>
          ${treatmentNames ? `
            <div class="flex justify-between gap-3">
              <span>Tratamientos:</span>
              <span class="text-slate-200 text-right">${Sanitizer.escapeHTML(treatmentNames)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between gap-3">
            <span>Obra Social:</span>
            <span class="text-slate-200 text-right">${Sanitizer.escapeHTML(o.insuranceName || 'Particular')}</span>
          </div>
        </div>

        <!-- Desglose Financiero -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs text-center">
          <div>
            <span class="text-slate-400 uppercase block font-medium">Total</span>
            <strong class="text-white font-mono tabular-nums">${Formatters.currencyARS(o.pricing?.totalAmount)}</strong>
          </div>
          <div>
            <span class="text-slate-400 uppercase block font-medium">Seña / O.S.</span>
            <strong class="text-emerald-300 font-mono tabular-nums">${Formatters.currencyARS((o.pricing?.insuranceCoverage || 0) + (o.pricing?.depositPaid || 0))}</strong>
          </div>
          <div>
            <span class="text-slate-400 uppercase block font-medium">Saldo a Cobrar</span>
            <strong class="font-mono tabular-nums ${o.pricing?.balanceDue > 0 ? 'text-amber-300' : 'text-slate-300'}">${Formatters.currencyARS(o.pricing?.balanceDue)}</strong>
          </div>
        </div>

        <!-- Acciones Rápidas -->
        <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
          ${o.status === 'EN_TALLER_CALIBRADO' ? `
            <button type="button" data-order-id="${Sanitizer.escapeHTML(o.orderId)}" class="btn-check-fronto flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors">
              ${SVG_ICONS.target}
              <span>Control Fronto QC</span>
            </button>
          ` : o.status === 'LISTO_PARA_ENTREGA' ? `
            <button type="button" data-order-id="${Sanitizer.escapeHTML(o.orderId)}" class="btn-deliver-order flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors">
              ${SVG_ICONS.check}
              <span>Entregar y Cobrar Saldo</span>
            </button>
            <button type="button" data-order-id="${Sanitizer.escapeHTML(o.orderId)}" class="btn-wa-notify min-h-[44px] min-w-[44px] px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors" aria-label="Notificar por WhatsApp a ${Sanitizer.escapeHTML(o.patientName)}">
              ${SVG_ICONS.message}
              <span>WhatsApp</span>
            </button>
          ` : `
            <span class="text-xs text-slate-300 flex-1 text-center py-2 inline-flex items-center justify-center gap-1.5">
              ${SVG_ICONS.check}
              <span>Orden Entregada y Adaptada</span>
            </span>
          `}
        </div>
      </article>
    `;
  }).join('');

  const html = `
    <div class="space-y-6">
      ${renderDemoNoticeBanner()}

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-white flex items-center gap-2">
            ${SVG_ICONS.glasses}
            <span>Recetas Médicas y Sobres de Taller</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">Prescripciones oftalmológicas OD/OI con transposición automática de cilindros y control de SLA.</p>
        </div>
        <button type="button" id="btn-open-new-order-modal" class="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors whitespace-nowrap">
          ${SVG_ICONS.plus}
          <span>Cargar Nueva Receta</span>
        </button>
      </div>

      ${state.orders.length === 0 ? emptyStateHtml : `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${cardsHtml}</div>`}
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachPrescriptionsEvents();
  attachDemoPurgeListener();
}

function attachPrescriptionsEvents() {
  document.getElementById('btn-open-new-order-modal')?.addEventListener('click', () => {
    openNewOrderModal();
  });

  document.getElementById('btn-prescriptions-empty-new')?.addEventListener('click', () => {
    openNewOrderModal();
  });

  document.getElementById('btn-qc-empty-new')?.addEventListener('click', () => {
    switchTab('prescriptions');
    openNewOrderModal();
  });

  document.querySelectorAll('.btn-check-fronto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.currentTarget.getAttribute('data-order-id');
      const order = state.orders.find(o => o.orderId === orderId);
      if (order) openLensometerModal(order);
    });
  });

  document.querySelectorAll('.btn-deliver-order').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.currentTarget.getAttribute('data-order-id');
      const order = state.orders.find(o => o.orderId === orderId);
      if (order) openDeliveryModal(order);
    });
  });

  document.querySelectorAll('.btn-wa-notify').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const orderId = e.currentTarget.getAttribute('data-order-id');
      const order = state.orders.find(o => o.orderId === orderId);
      if (order) {
        const rawUrl = WhatsAppOpticNotifierService.notifyGlassesReady({
          phone: order.patientPhone || '',
          patientName: order.patientName,
          orderId: order.orderId,
          frameModel: order.frameModel,
          balanceDue: order.pricing?.balanceDue || 0
        });
        const safeUrl = Sanitizer.sanitizeURL(rawUrl);
        if (safeUrl && safeUrl !== '#') {
          window.open(safeUrl, '_blank', 'noopener,noreferrer');
        }
      }
    });
  });
}

function renderTransposerTool() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const html = `
    <div class="space-y-6">
      <div>
        <h2 class="text-white flex items-center gap-2">
          ${SVG_ICONS.transpose}
          <span>Validador y Transpositor Óptico Profesional</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Conversor bidireccional entre cilindro positivo (+) y negativo (-) con suma de adición para presbicia.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Calculadora de Entrada -->
        <div class="bg-[#121722] p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 class="text-white uppercase tracking-wider">Fórmula Prescrita Original</h3>

          <div id="transposer-error" role="alert" class="hidden rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200"></div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label for="trans-sphere" class="block text-slate-300 mb-1.5 font-medium">Esfera (D)</label>
              <input type="number" id="trans-sphere" step="0.25" value="2.00" class="w-full min-h-[44px] bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-center">
            </div>
            <div>
              <label for="trans-cylinder" class="block text-slate-300 mb-1.5 font-medium">Cilindro (D)</label>
              <input type="number" id="trans-cylinder" step="0.25" value="-1.50" class="w-full min-h-[44px] bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-center">
            </div>
            <div>
              <label for="trans-axis" class="block text-slate-300 mb-1.5 font-medium">Eje (°)</label>
              <input type="number" id="trans-axis" min="0" max="180" value="80" class="w-full min-h-[44px] bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-center">
            </div>
          </div>

          <div>
            <label for="trans-addition" class="block text-slate-300 mb-1.5 text-xs font-medium">Adición Presbicia (Lejos a Cerca)</label>
            <input type="number" id="trans-addition" step="0.25" min="0" max="4" value="1.75" class="w-full min-h-[44px] bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tabular-nums text-center">
          </div>

          <button type="button" id="btn-calc-transpose" class="w-full min-h-[44px] py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors">
            ${SVG_ICONS.transpose}
            <span>Calcular Transposición y Visión Cercana</span>
          </button>
        </div>

        <!-- Panel de Resultado (Aplanado sin tarjetas anidadas) -->
        <div class="bg-[#121722] p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <span class="text-xs uppercase font-bold text-sky-300">Fórmula Transpuesta para Laboratorio</span>
            <div id="transposed-result-box" class="mt-2 pt-3 border-t border-slate-800 font-mono tabular-nums text-center space-y-1.5">
              <p class="text-2xl font-black text-white">+0.50 +1.50 x 170°</p>
              <p class="text-xs text-purple-300">Esfera: +0.50 D · Cilindro: +1.50 D · Eje: 170°</p>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800">
            <span class="text-xs uppercase font-bold text-amber-300">Prescripción Visión Cercana (Lectura / Trabajo)</span>
            <div id="near-result-box" class="mt-2 pt-3 border-t border-slate-800/70 font-mono tabular-nums text-center space-y-1">
              <p class="text-xl font-bold text-white">+3.75 -1.50 x 80°</p>
              <p class="text-xs text-amber-200">Esfera Cerca = Lejos (+2.00) + Adición (+1.75) = +3.75 D</p>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-800 text-xs text-slate-400">
            Regla: Esf' = Esf + Cil | Cil' = -Cil | Eje' = (Eje + 90) % 180. Ambas fórmulas describen exactamente el mismo cristal físico.
          </div>
        </div>
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachTransposerEvents();
}

function attachTransposerEvents() {
  const compute = () => {
    const errEl = document.getElementById('transposer-error');
    try {
      if (errEl) {
        errEl.classList.add('hidden');
        errEl.textContent = '';
      }
      const s = parseNumericInput('trans-sphere', { defaultValue: 0, label: 'Esfera' });
      const c = parseNumericInput('trans-cylinder', { defaultValue: 0, label: 'Cilindro' });
      const a = parseNumericInput('trans-axis', { integer: true, defaultValue: 0, label: 'Eje' });
      const add = parseNumericInput('trans-addition', { defaultValue: 0, label: 'Adición' });

      const validation = OpticalTransposer.validatePhysiologicalRanges({ sphere: s, cylinder: c, axis: a });
      if (!validation.isValid && errEl) {
        errEl.textContent = `Advertencia de rango fisiológico: ${validation.errors.join(' ')}`;
        errEl.classList.remove('hidden');
      }

      const transposed = OpticalTransposer.transpose({ sphere: s, cylinder: c, axis: a });
      const near = OpticalTransposer.computeNearFormula({ sphere: s, cylinder: c, axis: a }, add);

      const transBox = document.getElementById('transposed-result-box');
      const nearBox = document.getElementById('near-result-box');

      if (transBox) {
        const transHtml = `
          <p class="text-2xl font-black text-white">${Formatters.diopter(transposed.sphere)} ${Formatters.diopter(transposed.cylinder)} x ${Formatters.axis(transposed.axis)}</p>
          <p class="text-xs text-purple-300">Esfera: ${Formatters.diopter(transposed.sphere)} D · Cilindro: ${Formatters.diopter(transposed.cylinder)} D · Eje: ${Formatters.axis(transposed.axis)}</p>
        `;
        Sanitizer.safeSetInnerHTML(transBox, transHtml);
      }

      if (nearBox) {
        const nearHtml = `
          <p class="text-xl font-bold text-white">${Formatters.diopter(near.sphere)} ${Formatters.diopter(near.cylinder)} x ${Formatters.axis(near.axis)}</p>
          <p class="text-xs text-amber-200">Esfera Cerca = Lejos (${Formatters.diopter(s)}) + Adición (+${add.toFixed(2)}) = ${Formatters.diopter(near.sphere)} D</p>
        `;
        Sanitizer.safeSetInnerHTML(nearBox, nearHtml);
      }
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
      }
    }
  };

  document.getElementById('btn-calc-transpose')?.addEventListener('click', compute);
  document.querySelectorAll('#view-container input').forEach(inp => {
    inp.addEventListener('input', compute);
  });
}

function renderLensometerQC() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const emptyOrdersHtml = `
    <div class="bg-[#121722] p-6 rounded-2xl border border-slate-800 text-center space-y-3">
      <p class="text-sm text-white font-semibold">Sin órdenes pendientes de verificación</p>
      <p class="text-xs text-slate-400">Cargue una receta y envíela al taller para auditar las dioptrías medidas en frontofocómetro.</p>
      <button type="button" id="btn-qc-empty-new" class="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors">
        ${SVG_ICONS.plus}
        <span>Cargar Nueva Receta</span>
      </button>
    </div>
  `;

  const orderCardsHtml = state.orders.map(o => `
    <article class="bg-[#121722] p-5 rounded-2xl border border-slate-800 space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono tabular-nums">${Sanitizer.escapeHTML(o.orderId)}</span>
            ${renderDemoBadge(o)}
          </div>
          <h4 class="font-bold text-white mt-1.5">${Sanitizer.escapeHTML(o.patientName)}</h4>
          <p class="text-xs text-slate-400">${Sanitizer.escapeHTML(o.frameModel)} · ${Sanitizer.escapeHTML(o.workshopOrder?.labName || 'Taller Interno')}</p>
        </div>
        ${renderStatusBadge(o.status)}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs font-mono tabular-nums">
        <div>
          <span class="text-slate-400 block font-sans">Prescripción OD:</span>
          <span class="text-white">${Formatters.diopter(o.odFormula?.sphere)} ${Formatters.diopter(o.odFormula?.cylinder)} x ${Formatters.axis(o.odFormula?.axis)}</span>
        </div>
        <div>
          <span class="text-slate-400 block font-sans">Prescripción OI:</span>
          <span class="text-white">${Formatters.diopter(o.oiFormula?.sphere)} ${Formatters.diopter(o.oiFormula?.cylinder)} x ${Formatters.axis(o.oiFormula?.axis)}</span>
        </div>
      </div>

      ${o.qualityCheck && o.qualityCheck.isApproved ? `
        <div class="pt-3 border-t border-slate-800 text-xs space-y-1">
          <div class="flex flex-wrap justify-between gap-2 text-emerald-300 font-bold">
            <span class="inline-flex items-center gap-1.5">${SVG_ICONS.check} Control Fronto Aprobado</span>
            <span class="font-mono tabular-nums text-slate-300">${Formatters.date(o.qualityCheck.checkedAt)}</span>
          </div>
          <p class="text-slate-300">Óptico Responsable: ${Sanitizer.escapeHTML(o.qualityCheck.opticianName)} (${Sanitizer.escapeHTML(o.qualityCheck.opticianLicense)})</p>
          <p class="font-mono tabular-nums text-xs text-slate-400 truncate">Sello SHA-256: ${Sanitizer.escapeHTML(o.cryptoSeal || '-')}</p>
        </div>
      ` : `
        ${o.qualityCheck && !o.qualityCheck.isApproved ? `
          <div class="pt-3 border-t border-slate-800 text-xs text-rose-300 space-y-1">
            <p class="font-bold">Rechazado en última auditoría ISO 8980-1 (Rehacer en taller):</p>
            <p class="text-rose-200">${Sanitizer.escapeHTML((o.qualityCheck.deviations || []).join(' | '))}</p>
          </div>
        ` : ''}
        <div class="pt-2">
          <button type="button" data-order-id="${Sanitizer.escapeHTML(o.orderId)}" class="btn-check-fronto w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs inline-flex items-center justify-center gap-2 transition-colors">
            ${SVG_ICONS.target}
            <span>Registrar Medición en Frontofocómetro</span>
          </button>
        </div>
      `}
    </article>
  `).join('');

  const html = `
    <div class="space-y-6">
      <div>
        <h2 class="text-white flex items-center gap-2">
          ${SVG_ICONS.target}
          <span>Control de Calidad en Frontofocómetro (Lensómetro)</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Auditoría obligatoria de dioptrías, cilindros y ejes según la norma internacional <strong>ISO 8980-1</strong> antes de entregar el anteojo.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Panel Informativo de Tolerancias (Aplanado) -->
        <div class="bg-[#121722] p-5 rounded-2xl border border-slate-800 space-y-3 text-xs self-start">
          <h3 class="font-bold text-white uppercase tracking-wider">Tolerancias Oficiales ISO 8980-1</h3>
          <div class="pt-3 border-t border-slate-800 space-y-3">
            <div>
              <strong class="text-emerald-300">Potencia Esférica:</strong>
              <p class="text-slate-300 mt-0.5">Hasta ±6.00 D: tolerancia de ±0.12 D.<br>Superior a ±6.00 D: tolerancia de ±0.18 D.</p>
            </div>
            <div class="pt-2 border-t border-slate-800/80">
              <strong class="text-emerald-300">Potencia Cilíndrica:</strong>
              <p class="text-slate-300 mt-0.5">Tolerancia máxima de ±0.12 D en astigmatismo.</p>
            </div>
            <div class="pt-2 border-t border-slate-800/80">
              <strong class="text-emerald-300">Eje Astigmático:</strong>
              <p class="text-slate-300 mt-0.5">Cilindros ≥ 1.50 D: tolerancia estricta de ±2°.<br>Cilindros 0.75 a 1.50 D: tolerancia de ±4°.<br>Cilindros &lt; 0.75 D: tolerancia de ±7°.</p>
            </div>
          </div>
        </div>

        <!-- Órdenes Pendientes de Control Fronto -->
        <div class="md:col-span-2 space-y-4">
          <h3 class="font-bold text-white">Anteojos para Verificación en Banco de Taller</h3>
          ${state.orders.length === 0 ? emptyOrdersHtml : orderCardsHtml}
        </div>
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachPrescriptionsEvents();
}

function renderCatalog() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const html = `
    <div class="space-y-6">
      <div>
        <h2 class="text-white flex items-center gap-2">
          ${SVG_ICONS.layers}
          <span>Catálogo de Cristales y Tratamientos Ópticos</span>
        </h2>
        <p class="text-xs text-slate-400 mt-1">Índices de refracción, números de Abbe, densidades y tratamientos protectores.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${Object.values(LENS_MATERIALS).map(m => `
          <article class="bg-[#121722] p-5 rounded-2xl border border-slate-800 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-bold text-white">${Sanitizer.escapeHTML(m.name)}</h3>
                <p class="text-xs text-blue-300 font-mono tabular-nums mt-0.5">Índice n = ${m.refractiveIndex.toFixed(2)}</p>
              </div>
              <span class="px-2.5 py-1 rounded text-xs font-bold bg-[#0e131d] text-slate-200 border border-slate-700 font-mono tabular-nums shrink-0">
                Abbe: ${m.abbeNumber}
              </span>
            </div>
            <div class="pt-3 border-t border-slate-800 text-xs space-y-1.5">
              <p class="text-slate-200"><strong>Recomendado:</strong> ${Sanitizer.escapeHTML(m.recommendedFor)}</p>
              <p class="text-slate-300"><strong>Resistencia a Impactos:</strong> ${Sanitizer.escapeHTML(m.impactResistance)}</p>
            </div>
          </article>
        `).join('')}
      </div>

      <!-- Tratamientos -->
      <div class="pt-4 border-t border-slate-800">
        <h3 class="font-bold text-white uppercase tracking-wider mb-4">Tratamientos y Recubrimientos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${Object.values(LENS_TREATMENTS).map(t => `
            <article class="p-4 bg-[#121722] rounded-xl border border-slate-800 text-xs">
              <h4 class="font-bold text-sky-300">${Sanitizer.escapeHTML(t.name)}</h4>
              <p class="text-slate-300 mt-1">${Sanitizer.escapeHTML(t.description)}</p>
            </article>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
}

function renderSettlement() {
  const container = document.getElementById('view-container');
  if (!container) return;

  const hasOrders = state.orders.length > 0;

  const html = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-white flex items-center gap-2">
            ${SVG_ICONS.receipt}
            <span>Liquidación Mixta B2B y Obras Sociales</span>
          </h2>
          <p class="text-xs text-slate-400 mt-1">Conciliación de coberturas médicas, señas recibidas y saldos pendientes al retiro.</p>
        </div>
        <button type="button" id="btn-export-settlement-csv" ${!hasOrders ? 'disabled aria-disabled="true"' : ''} class="min-h-[44px] px-4 py-2.5 rounded-xl ${hasOrders ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-900 text-slate-400 border-slate-800 cursor-not-allowed opacity-70'} font-semibold text-xs border inline-flex items-center gap-2 transition-colors whitespace-nowrap">
          ${SVG_ICONS.download}
          <span>Exportar CSV (Excel)</span>
        </button>
      </div>

      <div class="bg-[#121722] p-5 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-[#0e131d] text-slate-300 uppercase text-xs tracking-wider border-b border-slate-800">
            <tr>
              <th class="py-3 px-3">ID Orden</th>
              <th class="py-3 px-3">Paciente</th>
              <th class="py-3 px-3">Obra Social</th>
              <th class="py-3 px-3">Total</th>
              <th class="py-3 px-3">Cobertura OS</th>
              <th class="py-3 px-3">Seña Percibida</th>
              <th class="py-3 px-3">Saldo a Cobrar</th>
              <th class="py-3 px-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80">
            ${!hasOrders ? `
              <tr>
                <td colspan="8" class="py-8 px-4 text-center">
                  <p class="text-sm text-slate-300 font-medium">Sin movimientos para liquidación</p>
                  <p class="text-xs text-slate-400 mt-1">Cargue al menos una receta para generar la conciliación de Obra Social y señas.</p>
                </td>
              </tr>
            ` : state.orders.map(o => `
              <tr class="hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-3 font-mono tabular-nums text-blue-300 font-bold whitespace-nowrap">
                  <div class="flex items-center gap-1.5">
                    <span>${Sanitizer.escapeHTML(o.orderId)}</span>
                    ${renderDemoBadge(o)}
                  </div>
                </td>
                <td class="py-3 px-3 font-semibold text-white">${Sanitizer.escapeHTML(o.patientName)}</td>
                <td class="py-3 px-3">${Sanitizer.escapeHTML(o.insuranceName || 'Particular')}</td>
                <td class="py-3 px-3 font-mono tabular-nums font-bold text-white whitespace-nowrap">${Formatters.currencyARS(o.pricing?.totalAmount)}</td>
                <td class="py-3 px-3 font-mono tabular-nums text-emerald-300 whitespace-nowrap">${Formatters.currencyARS(o.pricing?.insuranceCoverage)}</td>
                <td class="py-3 px-3 font-mono tabular-nums text-blue-300 whitespace-nowrap">${Formatters.currencyARS(o.pricing?.depositPaid)}</td>
                <td class="py-3 px-3 font-mono tabular-nums font-bold ${o.pricing?.balanceDue > 0 ? 'text-amber-300' : 'text-slate-300'} whitespace-nowrap">
                  ${Formatters.currencyARS(o.pricing?.balanceDue)}
                </td>
                <td class="py-3 px-3 whitespace-nowrap">${renderStatusBadge(o.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachSettlementEvents();
}

function attachSettlementEvents() {
  document.getElementById('btn-export-settlement-csv')?.addEventListener('click', () => {
    if (state.orders.length === 0) return;
    try {
      const rows = state.orders.map(o => ({
        id: o.orderId,
        patient: o.patientName,
        insurance: o.insuranceName || 'Particular',
        total: o.pricing?.totalAmount ?? 0,
        coverage: o.pricing?.insuranceCoverage ?? 0,
        deposit: o.pricing?.depositPaid ?? 0,
        balance: o.pricing?.balanceDue ?? 0,
        status: o.status
      }));

      ExportService.exportToExcelCSV('liquidacion_optica_optitrack', rows, [
        { key: 'id', label: 'ID Orden' },
        { key: 'patient', label: 'Paciente' },
        { key: 'insurance', label: 'Obra Social' },
        { key: 'total', label: 'Total Facturado' },
        { key: 'coverage', label: 'Cobertura OS' },
        { key: 'deposit', label: 'Seña Pagada' },
        { key: 'balance', label: 'Saldo Pendiente' },
        { key: 'status', label: 'Estado' }
      ]);
      showStatusMessage('Archivo CSV de liquidación exportado correctamente.');
    } catch (err) {
      showGlobalError(`Error al exportar CSV: ${err.message}`);
    }
  });
}

// Gestión de Modales (Accesibilidad + Handlers Únicos)
function openModalElement(modalId, focusSelector) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  state.lastFocusedElement = document.activeElement;
  modal.classList.remove('hidden');
  if (focusSelector) {
    const target = modal.querySelector(focusSelector);
    if (target) target.focus();
  }
}

function closeModalElement(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.add('hidden');
  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === 'function') {
    state.lastFocusedElement.focus();
  }
  state.lastFocusedElement = null;
}

function closeAllModals() {
  closeModalElement('new-order-modal');
  closeModalElement('lensometer-modal');
  closeModalElement('delivery-modal');
}

function openNewOrderModal() {
  showModalError('new-order-error', null);
  document.getElementById('form-new-order')?.reset();
  openModalElement('new-order-modal', '#new-patient-name');
}

function openLensometerModal(order) {
  state.activeOrderIdForQc = order.orderId;
  showModalError('lensometer-error', null);
  document.getElementById('form-lensometer-check')?.reset();

  const titleEl = document.getElementById('lensometer-modal-title');
  if (titleEl) titleEl.textContent = `Control Fronto QC: ${order.orderId} - ${order.patientName}`;

  openModalElement('lensometer-modal', '#qc-od-sph');
}

function openDeliveryModal(order) {
  state.activeOrderIdForDelivery = order.orderId;
  showModalError('delivery-error', null);
  document.getElementById('form-delivery-epod')?.reset();

  const titleEl = document.getElementById('delivery-modal-title');
  if (titleEl) titleEl.textContent = `Entrega y Adaptación: ${order.orderId} - ${order.patientName}`;

  const balanceEl = document.getElementById('delivery-balance-amount');
  if (balanceEl) balanceEl.textContent = Formatters.currencyARS(order.pricing?.balanceDue ?? 0);

  const paidInput = document.getElementById('delivery-final-paid');
  if (paidInput) paidInput.placeholder = String(order.pricing?.balanceDue ?? 0);

  openModalElement('delivery-modal', '#delivery-patient-signature');
}

function setupModalListeners() {
  if (state.modalsInitialized) return;
  state.modalsInitialized = true;

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // Cerrar con clic en backdrop y botones de cierre
  ['new-order-modal', 'lensometer-modal', 'delivery-modal'].forEach(modalId => {
    const modal = document.getElementById(modalId);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModalElement(modalId);
      }
    });
  });

  document.getElementById('btn-close-new-order-modal')?.addEventListener('click', () => {
    closeModalElement('new-order-modal');
  });

  document.getElementById('btn-close-lensometer-modal')?.addEventListener('click', () => {
    closeModalElement('lensometer-modal');
  });

  document.getElementById('btn-close-delivery-modal')?.addEventListener('click', () => {
    closeModalElement('delivery-modal');
  });

  // Submit Nueva Receta
  document.getElementById('form-new-order')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showModalError('new-order-error', null);

    try {
      const patientName = document.getElementById('new-patient-name')?.value.trim() || '';
      const patientPhone = document.getElementById('new-patient-phone')?.value.trim() || '';
      const doctorName = document.getElementById('new-doctor-name')?.value.trim() || '';
      const doctorLicense = document.getElementById('new-doctor-license')?.value.trim() || '';
      const frameModel = document.getElementById('new-frame-model')?.value.trim() || '';
      const lensMaterial = document.getElementById('new-lens-material')?.value || 'ORGANIC_CR39';
      const insuranceName = document.getElementById('new-insurance-name')?.value.trim() || 'Particular';
      const labName = document.getElementById('new-lab-name')?.value.trim() || 'Taller Central de Biselado';

      if (!patientName || !patientPhone || !doctorName || !doctorLicense || !frameModel) {
        throw new Error('Complete nombre y WhatsApp del paciente, médico, matrícula médica y armazón.');
      }

      const odSph = parseNumericInput('new-od-sph', { required: true, label: 'Esfera OD' });
      const odCyl = parseNumericInput('new-od-cyl', { defaultValue: 0, label: 'Cilindro OD' });
      const odAxis = parseNumericInput('new-od-axis', { integer: true, defaultValue: 0, label: 'Eje OD' });
      const odDnp = parseNumericInput('new-od-dnp', { required: true, label: 'DNP OD' });

      const oiSph = parseNumericInput('new-oi-sph', { required: true, label: 'Esfera OI' });
      const oiCyl = parseNumericInput('new-oi-cyl', { defaultValue: 0, label: 'Cilindro OI' });
      const oiAxis = parseNumericInput('new-oi-axis', { integer: true, defaultValue: 0, label: 'Eje OI' });
      const oiDnp = parseNumericInput('new-oi-dnp', { required: true, label: 'DNP OI' });

      const addition = parseNumericInput('new-addition', { defaultValue: 0, label: 'Adición' });
      const slaDays = parseNumericInput('new-sla-days', { integer: true, defaultValue: 3, label: 'Plazo SLA' });
      const totalAmount = parseNumericInput('new-total-amount', { required: true, label: 'Total Facturado' });
      const insuranceCoverage = parseNumericInput('new-insurance-coverage', { defaultValue: 0, label: 'Cobertura O.S.' });
      const depositPaid = parseNumericInput('new-deposit-paid', { defaultValue: 0, label: 'Seña Dejada' });

      const treatments = Array.from(document.querySelectorAll('input[name="new-treatments"]:checked'))
        .map(el => el.value);

      const order = OpticalOrderService.createOrder({
        patientId: generatePatientId(),
        patientName,
        patientPhone,
        doctorName,
        doctorLicense,
        odFormula: { sphere: odSph, cylinder: odCyl, axis: odAxis, dnpMm: odDnp },
        oiFormula: { sphere: oiSph, cylinder: oiCyl, axis: oiAxis, dnpMm: oiDnp },
        addition,
        frameModel,
        lensMaterial,
        treatments,
        pricing: { totalAmount, insuranceCoverage, depositPaid },
        insuranceName
      });

      const workshop = OpticalOrderService.sendToWorkshop(order, { labName, slaDays });
      state.orders.unshift(workshop);
      OptiTrackCacheService.saveOrders(state.orders);

      closeModalElement('new-order-modal');
      showStatusMessage(`Orden ${workshop.orderId} creada y enviada a taller (${labName}).`);
      renderPrescriptions();
    } catch (err) {
      showModalError('new-order-error', err.message);
    }
  });

  // Submit Control Fronto QC
  document.getElementById('form-lensometer-check')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showModalError('lensometer-error', null);

    try {
      const orderIdx = state.orders.findIndex(o => o.orderId === state.activeOrderIdForQc);
      if (orderIdx === -1) {
        throw new Error('No se encontró la orden seleccionada para control de calidad.');
      }
      const order = state.orders[orderIdx];

      const odMeasured = {
        sphere: parseNumericInput('qc-od-sph', { required: true, label: 'Esfera OD' }),
        cylinder: parseNumericInput('qc-od-cyl', { required: true, label: 'Cilindro OD' }),
        axis: parseNumericInput('qc-od-axis', { integer: true, required: true, label: 'Eje OD' })
      };
      const oiMeasured = {
        sphere: parseNumericInput('qc-oi-sph', { required: true, label: 'Esfera OI' }),
        cylinder: parseNumericInput('qc-oi-cyl', { required: true, label: 'Cilindro OI' }),
        axis: parseNumericInput('qc-oi-axis', { integer: true, required: true, label: 'Eje OI' })
      };

      const opticianName = document.getElementById('qc-optician-name')?.value.trim() || '';
      const opticianLicense = document.getElementById('qc-optician-license')?.value.trim() || '';

      const updated = OpticalOrderService.recordLensometerQualityCheck(order, {
        odMeasured,
        oiMeasured,
        opticianName,
        opticianLicense
      });

      state.orders[orderIdx] = updated;
      OptiTrackCacheService.saveOrders(state.orders);

      if (!updated.qualityCheck?.isApproved) {
        const deviations = updated.qualityCheck?.deviations || ['Desvío fuera de tolerancia ISO 8980-1.'];
        showModalError('lensometer-error', [
          'Control rechazado según ISO 8980-1. La orden permanece en taller para recalibrado:',
          ...deviations
        ]);
        switchTab(state.activeTab);
        return;
      }

      closeModalElement('lensometer-modal');
      showStatusMessage(`Control Fronto QC aprobado para ${updated.orderId}. Sello SHA-256: ${updated.cryptoSeal.slice(0, 12)}...`);
      switchTab(state.activeTab);
    } catch (err) {
      showModalError('lensometer-error', err.message);
    }
  });

  // Submit Entrega ePOD
  document.getElementById('form-delivery-epod')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showModalError('delivery-error', null);

    try {
      const orderIdx = state.orders.findIndex(o => o.orderId === state.activeOrderIdForDelivery);
      if (orderIdx === -1) {
        throw new Error('No se encontró la orden seleccionada para entrega.');
      }
      const order = state.orders[orderIdx];
      const patientSignature = document.getElementById('delivery-patient-signature')?.value.trim() || '';
      const finalAmountPaid = parseNumericInput('delivery-final-paid', {
        defaultValue: order.pricing?.balanceDue ?? 0,
        label: 'Importe Abonado al Retiro'
      });

      const updated = OpticalOrderService.deliverOrder(order, {
        patientSignature,
        finalAmountPaid
      });

      state.orders[orderIdx] = updated;
      OptiTrackCacheService.saveOrders(state.orders);

      closeModalElement('delivery-modal');
      showStatusMessage(`Entrega ePOD registrada para ${updated.orderId}.`);
      switchTab(state.activeTab);
    } catch (err) {
      showModalError('delivery-error', err.message);
    }
  });
}

// Router y Tabs
const TAB_BASE_CLASSES = 'min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors';
const TAB_ACTIVE_CLASSES = `${TAB_BASE_CLASSES} bg-blue-600 text-white`;
const TAB_INACTIVE_CLASSES = `${TAB_BASE_CLASSES} bg-[#121722] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800`;

export function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('#tab-nav button[role="tab"]').forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === tabId;
    btn.className = isActive ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES;
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  switch (tabId) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'prescriptions':
      renderPrescriptions();
      break;
    case 'transposer-tool':
      renderTransposerTool();
      break;
    case 'lensometer-qc':
      renderLensometerQC();
      break;
    case 'catalog':
      renderCatalog();
      break;
    case 'settlement':
      renderSettlement();
      break;
    default:
      renderDashboard();
  }
}

async function loadAppVersion() {
  const versionLabel = document.getElementById('app-version-label');
  if (!versionLabel || typeof fetch !== 'function') return;
  try {
    const resp = await fetch('./version.json', { cache: 'no-store' });
    if (!resp.ok) return;
    const data = await resp.json();
    if (data?.version) {
      versionLabel.textContent = `OptiTrack ${data.version}`;
    }
  } catch {
    // Offline o entorno sin HTTP server: mantiene etiqueta base sin error en consola
  }
}

// Inicialización
export function initApp() {
  initializeDemoData();
  setupModalListeners();
  loadAppVersion();

  const tabButtons = Array.from(document.querySelectorAll('#tab-nav button[role="tab"]'));
  tabButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });

    btn.addEventListener('keydown', (e) => {
      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabButtons.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabButtons.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        const target = tabButtons[nextIdx];
        target.focus();
        const tab = target.getAttribute('data-tab');
        if (tab) switchTab(tab);
      }
    });
  });

  document.getElementById('btn-header-new-order')?.addEventListener('click', () => {
    switchTab('prescriptions');
    openNewOrderModal();
  });

  switchTab('dashboard');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}
