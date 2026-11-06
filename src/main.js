/**
 * OptiTrack - Main Controller
 * AiAppFactory Standard
 */
import { OpticalTransposer } from './core/opticalTransposer.js';
import { MaterialsCatalog, LENS_MATERIALS, LENS_TREATMENTS } from './core/materialsCatalog.js';
import { LensometerQualitySentinel } from './core/lensometerQualitySentinel.js';
import { OpticalOrderService } from './services/opticalOrderService.js';
import { ExportService } from './services/exportService.js';
import { OptiTrackCacheService } from './services/optiTrackCache.service.js';
import { WhatsAppOpticNotifierService } from './services/whatsAppOpticNotifier.service.js';
import { Formatters } from './utils/formatters.js';
import { Sanitizer } from './utils/sanitizer.js';

// Estado Central Reactivo
const state = {
  activeTab: 'dashboard',
  orders: []
};

// Inicialización de Semilla Demo (Solo si no fue purgada)
function initializeDemoData() {
  if (OptiTrackCacheService.isPurged()) {
    state.orders = [];
    return;
  }

  const cachedOrders = OptiTrackCacheService.getOrders();
  if (cachedOrders.length > 0) {
    state.orders = cachedOrders;
  } else {
    // 1. Orden en Taller
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
    const order1Workshop = OpticalOrderService.sendToWorkshop(order1, {
      labName: 'Laboratorio de Tallado Óptico Centro',
      slaDays: 3
    });

    // 2. Orden Lista para Retiro con Sello Fronto SHA-256
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
    const order2Ready = OpticalOrderService.recordLensometerQualityCheck(order2Workshop, {
      odMeasured: { sphere: +1.75, cylinder: -0.50, axis: 180 },
      oiMeasured: { sphere: +2.00, cylinder: 0, axis: 0 },
      opticianName: 'Óptico Gabriel Solari',
      opticianLicense: 'COL-OPT-9912'
    });

    // 3. Orden Entregada y Adaptada ePOD
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
    const order3Delivered = OpticalOrderService.deliverOrder(order3Ready, {
      patientSignature: 'SIG_ESTEBAN_MORALES_EPOD',
      finalAmountPaid: 60000
    });

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
  const delivered = state.orders.filter(o => o.status === 'DELIVERED').length;
  const totalBalanceDue = state.orders.reduce((sum, o) => sum + (o.pricing?.balanceDue || 0), 0);

  const html = `
    <div class="space-y-6">
      <!-- KPIs Superiores -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Órdenes Activas</p>
          <p class="text-3xl font-extrabold text-blue-400 mt-2">${totalOrders}</p>
          <p class="text-xs text-slate-500 mt-1">Con Receta Oftálmica Digital</p>
        </div>
        <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">En Taller de Biselado</p>
          <p class="text-3xl font-extrabold text-sky-400 mt-2">${inWorkshop}</p>
          <p class="text-xs text-slate-500 mt-1">Sobres con SLA en Ejecución</p>
        </div>
        <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Listas para Retiro</p>
          <p class="text-3xl font-extrabold text-emerald-400 mt-2">${readyForPickUp}</p>
          <p class="text-xs text-slate-500 mt-1">Control Fronto OK · Notificar WA</p>
        </div>
        <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <p class="text-xs uppercase tracking-wider text-slate-400 font-bold">Saldos por Cobrar</p>
          <p class="text-2xl font-extrabold text-amber-400 mt-2">${Formatters.currencyARS(totalBalanceDue)}</p>
          <p class="text-xs text-slate-500 mt-1">A percibir contra entrega</p>
        </div>
      </div>

      <!-- Accesos Rápidos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-[#121722]/60 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 class="text-white font-bold text-base flex items-center gap-2">👓 Nueva Receta</h3>
            <p class="text-xs text-slate-400 mt-1">Cargar prescripción OD/OI con transposición automática.</p>
          </div>
          <button id="btn-quick-new-order" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 whitespace-nowrap">
            + Cargar Receta
          </button>
        </div>
        <div class="bg-[#121722]/60 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 class="text-white font-bold text-base flex items-center gap-2">🔄 Transpositor Óptico</h3>
            <p class="text-xs text-slate-400 mt-1">Herramienta de conversión cilindro (+) a (-) y adición.</p>
          </div>
          <button data-tab="transposer-tool" class="nav-trigger px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 whitespace-nowrap">
            Abrir Conversor
          </button>
        </div>
        <div class="bg-[#121722]/60 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 class="text-white font-bold text-base flex items-center gap-2">🔬 Control Fronto QC</h3>
            <p class="text-xs text-slate-400 mt-1">Auditar dioptrías según norma ISO 8980-1 con SHA-256.</p>
          </div>
          <button data-tab="lensometer-qc" class="nav-trigger px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 whitespace-nowrap">
            Auditar Lente
          </button>
        </div>
      </div>

      <!-- Tabla de Órdenes Recientes -->
      <div class="bg-[#121722]/90 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-white">Órdenes de Trabajo en Curso</h3>
          <span class="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 font-mono">Trazabilidad de Taller</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="bg-[#0b0f17]/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
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
            <tbody class="divide-y divide-slate-800/60">
              ${state.orders.length === 0 ? `
                <tr><td colspan="8" class="py-4 text-center text-slate-500">No hay órdenes registradas aún</td></tr>
              ` : state.orders.map(o => {
                const badge = Formatters.orderStatusBadge(o.status);
                const odStr = `Esf ${Formatters.diopter(o.odFormula?.sphere)} Cil ${Formatters.diopter(o.odFormula?.cylinder)} x ${Formatters.axis(o.odFormula?.axis)}`;
                const oiStr = `Esf ${Formatters.diopter(o.oiFormula?.sphere)} Cil ${Formatters.diopter(o.oiFormula?.cylinder)} x ${Formatters.axis(o.oiFormula?.axis)}`;
                return `
                  <tr class="hover:bg-slate-800/30 transition">
                    <td class="py-3 px-3 font-mono text-blue-400 font-bold">${Sanitizer.escapeHTML(o.orderId)}</td>
                    <td class="py-3 px-3 font-semibold text-white">${Sanitizer.escapeHTML(o.patientName)}</td>
                    <td class="py-3 px-3 text-slate-300">${Sanitizer.escapeHTML(o.frameModel)}</td>
                    <td class="py-3 px-3 font-mono text-[11px] text-cyan-300">${Sanitizer.escapeHTML(odStr)}</td>
                    <td class="py-3 px-3 font-mono text-[11px] text-cyan-300">${Sanitizer.escapeHTML(oiStr)}</td>
                    <td class="py-3 px-3 font-mono font-bold ${o.pricing?.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}">
                      ${Formatters.currencyARS(o.pricing?.balanceDue)}
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.border} ${badge.text}">
                        ${badge.icon} ${Sanitizer.escapeHTML(badge.label)}
                      </span>
                    </td>
                    <td class="py-3 px-3 font-mono text-[10px] text-slate-400" title="${o.cryptoSeal}">
                      🔒 ${o.cryptoSeal ? o.cryptoSeal.slice(0, 10) + '...' : '-'}
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
}

