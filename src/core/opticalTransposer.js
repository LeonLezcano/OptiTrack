/**
 * Motor de Transposición Óptica y Fórmulas Oftálmicas
 * AiAppFactory Standard
 */
export class OpticalTransposer {
  /**
   * Transpone una fórmula esferocilíndrica entre cilindro positivo y negativo
   * Regla de tres pasos:
   * 1. Nueva Esfera = Esfera + Cilindro
   * 2. Nuevo Cilindro = -Cilindro
   * 3. Nuevo Eje = (Eje + 90) % 180 (si resulta 0°, se expresa como 180°)
   * @param {Object} formula { sphere, cylinder, axis }
   * @returns {Object} { sphere, cylinder, axis }
   */
  static transpose({ sphere = 0, cylinder = 0, axis = 0 }) {
    const s = Number(sphere) || 0;
    const c = Number(cylinder) || 0;
    let a = Math.round(Number(axis) || 0);

    if (c === 0) {
      return {
        sphere: Number(s.toFixed(2)),
        cylinder: 0,
        axis: 0
      };
    }

    const newSphere = Number((s + c).toFixed(2));
    const newCylinder = Number((-c).toFixed(2));
    
    // Ajuste de eje
    let newAxis = (a + 90) % 180;
    if (newAxis === 0) newAxis = 180;

    return {
      sphere: newSphere,
      cylinder: newCylinder,
      axis: newAxis
    };
  }

  /**
   * Calcula la prescripción de visión cercana a partir de visión lejana y adición de presbicia
   * @param {Object} farFormula { sphere, cylinder, axis }
   * @param {number} addition
   */
  static computeNearFormula(farFormula, addition = 0) {
    if (!farFormula) throw new Error('Fórmula de lejos requerida');
    const add = Number(addition) || 0;
    return {
      sphere: Number(((Number(farFormula.sphere) || 0) + add).toFixed(2)),
      cylinder: Number(farFormula.cylinder) || 0,
      axis: Number(farFormula.axis) || 0,
      addition: add
    };
  }

  /**
   * Valida rangos fisiológicos estándar de dioptrías y DNP
   * @param {Object} eyeFormula { sphere, cylinder, axis, dnpMm }
   */
  static validatePhysiologicalRanges(eyeFormula = {}) {
    const errors = [];
    const s = Number(eyeFormula.sphere);
    const c = Number(eyeFormula.cylinder);
    const a = Number(eyeFormula.axis);
    const dnp = Number(eyeFormula.dnpMm);

    if (!isNaN(s) && (s < -25.00 || s > 20.00)) {
      errors.push(`Esfera fuera de rango fisiológico (-25.00 a +20.00 D): ${s}`);
    }
    if (!isNaN(c) && (c < -10.00 || c > 10.00)) {
      errors.push(`Cilindro fuera de rango fisiológico (-10.00 a +10.00 D): ${c}`);
    }
    if (!isNaN(a) && (a < 0 || a > 180)) {
      errors.push(`Eje astigmático fuera de rango (0° a 180°): ${a}`);
    }
    if (!isNaN(dnp) && (dnp < 20 || dnp > 40)) {
      errors.push(`Distancia Nasopupilar monocular anormal (20 a 40 mm): ${dnp}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
