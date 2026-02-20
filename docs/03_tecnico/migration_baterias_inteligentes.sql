-- ============================================================================
-- MIGRACIÓN: Sistema de Baterías Inteligentes con Motor de Resolución
-- Fecha: 2026-02-19
-- Descripción: Reemplaza el sistema manual de paneles (empresa_cargo_baterias)
--              por un motor automático basado en criterios atómicos.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. TABLA: riesgos (Catálogo maestro de factores de riesgo ocupacional)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.riesgos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    grupo TEXT NOT NULL CHECK (grupo IN (
        'altura_geografica',   -- Trabajo en altitud geográfica (msnm)
        'altura_fisica',       -- Trabajo en altura física (andamios, estructuras)
        'quimico',             -- Exposición a agentes químicos
        'fisico',              -- Otros riesgos físicos (ruido, radiación, presión)
        'ergonomico',          -- Riesgos ergonómicos
        'biologico',           -- Riesgos biológicos
        'especial'             -- Casos especiales
    )),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_riesgos_grupo ON public.riesgos(grupo);
CREATE INDEX IF NOT EXISTS idx_riesgos_activo ON public.riesgos(activo);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. ALTERAR TABLA: baterias (agregar campos de criterio y resolución)
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.baterias 
    ADD COLUMN IF NOT EXISTS criterio_tipo TEXT DEFAULT 'manual' 
        CHECK (criterio_tipo IN ('riesgo', 'cargo', 'empresa', 'combo', 'manual')),
    ADD COLUMN IF NOT EXISTS prioridad INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS edad_minima INT DEFAULT NULL;

-- Comentarios para claridad
COMMENT ON COLUMN public.baterias.criterio_tipo IS 'Tipo de criterio: riesgo=por factor de riesgo, cargo=por cargo, empresa=específica de empresa, combo=combinación, manual=legacy';
COMMENT ON COLUMN public.baterias.prioridad IS 'Mayor número = mayor prioridad en resolución de conflictos';
COMMENT ON COLUMN public.baterias.edad_minima IS 'Edad mínima del trabajador para que aplique esta batería (ej: 40). NULL = sin restricción de edad';

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. TABLA: bateria_criterios (qué condiciones activan cada batería)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bateria_criterios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bateria_id UUID NOT NULL REFERENCES public.baterias(id) ON DELETE CASCADE,
    tipo_criterio TEXT NOT NULL CHECK (tipo_criterio IN ('riesgo', 'cargo', 'empresa')),
    riesgo_id UUID REFERENCES public.riesgos(id) ON DELETE CASCADE,
    cargo_id UUID REFERENCES public.cargos(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validar que solo se llene el campo correspondiente al tipo
    CONSTRAINT chk_criterio_riesgo CHECK (
        tipo_criterio != 'riesgo' OR (riesgo_id IS NOT NULL AND cargo_id IS NULL AND empresa_id IS NULL)
    ),
    CONSTRAINT chk_criterio_cargo CHECK (
        tipo_criterio != 'cargo' OR (cargo_id IS NOT NULL AND riesgo_id IS NULL AND empresa_id IS NULL)
    ),
    CONSTRAINT chk_criterio_empresa CHECK (
        tipo_criterio != 'empresa' OR (empresa_id IS NOT NULL AND riesgo_id IS NULL AND cargo_id IS NULL)
    )
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_batcrit_bateria ON public.bateria_criterios(bateria_id);
CREATE INDEX IF NOT EXISTS idx_batcrit_riesgo ON public.bateria_criterios(riesgo_id) WHERE riesgo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batcrit_cargo ON public.bateria_criterios(cargo_id) WHERE cargo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batcrit_empresa ON public.bateria_criterios(empresa_id) WHERE empresa_id IS NOT NULL;

-- Evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_batcrit_unique_riesgo 
    ON public.bateria_criterios(bateria_id, riesgo_id) WHERE tipo_criterio = 'riesgo';
CREATE UNIQUE INDEX IF NOT EXISTS idx_batcrit_unique_cargo 
    ON public.bateria_criterios(bateria_id, cargo_id) WHERE tipo_criterio = 'cargo';
CREATE UNIQUE INDEX IF NOT EXISTS idx_batcrit_unique_empresa 
    ON public.bateria_criterios(bateria_id, empresa_id) WHERE tipo_criterio = 'empresa';

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. TABLA: cargo_riesgos (riesgos inherentes a cada cargo)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cargo_riesgos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
    riesgo_id UUID NOT NULL REFERENCES public.riesgos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cargo_id, riesgo_id)
);

CREATE INDEX IF NOT EXISTS idx_cargoriesgo_cargo ON public.cargo_riesgos(cargo_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. TABLA: faena_riesgos (riesgos de cada sitio/faena de una empresa)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faena_riesgos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    faena_nombre TEXT NOT NULL,
    riesgo_id UUID NOT NULL REFERENCES public.riesgos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(empresa_id, faena_nombre, riesgo_id)
);

