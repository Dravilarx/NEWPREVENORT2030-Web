# Matriz de Permisos RBAC y Data Masking

## Roles (RBAC)
- **Administrador:** Acceso total al sistema y configuraciones.
- **Médico:** Gestión de atenciones y diagnósticos.
- **Empresa (Contratista):** Solo visualización de sus propios trabajadores y resultados.
- **Empresa (Mandante):** Visualización global de dotación en faena.

## Data Masking
- Protocolos de ofuscación de datos sensibles para roles no médicos (Ley 19.628).
# 🔐 Matriz de Permisos: matriz_permisos_rbac.md

Este documento define las políticas de control de acceso para la plataforma Prevenort, asegurando el cumplimiento legal y la integridad de los datos clínicos.

---

## 1. Definición de Roles del Sistema
- **Admin**: Gestión de usuarios, clínicas y catálogos de cargos.
- **Médico**: Validación clínica, diseño de remediación y firma de certificados.
- **Técnico**: Captura de datos en terreno y ejecución de exámenes.
- **Empresa**: Gestión de dotación, agendamiento y descarga de certificados.
- **Trabajador**: Consulta de resultados propios y seguimiento de su plan de salud.

---

## 2. Matriz de Permisos Detallada

| Módulo / Tabla | Admin | Médico | Técnico | Empresa | Trabajador |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Datos Personales** | CRUD | CRUD | R | R | R |
| **Resultados Laboratorio** | R | CRUD | CR | NO ACCESO | R |
| **Veredicto de Aptitud** | CRUD | CRUD | R | R | R |
| **Planes de Remediación** | CRUD | CRUD | R | R (Admin) | CRUD |
| **Certificados (PDF)** | CRUD | CRUD | R | R | R |
| **Gestión de Citas** | CRUD | R | R | CRUD | R |

---

## 3. Políticas de Seguridad Críticas

### A. Protección de Datos Sensibles (Ley 20.584)
- Los agentes de IA y la interfaz de usuario deben filtrar cualquier diagnóstico médico para el rol **Empresa**. 
- La empresa solo recibe: `Estado` (Apto/No Apto/Remediación), `Vigencia` y `Fecha de Resolución`.

### B. Firma Electrónica Avanzada
- El campo `certificado_firmado` solo puede cambiar a `TRUE` tras una validación exitosa del token de seguridad del **Médico Evaluador**.

### C. Auditoría Inmutable
- Todas las acciones de creación o modificación (CUD) deben quedar registradas en una tabla de `logs_auditoria` que incluya: `user_id`, `timestamp`, `ip_address` y `accion_realizada`.

---

## 4. Implementación en Antigravity
El orquestador debe validar el token JWT del usuario antes de permitir la ejecución de cualquier **Skill** (ej: `generar_certificado`). Si el rol no coincide con la matriz, el Skill debe retornar un error `403 Forbidden`.