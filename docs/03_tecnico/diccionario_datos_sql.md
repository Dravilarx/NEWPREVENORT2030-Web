# Diccionario de Datos SQL

## Tablas Principales
- **empresas:** Datos de las compañías mandantes y contratistas.
- **trabajadores:** Información personal y laboral.
- **atenciones:** Registro de citas y evaluaciones médicas.
- **resultados:** Hallazgos médicos y estados de aptitud.

Columna,Tipo,Descripción
id,uuid,"PK, Identificador único generado por el sistema."
rut_empresa,text,RUT de la empresa (Unique).
nombre,text,Razón social o nombre legal.
giro,text,Actividad económica de la empresa.
direccion,text,Dirección comercial física.
email_contacto,text,Correo electrónico para notificaciones de aptitud y cobranza.
faenas,jsonb,Lista de faenas o proyectos asociados a la empresa.

Columna,Tipo,Descripción
id,uuid,"PK, Identificador único."
nombre_cargo,text,"Ej: ""Operador CAEX"", ""Administrativo""."
es_gran_altura,boolean,Indica si aplica la Guía Técnica de Hipobaria.
limite_pa_sistolica,int,Límite máximo (Por defecto: 140 mmHg).
limite_pa_diastolica,int,Límite máximo (Por defecto: 90 mmHg).
limite_glicemia_max,numeric,Límite para ayuno (Por defecto: 110 mg/dL).

Columna,Tipo,Descripción
id,uuid,"PK, Referencia a auth.users."
rut,text,Identificador nacional único (RUT).
nombre_completo,text,Nombre y apellidos del trabajador.
fecha_nacimiento,date,Para cálculo automático de edad y riesgos etarios.
sexo,text,Registro legal para valoración clínica.
email,text,Correo electrónico personal para entrega de resultados.

Columna,Tipo,Descripción
id,uuid,"PK, Identificador único."
trabajador_id,uuid,FK -> trabajadores.id.
empresa_id,uuid,FK -> empresas.id.
cargo_id,uuid,FK -> cargos.id.
nro_ot,text,Número de Orden de Trabajo asignada.
nro_ficha,text,Identificador interno de ficha clínica.
estado_aptitud,text,"pendiente, apto, no_apto, remediacion."
orden_compra,text,OC asociada para trazabilidad financiera.

Columna,Tipo,Descripción
id,uuid,"PK, Identificador único."
atencion_id,uuid,FK -> atenciones.id.
item_nombre,text,"Ej: 'Glicemia', 'Presión Arterial', 'Audiometría'."
valor_encontrado,text,Dato crudo ingresado por el técnico o médico.
es_alerta,boolean,Marcado como true por el motor de IA si está fuera de rango.
ia_evaluacion,text,Comentario o veredicto generado por la IA.
responsable_rol,text,"Rol que realizó la carga (Médico, Paramédico, etc.)."

Columna,Tipo,Descripción
id,uuid,"PK, Identificador único."
atencion_id,uuid,FK -> atenciones.id (Unique).
fecha_estimada_alta,date,Proyección de retorno a la aptitud calculada por IA.
progreso_actual,int,Porcentaje de avance (0 a 100).
plan_accion,text,Hoja de ruta generada por la IA (ej: interconsultas).
activo,boolean,Indica si el proceso de rescate sigue vigente.

🛡️ Políticas de Seguridad (RLS)
Para cumplir con la Ley 20.584, se aplican las siguientes restricciones:
Empresas: Solo pueden ver el estado_aptitud y resultado_final de sus trabajadores. No tienen acceso a resultados_clinicos o diagnósticos.
Trabajadores: Acceso exclusivo a su propia información de perfil, resultados y plan de remediación.
Médicos: Permisos completos de lectura y escritura para la gestión clínica y firma electrónica.