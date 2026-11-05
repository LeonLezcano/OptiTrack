import { OpticalTransposer } from '../core/opticalTransposer.js';
import { LensometerQualitySentinel } from '../core/lensometerQualitySentinel.js';
import { CryptoSeal } from '../utils/cryptoSeal.js';

export class OpticalOrderService {
  /**
   * Crea una nueva orden de anteojo recetado
   */
  static createOrder({
    patientId,
    patientName,
    patientPhone,
    doctorName,
    doctorLicense,
    odFormula = { sphere: 0, cylinder: 0, axis: 0, dnpMm: 31 },
    oiFormula = { sphere: 0, cylinder: 0, axis: 0, dnpMm: 31 },
    addition = 0, // Adición presbicia
    frameModel = 'Ray-Ban Wayfarer RB2140',
    lensMaterial = 'ORGANIC_CR39',
    treatments = ['AR_MULTI'],
    pricing = { totalAmount: 85000, insuranceCoverage: 30000, depositPaid: 25000 },
    insuranceName = 'OSDE 210'
  }) {
    if (!patientId || !patientName || !doctorName) {
      throw new Error('Faltan datos obligatorios para crear la orden de óptica');
    }

    const orderId = `OPT-${Date.now().toString(36).slice(-4)}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    // Validar rangos fisiológicos
    const odValidation = OpticalTransposer.validatePhysiologicalRanges(odFormula);
    const oiValidation = OpticalTransposer.validatePhysiologicalRanges(oiFormula);

    if (!odValidation.isValid || !oiValidation.isValid) {
      const allErrors = [...odValidation.errors, ...oiValidation.errors];
      throw new Error(`Error en receta médica: ${allErrors.join('; ')}`);
    }

    // Transposición automática para taller
    const odTransposed = OpticalTransposer.transpose(odFormula);
    const oiTransposed = OpticalTransposer.transpose(oiFormula);

    // Visión cercana si hay adición
    const nearFormula = addition > 0 ? {
      od: OpticalTransposer.computeNearFormula(odFormula, addition),
      oi: OpticalTransposer.computeNearFormula(oiFormula, addition)
    } : null;

    // Desglose financiero
    const total = Number(pricing.totalAmount) || 0;
    const insurance = Number(pricing.insuranceCoverage) || 0;
    const deposit = Number(pricing.depositPaid) || 0;
    const balanceDue = Math.max(0, total - insurance - deposit);

    return {
      orderId,
      patientId,
      patientName,
      patientPhone: String(patientPhone || '').trim(),
      doctorName,
      doctorLicense,
      createdAt,
      status: 'RECETA_INGRESADA',
      odFormula,
      oiFormula,
      odTransposed,
      oiTransposed,
      addition: Number(addition) || 0,
      nearFormula,
      frameModel,
      lensMaterial,
      treatments,
      insuranceName,
      pricing: {
        totalAmount: total,
        insuranceCoverage: insurance,
        depositPaid: deposit,
        balanceDue
      },
      workshopOrder: {
        sentAt: null,
        targetDueDate: null,
        labName: null
      },
      qualityCheck: null,
      adaptationEpod: null,
      cryptoSeal: null
    };
  }

  /**
   * Envía la orden al taller de calibrado / biselado
   */
  static sendToWorkshop(order, { labName = 'Taller Central de Biselado', slaDays = 4 }) {
    if (!order) throw new Error('Orden no especificada');
    const sentAt = new Date().toISOString();
    const targetDueDate = new Date(Date.now() + slaDays * 24 * 3600 * 1000).toISOString();

    return {
      ...order,
      status: 'EN_TALLER_CALIBRADO',
      workshopOrder: {
        sentAt,
        targetDueDate,
        labName
      }
    };
  }

  /**
   * Registra el control de calidad en frontofocómetro
   */
  static recordLensometerQualityCheck(order, {
    odMeasured,
    oiMeasured,
    opticianName,
    opticianLicense
  }) {
    if (!order) throw new Error('Orden no especificada');
    if (!opticianName || !opticianLicense) {
      throw new Error('Se requiere nombre y matrícula del óptico responsable');
    }

    const odAudit = LensometerQualitySentinel.auditDiopters(order.odFormula, odMeasured);
    const oiAudit = LensometerQualitySentinel.auditDiopters(order.oiFormula, oiMeasured);

    const isApproved = odAudit.passed && oiAudit.passed;
    const checkedAt = new Date().toISOString();

    const qualityCheck = {
      isApproved,
      opticianName,
      opticianLicense,
      checkedAt,
      odMeasured,
      oiMeasured,
      deviations: [...odAudit.deviations, ...oiAudit.deviations]
    };

    const nextStatus = isApproved ? 'LISTO_PARA_ENTREGA' : 'EN_TALLER_CALIBRADO';

    const updated = {
      ...order,
      status: nextStatus,
      qualityCheck
    };

    // Sello criptográfico SHA-256
    const sealPayload = {
      orderId: updated.orderId,
      patientId: updated.patientId,
      odFormula: updated.odFormula,
      oiFormula: updated.oiFormula,
      odMeasured,
      oiMeasured,
      isApproved,
      opticianLicense,
      checkedAt
    };

    updated.cryptoSeal = CryptoSeal.generate(sealPayload);
    return updated;
  }

  /**
   * Registra la entrega final con prueba de adaptación y cobro del saldo
   */
  static deliverOrder(order, { patientSignature, finalAmountPaid = null }) {
    if (!order) throw new Error('Orden no especificada');
    if (!patientSignature) {
      throw new Error('Se requiere la firma del paciente en conformidad de la prueba de adaptación');
    }

    const deliveredAt = new Date().toISOString();
    const paid = finalAmountPaid !== null ? Number(finalAmountPaid) : order.pricing.balanceDue;

    return {
      ...order,
      status: 'DELIVERED',
      pricing: {
        ...order.pricing,
        balanceDue: Math.max(0, order.pricing.balanceDue - paid)
      },
      adaptationEpod: {
        deliveredAt,
        patientSignature,
        adaptationApproved: true
      }
    };
  }

  /**
   * Verifica la integridad forense de la orden y su control de calidad
   */
  static verifyOrderSeal(order) {
    if (!order || !order.cryptoSeal || !order.qualityCheck) return false;

    const sealPayload = {
      orderId: order.orderId,
      patientId: order.patientId,
      odFormula: order.odFormula,
      oiFormula: order.oiFormula,
      odMeasured: order.qualityCheck.odMeasured,
      oiMeasured: order.qualityCheck.oiMeasured,
      isApproved: order.qualityCheck.isApproved,
      opticianLicense: order.qualityCheck.opticianLicense,
      checkedAt: order.qualityCheck.checkedAt
    };

    return CryptoSeal.verify(sealPayload, order.cryptoSeal);
  }
}
