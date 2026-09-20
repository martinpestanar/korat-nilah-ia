-- =====================================================
-- Migración: Módulo Carta Digital Interactiva
-- Korat Flow / Nilah IA — Plan Glow (Freemium)
-- =====================================================

-- 1. Categorías de la carta
CREATE TABLE IF NOT EXISTS carta_categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  nombre      TEXT NOT NULL,
  emoji       TEXT DEFAULT '✨',
  orden       INT  DEFAULT 0,
  activo      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carta_categorias_business ON carta_categorias(business_id);

-- RLS
ALTER TABLE carta_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carta_categorias_owner_all" ON carta_categorias
  FOR ALL USING (
    business_id IN (
      SELECT id FROM "Negocios" WHERE id IN (
        SELECT business_id FROM "Usuarios" WHERE auth_uid = auth.uid()
      )
    )
  );

-- Lectura pública para la carta pública
CREATE POLICY "carta_categorias_public_read" ON carta_categorias
  FOR SELECT USING (activo = true);


-- 2. Servicios de la carta
CREATE TABLE IF NOT EXISTS carta_servicios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL,
  categoria_id UUID REFERENCES carta_categorias(id) ON DELETE SET NULL,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio       NUMERIC(10,2),
  precio_desde BOOLEAN DEFAULT false,
  duracion_min INT,
  media_url    TEXT,
  media_tipo   TEXT DEFAULT 'imagen',  -- 'imagen' | 'video'
  destacado    BOOLEAN DEFAULT false,
  orden        INT  DEFAULT 0,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carta_servicios_business   ON carta_servicios(business_id);
CREATE INDEX IF NOT EXISTS idx_carta_servicios_categoria  ON carta_servicios(categoria_id);
CREATE INDEX IF NOT EXISTS idx_carta_servicios_activo     ON carta_servicios(activo);

ALTER TABLE carta_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carta_servicios_owner_all" ON carta_servicios
  FOR ALL USING (
    business_id IN (
      SELECT id FROM "Negocios" WHERE id IN (
        SELECT business_id FROM "Usuarios" WHERE auth_uid = auth.uid()
      )
    )
  );

CREATE POLICY "carta_servicios_public_read" ON carta_servicios
  FOR SELECT USING (activo = true);


-- 3. Configuración visual de la carta (1 fila por negocio)
CREATE TABLE IF NOT EXISTS carta_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID UNIQUE NOT NULL,
  -- Paleta de colores
  paleta              TEXT DEFAULT 'rose',    -- 'rose'|'lilac'|'mauve'|'gold'|'pearl'|'custom'
  color_primario      TEXT DEFAULT '#f43f5e',
  color_secundario    TEXT DEFAULT '#fda4af',
  color_acento        TEXT DEFAULT '#fff1f2',
  -- Datos del header
  nombre_salon        TEXT,
  logo_url            TEXT,
  descripcion_header  TEXT,
  telefono_whatsapp   TEXT,
  maps_url            TEXT,
  horario             TEXT,
  -- Stories de inspiración (array JSON)
  stories             JSONB DEFAULT '[]'::jsonb,
  -- Promo del mes
  promo_mes           JSONB DEFAULT NULL,
  -- {activa, badge_texto, badge_emoji, titulo, descripcion}
  -- Oferta de la semana
  oferta_semana       JSONB DEFAULT NULL,
  -- {activa, titulo, precio_original, precio_oferta, expira_en, descripcion, servicios_ids}
  -- Metadata
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carta_config_business ON carta_config(business_id);

ALTER TABLE carta_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carta_config_owner_all" ON carta_config
  FOR ALL USING (
    business_id IN (
      SELECT id FROM "Negocios" WHERE id IN (
        SELECT business_id FROM "Usuarios" WHERE auth_uid = auth.uid()
      )
    )
  );

CREATE POLICY "carta_config_public_read" ON carta_config
  FOR SELECT USING (true);


-- Trigger para updated_at automático en carta_servicios
CREATE OR REPLACE FUNCTION update_carta_servicios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_carta_servicios_updated_at
  BEFORE UPDATE ON carta_servicios
  FOR EACH ROW EXECUTE FUNCTION update_carta_servicios_updated_at();

CREATE OR REPLACE FUNCTION update_carta_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_carta_config_updated_at
  BEFORE UPDATE ON carta_config
  FOR EACH ROW EXECUTE FUNCTION update_carta_config_updated_at();
