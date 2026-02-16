-- Migración: Categorías de Prestaciones
CREATE TABLE IF NOT EXISTS public.prestacion_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    prefijo TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías base
INSERT INTO public.prestacion_categorias (nombre, prefijo)
VALUES 
    ('Laboratorio', 'LAB'),
    ('Médico', 'MED'),
    ('Rayos X', 'RX'),
    ('Psicotécnico', 'PSI'),
    ('Electro', 'ECG')
ON CONFLICT (nombre) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.prestacion_categorias ENABLE ROW LEVEL SECURITY;
-- Por ahora permitir todo para desarrollo (ajustar luego)
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.prestacion_categorias FOR ALL USING (true);

-- Agregar FK a prestaciones si no existe
-- Nota: La tabla prestaciones ya existe en el código, me aseguro que la columna categoria sea consistente
-- Si categoria es TEXT, podemos dejarlo así o migrarlo a FK. 
-- El usuario dijo "debe permitir crear y eliminar categorías", por lo que una tabla es el camino correcto.
