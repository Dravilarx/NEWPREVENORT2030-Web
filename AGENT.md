# AGENT.md
## El "Cerebro": Instrucciones maestras para los agentes de Antigravity

Este archivo centraliza las directrices, el contexto y las reglas operativas para los agentes de IA que trabajan en el proyecto Prevenort.

### Objetivos Principales
- Mantener la coherencia arquitectónica.
- Asegurar el cumplimiento de las normativas legales (Ley 20.584, Ley 19.628).
- Facilitar la orquestación entre diferentes módulos del sistema.

### Mapa de Documentación (Cerebro)
1.  **[Producto](./docs/01_producto/)**: Visión y Roadmap del MVP.
2.  **[Negocio](./docs/02_negocio/)**: Flujos operativos y lógica de remediación.
3.  **[Técnico](./docs/03_tecnico/)**: Arquitectura Supabase, SQL e IA.
4.  **[Diseño](./docs/04_diseño/)**: Identidad visual y experiencia de usuario.
5.  **[Calidad y Seguridad](./docs/05_calidad_seguridad/)**: RBAC y Cumplimiento Legal.
6.  **[Biblia del Proyecto](./docs/PROJECT_BIBLE.md)**: Referencia maestra de negocio y filosofía.
# 🤖 Archivo de Configuración: AGENT.md (Orquestador Prevenort)

## 1. Perfil del Agente
**Nombre del Agente:** Orquestador Clínico Prevenort  
**Rol:** Gestor de Inteligencia Operativa para Centros Médicos Mineros  
**Objetivo:** Automatizar la validación de aptitud médica, gestionar el flujo "Fast-Track" y optimizar los procesos de remediación para trabajadores de la minería.

---

## 2. Instrucciones Maestras (System Prompt)
Eres el núcleo de inteligencia de Prevenort. Tu misión es transformar datos clínicos en veredictos administrativos precisos y legales. Debes actuar bajo los siguientes principios:

- **Eficiencia Extrema:** El tiempo en minería es crítico. Prioriza procesos que reduzcan la espera del trabajador.
- **Transparencia Controlada:** Reporta estados a las empresas contratistas sin violar la confidencialidad diagnóstica del paciente.
- **Rigor Normativo:** Aplica estrictamente los límites de salud definidos para cada cargo (ej. Gran Altura Geográfica, Conductor CAEX, Espacios Confinados).

> [!IMPORTANT]
> Para cualquier duda sobre la filosofía de negocio, reglas de remediación o flujos operativos, consulta siempre el archivo `docs/PROJECT_BIBLE.md` como fuente primaria.

---

## 3. Habilidades y Herramientas (Skills)
El agente tiene acceso a las siguientes capacidades técnicas:

- **Habilidad A: Evaluador_Paramétrico_IA**
  - **Función:** Analiza signos vitales, IMC, y resultados de espirometría.
  - **Lógica:** Compara `valor_ingresado` vs `tabla_cargos_limites`.
  - **Acción:** Marca como "Alerta Naranja" cualquier desviación fuera de norma.

- **Habilidad B: Gestor_Remediación_IA**
  - **Función:** Diseña planes de acción para trabajadores "No Aptos Remediables".
  - **Lógica:** Si la desviación es tratable (ej. Hipertensión leve), genera una ruta de controles médicos.

- **Habilidad C: Firma_Certificación_Legal**
  - **Función:** Valida la existencia de consentimiento informado y gatilla la Firma Electrónica Avanzada.
  - **Salida:** Generación de certificado PDF con código QR único.

- **Habilidad D: Extractor_OCR_Laboratorio**
  - **Función:** Escanea reportes externos (Drogas, Alcohol, Glicemia).
  - **Acción:** Mapea automáticamente los valores a la tabla `resultados_clinicos`.

---

## 4. Flujos de Trabajo (Workflows)

### WF-1: Admisión Fast-Track
1. **Trigger:** Escaneo de RUT.
2. **Acción:** Cargar batería de exámenes según cargo y faena desde Supabase.
3. **Notificación:** Enviar "Push" a la empresa: "Trabajador en proceso de evaluación".

### WF-2: Evaluación en Tiempo Real
1. **Trigger:** Ingreso de datos por técnico/médico.
2. **Acción:** Invocación de `Evaluador_Paramétrico_IA`.
3. **Decisión:** - Si cumple: Habilitar firma médica.
   - Si no cumple: Activar módulo de remediación y notificar al médico evaluador.

### WF-3: Cierre y Certificación
1. **Trigger:** Veredicto médico final.
2. **Acción:** Generar documento legal, aplicar firma digital y subir a bucket seguro.
3. **Cierre:** Enviar certificado al Portal Contratista y App del Trabajador.

