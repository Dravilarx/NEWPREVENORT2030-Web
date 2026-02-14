# Especificación de IA: Prompts y Lógica Médica

## Motor Médico
- **Prompts:** Definición de instrucciones para el asistente de diagnóstico.
- **Validación Paramétrica:** Lógica de validación cruzada entre datos médicos y diagnósticos sugeridos por la IA.
- **Modelos:** Gemini 1.5 Flash / Pro para tareas de procesamiento.
# 🧠 Especificación del Motor de IA (Prevenort)

Este documento describe la lógica de inferencia, los umbrales de decisión y la configuración de los prompts que los agentes de Antigravity utilizan para procesar la salud de los trabajadores mineros.

---

## 1. Lógica de Evaluación Paramétrica (Veredicto Automático)

El motor de IA compara los datos capturados en tiempo real contra la matriz de riesgo del cargo. 

### Matriz de Umbrales Críticos
| Parámetro | Rango Normal | Alerta Amarilla (Remediación) | Alerta Roja (No Apto) |
| :--- | :--- | :--- | :--- |
| **Presión Arterial** | < 120/80 mmHg | 140/90 a 159/99 mmHg | ≥ 160/100 mmHg |
| **Glicemia (Ayuno)** | < 100 mg/dL | 100 - 125 mg/dL | ≥ 126 mg/dL |
| **IMC** | 18.5 - 29.9 | 30.0 - 34.9 (Obesidad I) | ≥ 35.0 (Riesgo Cardiovascular) |
| **Saturación O2** | > 93% | 90% - 92% (Hipoxia leve) | < 89% (Crítico) |
| **Test Psicosensomet.** | Error < 5% | Error 5% - 10% | Error > 10% / Fatiga detectada |

---

## 2. Configuración de Prompts (Prompt Engineering)

### A. Skill: `evaluador_clinico`
**System Prompt:**
> "Actúa como un Médico Evaluador Senior de Prevenort. Tu tarea es recibir un objeto JSON con los resultados de los exámenes de un trabajador y compararlos con los requisitos del cargo. 
> 
> **Reglas Críticas:**
> 1. Si el cargo implica 'Gran Altura Geográfica', la presión arterial DEBE ser inferior a 140/90.
> 2. Si detectas una anomalía leve, marca el estado como 'REMEDIACION' y sugiere el paso médico siguiente.
> 3. No menciones diagnósticos específicos en el 'Resumen Ejecutivo' para la empresa, solo la condición de aptitud."

### B. Skill: `diseñador_remediacion`
**System Prompt:**
> "Eres un especialista en medicina preventiva. Cuando un trabajador es desviado a remediación, tu objetivo es crear un plan de acción breve (7-14 días) para que recupere su aptitud.
> 
> **Estructura de respuesta:**
> - Hallazgo: [Descripción técnica]
> - Plan: [Pasos numerados: ej. MAPA, Interconsulta, Dieta]
> - Estimación de Alta: [Días estimados]"

---

## 3. Implementación de Código (Modular)

Los skills han sido implementados como funciones puras en el directorio `lib/skills/`:

| Skill | Archivo Fuente | Descripción |
| :--- | :--- | :--- |
| **Evaluador Clínico** | `lib/skills/evaluadorClinico.ts` | Lógica de validación paramétrica vs límites de cargo. |
| **Gestor de Remediación** | `lib/skills/gestorRemediacion.ts` | Generación automática de planes de acción médicos. |
| **Certificación Legal** | `lib/skills/certificacionLegal.ts` | Preparación de datos para FEA y generación de QR. |
| **Extractor OCR** | `lib/skills/extractorOCR.ts` | Mapeo de datos externos hacia la base de datos. |

---

## 4. Flujo de Inferencia de Antigravity

El agente sigue este flujo lógico para cada atención (`Workflow-ID: WF-02`):

1. **Recolección**: Obtiene `valor_encontrado` de la tabla `resultados_clinicos`.
2. **Contextualización**: Cruza el `cargo_id` para identificar si es un cargo crítico (ej: Operador de Maquinaria Pesada).
3. **Análisis de Skill**: Ejecuta la función `ia_screening` mediante una Edge Function en Supabase.
4. **Persistencia**: Escribe el veredicto en `atenciones.ia_evaluacion`.
5. **Notificación**: Si el veredicto es `REMEDIACION`, dispara un webhook hacia la App del Trabajador con su nuevo plan de salud.

---

## 4. Ética y Explicabilidad (XAI)

Para cumplir con la normativa de salud, cada decisión tomada por la IA debe incluir el campo `justificacion_normativa`.
- **Ejemplo:** *"El trabajador se califica como 'Remediación' porque su IMC de 32.5 aumenta el riesgo cardiovascular para el cargo de conductor, según el protocolo interno de seguridad minera."*

---

## 5. Control de Calidad (Loop de Aprendizaje)

- **Override Humano:** Si el médico jefe cambia un veredicto de la IA, el sistema guarda el par `{ia_decision, humano_decision, razon_cambio}`.
- **Auditoría:** Mensualmente, el agente revisa las discrepancias para ajustar los umbrales de los prompts y reducir falsos positivos.