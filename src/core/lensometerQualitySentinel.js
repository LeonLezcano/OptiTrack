/**
 * Sentinel de Calidad de Frontifocómetro (ISO 8980-1)
 * AiAppFactory Standard
 */
export class LensometerQualitySentinel {
  /**
   * Audita la concordancia entre la prescripción médica y la medición real en frontofocómetro
   * @param {Object} prescriptionFormula { sphere, cylinder, axis }
   * @param {Object} measuredFormula { sphere, cylinder, axis }
   * @returns {Object} { passed: boolean, deviations: Array<string> }
   */
  static auditDiopters(prescriptionFormula, measuredFormula) {
    if (!prescriptionFormula || !measuredFormula) {
      return { passed: false, deviations: ['Fórmulas insuficientes para auditoría en fronto'] };
    }

    const deviations = [];

    const pSph = Number(prescriptionFormula.sphere) || 0;
    const mSph = Number(measuredFormula.sphere) || 0;
    const diffSph = Math.abs(pSph - mSph);

    // Tolerancia Esférica ISO 8980-1
    const sphTolerance = Math.abs(pSph) >= 6.00 ? 0.18 : 0.12;
    if (diffSph > sphTolerance) {
      deviations.push(`Desvío esférico excesivo: Prescrito ${pSph >= 0 ? '+' : ''}${pSph.toFixed(2)}, Medido ${mSph >= 0 ? '+' : ''}${mSph.toFixed(2)} (Diff: ${diffSph.toFixed(2)} D, Tolerancia: ±${sphTolerance.toFixed(2)} D)`);
    }

    const pCyl = Number(prescriptionFormula.cylinder) || 0;
    const mCyl = Number(measuredFormula.cylinder) || 0;
    const diffCyl = Math.abs(pCyl - mCyl);

    // Tolerancia Cilíndrica
    const cylTolerance = 0.12;
    if (diffCyl > cylTolerance) {
      deviations.push(`Desvío cilíndrico excesivo: Prescrito ${pCyl >= 0 ? '+' : ''}${pCyl.toFixed(2)}, Medido ${mCyl >= 0 ? '+' : ''}${mCyl.toFixed(2)} (Diff: ${diffCyl.toFixed(2)} D, Tolerancia: ±${cylTolerance.toFixed(2)} D)`);
    }

    // Tolerancia de Eje (Dependiente de la potencia cilíndrica)
    if (Math.abs(pCyl) >= 0.25) {
      const pAxis = Number(prescriptionFormula.axis) || 0;
      const mAxis = Number(measuredFormula.axis) || 0;
      let diffAxis = Math.abs(pAxis - mAxis);
      if (diffAxis > 90) diffAxis = 180 - diffAxis;

      let axisTolerance = 7; // Grados
      if (Math.abs(pCyl) >= 1.50) axisTolerance = 2;
      else if (Math.abs(pCyl) >= 0.75) axisTolerance = 4;

      if (diffAxis > axisTolerance) {
        deviations.push(`Desvío de eje astigmático: Prescrito ${pAxis}°, Medido ${mAxis}° (Diff: ${diffAxis}°, Tolerancia: ±${axisTolerance}°)`);
      }
    }

    return {
      passed: deviations.length === 0,
      deviations,
      checkedAt: new Date().toISOString()
    };
  }
}
