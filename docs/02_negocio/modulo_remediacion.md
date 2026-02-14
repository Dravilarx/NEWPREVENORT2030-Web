# Módulo de Remediación: "Camino a la Aptitud"

## Objetivo
Gestionar el proceso de recuperación de trabajadores no aptos temporalmente para que vuelvan a su estado de aptitud.

## Componentes
- **Plan de Acción:** Pasos médicos requeridos.
- **ROI de Rescate:** Cálculo del ahorro por trabajador recuperado.
- **Seguimiento:** Monitorización de hitos de salud.
# 🩺 Módulo de Remediación y Rescate (Prevenort)

Este documento describe la lógica de "Rescate del Trabajador", una funcionalidad crítica de Prevenort que permite gestionar el retorno a la aptitud de trabajadores con condiciones de salud tratables, optimizando la dotación de las empresas contratistas.

---

## 1. Definición y Propósito
El módulo de remediación transforma un resultado potencialmente "No Apto" en un proceso de acompañamiento médico. Su objetivo es estabilizar parámetros clínicos desviados para que el trabajador obtenga su certificación de aptitud en el menor tiempo posible.

---

## 2. Criterios de Entrada (Lógica de IA)
El `Agente_Evaluador_IA` categoriza automáticamente una atención como "En Remediación" cuando los valores se encuentran en los siguientes rangos:

| Hallazgo Clínico | Rango de Remediación | Acción Inmediata de la IA |
| :--- | :--- | :--- |
| **Presión Arterial** | 140/90 a 159/99 mmHg | Genera orden de monitoreo (MAPA). |
| **Glicemia (Ayuno)** | 100 - 125 mg/dL | Sugiere evaluación nutricional y re-test. |
| **IMC (Obesidad I)** | 30.0 - 34.9 | Propone plan de acondicionamiento físico. |
| **Fatiga (Psicosens.)** | Desviación estándar > 8% | Sugiere re-evaluación tras 8h de sueño. |

---

## 3. Flujo Operativo del Rescate

1. **Activación**: Al detectarse el hallazgo, el sistema cambia el estado de la atención a `REMEDIACION`.
2. **Generación del Plan**: La IA redacta un plan de acción basado en guías clínicas (ej: "Control de presión por 7 días y re-evaluación").
3. **Notificación a la Empresa**: El portal de la contratista muestra el estado administrativo: *"En Remediación - Tiempo estimado de resolución: 10 días"*.
4. **Seguimiento vía App**: El trabajador recibe notificaciones en su móvil con su hoja de ruta y recordatorios de controles.
5. **Cierre de Ciclo**: Una vez cumplidos los hitos, el médico valida la mejora y emite el certificado de aptitud final.

---

## 4. Estructura de Datos (Tabla: `planes_remediacion`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `atencion_id` | `uuid` | Relación con la atención original. |
| `hallazgo_principal`| `text` | Descripción técnica del motivo (ej: HTA leve). |
| `probabilidad_exito`| `int` | Estimación porcentual de la IA para lograr la aptitud. |
| `fecha_limite` | `date` | Plazo máximo para completar el plan. |
| `estado_plan` | `enum` | `activo`, `completado`, `vencido`. |

---

## 5. Privacidad y Confidencialidad (Ley 20.584)
- **Acceso Restringido**: Los detalles específicos de la remediación (ej: valores exactos de exámenes) son visibles solo para el personal médico y el trabajador.
- **Vista Empresa**: La empresa contratista solo recibe información sobre la viabilidad laboral y los plazos de retorno, protegiendo el diagnóstico clínico del paciente.

---

## 6. Análisis de ROI (Retorno de Inversión)
El sistema genera un reporte para la empresa contratista que cuantifica el dinero ahorrado al "rescatar"