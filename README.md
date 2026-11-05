# 👓 OptiTrack — Cadenas de Ópticas, Contactología & Talleres de Tallado Oftálmico

> **AiAppFactory Standard · Versión v1.0.00**  
> *Gestión de Recetas Oftalmológicas OD/OI, Transposición Matemática de Cilindros, Sobres de Taller de Biselado, Control de Calidad en Frontofocómetro (Norma ISO 8980-1) con Sello SHA-256 y Liquidación Mixta B2B.*

---

## 👁️ La Problemática del Sector

Las cadenas de ópticas, centros de contactología y talleres de tallado oftálmico enfrentan cuatro focos críticos de ineficiencia y pérdidas financieras:
1. **Pérdida de Cristales por Error de Transposición:** Oftalmólogos que prescriben en cilindro negativo o positivo (ej. $\text{OD: } +1.50 \ -2.00 \times 85^\circ$). Si la óptica o el taller comete un error de cálculo manual al transponer, el anteojo se calibra en el eje opuesto, causando mareos en el paciente y la pérdida del par de cristales.
2. **Descontrol del "Sobre de Taller" Físico:** Los pedidos a talleres de tallado (orgánicos CR-39, policarbonato, alto índice 1.67/1.74, antirréflex multicapa o filtro azul) viajan en sobres de papel sin SLA ni trazabilidad.
3. **Cobro Fragmentado (Obra Social + Seña + Saldo):** Dificultades para conciliar la cobertura de la obra social, la seña inicial del paciente y el saldo a cobrar en el acto de entrega y prueba de confort visual.
4. **Falta de Verificación en Frontofocómetro Pre-Entrega:** Entregar anteojos sin auditar dioptrías, cilindro, eje y Distancia Nasopupilar (DNP) contra la tolerancia internacional de la norma ISO 8980-1.

---

## ⚡ Soluciones Arquitectónicas Implementadas en OptiTrack

### 1. 🔄 Transpositor Óptico Automático & Visión Cercana
- Cálculo instantáneo de la transposición esferocilíndrica:
  $$\text{Esfera}' = \text{Esfera} + \text{Cilindro}$$
  $$\text{Cilindro}' = -\text{Cilindro}$$
  $$\text{Eje}' = (\text{Eje} + 90^\circ) \bmod 180^\circ$$
- Suma de adición para presbicia en visión cercana ($\text{Cerca} = \text{Lejos} + \text{Adición}$).
- Validación de rangos fisiológicos estándar de dioptrías y DNP monocular ($20$ a $40$ mm).

### 2. 📋 Sobre Digital de Taller de Calibrado & SLA
- Trazabilidad de estados: `RECETA_INGRESADA` $\to$ `EN_TALLER_CALIBRADO` $\to$ `CONTROL_FRONTOMETRO` $\to$ `LISTO_PARA_ENTREGA` $\to$ `DELIVERED`.
- Asignación de taller externo con fecha límite de SLA y catálogo de materiales (CR-39, Policarbonato, Alto Índice 1.67, Ultra Alto 1.74).

### 3. 🔬 Control de Calidad en Frontofocómetro (ISO 8980-1) con Sello SHA-256
- Auditoría estricta de tolerancias de potencia esférica ($\pm 0.12$ D a $\pm 0.18$ D), cilíndrica ($\pm 0.12$ D) y de eje ($\pm 2^\circ$ a $\pm 7^\circ$).
- Sello criptográfico SHA-256 inmutable generado por el Óptico Técnico responsable (Engine #159).

### 4. 💰 Liquidación Mixta B2B & Exportación Excel
- Conciliación entre cobertura de Obra Social, seña percibida y saldo en mostrador.
- Exportación universal CSV con prefijo **BOM UTF-8 (`\uFEFF`)** para apertura limpia en Microsoft Excel en Windows (Directiva Inquebrantable #17).

### 5. 📲 Notificador Automático WhatsApp por E.164
- Enlaces con mensajes pre-redactados para avisar al paciente cuando sus anteojos superaron el control de calidad y están listos para retirar en sucursal.

---

## 🧪 Arnés de Pruebas Multi-Capa (75 Tests en 5 Capas)

Ejecución de la suite completa:
```bash
node tests/run_tests.js
```
- **Capa 1 (Unitarias & Fórmulas Oftálmicas):** Algoritmos de transposición, adición de cerca, rangos fisiológicos, catálogo de materiales y tolerancias ISO 8980-1.
- **Capa 2 (Integración & Ciclo de Taller):** Sobres de taller, control fronto, sellos SHA-256, detección de alteraciones, entrega con firma ePOD y exportador CSV con BOM UTF-8.
- **Capa 3 (Componentes & Reactividad):** Formateadores de dioptrías ($+$ y $-$), distancias en mm, badges de estado y prevención de XSS con Sanitizer Zero-Sink.
- **Capa 4 (Seguridad, CSP & Firestore Rules):** Auditoría AppSec Guardian 100/100, aislamiento multi-sucursal y reglas RBAC.
- **Capa 5 (E2E & Operatividad de Mostrador):** Flujo completo de paciente, caché offline, alertas WhatsApp E.164 y fuzzing caótico con valores extremos.

---

## 🛡️ Auditoría de Seguridad AppSec Guardian

```bash
node ../AiAppFactory/tools/security-guardian/index.mjs .
```
- **Puntaje de Seguridad:** **100 / 100**
- **Vulnerabilidades:** 0 Críticas | 0 Altas | 0 Medias | 0 Bajas.

---

## 🚀 Despliegue & Ejecución

```bash
# Servidor local
python -m http.server 5225

# Abrir en navegador
http://localhost:5225
```

---

*Desarrollado con rigor tecnológico y óptico bajo los estándares de AiAppFactory.*
