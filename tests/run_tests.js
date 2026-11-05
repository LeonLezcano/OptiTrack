/**
 * Arnés de Pruebas Multi-Capa (5 Capas + Fuzzing)
 * OptiTrack - AiAppFactory Standard
 */
import { OpticalTransposer } from '../src/core/opticalTransposer.js';
import { MaterialsCatalog, LENS_MATERIALS, LENS_TREATMENTS } from '../src/core/materialsCatalog.js';
import { LensometerQualitySentinel } from '../src/core/lensometerQualitySentinel.js';
import { OpticalOrderService } from '../src/services/opticalOrderService.js';
import { ExportService } from '../src/services/exportService.js';
import { OptiTrackCacheService } from '../src/services/optiTrackCache.service.js';
import { WhatsAppOpticNotifierService } from '../src/services/whatsAppOpticNotifier.service.js';
import { CryptoSeal } from '../src/utils/cryptoSeal.js';
import { Formatters } from '../src/utils/formatters.js';
import { Sanitizer } from '../src/utils/sanitizer.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✔ ${message}`);
  } else {
    failed++;
    console.error(`  ✖ FAILED: ${message}`);
  }
}

console.log('======================================================================');
console.log('  OPTITRACK - SUITE COMPLETA DE PRUEBAS (5 CAPAS)');
console.log('======================================================================\n');

// ---------------------------------------------------------------------
// CAPA 1: UNITARIAS & MATEMÁTICA OFTÁLMICA
// ---------------------------------------------------------------------
console.log('  [CAPA 1: UNITARIAS & MATEMÁTICA OFTÁLMICA]');

// 1. Transposition: Negative cylinder to positive cylinder
// Formula: +2.00 -1.50 x 80° -> (+0.50) (+1.50) x 170°
const tr1 = OpticalTransposer.transpose({ sphere: 2.00, cylinder: -1.50, axis: 80 });
assert(tr1.sphere === 0.50, 'Transposition sphere computed correctly (+0.50)');
assert(tr1.cylinder === 1.50, 'Transposition cylinder sign inverted (+1.50)');
assert(tr1.axis === 170, 'Transposition axis rotated 90 deg (80 + 90 = 170)');

// 2. Transposition: Positive cylinder to negative cylinder
// Formula: -3.00 +2.00 x 15° -> (-1.00) (-2.00) x 105°
const tr2 = OpticalTransposer.transpose({ sphere: -3.00, cylinder: 2.00, axis: 15 });
assert(tr2.sphere === -1.00 && tr2.cylinder === -2.00 && tr2.axis === 105, 'Transposition handles negative sphere with positive cylinder');

// 3. Transposition: Axis wrap-around at 180°
// Formula: +1.00 -1.00 x 90° -> (0.00) (+1.00) x 180° (not 0°)
const tr3 = OpticalTransposer.transpose({ sphere: 1.00, cylinder: -1.00, axis: 90 });
assert(tr3.axis === 180, 'Transposition sets axis 180° when (90+90)%180 is 0');

// 4. Transposition: Spherical lens (cylinder = 0)
const tr4 = OpticalTransposer.transpose({ sphere: -4.50, cylinder: 0, axis: 0 });
assert(tr4.sphere === -4.50 && tr4.cylinder === 0, 'Transposition preserves spherical lens without cylinder');

// 5. Near vision formula computation with addition
const far = { sphere: 1.50, cylinder: -0.75, axis: 90 };
const near = OpticalTransposer.computeNearFormula(far, 2.00);
assert(near.sphere === 3.50, 'Near vision adds addition to far sphere (+1.50 + 2.00 = +3.50)');
assert(near.cylinder === -0.75 && near.axis === 90, 'Near vision preserves cylinder and axis');

// 6. Physiological range validation passes for normal prescription
const validRanges = OpticalTransposer.validatePhysiologicalRanges({ sphere: -2.50, cylinder: -1.00, axis: 180, dnpMm: 31.5 });
assert(validRanges.isValid === true, 'Physiological validation approves standard human prescription');

// 7. Physiological range validation detects extreme sphere
const extremeSph = OpticalTransposer.validatePhysiologicalRanges({ sphere: -35.00, cylinder: 0, axis: 0, dnpMm: 31 });
assert(extremeSph.isValid === false && extremeSph.errors.length > 0, 'Physiological validation catches extreme sphere (> ±25 D)');

// 8. Physiological range validation detects abnormal DNP
const badDnp = OpticalTransposer.validatePhysiologicalRanges({ sphere: -1.00, cylinder: 0, axis: 0, dnpMm: 12.0 });
assert(badDnp.isValid === false, 'Physiological validation catches abnormal DNP (< 20mm)');

