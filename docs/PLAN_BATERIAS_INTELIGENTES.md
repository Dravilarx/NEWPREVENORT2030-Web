# Plan: Sistema de Baterías Inteligentes con Motor de Resolución

## Fecha: 2026-02-19

## Problema
El sistema antiguo maneja ~200+ baterías nombradas manualmente, cada una representando una
combinación explícita de: Cargo + Riesgo + Altitud + Edad. Esto es inmanejable.

## Solución
Descomponer en criterios atómicos y dejar que un motor resuelva la combinación automáticamente.

---

## Esquema de Datos

### 1. Nueva tabla: `riesgos`
Catálogo maestro de factores de riesgo ocupacional.
- id, nombre, grupo (fisico, quimico, ambiental, ergonomico, especial), descripcion, activo, orden

### 2. Tabla `baterias` (ampliada)
Columnas nuevas:
- `criterio_tipo`: 'riesgo' | 'cargo' | 'empresa' | 'combo'
- `prioridad`: int (mayor = preferencia en resolución)
- `activa`: boolean
- `edad_minima`: int nullable (ej: 40 → aplica solo a ≥40 años)

### 3. Nueva tabla: `bateria_criterios`
Define QUÉ condiciones activan una batería. Una batería combo tiene múltiples filas.
- bateria_id FK → baterias
- tipo_criterio: 'riesgo' | 'cargo' | 'empresa'
- riesgo_id FK → riesgos (nullable)
- cargo_id FK → cargos (nullable)
- empresa_id FK → empresas (nullable)

### 4. Nueva tabla: `cargo_riesgos`
Qué riesgos son inherentes a cada cargo.
- cargo_id FK → cargos
- riesgo_id FK → riesgos

### 5. Nueva tabla: `faena_riesgos`
Qué riesgos tiene cada sitio/faena.
- empresa_id FK → empresas
- faena_nombre TEXT
- riesgo_id FK → riesgos

---

## Motor de Resolución (Admisión)

```
INPUT: empresa_id, faena_nombre, cargo_id, fecha_nacimiento_trabajador

1. Calcular edad del trabajador

2. Recolectar riesgos:
   riesgos = cargo_riesgos[cargo_id] ∪ faena_riesgos[empresa_id + faena]

3. Buscar baterías candidatas (filtrar por edad_minima ≤ edad OR edad_minima IS NULL):

   PRIORIDAD 1: tipo 'combo' - TODOS sus criterios coinciden
   PRIORIDAD 2: tipo 'empresa' - la empresa coincide
   PRIORIDAD 3: tipo 'cargo' - el cargo coincide
   PRIORIDAD 4: tipo 'riesgo' - al menos un riesgo coincide

4. Para cada batería candidata, si existe una variante edad_minima que aplica,
   preferir esa sobre la versión sin edad_minima (mismos criterios)

5. Consolidar prestaciones:
   UNION de todas las bateria_items aplicables
   DEDUPLICAR por prestacion_id

6. Resultado: set final de prestaciones a crear como atencion_examenes
```

---

## Fases de Implementación

### Fase 1: Migración SQL
- Crear tablas riesgos, bateria_criterios, cargo_riesgos, faena_riesgos
- Alterar tabla baterias
- Seed de riesgos iniciales basados en sistema antiguo

### Fase 2: UI Configuración
- Nueva sub-pestaña "Riesgos" en Protocolos y Salud
- Rediseñar sub-pestaña "Baterías" (agregar selector de criterios)
- Agregar selector de riesgos en edición de Cargos
- Agregar selector de riesgos por faena en edición de Empresas
- Ocultar/eliminar sub-pestaña "Paneles"

### Fase 3: Motor de Resolución en Admisión
- Implementar función resolverBateria()
- Reemplazar lookup actual en empresa_cargo_baterias
- Mostrar al admisionista los exámenes resueltos con origen (qué batería aporta qué)

### Fase 4: Limpieza
- Migrar datos legacy de empresa_cargo_baterias → nuevas tablas
- Eliminar tabla empresa_cargo_baterias
- Eliminar código legacy de paneles

---

## Catálogo de Riesgos (seed inicial)

### Grupo: Físico
1. Altura Física >1.8m y hasta 10m
2. Altura Física >10m
3. Espacio Confinado
4. Hiperbárica
5. Manejo Manual de Carga
6. Movimiento Repetitivo

### Grupo: Geográfico
7. Nivel del Mar (hasta 3.000 msnm)
8. Altitud Geográfica (3.000 - 5.000 msnm)

### Grupo: Químico
9. Sílice
10. Arsénico
11. Plomo
12. Metales Pesados
13. Órganos Fosforados
14. Cumarínicos
15. Anhídrido Sulfuroso / Neblinas Ácidas

### Grupo: Ambiental
16. Ruido
17. Radiaciones Ionizantes
18. Polvos Neumoconiósicos

### Grupo: Especial
19. Faena Expuesta (genérico)
