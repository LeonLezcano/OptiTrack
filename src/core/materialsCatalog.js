/**
 * Catálogo Técnico de Materiales y Tratamientos Ópticos
 * AiAppFactory Standard
 */
export const LENS_MATERIALS = {
  ORGANIC_CR39: {
    id: 'ORGANIC_CR39',
    name: 'Orgánico Estándar (CR-39)',
    refractiveIndex: 1.50,
    abbeNumber: 58,
    density: 1.32,
    recommendedFor: 'Bajas dioptrías (hasta ±2.00 D)',
    impactResistance: 'Media'
  },
  POLYCARBONATE: {
    id: 'POLYCARBONATE',
    name: 'Policarbonato 1.59 (Airwear)',
    refractiveIndex: 1.59,
    abbeNumber: 30,
    density: 1.20,
    recommendedFor: 'Niños, deportes, armazones al aire/ranurados',
    impactResistance: 'Extrema (Inastillable)'
  },
  HIGH_INDEX_167: {
    id: 'HIGH_INDEX_167',
    name: 'Alto Índice 1.67 (Extra Delgado)',
    refractiveIndex: 1.67,
    abbeNumber: 32,
    density: 1.36,
    recommendedFor: 'Miopías/Hipermetropías moderadas y altas (±3.00 a ±6.00 D)',
    impactResistance: 'Alta'
  },
  ULTRA_HIGH_174: {
    id: 'ULTRA_HIGH_174',
    name: 'Ultra Alto Índice 1.74',
    refractiveIndex: 1.74,
    abbeNumber: 33,
    density: 1.47,
    recommendedFor: 'Graduaciones muy elevadas (> ±6.00 D), máxima delgadez',
    impactResistance: 'Alta'
  },
  MINERAL: {
    id: 'MINERAL',
    name: 'Cristal Mineral (Crown Glass)',
    refractiveIndex: 1.52,
    abbeNumber: 59,
    density: 2.54,
    recommendedFor: 'Máxima resistencia a rayas / Talleres industriales',
    impactResistance: 'Baja (Frágil)'
  }
};

export const LENS_TREATMENTS = {
  ANTIREFLECTIVE_MULTICOAT: {
    id: 'AR_MULTI',
    name: 'Antirréflex Multicapa Verde',
    description: 'Elimina reflejos parásitos, mejora contraste nocturno y transparencia estética 99.5%'
  },
  BLUE_LIGHT_BLOCKER: {
    id: 'BLUE_CUT',
    name: 'Filtro Luz Azul (Blue Cut / Protect)',
    description: 'Bloquea radiación UV y luz azul nociva (380-450nm) de pantallas LED y monitores'
  },
  PHOTOCHROMIC_TRANSITIONS: {
    id: 'TRANSITIONS',
    name: 'Fotocromático Sensible a UV (Transitions)',
    description: 'Se oscurece automáticamente al sol y aclara en interiores'
  },
  POLARIZED_SUN: {
    id: 'POLARIZED',
    name: 'Polarizado Antirreflejo Solar',
    description: 'Elimina el deslumbramiento de superficies brillantes (asfalto, agua, nieve)'
  }
};

export class MaterialsCatalog {
  static getMaterial(id) {
    return LENS_MATERIALS[id] || LENS_MATERIALS.ORGANIC_CR39;
  }

  static getTreatment(id) {
    return LENS_TREATMENTS[id] || null;
  }

  static suggestMaterial(sphereDiopters) {
    const absSphere = Math.abs(Number(sphereDiopters) || 0);
    if (absSphere <= 2.25) return LENS_MATERIALS.ORGANIC_CR39;
    if (absSphere <= 4.00) return LENS_MATERIALS.POLYCARBONATE;
    if (absSphere <= 6.50) return LENS_MATERIALS.HIGH_INDEX_167;
    return LENS_MATERIALS.ULTRA_HIGH_174;
  }
}
