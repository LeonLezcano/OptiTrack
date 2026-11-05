/**
 * WhatsApp Optic Notifier Service
 * Enlaces directos E.164 para avisos de retiro de anteojos y recetas
 */
export class WhatsAppOpticNotifierService {
  /**
   * Genera enlace de notificación de anteojo listo para retiro
   */
  static notifyGlassesReady({ phone, patientName, orderId, frameModel, balanceDue }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const balanceText = balanceDue > 0
      ? `\n💰 *Saldo a abonar al retirar:* $${balanceDue.toLocaleString('es-AR')}`
      : '\n💰 *Saldo:* Totalmente abonado';

    const text = `👓 *OptiTrack - ¡Tus anteojos están listos!* 👓\n\nEstimado/a *${patientName}*:\nLe informamos que su orden *${orderId}* (${frameModel}) ha superado exitosamente el control de calidad en frontofocómetro y ya se encuentra lista en sucursal para su prueba de adaptación y retiro.${balanceText}\n\n¡Te esperamos!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Genera enlace con resumen de prescripción oftálmica
   */
  static notifyPrescriptionSummary({ phone, patientName, orderId, odSummary, oiSummary }) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const text = `📋 *OptiTrack - Ficha de Receta Oftálmica*\n\nPaciente: *${patientName}*\nOrden: *${orderId}*\n\n👁️ *OD:* ${odSummary}\n👁️ *OI:* ${oiSummary}\n\nGuardá este mensaje como respaldo digital de tu graduación visual.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