CREATE INDEX IF NOT EXISTS idx_faenariesgo_empresa ON public.faena_riesgos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faenariesgo_lookup ON public.faena_riesgos(empresa_id, faena_nombre);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. RLS: Habilitar seguridad en nuevas tablas
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.riesgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bateria_criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_riesgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faena_riesgos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según necesidad)
CREATE POLICY "riesgos_read" ON public.riesgos FOR SELECT USING (true);
CREATE POLICY "riesgos_write" ON public.riesgos FOR ALL USING (true);

CREATE POLICY "bateria_criterios_read" ON public.bateria_criterios FOR SELECT USING (true);
CREATE POLICY "bateria_criterios_write" ON public.bateria_criterios FOR ALL USING (true);

CREATE POLICY "cargo_riesgos_read" ON public.cargo_riesgos FOR SELECT USING (true);
CREATE POLICY "cargo_riesgos_write" ON public.cargo_riesgos FOR ALL USING (true);

CREATE POLICY "faena_riesgos_read" ON public.faena_riesgos FOR SELECT USING (true);
CREATE POLICY "faena_riesgos_write" ON public.faena_riesgos FOR ALL USING (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. SEED: Catálogo inicial de riesgos ocupacionales
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO public.riesgos (nombre, codigo, grupo, descripcion, orden) VALUES
    -- ═══ ALTURA GEOGRÁFICA (Altitud sobre nivel del mar) ═══
    ('Nivel del Mar (hasta 3.000 msnm)',           'ALT_GEO_3000',     'altura_geografica', 'Trabajo a nivel del mar o hasta 3.000 metros sobre el nivel del mar', 1),
    ('Altitud Geográfica (3.000 - 5.000 msnm)',    'ALT_GEO_5000',     'altura_geografica', 'Trabajo en gran altitud geográfica, típico en faenas mineras de cordillera', 2),

    -- ═══ ALTURA FÍSICA (Trabajo en andamios, estructuras, grúas) ═══
    ('Altura Física >1.8m y hasta 10m',            'ALT_FIS_10',       'altura_fisica', 'Trabajo en andamios, escaleras o estructuras entre 1.8 y 10 metros', 3),
    ('Altura Física mayor a 10m',                  'ALT_FIS_10PLUS',   'altura_fisica', 'Trabajo en estructuras, grúas o torres sobre 10 metros de altura', 4),

    -- ═══ QUÍMICO (Exposición a sustancias) ═══
    ('Sílice',                                     'QUIM_SILICE',      'quimico', 'Exposición a polvo de sílice cristalina', 10),
    ('Arsénico',                                   'QUIM_ARSENICO',    'quimico', 'Exposición a arsénico y sus compuestos', 11),
    ('Plomo',                                      'QUIM_PLOMO',       'quimico', 'Exposición a plomo y sus derivados', 12),
    ('Metales Pesados',                            'QUIM_METALES',     'quimico', 'Exposición a metales pesados diversos', 13),
    ('Órganos Fosforados',                         'QUIM_ORGFOSF',     'quimico', 'Exposición a compuestos organofosforados', 14),
    ('Cumarínicos',                                'QUIM_CUMAR',       'quimico', 'Exposición a cumarínicos (anticoagulantes/rodenticidas)', 15),
    ('Anhídrido Sulfuroso / Neblinas Ácidas',      'QUIM_ANHSULF',     'quimico', 'Exposición a anhídrido sulfuroso y neblinas ácidas industriales', 16),

    -- ═══ FÍSICO (Otros agentes físicos) ═══
    ('Ruido',                                      'FIS_RUIDO',        'fisico', 'Exposición a niveles de ruido sobre el límite permisible', 20),
    ('Radiaciones Ionizantes',                     'FIS_RADION',       'fisico', 'Exposición a radiaciones ionizantes (rayos X, gamma)', 21),
    ('Espacio Confinado',                          'FIS_ESPCONF',      'fisico', 'Ingreso y trabajo en espacios confinados', 22),
    ('Hiperbárica',                                'FIS_HIPERB',       'fisico', 'Trabajo en condiciones hiperbáricas (mayor presión atmosférica)', 23),
    ('Polvos Neumoconiósicos',                     'FIS_POLVONEUMO',   'fisico', 'Exposición a polvos que causan neumoconiosis', 24),

    -- ═══ ERGONÓMICO ═══
    ('Manejo Manual de Carga',                     'ERGO_MMC',         'ergonomico', 'Tareas frecuentes de levantamiento y transporte manual de cargas', 30),
    ('Movimiento Repetitivo',                      'ERGO_MOVREP',      'ergonomico', 'Tareas con movimientos repetitivos de extremidades superiores', 31)

ON CONFLICT (codigo) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Marcar baterías existentes como 'manual' (legacy)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE public.baterias SET criterio_tipo = 'manual' WHERE criterio_tipo IS NULL;