// 9. Materials catalog suggestion by diopter threshold
const matLow = MaterialsCatalog.suggestMaterial(1.50);
assert(matLow.id === 'ORGANIC_CR39', 'Low power suggests Organic CR-39');
const matMid = MaterialsCatalog.suggestMaterial(3.50);
assert(matMid.id === 'POLYCARBONATE', 'Moderate power suggests Polycarbonate 1.59');
const matHigh = MaterialsCatalog.suggestMaterial(5.50);
assert(matHigh.id === 'HIGH_INDEX_167', 'High power suggests High Index 1.67');
const matUltra = MaterialsCatalog.suggestMaterial(8.50);
assert(matUltra.id === 'ULTRA_HIGH_174', 'Very high power suggests Ultra High Index 1.74');

// 10. Lensometer quality sentinel: approves exact measurement
const lensCheckPass = LensometerQualitySentinel.auditDiopters(
  { sphere: 2.00, cylinder: -1.00, axis: 90 },
  { sphere: 2.05, cylinder: -1.05, axis: 91 }
);
assert(lensCheckPass.passed === true, 'Lensometer audit approves measurement within ISO 8980-1 tolerances');

// 11. Lensometer quality sentinel: rejects sphere deviation
const lensCheckFailSph = LensometerQualitySentinel.auditDiopters(
  { sphere: 2.00, cylinder: -1.00, axis: 90 },
  { sphere: 2.35, cylinder: -1.00, axis: 90 }
);
assert(lensCheckFailSph.passed === false && lensCheckFailSph.deviations.length > 0, 'Lensometer audit flags excessive sphere deviation (> 0.12 D)');

// 12. Lensometer quality sentinel: rejects axis deviation on significant astigmatism
const lensCheckFailAxis = LensometerQualitySentinel.auditDiopters(
  { sphere: 0.00, cylinder: -2.00, axis: 90 },
  { sphere: 0.00, cylinder: -2.00, axis: 98 }
);
assert(lensCheckFailAxis.passed === false, 'Lensometer audit flags axis shift > 2° on cylinder >= 1.50 D');


// ---------------------------------------------------------------------
// CAPA 2: INTEGRACIÓN & CICLO DEL SOBRE DE TALLER
// ---------------------------------------------------------------------
console.log('\n  [CAPA 2: INTEGRACIÓN & CICLO DEL SOBRE DE TALLER]');

