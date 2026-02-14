# Portal Contratista: Dashboard de Transparencia

## Funcionalidades
- **Gestión de Dotación:** Visualización en tiempo real del estado de aptitud de la cuadrilla.
- **Transparencia:** Seguimiento del proceso de evaluación de cada trabajador enviado.
- **Alertas:** Notificaciones de vencimiento de certificaciones y citas pendientes.
# 🏢 Diseño de Interfaz: Portal de la Empresa Contratista

El portal es la herramienta de gestión estratégica para los clientes de Prevenort. Su enfoque es la transparencia y la disponibilidad de dotación.

## Dashboards de Control
El administrador de la empresa debe ver tres indicadores clave al ingresar:
1. **Disponibilidad Inmediata:** Número de trabajadores con estado `APTO` listos para subir a faena.
2. **Tasa de Rescate:** Porcentaje de trabajadores en `REMEDIACION` que han recuperado su aptitud.
3. **Estado Financiero:** Monto acumulado en OTs del mes en curso.

## Lógica de Visualización
- **Buscador de Certificados:** Filtro por RUT o fecha. Descarga masiva en formato `.zip`.
- **Panel de Remediación:** Visualización del progreso de sus trabajadores. 
    - *Ejemplo:* "Juan Pérez - 70% de avance en su plan de hipertensión. Fecha estimada de alta: 3 días".

## KPI de Eficiencia (ROI)
El portal debe mostrar automáticamente el ahorro proyectado mediante la fórmula:
$$\text{Ahorro Total} = \sum (\text{Costo Reclutamiento} \times \text{Trabajadores Rescatados})$$
Este dato es fundamental para la retención del cliente B2B.