function attachDashboardEvents() {
  document.getElementById('btn-quick-new-order')?.addEventListener('click', () => {
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

  const html = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">👓 Recetas Médicas & Sobres de Taller</h2>
          <p class="text-xs text-slate-400 mt-1">Prescripciones oftalmológicas OD/OI con transposición automática de cilindros y control de SLA.</p>
        </div>
        <button id="btn-open-new-order-modal" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2">
          <span>+</span> Cargar Nueva Receta
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${state.orders.map(o => {
          const badge = Formatters.orderStatusBadge(o.status);
          const mat = MaterialsCatalog.getMaterial(o.lensMaterial);
          return `
            <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div class="flex items-start justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 font-mono">${Sanitizer.escapeHTML(o.orderId)}</span>
                  <h3 class="text-base font-bold text-white mt-1">${Sanitizer.escapeHTML(o.patientName)}</h3>
                  <p class="text-xs text-slate-400">Dr/a: ${Sanitizer.escapeHTML(o.doctorName)} (${Sanitizer.escapeHTML(o.doctorLicense || '-')})</p>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg} ${badge.border} ${badge.text}">
                  ${badge.icon} ${Sanitizer.escapeHTML(badge.label)}
                </span>
              </div>

              <!-- Ficha Técnica OD / OI -->
              <div class="p-3 bg-[#0b0f17] rounded-xl border border-slate-800/80 space-y-2 text-xs">
                <div class="flex justify-between items-center text-slate-400 font-bold border-b border-slate-800 pb-1 text-[11px]">
                  <span>OJO / DIOPTRÍAS</span>
                  <span>ESFERA</span>
                  <span>CILINDRO</span>
                  <span>EJE</span>
                  <span>DNP</span>
                </div>
                <div class="flex justify-between items-center font-mono">
                  <span class="text-cyan-400 font-bold">OD:</span>
                  <span class="text-white">${Formatters.diopter(o.odFormula?.sphere)}</span>
                  <span class="text-white">${Formatters.diopter(o.odFormula?.cylinder)}</span>
                  <span class="text-white">${Formatters.axis(o.odFormula?.axis)}</span>
                  <span class="text-slate-400">${Formatters.distanceMm(o.odFormula?.dnpMm)}</span>
                </div>
                <div class="flex justify-between items-center font-mono">
                  <span class="text-cyan-400 font-bold">OI:</span>
                  <span class="text-white">${Formatters.diopter(o.oiFormula?.sphere)}</span>
                  <span class="text-white">${Formatters.diopter(o.oiFormula?.cylinder)}</span>
                  <span class="text-white">${Formatters.axis(o.oiFormula?.axis)}</span>
                  <span class="text-slate-400">${Formatters.distanceMm(o.oiFormula?.dnpMm)}</span>
                </div>
                ${o.addition > 0 ? `
                  <div class="pt-1 border-t border-slate-800/60 flex justify-between text-[11px] text-amber-300">
                    <span>Adición Presbicia: +${o.addition.toFixed(2)} D</span>
                    <span>Cerca: OD ${Formatters.diopter(o.nearFormula?.od?.sphere)} | OI ${Formatters.diopter(o.nearFormula?.oi?.sphere)}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Transposición de Taller -->
              <div class="p-2.5 bg-purple-950/30 rounded-xl border border-purple-900/30 text-[11px] font-mono text-purple-300 flex justify-between">
                <span>Transposición Taller:</span>
                <span>OD: ${Formatters.diopter(o.odTransposed?.sphere)} ${Formatters.diopter(o.odTransposed?.cylinder)} x ${Formatters.axis(o.odTransposed?.axis)}</span>
              </div>

              <!-- Armazón y Material -->
              <div class="text-xs text-slate-400 space-y-1">
                <div class="flex justify-between">
                  <span>👓 Armazón:</span>
                  <strong class="text-white">${Sanitizer.escapeHTML(o.frameModel)}</strong>
                </div>
                <div class="flex justify-between">
                  <span>🔬 Cristal:</span>
                  <span class="text-slate-300">${Sanitizer.escapeHTML(mat.name)}</span>
                </div>
                <div class="flex justify-between">
                  <span>🏥 Obra Social:</span>
                  <span class="text-slate-300">${Sanitizer.escapeHTML(o.insuranceName || 'Particular')}</span>
                </div>
              </div>

              <!-- Desglose Financiero -->
              <div class="grid grid-cols-3 gap-2 p-2.5 bg-[#0b0f17]/60 rounded-xl border border-slate-800 text-[11px] text-center">
                <div>
                  <span class="text-slate-500 uppercase text-[9px] block">Total</span>
                  <strong class="text-white">${Formatters.currencyARS(o.pricing?.totalAmount)}</strong>
                </div>
                <div>
                  <span class="text-slate-500 uppercase text-[9px] block">Seña / O.S.</span>
                  <strong class="text-emerald-400">${Formatters.currencyARS((o.pricing?.insuranceCoverage || 0) + (o.pricing?.depositPaid || 0))}</strong>
                </div>
                <div>
                  <span class="text-slate-500 uppercase text-[9px] block">Saldo a Cobrar</span>
                  <strong class="${o.pricing?.balanceDue > 0 ? 'text-amber-400' : 'text-slate-500'}">${Formatters.currencyARS(o.pricing?.balanceDue)}</strong>
                </div>
              </div>

              <!-- Acciones Rápidas -->
              <div class="flex items-center gap-2 pt-2 border-t border-slate-800">
                ${o.status === 'EN_TALLER_CALIBRADO' ? `
                  <button data-order-id="${o.orderId}" class="btn-check-fronto flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs">
                    🔬 Control Fronto QC
                  </button>
                ` : o.status === 'LISTO_PARA_ENTREGA' ? `
                  <button data-order-id="${o.orderId}" class="btn-deliver-order flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs">
                    🤝 Entregar y Cobrar Saldo
                  </button>
                  <button data-order-id="${o.orderId}" class="btn-wa-notify px-3 py-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-300 text-xs" title="Notificar WhatsApp">
                    📲 WA
                  </button>
                ` : `
                  <span class="text-xs text-slate-500 italic flex-1 text-center py-1">✓ Orden Entregada y Adaptada</span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  Sanitizer.safeSetInnerHTML(container, html);
  attachPrescriptionsEvents();
}

function attachPrescriptionsEvents() {
  document.getElementById('btn-open-new-order-modal')?.addEventListener('click', () => {
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
        const url = WhatsAppOpticNotifierService.notifyGlassesReady({
          phone: order.patientPhone || '+5493434112233',
          patientName: order.patientName,
          orderId: order.orderId,
          frameModel: order.frameModel,
          balanceDue: order.pricing.balanceDue
        });
        window.open(url, '_blank');
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
        <h2 class="text-xl font-bold text-white flex items-center gap-2">🔄 Validador & Transpositor Óptico Profesional</h2>
        <p class="text-xs text-slate-400 mt-1">Conversor bidireccional entre cilindro positivo (+) y negativo (-) con suma de adición para presbicia.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Calculadora de Entrada -->
        <div class="bg-[#121722]/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">Fórmula Prescrita Original</h3>

          <div class="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label class="block text-slate-400 mb-1">Esfera (D)</label>
              <input type="number" id="trans-sphere" step="0.25" value="2.00" class="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center">
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Cilindro (D)</label>
              <input type="number" id="trans-cylinder" step="0.25" value="-1.50" class="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center">
            </div>
            <div>
              <label class="block text-slate-400 mb-1">Eje (°)</label>
              <input type="number" id="trans-axis" min="0" max="180" value="80" class="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center">
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1 text-xs">Adición Presbicia (Lejos a Cerca)</label>
            <input type="number" id="trans-addition" step="0.25" min="0" max="4" value="1.75" class="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center">
          </div>

          <button id="btn-calc-transpose" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/30">
            ⚡ Calcular Transposición & Visión Cercana
          </button>
        </div>

        <!-- Panel de Resultado -->
        <div class="bg-[#121722]/90 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <span class="text-[10px] uppercase font-bold text-sky-400">Fórmula Transpuesta para Laboratorio</span>
            <div id="transposed-result-box" class="mt-2 p-5 rounded-xl bg-purple-950/40 border border-purple-800/60 font-mono text-center space-y-2">
              <p class="text-2xl font-black text-white">+0.50 +1.50 x 170°</p>
              <p class="text-xs text-purple-300">Esfera: +0.50 D · Cilindro: +1.50 D · Eje: 170°</p>
            </div>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-amber-400">Prescripción Visión Cercana (Lectura / Trabajo)</span>
            <div id="near-result-box" class="mt-2 p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 font-mono text-center">
              <p class="text-xl font-bold text-white">+3.75 -1.50 x 80°</p>
              <p class="text-xs text-amber-300">Esfera Cerca = Lejos (+2.00) + Adición (+1.75) = +3.75 D</p>
            </div>
          </div>

          <div class="text-[11px] text-slate-500">
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
    const s = parseFloat(document.getElementById('trans-sphere')?.value) || 0;
    const c = parseFloat(document.getElementById('trans-cylinder')?.value) || 0;
    const a = parseInt(document.getElementById('trans-axis')?.value, 10) || 0;
    const add = parseFloat(document.getElementById('trans-addition')?.value) || 0;

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
        <p class="text-xs text-amber-300">Esfera Cerca = Lejos (${Formatters.diopter(s)}) + Adición (+${add.toFixed(2)}) = ${Formatters.diopter(near.sphere)} D</p>
      `;
      Sanitizer.safeSetInnerHTML(nearBox, nearHtml);
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

  const html = `
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white flex items-center gap-2">🔬 Control de Calidad en Frontofocómetro (Lensómetro)</h2>
        <p class="text-xs text-slate-400 mt-1">Auditoría obligatoria de dioptrías, cilindros y ejes según la norma internacional <strong>ISO 8980-1</strong> antes de entregar el anteojo.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Panel Informativo de Tolerancias -->
        <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 text-xs">
          <h3 class="font-bold text-white uppercase text-xs tracking-wider">Tolerancias Oficiales ISO 8980-1</h3>
          <div class="p-3 bg-[#0b0f17] rounded-xl border border-slate-800 space-y-2">
            <div>
              <strong class="text-emerald-400">Potencia Esférica:</strong>
              <p class="text-slate-400">Hasta ±6.00 D: tolerancia de ±0.12 D.<br>Superior a ±6.00 D: tolerancia de ±0.18 D.</p>
            </div>
            <div>
              <strong class="text-emerald-400">Potencia Cilíndrica:</strong>
              <p class="text-slate-400">Tolerancia máxima de ±0.12 D en astigmatismo.</p>
            </div>
            <div>
              <strong class="text-emerald-400">Eje Astigmático:</strong>
              <p class="text-slate-400">Cilindros ≥ 1.50 D: tolerancia estricta de ±2°.<br>Cilindros 0.75 - 1.50 D: tolerancia de ±4°.<br>Cilindros &lt; 0.75 D: tolerancia de ±7°.</p>
            </div>
          </div>
        </div>

        <!-- Órdenes Pendientes de Control Fronto -->
        <div class="md:col-span-2 space-y-4">
          <h3 class="font-bold text-white text-sm">Anteojos Listos para Verificación en Banco de Taller</h3>
          ${state.orders.map(o => `
            <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 font-mono">${Sanitizer.escapeHTML(o.orderId)}</span>
                  <h4 class="text-base font-bold text-white mt-1">${Sanitizer.escapeHTML(o.patientName)}</h4>
                  <p class="text-xs text-slate-400">${Sanitizer.escapeHTML(o.frameModel)} · ${Sanitizer.escapeHTML(o.workshopOrder?.labName || 'Taller Interno')}</p>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-xs font-bold border ${Formatters.orderStatusBadge(o.status).bg} ${Formatters.orderStatusBadge(o.status).border} ${Formatters.orderStatusBadge(o.status).text}">
                  ${Formatters.orderStatusBadge(o.status).label}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3 p-3 bg-[#0b0f17] rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <span class="text-slate-500 block text-[10px]">Prescripción OD:</span>
                  <span class="text-white">${Formatters.diopter(o.odFormula?.sphere)} ${Formatters.diopter(o.odFormula?.cylinder)} x ${Formatters.axis(o.odFormula?.axis)}</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-[10px]">Prescripción OI:</span>
                  <span class="text-white">${Formatters.diopter(o.oiFormula?.sphere)} ${Formatters.diopter(o.oiFormula?.cylinder)} x ${Formatters.axis(o.oiFormula?.axis)}</span>
                </div>
              </div>

              ${o.qualityCheck ? `
                <div class="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                  <div class="flex justify-between text-emerald-300 font-bold">
                    <span>✓ Control Fronto Aprobado</span>
                    <span class="font-mono text-[10px]">${Formatters.date(o.qualityCheck.checkedAt)}</span>
                  </div>
                  <p class="text-slate-400 text-[11px]">Óptico Responsable: ${Sanitizer.escapeHTML(o.qualityCheck.opticianName)} (${Sanitizer.escapeHTML(o.qualityCheck.opticianLicense)})</p>
                  <p class="font-mono text-[10px] text-slate-500 truncate">Sello SHA-256: ${o.cryptoSeal}</p>
                </div>
              ` : `
                <button data-order-id="${o.orderId}" class="btn-check-fronto w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30">
                  🔬 Registrar Medición en Frontofocómetro
                </button>
              `}
            </div>
          `).join('')}
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
        <h2 class="text-xl font-bold text-white flex items-center gap-2">🔬 Catálogo de Cristales & Tratamientos Ópticos</h2>
        <p class="text-xs text-slate-400 mt-1">Índices de refracción, números de Abbe, densidades y tratamientos protectores.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${Object.values(LENS_MATERIALS).map(m => `
          <div class="bg-[#121722]/90 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-base font-bold text-white">${Sanitizer.escapeHTML(m.name)}</h3>
                <p class="text-xs text-blue-400 font-mono mt-0.5">Índice n = ${m.refractiveIndex.toFixed(2)}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Abbe: ${m.abbeNumber}
              </span>
            </div>
            <div class="p-3 bg-[#0b0f17] rounded-xl border border-slate-800 text-xs space-y-1">
              <p class="text-slate-300"><strong>Recomendado:</strong> ${Sanitizer.escapeHTML(m.recommendedFor)}</p>
              <p class="text-slate-400"><strong>Resistencia a Impactos:</strong> ${Sanitizer.escapeHTML(m.impactResistance)}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Tratamientos -->
      <div class="pt-4 border-t border-slate-800">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider mb-4">Tratamientos y Recubrimientos</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${Object.values(LENS_TREATMENTS).map(t => `
            <div class="p-4 bg-[#121722]/60 rounded-xl border border-slate-800/80 text-xs">
              <h4 class="font-bold text-sky-400 text-sm">${Sanitizer.escapeHTML(t.name)}</h4>
              <p class="text-slate-300 mt-1">${Sanitizer.escapeHTML(t.description)}</p>
            </div>
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

  const html = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">💰 Liquidación Mixta B2B & Obras Sociales</h2>
          <p class="text-xs text-slate-400 mt-1">Conciliación de coberturas médicas, señas recibidas y saldos pendientes al retiro.</p>
        </div>
        <button id="btn-export-settlement-csv" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shadow-lg flex items-center gap-2">
          📥 Exportar CSV (Excel)
        </button>
      </div>

      <div class="bg-[#121722]/90 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-[#0b0f17]/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
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
          <tbody class="divide-y divide-slate-800/60">
            ${state.orders.map(o => `
              <tr class="hover:bg-slate-800/30 transition">
                <td class="py-3 px-3 font-mono text-blue-400 font-bold">${Sanitizer.escapeHTML(o.orderId)}</td>
                <td class="py-3 px-3 font-semibold text-white">${Sanitizer.escapeHTML(o.patientName)}</td>
                <td class="py-3 px-3">${Sanitizer.escapeHTML(o.insuranceName || 'Particular')}</td>
                <td class="py-3 px-3 font-mono font-bold text-white">${Formatters.currencyARS(o.pricing?.totalAmount)}</td>
                <td class="py-3 px-3 font-mono text-emerald-400">${Formatters.currencyARS(o.pricing?.insuranceCoverage)}</td>
                <td class="py-3 px-3 font-mono text-blue-300">${Formatters.currencyARS(o.pricing?.depositPaid)}</td>
                <td class="py-3 px-3 font-mono font-bold ${o.pricing?.balanceDue > 0 ? 'text-amber-400' : 'text-slate-500'}">
                  ${Formatters.currencyARS(o.pricing?.balanceDue)}
                </td>
                <td class="py-3 px-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${Formatters.orderStatusBadge(o.status).bg} ${Formatters.orderStatusBadge(o.status).border} ${Formatters.orderStatusBadge(o.status).text}">
                    ${Formatters.orderStatusBadge(o.status).label}
                  </span>
                </td>
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
    const rows = state.orders.map(o => ({
      id: o.orderId,
      patient: o.patientName,
      insurance: o.insuranceName,
      total: o.pricing?.totalAmount,
      coverage: o.pricing?.insuranceCoverage,
      deposit: o.pricing?.depositPaid,
      balance: o.pricing?.balanceDue,
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
  });
}

// Modales
function openNewOrderModal() {
  const modal = document.getElementById('new-order-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  document.getElementById('btn-close-new-order-modal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('form-new-order')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientName = document.getElementById('new-patient-name')?.value || 'Carlos Paez';
    const patientPhone = document.getElementById('new-patient-phone')?.value || '+5493435123456';
    const doctorName = document.getElementById('new-doctor-name')?.value || 'Dr. Guillermo Bustos';
    const frameModel = document.getElementById('new-frame-model')?.value || 'Ray-Ban Wayfarer RB2140';
    const lensMaterial = document.getElementById('new-lens-material')?.value || 'HIGH_INDEX_167';
    const insuranceName = document.getElementById('new-insurance-name')?.value || 'OSDE 210';

    const odSph = parseFloat(document.getElementById('new-od-sph')?.value) || 0;
    const odCyl = parseFloat(document.getElementById('new-od-cyl')?.value) || 0;
    const odAxis = parseInt(document.getElementById('new-od-axis')?.value, 10) || 0;
    const odDnp = parseFloat(document.getElementById('new-od-dnp')?.value) || 31.0;

    const oiSph = parseFloat(document.getElementById('new-oi-sph')?.value) || 0;
    const oiCyl = parseFloat(document.getElementById('new-oi-cyl')?.value) || 0;
    const oiAxis = parseInt(document.getElementById('new-oi-axis')?.value, 10) || 0;
    const oiDnp = parseFloat(document.getElementById('new-oi-dnp')?.value) || 31.0;

    const addition = parseFloat(document.getElementById('new-addition')?.value) || 0;
    const totalAmount = parseFloat(document.getElementById('new-total-amount')?.value) || 90000;
    const insuranceCoverage = parseFloat(document.getElementById('new-insurance-coverage')?.value) || 30000;
    const depositPaid = parseFloat(document.getElementById('new-deposit-paid')?.value) || 30000;

    const order = OpticalOrderService.createOrder({
      patientId: `PAT-${Math.random().toString(36).slice(2, 6)}`,
      patientName,
      patientPhone,
      doctorName,
      doctorLicense: 'MP-OFT-8491',
      odFormula: { sphere: odSph, cylinder: odCyl, axis: odAxis, dnpMm: odDnp },
      oiFormula: { sphere: oiSph, cylinder: oiCyl, axis: oiAxis, dnpMm: oiDnp },
      addition,
      frameModel,
      lensMaterial,
      treatments: ['AR_MULTI'],
      pricing: { totalAmount, insuranceCoverage, depositPaid },
      insuranceName
    });

    const workshop = OpticalOrderService.sendToWorkshop(order, { labName: 'Taller Central de Biselado', slaDays: 3 });
    state.orders.unshift(workshop);
    OptiTrackCacheService.saveOrders(state.orders);

    modal.classList.add('hidden');
    renderPrescriptions();
  });
}

function openLensometerModal(order) {
  const modal = document.getElementById('lensometer-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const titleEl = document.getElementById('lensometer-modal-title');
  if (titleEl) titleEl.textContent = `Control Fronto QC: ${order.orderId} - ${order.patientName}`;

  document.getElementById('btn-close-lensometer-modal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('form-lensometer-check')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const odMeasured = {
      sphere: parseFloat(document.getElementById('qc-od-sph')?.value) || order.odFormula.sphere,
      cylinder: parseFloat(document.getElementById('qc-od-cyl')?.value) || order.odFormula.cylinder,
      axis: parseInt(document.getElementById('qc-od-axis')?.value, 10) || order.odFormula.axis
    };
    const oiMeasured = {
      sphere: parseFloat(document.getElementById('qc-oi-sph')?.value) || order.oiFormula.sphere,
      cylinder: parseFloat(document.getElementById('qc-oi-cyl')?.value) || order.oiFormula.cylinder,
      axis: parseInt(document.getElementById('qc-oi-axis')?.value, 10) || order.oiFormula.axis
    };

    const updated = OpticalOrderService.recordLensometerQualityCheck(order, {
      odMeasured,
      oiMeasured,
      opticianName: 'Óptico Gabriel Solari',
      opticianLicense: 'COL-OPT-9912'
    });

    const idx = state.orders.findIndex(o => o.orderId === order.orderId);
    state.orders[idx] = updated;
    OptiTrackCacheService.saveOrders(state.orders);

    modal.classList.add('hidden');
    switchTab('prescriptions');
  });
}

function openDeliveryModal(order) {
  const modal = document.getElementById('delivery-modal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const titleEl = document.getElementById('delivery-modal-title');
  if (titleEl) titleEl.textContent = `Entrega y Adaptación: ${order.orderId} - ${order.patientName}`;

  const balanceEl = document.getElementById('delivery-balance-amount');
  if (balanceEl) balanceEl.textContent = Formatters.currencyARS(order.pricing.balanceDue);

  document.getElementById('btn-close-delivery-modal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.getElementById('btn-confirm-delivery')?.addEventListener('click', () => {
    const updated = OpticalOrderService.deliverOrder(order, {
      patientSignature: `SIG_${order.patientName.replace(/\s+/g, '_')}_EPOD`
    });

    const idx = state.orders.findIndex(o => o.orderId === order.orderId);
    state.orders[idx] = updated;
    OptiTrackCacheService.saveOrders(state.orders);

    modal.classList.add('hidden');
    switchTab('prescriptions');
  });
}

// Router & Tabs
export function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('#tab-nav button').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.className = 'px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2';
    } else {
      btn.className = 'px-4 py-2 rounded-xl text-sm font-semibold bg-[#121722]/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 flex items-center gap-2';
    }
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

// Inicialización
export function initApp() {
  initializeDemoData();

  document.querySelectorAll('#tab-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
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
