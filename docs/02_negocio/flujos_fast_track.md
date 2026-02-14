# Flujos Fast-Track: Ingreso, Evaluación y Motor de Decisión

## Descripción
Define los procesos acelerados para la evaluación de trabajadores, integrando el motor de decisión médica.

## Etapas del Flujo
1. **Ingreso:** Captura de datos inicial del trabajador.
2. **Evaluación:** Aplicación de protocolos médicos automatizados.
3. **Decisión:** Clasificación automática basada en parámetros de salud.
# 🚀 Flujo de Trabajo: Fast-Track Minero (Prevenort)

Este documento describe el flujo operativo optimizado para el centro médico, diseñado para eliminar cuellos de botella y garantizar la entrega inmediata de certificados de aptitud.

---

## 1. Fase A: Ingreso y Admisión
El objetivo es reducir el tiempo de espera inicial y asegurar que el trabajador realice la batería de exámenes correcta.

- **Check-in Digital**: El trabajador escanea su cédula de identidad. El sistema consulta automáticamente la base de datos de la empresa para identificar el cargo y la faena de destino.
- **Asignación Automática**: Basado en el cargo (ej. Gran Altura Geográfica, Operador de Maquinaria), el sistema carga la batería de exámenes específica (Espirometría, Psicosensométrico, Laboratorio, etc.).
- **Notificación de Inicio**: Se dispara un evento hacia el Portal de la Empresa Contratista, informando que el trabajador ha iniciado su proceso de evaluación.

---

## 2. Fase B: Evaluación Clínica e IA
Captura de datos ágil y validación en tiempo real para evitar errores de re-ingreso.

- **Carga en Tablets**: Los técnicos ingresan signos vitales y resultados directamente en dispositivos móviles sincronizados con Supabase.
- **Validación Paramétrica (Skill IA)**: Mientras se ingresan los datos, el agente de IA compara los valores con los límites normativos. Si un parámetro es crítico (ej. Presión Arterial > 140/90), el sistema emite una alerta visual naranja inmediata.
- **Integración de Laboratorio**: Los resultados de equipos médicos con API o archivos PDF (vía OCR) se inyectan automáticamente en la ficha del paciente.

---

## 3. Fase C: Veredicto y Remediación
Uso del motor de decisión para determinar la aptitud de manera objetiva.

- **Propuesta de Veredicto**: La IA analiza el conjunto de exámenes y sugiere un estado: **Apto**, **No Apto** o **Remediación**.
- **Gestión de Remediación**: Si el trabajador es "No Apto" por una condición tratable, la IA genera un plan de acción (ej. derivación a especialista o monitoreo de 7 días). El trabajador recibe este plan en su App para iniciar su "rescate" de inmediato.El plan tambien puede realizarse en forma manual por el médico.
- **Validación Médica**: El médico evaluador revisa la propuesta de la IA, realiza ajustes si es necesario y confirma el veredicto final.


## 4. Fase D: Certificación Legal y Cierre
Finalización del proceso con validez jurídica y entrega instantánea.

- **Firma Electrónica Avanzada**: El certificado se firma digitalmente cumpliendo con los estándares legales chilenos.
- **Código QR de Verificación**: Cada documento incluye un código QR único que permite a la minera validar la autenticidad del certificado en terreno.
- **Entrega Omnicanal**:
    - **Empresa**: Descarga disponible en el portal.
    - **Trabajador**: Copia digital en su App personal.
    - **Finanzas**: Generación automática de la orden de facturación (OT) al cerrarse el ciclo.

---

## 📊 Matriz de Estados del Flujo

| Estado | Significado | Acción del Sistema |
| :--- | :--- | :--- |
| **Ingresado** | En recepción | Notifica a la empresa inicio de atención. |
| **En Evaluación** | Realizando exámenes | Bloquea edición de datos previos. |
| **En Remediación** | Bajo plan médico | Activa seguimiento en la App del Trabajador. |
| **Cerrado** | Certificado emitido | Envía PDF firmado y cierra la OT. |
