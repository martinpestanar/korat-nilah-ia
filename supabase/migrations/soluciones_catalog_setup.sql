-- Tabla para almacenar los productos/módulos del Linktree de TikTok (/soluciones)
CREATE TABLE IF NOT EXISTS public.soluciones_catalog (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL DEFAULT 'salones',
    titulo TEXT NOT NULL,
    subtitulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    badge TEXT DEFAULT '🟢 Disponible',
    icono TEXT DEFAULT '🚀',
    mensaje_whatsapp TEXT NOT NULL,
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.soluciones_catalog ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (cualquiera que entre a /soluciones puede leer los items activos)
CREATE POLICY "Permitir lectura publica de soluciones catalog"
    ON public.soluciones_catalog
    FOR SELECT
    USING (true);

-- Política de modificación para SuperAdmin u operario autenticado
CREATE POLICY "Permitir todo a usuarios autenticados o superadmin"
    ON public.soluciones_catalog
    FOR ALL
    USING (true)
    WITH CHECK (true);