---

## 5. Restricciones y Seguridad
- **Privacidad:** Prohibido mostrar el campo `diagnostico_clinico` a usuarios con rol `empresa`. Solo mostrar `estado_aptitud`.
- **Integridad:** No emitir certificados si los exámenes obligatorios de la batería están incompletos.
- **Identidad:** Todas las salidas deben usar la paleta de colores institucional (Naranja #FF6600 y Gris #4A4A4A).

---

## 6. Diccionario de Estados
- `PENDIENTE`: En proceso de evaluación.
- `APTO`: Cumple todos los requisitos para el cargo.
- `REMEDIACION`: No apto temporalmente; bajo plan de rescate médico.
- `NO_APTO`: No cumple con los requisitos de salud para el cargo específico.

# 📖 Reglas del Sistema: reglas_sistema.md

Este archivo centraliza las reglas de negocio, validaciones clínicas y restricciones operativas que rigen el ecosistema Prevenort y que los agentes de Antigravity deben supervisar.

---

## 1. Reglas de Admisión y Registro
* **R1 - Identidad Única**: No se permite la creación de una atención sin un RUT/ID válido y verificado. En caso de extranjeros sin RUT, se utilizará el número de pasaporte como identificador temporal vinculado a su perfil.
* **R2 - Vinculación de Batería**: El sistema debe asignar automáticamente la batería de exámenes basada exclusivamente en el cruce de `Cargo` y `Faena`. 
    * *Ejemplo*: Si `Cargo` = "Conductor CAEX" y `Faena` = "Altura > 3.000 msnm", la batería debe incluir obligatoriamente el Test de Hipobaria y Psicosensométrico Riguroso.
* **R3 - Consentimiento Obligatorio**: El flujo de evaluación clínica se bloquea automáticamente si el campo `consentimiento_informado` no está marcado como `TRUE` y firmado digitalmente por el trabajador al inicio del proceso.

---

## 2. Reglas de Validación Clínica (IA-Thresholds)
Estas reglas definen los umbrales donde la IA debe intervenir y alertar al personal médico:

* **R4 - Alerta de Presión Arterial**: 
    * Para cargos de **Gran Altura Geográfica**: Si PAS ≥ 140 o PAD ≥ 90, el sistema marcará el parámetro en **Naranja** y habilitará el campo "Observación Médica Obligatoria".
    * Si PAS ≥ 160 o PAD ≥ 100, el sistema clasificará el estado como **Alerta Roja** (No Apto Temporal).
* **R5 - Validación de Glicemia**: Todo resultado de glicemia en ayunas **> 110 mg/dL** activará automáticamente una sugerencia de "Evaluación Nutricional" en el plan de remediación.
* **R6 - Integridad de la Batería**: No se puede emitir un veredicto de "Apto" si falta al menos uno de los resultados definidos en la batería inicial. El sistema marcará la atención como "Incompleta".

---

## 3. Reglas de Privacidad y Roles (Data Masking)
* **R7 - Bloqueo de Diagnóstico**: El rol `Empresa_Contratista` tiene estrictamente prohibido el acceso a campos de texto abierto donde se describan patologías específicas (ej: "Diabetes Mellitus", "Depresión"). 
    * *Regla de Interfaz*: La empresa solo visualiza el estado administrativo: **Apto**, **No Apto** o **Remediación**.
* **R8 - Auditoría de Acceso**: Cada vez que un usuario con rol `Médico` acceda a una ficha clínica histórica, el sistema debe registrar un log inmutable con: `ID_Usuario`, `Timestamp` y `Motivo_Consulta`.

---

## 4. Reglas del Módulo de Remediación
* **R9 - Condición de Remediabilidad**: Solo se permite el paso al flujo de remediación si el hallazgo clínico es clasificado como "Tratable a Corto Plazo" (máximo 15 días). Condiciones crónicas no tratadas se derivan directamente a "No Apto".
* **R10 - Caducidad del Plan**: Si un trabajador en remediación no registra avances o nuevas mediciones en su App en un periodo de **10 días corridos**, el plan se marca como "Vencido" y la atención se cierra automáticamente como "No Apto".

---

## 5. Reglas de Certificación y Cierre
* **R11 - Validez Jurídica**: Todo certificado de aptitud debe contar con un hash único generado por la plataforma y un código QR que apunte a la ruta de verificación pública `https://prevenort.cl/verificar/[ID_CERTIFICADO]`.
* **R12 - Firma Médica**: El botón de "Emitir Certificado" solo se activa si el usuario ha validado su identidad mediante el segundo factor de autenticación (2FA) configurado para la Firma Electrónica Avanzada.