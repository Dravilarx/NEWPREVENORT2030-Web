# Certificación Legal: Firma Electrónica y Validación QR

## Especificaciones
- **Firma Electrónica Avanzada:** Implementación de flujos de firma para certificados médicos.
- **Validación QR:** Sistema de verificación de integridad y autenticidad en terreno.
# ⚖️ Certificación y Validez Legal: certificacion_legal.md

Este documento describe los protocolos de seguridad y legalidad aplicados a los documentos emitidos por la plataforma Prevenort.

---

## 1. Protocolo de Firma Electrónica
Todo veredicto médico debe ser validado mediante **Firma Electrónica Avanzada (FEA)** conforme a la Ley 19.799.
- **Autorización:** El botón de firma solo se activa tras la validación 2FA del médico.
- **Integridad:** Una vez firmado, el archivo PDF es sellado criptográficamente. Cualquier modificación posterior invalidará el sello digital.

---

## 2. Sistema de Verificación QR
- **Ubicación:** El código QR se sitúa en la esquina inferior izquierda de cada certificado.
- **Función:** Permite a los guardias de seguridad o prevencionistas en faena validar la aptitud en tiempo real.
- **Seguridad:** El enlace de validación no requiere login, pero solo muestra datos de aptitud administrativa (Apto/No Apto), nunca datos clínicos.

---

## 3. Inmutabilidad y Auditoría
- **Logs de Emisión:** Cada certificado genera una entrada en la tabla `certificados_legales` con su `hash_sha256`.
- **Bloqueo de Edición:** Al emitirse el certificado, la tabla `resultados_clinicos` asociada a esa atención queda en modo "Solo Lectura" permanentemente.

---

## 4. Verificador de Autenticidad (URL)
El servicio de verificación responderá con uno de los siguientes tres estados al ser consultado por la empresa:
1. **VÁLIDO:** El documento coincide con los registros originales.
2. **CADUCADO:** El certificado ha superado su fecha de vigencia.
3. **INVÁLIDO:** El hash del documento no coincide o el certificado fue anulado.