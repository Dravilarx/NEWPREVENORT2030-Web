-- Migración Inicial: Esquema de Base de Datos Prevenort 2030

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Para pgvector si se usa búsqueda semántica

-- 2. Tablas Maestras
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut_empresa TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    giro TEXT,
    direccion TEXT,
    email_contacto TEXT,
    faenas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_cargo TEXT NOT NULL,
    es_gran_altura BOOLEAN DEFAULT FALSE,
    limite_pa_sistolica INT DEFAULT 140,
    limite_pa_diastolica INT DEFAULT 90,
    limite_glicemia_max NUMERIC DEFAULT 110,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Entidades Principales
CREATE TABLE IF NOT EXISTS public.trabajadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut TEXT UNIQUE NOT NULL,
    nombre_completo TEXT NOT NULL,
    fecha_nacimiento DATE,
    sexo TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Operaciones Clínicas
CREATE TYPE public.estado_aptitud AS ENUM ('pendiente', 'apto', 'no_apto', 'remediacion');

CREATE TABLE IF NOT EXISTS public.atenciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trabajador_id UUID REFERENCES public.trabajadores(id),
    empresa_id UUID REFERENCES public.empresas(id),
    cargo_id UUID REFERENCES public.cargos(id),
    nro_ot TEXT,
    nro_ficha TEXT,
    estado_aptitud public.estado_aptitud DEFAULT 'pendiente',
    orden_compra TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ia_evaluacion TEXT,
    justificacion_normativa TEXT
);

CREATE TABLE IF NOT EXISTS public.resultados_clinicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atencion_id UUID REFERENCES public.atenciones(id) ON DELETE CASCADE,
    item_nombre TEXT NOT NULL, -- Ej: 'Presión Arterial', 'Glicemia'
    valor_encontrado TEXT,
    es_alerta BOOLEAN DEFAULT FALSE,
    ia_evaluacion TEXT,
    responsable_rol TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planes_remediacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    atencion_id UUID UNIQUE REFERENCES public.atenciones(id) ON DELETE CASCADE,
    fecha_estimada_alta DATE,
    progreso_actual INT DEFAULT 0,
    plan_accion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    hallazgo_principal TEXT,
    probabilidad_exito INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Seguridad: RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atenciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_clinicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planes_remediacion ENABLE ROW LEVEL SECURITY;

-- Nota: Las políticas de RLS se definirán detalladamente según el rol del usuario (auth.uid()).
