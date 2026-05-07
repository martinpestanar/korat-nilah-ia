-- Módulo Nilah Finanzas: Tablas y Políticas RLS

-- 1. Tabla de Gastos (Egresos)
CREATE TABLE public.finances_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL, -- Asumiendo que usas UUID para business_id, sino cambia a TEXT
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL, -- ej. 'alquiler', 'luz', 'agua', 'insumos', 'marketing'
    description TEXT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.finances_expenses ENABLE ROW LEVEL SECURITY;

-- Política RLS: Solo Select, Insert, Update, Delete para el propio business_id
-- (Ajusta la lógica de auth.uid() si usas JWT de Supabase, o a través de service_role si manejas N8N/backend)
CREATE POLICY "Permitir full access a gastos del propio negocio" ON public.finances_expenses
    FOR ALL USING (true); -- REEMPLAZAR 'true' POR TU LÓGICA RLS DE BUSINESS_ID SI ESTÁS USANDO SUPABASE AUTH DIRECTO DESDE EL FRONTEND.
    -- Ejemplo si tuvieras auth: USING (business_id = auth.uid()); O si manejas el business_id por app metadata.

-- 2. Tabla de Configuración Financiera e Impuestos
CREATE TABLE public.finances_settings (
    business_id UUID PRIMARY KEY,
    tax_country TEXT DEFAULT 'PE',
    tax_regime TEXT DEFAULT 'RUS', -- RUS, MYPE, GENERAL
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'PEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.finances_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir full access a config del propio negocio" ON public.finances_settings
    FOR ALL USING (true); -- Ajustar según auth.

-- 3. Tabla de Nómina y Pagos a Staff (Opcional por ahora, pero buena base)
CREATE TABLE public.finances_payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL,
    staff_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL, -- 'base', 'commission', 'mixed'
    base_amount DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    commission_sales DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.finances_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir full access a nomina del propio negocio" ON public.finances_payroll
    FOR ALL USING (true); -- Ajustar según auth.
