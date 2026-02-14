# Cumplimiento Legal: Auditoría Inmutable y Protección de Datos

## Requerimientos
- **Auditoría de Logs:** Registro inmutable de todos los accesos a fichas médicas.
- **Ley 19.628:** Estándares de protección de la vida privada y datos de carácter personal.
- **Custodia:** Protocolos de respaldo y retención de información médica.
# ⚖️ Cumplimiento Legal y Normativo: cumplimiento_legal.md

Este documento define el marco legal bajo el cual opera la plataforma Prevenort, asegurando la protección de datos sensibles y la validez de los certificados emitidos.

---

## 1. Protección de Datos Sensibles (Ley 19.628)
- **Definición:** Los resultados de exámenes y diagnósticos son datos sensibles.
- **Protocolo:** Se prohíbe el almacenamiento de datos de salud en dispositivos locales (tablets). Toda la información se procesa en el backend seguro de Supabase con encriptación de grado médico.
- **Acceso:** Solo el personal médico autorizado mediante autenticación de dos factores (2FA) puede acceder a los datos crudos de salud.

---

## 2. Ética Médica y Derechos del Paciente (Ley 20.584)
- **Consentimiento Digital:** El trabajador debe firmar un consentimiento informado en la tablet de admisión antes de proceder. El sistema bloquea el ingreso de datos si este paso no se cumple.
- **Confidencialidad B2B:** El sistema está diseñado para que la empresa mandante reciba solo la "Aptitud Laboral". Bajo ninguna circunstancia se enviarán detalles de patologías o resultados numéricos de exámenes a la empresa, protegiendo la privacidad del trabajador.

---

## 3. Validez de Certificados (Ley 19.799)
- **Firma Avanzada:** Los certificados emitidos tienen el mismo valor legal que un documento firmado en papel, gracias al uso de firmas electrónicas avanzadas vinculadas a la identidad del médico.
- **Repositorio de Auditoría:** Se mantiene un registro inmutable por 15 años (según normativa de salud) de todas las atenciones y certificados generados.

---

## 4. Estándares de Salud Ocupacional (MINSAL)
- **Validación Automática:** El sistema aplica los criterios de la Guía Técnica de Hipobaria Intermitente Crónica para trabajadores en gran altura.
- **Actualización de Reglas:** El administrador de Prevenort es responsable de actualizar los umbrales de la IA ante cambios en las normativas del Ministerio de Salud (MINSAL) o las exigencias de las mutualidades.

---

## 5. Protocolo de Brechas de Seguridad
En caso de detección de un acceso no autorizado:
1. **Bloqueo Inmediato:** Se suspenden los servicios de API y acceso a base de datos.
2. **Notificación:** Se informa a los afectados en un plazo máximo de 72 horas.
3. **Auditoría:** Se genera un reporte técnico de la brecha y las medidas de mitigación tomadas.