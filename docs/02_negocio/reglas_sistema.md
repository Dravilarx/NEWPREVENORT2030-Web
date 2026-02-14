# Reglas del Sistema: Normativa Minera y Privacidad

## Normativas Aplicables
- **Normativa Minera:** Estándares de salud para trabajos en altura y espacios confinados.
- **Ley 20.584:** Derechos y deberes de los pacientes.
- **Validación:** Lógica de verificación de identidad y documentos.
# 📖 Reglas del Sistema: reglas_sistema.md

Este documento centraliza las reglas de negocio, validaciones clínicas y restricciones operativas que rigen el ecosistema Prevenort. Estas reglas deben ser consultadas por los agentes de Antigravity para garantizar la integridad del proceso médico-minero.

---

## 1. Reglas de Admisión y Registro
* **R1 - Identidad Única**: No se permite iniciar una atención sin la validación del RUT o Pasaporte. El sistema debe verificar la vigencia de los datos antes de asignar una batería de exámenes.
* **R2 - Selección de Batería**: La batería de exámenes se asigna de forma automática cruzando el `Cargo` del trabajador con los riesgos de la `Faena` (ej: Gran Altura Geográfica, Espacios Confinados, Conducción de Maquinaria Pesada).
* **R3 - Bloqueo por Consentimiento**: Queda estrictamente prohibido avanzar a la etapa de toma de exámenes si el "Consentimiento Informado" no ha sido firmado digitalmente y cargado en el sistema.

---

## 2. Umbrales de Validación Clínica (IA-Thresholds)
Reglas de decisión automática basadas en parámetros fisiológicos:

* **R4 - Presión Arterial (Norma Hipobaria)**: 
    * **Alerta Naranja**: Si la presión es ≥ 140/90 mmHg, la IA debe sugerir el estado "Remediación" y activar el protocolo de monitoreo.
    * **Alerta Roja**: Si la presión es ≥ 160/100 mmHg, el sistema marca "No Apto Temporal" de inmediato.
* **R5 - Glicemia**: Resultados > 110 mg/dL en ayuno activan automáticamente la sugerencia de evaluación nutricional en el plan de remediación.
* **R6 - Integridad de Resultados**: No se puede emitir un veredicto de "Apto" si falta un solo resultado de la batería de exámenes obligatoria.

---

## 3. Reglas de Privacidad y Acceso (Data Masking)
* **R7 - Confidencialidad Diagnóstica**: El sistema debe anonimizar o filtrar diagnósticos específicos (ej: patologías crónicas) para los usuarios con rol `Empresa_Contratista`. 
    * *Acción*: La empresa solo recibe el estado administrativo (**Apto**, **No Apto** o **Remediación**).
* **R8 - Trazabilidad Médica**: Toda modificación de un resultado clínico después de haber sido guardado debe generar un log de auditoría inmutable que indique quién, cuándo y por qué se cambió el dato.

---

## 4. Reglas del Módulo de Remediación
* **R9 - Elegibilidad**: Solo pueden entrar a remediación trabajadores con condiciones "recuperables" en un plazo máximo de 15 días corridos.
* **R10 - Caducidad de Planes**: Si un plan de remediación no presenta nuevas cargas de datos o hitos cumplidos en 10 días, el sistema cerrará la atención automáticamente como "No Apto" por abandono de proceso.

---

## 5. Reglas de Certificación y Cierre Administrativo
* **R11 - Firma Electrónica**: Un certificado solo adquiere validez legal si posee la Firma Electrónica Avanzada del médico evaluador.
* **R12 - Validación por QR**: Todo certificado debe incluir un código QR único que apunte al servicio de verificación de Prevenort para evitar falsificaciones en los puntos de control de las minas.
* **R13 - Cierre de OT**: La emisión del certificado gatilla automáticamente el cambio de estado de la Orden de Trabajo a "Facturable".