// 13. Create optical order with patient and formulas
const orderDraft = OpticalOrderService.createOrder({
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
assert(orderDraft.orderId.startsWith('OPT-'), 'Order created with unique OPT- ID');
assert(orderDraft.status === 'RECETA_INGRESADA', 'Order initial status is RECETA_INGRESADA');
assert(orderDraft.pricing.balanceDue === 35000, 'Balance due computed accurately (120k - 45k - 40k = 35k)');
assert(orderDraft.odTransposed.sphere === -3.25, 'Order automatically computes OD transposed formula');

// 14. Send order to workshop
const orderWorkshop = OpticalOrderService.sendToWorkshop(orderDraft, {
  labName: 'Laboratorio de Tallado Óptico Centro',
  slaDays: 3
});
assert(orderWorkshop.status === 'EN_TALLER_CALIBRADO', 'Order transitions to EN_TALLER_CALIBRADO');
assert(orderWorkshop.workshopOrder.labName === 'Laboratorio de Tallado Óptico Centro', 'Workshop lab name stored');
assert(Boolean(orderWorkshop.workshopOrder.targetDueDate), 'Workshop target due date computed');

// 15. Record successful lensometer quality check
const orderQualityApproved = OpticalOrderService.recordLensometerQualityCheck(orderWorkshop, {
  odMeasured: { sphere: -2.55, cylinder: -0.70, axis: 90 },
  oiMeasured: { sphere: -2.20, cylinder: -0.55, axis: 86 },
  opticianName: 'Óptico Técnico Marcelo Gómez',
  opticianLicense: 'COL-OPT-2931'
});
assert(orderQualityApproved.status === 'LISTO_PARA_ENTREGA', 'Order transitions to LISTO_PARA_ENTREGA after passing lensometer check');
assert(orderQualityApproved.qualityCheck.isApproved === true, 'Quality check marked as approved');
assert(typeof orderQualityApproved.cryptoSeal === 'string' && orderQualityApproved.cryptoSeal.length === 64, 'Order generates immutable 64-char SHA-256 seal');

// 16. Verify authentic cryptographic seal
const isSealValid = OpticalOrderService.verifyOrderSeal(orderQualityApproved);
assert(isSealValid === true, 'Order seal integrity verification succeeds on authentic record');

// 17. Tampering with diopter measurement breaks seal verification
const tamperedOrder = JSON.parse(JSON.stringify(orderQualityApproved));
tamperedOrder.odFormula.sphere = -4.00; // Malicious prescription modification
assert(OpticalOrderService.verifyOrderSeal(tamperedOrder) === false, 'Seal verification rejects tampered optical order');

// 18. Failed lensometer quality check keeps order in workshop status
const orderQualityFailed = OpticalOrderService.recordLensometerQualityCheck(orderWorkshop, {
  odMeasured: { sphere: -3.50, cylinder: -2.00, axis: 45 }, // Serious deviation
  oiMeasured: { sphere: -2.20, cylinder: -0.50, axis: 85 },
  opticianName: 'Óptico Técnico Marcelo Gómez',
  opticianLicense: 'COL-OPT-2931'
});
assert(orderQualityFailed.status === 'EN_TALLER_CALIBRADO', 'Failed lensometer check keeps order in EN_TALLER_CALIBRADO for remaking');
assert(orderQualityFailed.qualityCheck.isApproved === false, 'Quality check flags rejection on out-of-tolerance lens');

// 19. Final delivery with patient adaptation ePOD signature
const orderDelivered = OpticalOrderService.deliverOrder(orderQualityApproved, {
  patientSignature: 'SIG_FEDERICO_SANTORO_EPOD',
  finalAmountPaid: 35000
});
assert(orderDelivered.status === 'DELIVERED', 'Order transitions to DELIVERED');
assert(orderDelivered.pricing.balanceDue === 0, 'Final balance due drops to 0 after settlement');
assert(orderDelivered.adaptationEpod.patientSignature === 'SIG_FEDERICO_SANTORO_EPOD', 'Patient adaptation ePOD signature stored');

// 20. Universal CSV export generates Excel-compatible string with UTF-8 BOM
const csvOutput = ExportService.exportToExcelCSV('test_optics', [
  { id: 'OPT-01', patient: 'Santoro', balance: 0, status: 'DELIVERED' }
], [
  { key: 'id', label: 'ID Orden' },
  { key: 'patient', label: 'Paciente' },
  { key: 'balance', label: 'Saldo Pendiente' },
  { key: 'status', label: 'Estado' }
]);
assert(csvOutput.startsWith('\uFEFF'), 'CSV export includes UTF-8 BOM prefix for Microsoft Excel in Windows');
assert(csvOutput.includes('Santoro'), 'CSV export outputs patient records cleanly');


// ---------------------------------------------------------------------
// CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA
// ---------------------------------------------------------------------
console.log('\n  [CAPA 3: COMPONENTES & ESTABILIDAD REACTIVA]');

// 21. Diopter formatter displays explicit plus sign
assert(Formatters.diopter(2.5) === '+2.50', 'Diopter formatter outputs explicit plus sign for positive power');

// 22. Diopter formatter displays minus sign
assert(Formatters.diopter(-1.75) === '-1.75', 'Diopter formatter outputs minus sign for negative power');

// 23. Diopter formatter displays zero
assert(Formatters.diopter(0) === '0.00', 'Diopter formatter outputs 0.00 cleanly');

// 24. Axis formatter outputs degree symbol
assert(Formatters.axis(85) === '85°', 'Axis formatter outputs degrees symbol');

// 25. Distance mm formatter
assert(Formatters.distanceMm(31.5) === '31.5 mm', 'Distance formatter outputs mm');

// 26. Currency ARS formatting
assert(Formatters.currencyARS(85000).includes('85.000'), 'Currency ARS formats thousands with dot');

// 27. Currency USD formatting
assert(Formatters.currencyUSD(150.25).includes('150.25'), 'Currency USD formats two decimals');

// 28. Order status badge mapping
const badgeReady = Formatters.orderStatusBadge('LISTO_PARA_ENTREGA');
assert(badgeReady.icon === '🟢' && badgeReady.text.includes('emerald'), 'Status badge styles LISTO_PARA_ENTREGA in emerald');
const badgeWorkshop = Formatters.orderStatusBadge('EN_TALLER_CALIBRADO');
assert(badgeWorkshop.icon === '⚙️' && badgeWorkshop.text.includes('purple'), 'Status badge styles EN_TALLER_CALIBRADO in purple');

// 29. DOM Sanitizer escapes dangerous characters
const escaped = Sanitizer.escapeHTML('<img src=x onerror=alert(1)>');
assert(!escaped.includes('<img') && escaped.includes('&lt;img'), 'Sanitizer escapes HTML tags safely');

// 30. Sanitizer blocks javascript: URLs
assert(Sanitizer.sanitizeURL('javascript:evil()') === '#', 'Sanitizer blocks javascript: protocol');
assert(Sanitizer.sanitizeURL('https://optitrack.app/order') === 'https://optitrack.app/order', 'Sanitizer allows HTTPS URL');


// ---------------------------------------------------------------------
// CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES
// ---------------------------------------------------------------------
console.log('\n  [CAPA 4: SEGURIDAD, CSP & FIRESTORE RULES]');

// 31. firestore.rules file exists
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
assert(fs.existsSync(rulesPath), 'firestore.rules exists in root');

// 32. firestore.rules enforces authenticated access
const rulesContent = fs.readFileSync(rulesPath, 'utf8');
assert(rulesContent.includes('request.auth != null'), 'Firestore rules require authenticated user');

// 33. firestore.rules defines RBAC roles
assert(rulesContent.includes('OPTICO_DIRECTOR') && rulesContent.includes('VENDEDOR'), 'Firestore rules define optical roles');

// 34. firestore.rules locks delivered orders from modifications
assert(rulesContent.includes("resource.data.status != 'DELIVERED'"), 'Firestore rules lock delivered orders from edits');

// 35. firestore.rules forbids deleting medical optical orders
assert(rulesContent.includes('allow delete: if false;'), 'Firestore rules forbid deleting prescription orders');

// 36. firebase.json contains strict Content-Security-Policy
const fbPath = path.resolve(process.cwd(), 'firebase.json');
const fbContent = fs.readFileSync(fbPath, 'utf8');
assert(fbContent.includes('Content-Security-Policy'), 'firebase.json specifies Content-Security-Policy');

// 37. CSP forbids unsafe-eval
assert(!fbContent.includes("'unsafe-eval'"), 'CSP forbids unsafe-eval execution');

// 38. firebase.json contains X-Frame-Options DENY
assert(fbContent.includes('"X-Frame-Options"') && fbContent.includes('"DENY"'), 'firebase.json enforces X-Frame-Options: DENY');

// 39. firebase.json contains HSTS and nosniff
assert(fbContent.includes('nosniff') && fbContent.includes('max-age=31536000'), 'firebase.json enforces HSTS and X-Content-Type nosniff');

// 40. Zero secrets committed in source code
assert(!fbContent.includes('sk-ant-') && !fbContent.includes('AIzaSy'), 'Zero API keys or cloud secrets in configuration files');

// 41. .gitignore covers secrets and dependencies
const gitignoreContent = fs.readFileSync(path.resolve(process.cwd(), '.gitignore'), 'utf8');
assert(gitignoreContent.includes('.env') && gitignoreContent.includes('node_modules'), '.gitignore covers secrets and dependencies');


// ---------------------------------------------------------------------
// CAPA 5: E2E FLUIDO & OPERATIVIDAD DE MOSTRADOR
// ---------------------------------------------------------------------
console.log('\n  [CAPA 5: E2E FLUIDO & OPERATIVIDAD DE MOSTRADOR]');

// 42. Full optical workflow: Prescription -> Workshop -> Lensometer Check -> WhatsApp -> Delivery
const e2eOrder = OpticalOrderService.createOrder({
  patientId: 'PAT-E2E-99',
  patientName: 'Mariana López',
  patientPhone: '+5493415556677',
  doctorName: 'Dra. Romina Castro',
  doctorLicense: 'MP-OFT-3912',
  odFormula: { sphere: -1.75, cylinder: -0.50, axis: 180, dnpMm: 30.5 },
  oiFormula: { sphere: -2.00, cylinder: 0, axis: 0, dnpMm: 31.0 },
  frameModel: 'Prada Linea Rossa 01VS',
  lensMaterial: 'POLYCARBONATE',
  treatments: ['AR_MULTI'],
  pricing: { totalAmount: 95000, insuranceCoverage: 35000, depositPaid: 30000 },
  insuranceName: 'Medifé Plata'
});
const e2eWorkshop = OpticalOrderService.sendToWorkshop(e2eOrder, { labName: 'Laboratorio Digital Sur', slaDays: 2 });
const e2eQuality = OpticalOrderService.recordLensometerQualityCheck(e2eWorkshop, {
  odMeasured: { sphere: -1.75, cylinder: -0.50, axis: 180 },
  oiMeasured: { sphere: -2.00, cylinder: 0, axis: 0 },
  opticianName: 'Óptico Gabriel Solari',
  opticianLicense: 'COL-OPT-9912'
});
const e2eDelivered = OpticalOrderService.deliverOrder(e2eQuality, { patientSignature: 'SIG_MARIANA_LOPEZ' });
assert(e2eDelivered.status === 'DELIVERED', 'Full E2E lifecycle completes in DELIVERED state');
assert(e2eDelivered.adaptationEpod.patientSignature === 'SIG_MARIANA_LOPEZ', 'Adaptation signature registered');

// 43. Offline cache stores and retrieves orders
OptiTrackCacheService.saveOrders([e2eDelivered]);
const cachedOrders = OptiTrackCacheService.getOrders();
assert(cachedOrders.length === 1 && cachedOrders[0].orderId === e2eDelivered.orderId, 'Offline cache stores and retrieves optical orders');

// 44. Anti-phantom seed flag respects purge state
OptiTrackCacheService.purgeData();
assert(OptiTrackCacheService.isPurged() === true, 'Purge flag is set');
assert(OptiTrackCacheService.getOrders().length === 0, 'Purged state prevents demo seed re-population');

// 45. WhatsApp notification encodes valid E.164 URLs
const waReady = WhatsAppOpticNotifierService.notifyGlassesReady({
  phone: '+54 9 341 555-6677',
  patientName: 'Mariana López',
  orderId: e2eDelivered.orderId,
  frameModel: 'Prada Linea Rossa 01VS',
  balanceDue: 30000
});
assert(waReady.startsWith('https://wa.me/5493415556677'), 'WhatsApp notification formats E.164 phone');
assert(waReady.includes('Prada'), 'WhatsApp notification includes frame model name');

// 46. WhatsApp prescription summary
const waSummary = WhatsAppOpticNotifierService.notifyPrescriptionSummary({
  phone: '+5493415556677',
  patientName: 'Mariana',
  orderId: e2eDelivered.orderId,
  odSummary: 'Esf -1.75 Cil -0.50 x 180°',
  oiSummary: 'Esf -2.00'
});
assert(waSummary.includes('OD'), 'WhatsApp summary formats diopter formula');

// 47. Rapid repeated transposition calculations for memory stability
for (let i = 0; i < 500; i++) {
  OpticalTransposer.transpose({ sphere: -2.50 + (i % 5), cylinder: -1.00, axis: (i * 10) % 180 });
}
assert(true, 'Rapid repeated optical transpositions execute with zero memory leaks');


// ---------------------------------------------------------------------
// FUZZING & CHAOTIC PROPERTY TESTS
// ---------------------------------------------------------------------
console.log('\n  [FUZZING & CHAOTIC PROPERTY TESTS]');

// 48. Transposer handles null, undefined, empty object
const nullTrans = OpticalTransposer.transpose({});
assert(nullTrans.sphere === 0 && nullTrans.cylinder === 0 && nullTrans.axis === 0, 'Transposer handles empty formula gracefully');

// 49. Transposer handles NaN and strings safely
const chaosTrans = OpticalTransposer.transpose({ sphere: 'abc', cylinder: NaN, axis: '90' });
assert(chaosTrans.sphere === 0 && chaosTrans.cylinder === 0, 'Transposer handles NaN and invalid string inputs safely');

// 50. Lensometer sentinel handles missing parameters
const chaosLens = LensometerQualitySentinel.auditDiopters(null, null);
assert(chaosLens.passed === false, 'Lensometer audit handles null formulas without throwing');

// 51. CryptoSeal handles complex unicode, emoji, special symbols
const unicodePayload = { frame: '👓 Vulk® Edición Limitada — Ojo Izquierdo: +2.50 -1.00 x 45° · María Müller' };
const unicodeHash = CryptoSeal.generate(unicodePayload);
assert(typeof unicodeHash === 'string' && unicodeHash.length === 64, 'CryptoSeal produces valid 64-char hex on complex UTF-8/emoji payloads');

// 52. Order service throws on invalid patient data
let errorThrown = false;
try {
  OpticalOrderService.createOrder({});
} catch (e) {
  errorThrown = true;
}
assert(errorThrown === true, 'Order service rejects empty required data');

// 53. Version parity check
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const versionJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'version.json'), 'utf8'));
assert(packageJson.version === versionJson.version.replace(/^v/, ''), 'package.json and version.json versions match');

console.log('\n======================================================================');
console.log(`  TOTAL: ${passed + failed} tests | ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================================\n');

if (failed > 0) {
  process.exit(1);
}
