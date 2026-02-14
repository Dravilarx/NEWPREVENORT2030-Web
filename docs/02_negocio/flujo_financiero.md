# 💰 Flujo Financiero y de Cierre Administrativo: flujo_financiero.md

Este documento describe la lógica de integración entre la gestión clínica y el sistema de facturación, asegurando que cada atención sea conciliada y cobrada correctamente.

---

## 1. Trigger de Facturación
El proceso de cierre administrativo se dispara automáticamente cuando se cumplen las siguientes condiciones:
1. El veredicto médico ha sido firmado electrónicamente.
2. El certificado de aptitud ha sido generado y cargado en el bucket de almacenamiento.
3. El estado de la atención cambia de `En Evaluación` a `Completado`.

---

## 2. Lógica de Conciliación
El agente financiero de Antigravity ejecuta las siguientes validaciones:

- **Verificación de Batería:** Compara los exámenes efectivamente realizados contra los cargados en la admisión.
- **Aplicación de Convenio:** Consulta la tabla `empresas` para aplicar el descuento o tarifa preferencial pactada con el cliente.
- **Vínculo con OT/OC:** Asocia el número de Orden de Trabajo (OT) y, si existe, la Orden de Compra (OC) para facilitar la aceptación de la factura por parte de la minera.

---

## 3. Reglas de Negocio Financieras

- **No Facturación de Incompletos:** No se puede generar un registro de cobro para atenciones que no tengan un veredicto final firmado (excepto en casos de abandono del trabajador debidamente documentados).
- **Cierre de Remediaciones:** Las atenciones en modo `REMEDIACION` mantienen la OT abierta. El cobro final se gatilla solo cuando se emite el certificado definitivo o se cumple el plazo máximo de 15 días.
- **Trazabilidad Inmutable:** Cada registro financiero debe estar vinculado al `atencion_id` para auditorías de la empresa contratista.

---

## 4. Salida de Datos (Output Administrativo)
El sistema genera un reporte de cierre diario con los siguientes campos para el ERP:
- `ID_Atencion`
- `RUT_Empresa_Cliente`
- `Monto_Neto`
- `Centro_Costo_Minera` (Si aplica)
- `Estado_Certificacion` (Apto / No Apto / Rescate)

---

## 5. Panel de Transparencia (Portal Contratista)
Las empresas tienen una sección de "Consumo y Facturación" donde pueden ver:
- Historial de servicios consumidos en el mes.
- Estado de las órdenes de compra activas.
- Pre-facturas descargables para validación interna antes de la emisión del documento tributario legal.