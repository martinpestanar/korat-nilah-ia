-- Script de soporte para la gestión personalizada de categorías de soluciones
CREATE TABLE IF NOT EXISTS public.soluciones_categorias (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    short_label TEXT NOT NULL,
    icon TEXT DEFAULT '⚡',
    orden INT DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.soluciones_categorias ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Lectura publica de soluciones_categorias"
    ON public.soluciones_categorias FOR SELECT USING (true);

CREATE POLICY "Modificacion completa de soluciones_categorias"
    ON public.soluciones_categorias FOR ALL USING (true) WITH CHECK (true);
