-- Script para almacenar la configuración de textos del Header en Soluciones
CREATE TABLE IF NOT EXISTS public.soluciones_header_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    status_badge TEXT DEFAULT '🟢 Disponible para instalaciones esta semana',
    nombre_persona TEXT DEFAULT 'Martín Pestana',
    subtitulo_persona TEXT DEFAULT 'Automatización con n8n, IA & Recursos',
    trust_badge1 TEXT DEFAULT 'Sin Bots Rígidos',
    trust_badge2 TEXT DEFAULT 'Instalación Exprés',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.soluciones_header_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica soluciones_header_config"
    ON public.soluciones_header_config FOR SELECT USING (true);

CREATE POLICY "Modificacion soluciones_header_config"
    ON public.soluciones_header_config FOR ALL USING (true) WITH CHECK (true);
