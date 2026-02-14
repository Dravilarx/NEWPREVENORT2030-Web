# Arquitectura Supabase: Edge Functions, pgvector y RLS

## Stack Tecnológico
- **Auth:** Gestión de usuarios y sesiones.
- **Edge Functions:** Lógica de negocio en el lado del servidor.
- **pgvector:** Búsqueda semántica para diagnósticos y manuales médicos.
- **RLS (Row Level Security):** Aislamiento de datos por empresa (Multi-tenant).
# 🏗️ Arquitectura del Stack: Supabase + Antigravity

## Componentes del Sistema
- **Base de Datos:** PostgreSQL (Supabase) con extensiones `pgvector` para futuras búsquedas semánticas en historial clínico.
- **Autenticación:** Supabase Auth con roles personalizados (RBAC) inyectados en el JWT.
- **Almacenamiento (Buckets):** - `certificados-publicos`: PDF con acceso vía URL firmada.
  - `expedientes-privados`: Documentación técnica protegida.
- **Edge Functions:** Lógica de servidor en TypeScript para procesamiento de IA y firmas digitales.
- **Real-time:** Suscripción a cambios en la tabla `atenciones` para actualizar los dashboards de las empresas instantáneamente.