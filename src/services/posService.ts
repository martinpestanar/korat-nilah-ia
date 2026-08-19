import { supabase } from './supabase';

export type RubroType = 'gastro' | 'belleza' | 'mascotas' | 'retail';

export interface PosThemeConfig {
  rubro: RubroType;
  paletteId: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface PosBusiness {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  rubro: RubroType;
  currency: string;
  logo_url?: string;
  theme_config: PosThemeConfig;
  welcome_reward: string;
  created_at?: string;
}

export interface PosCategory {
  id: string;
  business_id: string;
  name: string;
  type: 'service' | 'product';
}

export interface PosItem {
  id: string;
  business_id: string;
  category_id?: string;
  name: string;
  price: number;
  type: 'service' | 'product';
  stock: number;
  is_active: boolean;
}

export interface PosCustomer {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  birthday?: string;
  total_spent: number;
  visits_count: number;
  last_visit_at: string;
  status: 'active' | 'risk' | 'inactive';
  notes?: string;
}

export interface PosTransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

export interface PosTransaction {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'yape_plin' | 'transferencia';
  items_summary: PosTransactionItem[];
  status: 'paid' | 'pending' | 'cancelled';
  table_number?: string;
  staff_name?: string;
  note?: string;
  created_at: string;
}

export interface PosExpense {
  id: string;
  business_id: string;
  category: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface PosAppointment {
  id: string;
  business_id: string;
  customer_name: string;
  customer_phone: string;
  service_name: string;
  time_slot: string;
  date: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

export interface PosStateData {
  business: PosBusiness;
  categories: PosCategory[];
  items: PosItem[];
  customers: PosCustomer[];
  transactions: PosTransaction[];
  expenses: PosExpense[];
  appointments: PosAppointment[];
}

export const RUBRO_CONFIG: Record<
  RubroType,
  {
    serviceLabel: string;
    productLabel: string;
    itemPlaceholder: string;
    customerPlaceholder: string;
    serviceTag: string;
    productTag: string;
  }
> = {
  gastro: {
    serviceLabel: '🍔 Platos & Menús',
    productLabel: '🥤 Bebidas & Cocteles',
    itemPlaceholder: 'Ej: Lomo Saltado al Wok / Ceviche / Chicha Morada',
    customerPlaceholder: 'Ej: Carlos Mendoza (Mesa 4)',
    serviceTag: 'Plato / Menú',
    productTag: 'Bebida / Postre',
  },
  belleza: {
    serviceLabel: '💇‍♀️ Cortes & Tratamientos',
    productLabel: '💅 Productos & Cuidado Capilar',
    itemPlaceholder: 'Ej: Corte de Cabello / Balayage Glow / Olaplex No.4',
    customerPlaceholder: 'Ej: Valentina Torres (Clienta VIP)',
    serviceTag: 'Servicio Estética',
    productTag: 'Producto Capilar',
  },
  mascotas: {
    serviceLabel: '🐾 Consultas & Baños Vet',
    productLabel: '🦴 Alimentos & Fármacos',
    itemPlaceholder: 'Ej: Consulta Veterinaria / Baño Medicado / Pro Plan 3kg',
    customerPlaceholder: 'Ej: Mauricio & "Max" (Pug)',
    serviceTag: 'Servicio Vet',
    productTag: 'Alimento / Fármaco',
  },
  retail: {
    serviceLabel: '🛠️ Servicios Técnicos',
    productLabel: '📱 Productos & Accesorios',
    itemPlaceholder: 'Ej: Mantenimiento Laptop / Cargador Rápido 33W',
    customerPlaceholder: 'Ej: Jorge Benítez',
    serviceTag: 'Servicio Técnico',
    productTag: 'Artículo / Repuesto',
  },
};

// ── PALETAS PRE-DISEÑADAS POR RUBRO ──
export const PALETAS_POR_RUBRO: Record<RubroType, { id: string; name: string; primary: string; accent: string; bgSoft: string; badge: string }[]> = {
  gastro: [
    { id: 'amber-charcoal', name: 'Ámbar Cálido & Carbón', primary: '#d97706', accent: '#78350f', bgSoft: '#fffbeb', badge: 'Default' },
    { id: 'neon-slate', name: 'Naranja Neón & Slate', primary: '#f97316', accent: '#334155', bgSoft: '#fff7ed', badge: 'Neón' },
    { id: 'terracota-cream', name: 'Terracota & Crema', primary: '#c2410c', accent: '#ea580c', bgSoft: '#ffedd5', badge: 'Cálido' },
  ],
  belleza: [
    { id: 'rose-lavender', name: 'Rosa Cuarzo & Lavanda', primary: '#ec4899', accent: '#8b5cf6', bgSoft: '#fdf2f8', badge: 'Default' },
    { id: 'burgundy-slate', name: 'Borgoña Elegante & Dark', primary: '#9f1239', accent: '#475569', bgSoft: '#fff1f2', badge: 'Elegante' },
    { id: 'nude-rose-gold', name: 'Nude / Oro Rosa & Blanco', primary: '#f43f5e', accent: '#fb7185', bgSoft: '#fff1f2', badge: 'Glow' },
  ],
  mascotas: [
    { id: 'mint-turquoise', name: 'Verde Menta & Turquesa', primary: '#10b981', accent: '#0d9488', bgSoft: '#ecfdf5', badge: 'Default' },
    { id: 'petroleum-snow', name: 'Azul Petróleo & Nieve', primary: '#0284c7', accent: '#0369a1', bgSoft: '#f0f9ff', badge: 'Clínico' },
    { id: 'emerald-white', name: 'Esmeralda Suave & Blanco', primary: '#059669', accent: '#047857', bgSoft: '#f0fdf4', badge: 'Fresco' },
  ],
  retail: [
    { id: 'cobalt-graphite', name: 'Azul Cobalto & Grafito', primary: '#2563eb', accent: '#1e40af', bgSoft: '#eff6ff', badge: 'Default' },
    { id: 'violet-electric', name: 'Violeta Eléctrico & Slate', primary: '#7c3aed', accent: '#6d28d9', bgSoft: '#f5f3ff', badge: 'Eléctrico' },
    { id: 'titanium-lime', name: 'Titanio & Lima', primary: '#0f172a', accent: '#65a30d', bgSoft: '#f8fafc', badge: 'Moderno' },
  ],
};

// ── DATOS DEMO REALISTAS POR RUBRO ──
export const DEMO_DATA_POR_RUBRO: Record<RubroType, {
  business: Omit<PosBusiness, 'id'>;
  categories: Omit<PosCategory, 'id' | 'business_id'>[];
  items: Omit<PosItem, 'id' | 'business_id'>[];
  customers: Omit<PosCustomer, 'id' | 'business_id'>[];
  transactions: Omit<PosTransaction, 'id' | 'business_id'>[];
}> = {
  gastro: {
    business: {
      name: 'La Bamba Gourmet & Restobar',
      slug: 'labamba-gourmet',
      rubro: 'gastro',
      currency: 'S/',
      theme_config: { rubro: 'gastro', paletteId: 'amber-charcoal' },
      welcome_reward: '🍋 Lemonade Gratis en tu consumo de plato fondo',
    },
    categories: [
      { name: 'Platos & Fondos', type: 'service' },
      { name: 'Entradas & Combos', type: 'service' },
      { name: 'Bebidas & Cocteles', type: 'product' },
    ],
    items: [
      { name: 'Lomo Saltado Jugoso al Wok', price: 34.00, type: 'service', stock: 0, is_active: true },
      { name: 'Ceviche Mixto Clásico', price: 38.00, type: 'service', stock: 0, is_active: true },
      { name: 'Hamburguesa Artesanal Doble', price: 26.00, type: 'service', stock: 0, is_active: true },
      { name: 'Chicha Morada Artesanal 1L', price: 12.00, type: 'product', stock: 35, is_active: true },
      { name: 'Cerveza Cusqueña Trigo 330ml', price: 14.00, type: 'product', stock: 48, is_active: true },
      { name: 'Inka Kola Personal 500ml', price: 6.00, type: 'product', stock: 60, is_active: true },
    ],
    customers: [
      { name: 'Carlos Mendoza', phone: '51987654321', total_spent: 340.00, visits_count: 8, last_visit_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'active', notes: 'Prefiere mesa terraza, le gusta el Lomo Saltado' },
      { name: 'Lucía Benavides', phone: '51912345678', total_spent: 210.00, visits_count: 4, last_visit_at: new Date(Date.now() - 5 * 86400000).toISOString(), status: 'active', birthday: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0] },
      { name: 'Mariano Silva', phone: '51999888777', total_spent: 180.00, visits_count: 3, last_visit_at: new Date(Date.now() - 25 * 86400000).toISOString(), status: 'risk' },
      { name: 'Fiorella Ramos', phone: '51955443322', total_spent: 490.00, visits_count: 11, last_visit_at: new Date(Date.now() - 48 * 86400000).toISOString(), status: 'inactive' },
    ],
    transactions: [
      { amount: 74.00, payment_method: 'yape_plin', customer_name: 'Carlos Mendoza', items_summary: [{ id: '1', name: 'Lomo Saltado', price: 34, quantity: 1, type: 'service' }, { id: '2', name: 'Ceviche Mixto', price: 38, quantity: 1, type: 'service' }, { id: '3', name: 'Inka Kola', price: 2, quantity: 1, type: 'product' }], status: 'paid', created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
      { amount: 48.00, payment_method: 'tarjeta', customer_name: 'Lucía Benavides', items_summary: [{ id: '1', name: 'Hamburguesa Doble', price: 26, quantity: 1, type: 'service' }, { id: '2', name: 'Cerveza Cusqueña', price: 14, quantity: 1, type: 'product' }], status: 'paid', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
      { amount: 110.00, payment_method: 'efectivo', customer_name: 'Mesa 4 (Comensales)', items_summary: [{ id: '1', name: 'Lomo Saltado x3', price: 102, quantity: 3, type: 'service' }], status: 'pending', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
    ]
  },
  belleza: {
    business: {
      name: 'Glow Up Studio & Spa',
      slug: 'glowup-studio',
      rubro: 'belleza',
      currency: 'S/',
      theme_config: { rubro: 'belleza', paletteId: 'rose-lavender' },
      welcome_reward: '💅 15% Dcto en tu primera sesión de Manicure o Tinte',
    },
    categories: [
      { name: 'Cortes & Cabello', type: 'service' },
      { name: 'Uñas & Manicure', type: 'service' },
      { name: 'Tratamientos & Skincare', type: 'service' },
      { name: 'Cuidado Capilar (Home)', type: 'product' },
    ],
    items: [
      { name: 'Corte + Peinado + Ondas', price: 45.00, type: 'service', stock: 0, is_active: true },
      { name: 'Manicure Rusa + Gel Color', price: 55.00, type: 'service', stock: 0, is_active: true },
      { name: 'Tinte Global + Balayage Glow', price: 140.00, type: 'service', stock: 0, is_active: true },
      { name: 'Tratamiento Olaplex Reparador', price: 80.00, type: 'service', stock: 0, is_active: true },
      { name: 'Shampoo Olaplex No.4 250ml', price: 110.00, type: 'product', stock: 12, is_active: true },
      { name: 'Aceite de Argan Reparador 50ml', price: 65.00, type: 'product', stock: 18, is_active: true },
    ],
    customers: [
      { name: 'Valentina Torres', phone: '51988776655', total_spent: 620.00, visits_count: 7, last_visit_at: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'active', notes: 'Fórmula tinte: 8.1 con 20 vol.' },
      { name: 'Camila Reyes', phone: '51977665544', total_spent: 310.00, visits_count: 5, last_visit_at: new Date(Date.now() - 8 * 86400000).toISOString(), status: 'active', birthday: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0] },
      { name: 'Andrea Paredes', phone: '51966554433', total_spent: 240.00, visits_count: 3, last_visit_at: new Date(Date.now() - 28 * 86400000).toISOString(), status: 'risk' },
      { name: 'Sofía Morales', phone: '51955443311', total_spent: 530.00, visits_count: 6, last_visit_at: new Date(Date.now() - 52 * 86400000).toISOString(), status: 'inactive' },
    ],
    transactions: [
      { amount: 195.00, payment_method: 'yape_plin', customer_name: 'Valentina Torres', items_summary: [{ id: '1', name: 'Balayage Glow', price: 140, quantity: 1, type: 'service' }, { id: '2', name: 'Manicure Rusa', price: 55, quantity: 1, type: 'service' }], status: 'paid', created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
      { amount: 110.00, payment_method: 'tarjeta', customer_name: 'Camila Reyes', items_summary: [{ id: '1', name: 'Shampoo Olaplex', price: 110, quantity: 1, type: 'product' }], status: 'paid', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
      { amount: 80.00, payment_method: 'efectivo', customer_name: 'Sillón 2 (Atención)', items_summary: [{ id: '1', name: 'Tratamiento Olaplex', price: 80, quantity: 1, type: 'service' }], status: 'pending', created_at: new Date(Date.now() - 20 * 60000).toISOString() },
    ]
  },
  mascotas: {
    business: {
      name: 'PetVets & Spa Canino',
      slug: 'petvets-spa',
      rubro: 'mascotas',
      currency: 'S/',
      theme_config: { rubro: 'mascotas', paletteId: 'mint-turquoise' },
      welcome_reward: '🐾 Desparasitación Gratis en el primer baño de tu mascota',
    },
    categories: [
      { name: 'Consultas & Salud', type: 'service' },
      { name: 'Grooming & Baños', type: 'service' },
      { name: 'Alimentos & Snacks', type: 'product' },
      { name: 'Fármacos & Pipetas', type: 'product' },
    ],
    items: [
      { name: 'Consulta Veterinaria General', price: 40.00, type: 'service', stock: 0, is_active: true },
      { name: 'Baño Medicado + Limpieza Oídos', price: 50.00, type: 'service', stock: 0, is_active: true },
      { name: 'Vacuna Triple Felina / Quintuple', price: 60.00, type: 'service', stock: 0, is_active: true },
      { name: 'Pro Plan Perro Adulto 3kg', price: 78.00, type: 'product', stock: 15, is_active: true },
      { name: 'Pipeta Bravecto Perro 10-20kg', price: 95.00, type: 'product', stock: 22, is_active: true },
    ],
    customers: [
      { name: 'Mauricio & "Max" (Pug)', phone: '51944332211', total_spent: 450.00, visits_count: 6, last_visit_at: new Date(Date.now() - 4 * 86400000).toISOString(), status: 'active', notes: 'Pug alérgico al champú común' },
      { name: 'Daniela & "Pelusa" (Gato)', phone: '51933221100', total_spent: 280.00, visits_count: 4, last_visit_at: new Date(Date.now() - 12 * 86400000).toISOString(), status: 'active' },
      { name: 'Gonzalo & "Thor" (Golden)', phone: '51922110099', total_spent: 390.00, visits_count: 5, last_visit_at: new Date(Date.now() - 32 * 86400000).toISOString(), status: 'risk' },
      { name: 'Patty & "Luna" (Shih Tzu)', phone: '51911009988', total_spent: 510.00, visits_count: 8, last_visit_at: new Date(Date.now() - 60 * 86400000).toISOString(), status: 'inactive' },
    ],
    transactions: [
      { amount: 135.00, payment_method: 'yape_plin', customer_name: 'Mauricio & "Max"', items_summary: [{ id: '1', name: 'Baño Medicado', price: 50, quantity: 1, type: 'service' }, { id: '2', name: 'Pipeta Bravecto', price: 95, quantity: 1, type: 'product' }], status: 'paid', created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
      { amount: 40.00, payment_method: 'efectivo', customer_name: 'Daniela & "Pelusa"', items_summary: [{ id: '1', name: 'Consulta Veterinaria', price: 40, quantity: 1, type: 'service' }], status: 'pending', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
    ]
  },
  retail: {
    business: {
      name: 'TechFix & Retail Express',
      slug: 'techfix-express',
      rubro: 'retail',
      currency: 'S/',
      theme_config: { rubro: 'retail', paletteId: 'cobalt-graphite' },
      welcome_reward: '📱 Protector de Pantalla Gratis en tu servicio técnico',
    },
    categories: [
      { name: 'Servicios Técnicos', type: 'service' },
      { name: 'Accesorios & Gadgets', type: 'product' },
      { name: 'Cargadores & Cables', type: 'product' },
    ],
    items: [
      { name: 'Mantenimiento Preventivo Laptop/PC', price: 80.00, type: 'service', stock: 0, is_active: true },
      { name: 'Cambio de Pantalla Smartphone', price: 120.00, type: 'service', stock: 0, is_active: true },
      { name: 'Audífonos Bluetooth Wireless TWS', price: 65.00, type: 'product', stock: 25, is_active: true },
      { name: 'Cargador Carga Rápida 33W Type-C', price: 45.00, type: 'product', stock: 40, is_active: true },
      { name: 'Powerbank 10,000mAh Ultra Slim', price: 75.00, type: 'product', stock: 16, is_active: true },
    ],
    customers: [
      { name: 'Jorge Benítez', phone: '51900998877', total_spent: 420.00, visits_count: 5, last_visit_at: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'active' },
      { name: 'Esteban Ruiz', phone: '51988112233', total_spent: 260.00, visits_count: 3, last_visit_at: new Date(Date.now() - 9 * 86400000).toISOString(), status: 'active' },
      { name: 'Valeria Castro', phone: '51977223344', total_spent: 190.00, visits_count: 2, last_visit_at: new Date(Date.now() - 35 * 86400000).toISOString(), status: 'risk' },
      { name: 'Renzo Farfán', phone: '51966334455', total_spent: 580.00, visits_count: 7, last_visit_at: new Date(Date.now() - 70 * 86400000).toISOString(), status: 'inactive' },
    ],
    transactions: [
      { amount: 165.00, payment_method: 'tarjeta', customer_name: 'Jorge Benítez', items_summary: [{ id: '1', name: 'Cambio de Pantalla', price: 120, quantity: 1, type: 'service' }, { id: '2', name: 'Cargador 33W', price: 45, quantity: 1, type: 'product' }], status: 'paid', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { amount: 120.00, payment_method: 'efectivo', customer_name: 'Orden Servicio #104', items_summary: [{ id: '1', name: 'Cambio de Pantalla', price: 120, quantity: 1, type: 'service' }], status: 'pending', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
    ]
  }
};

const STORAGE_KEY = 'korat_pos_express_data_v1';

export interface PosStateData {
  business: PosBusiness;
  categories: PosCategory[];
  items: PosItem[];
  customers: PosCustomer[];
  transactions: PosTransaction[];
}

export const getStoredPosData = (rubro: RubroType = 'gastro'): PosStateData => {
  if (typeof window === 'undefined') return loadDemoState(rubro);

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${rubro}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.business && parsed?.items && parsed?.customers) {
        return {
          ...parsed,
          categories: parsed.categories || [],
          items: parsed.items || [],
          customers: parsed.customers || [],
          transactions: parsed.transactions || [],
          expenses: parsed.expenses || [],
          appointments: parsed.appointments || [],
        };
      }
    }
  } catch (e) {
    console.error('Error loading local POS data:', e);
  }

  const demoState = loadDemoState(rubro);
  savePosDataToStorage(demoState);
  return demoState;
};

export const createCleanState = (rubro: RubroType = 'gastro', businessName?: string): PosStateData => {
  return {
    business: {
      id: `b_real_${Date.now()}`,
      name: businessName || 'Mi Negocio Real',
      rubro,
      currency: 'S/',
      slug: (businessName || 'mi-negocio').toLowerCase().replace(/\s+/g, '-'),
      theme_config: { paletteId: 'warm_amber' },
    },
    categories: [],
    items: [
      {
        id: `it_init_1`,
        business_id: `b_real`,
        name: rubro === 'gastro' ? 'Plato / Consumo Ejemplo' : rubro === 'belleza' ? 'Servicio Ejemplo' : 'Producto Ejemplo',
        price: 25.0,
        type: rubro === 'belleza' ? 'service' : 'product',
        stock: 10,
        is_active: true,
      },
    ],
    customers: [],
    transactions: [],
    expenses: [],
    appointments: [],
  };
};

export const savePosDataToStorage = (state: PosStateData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${state.business.rubro}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving local POS data:', e);
  }
};

export const loadDemoState = (rubro: RubroType): PosStateData => {
  const t = DEMO_DATA_POR_RUBRO[rubro] || DEMO_DATA_POR_RUBRO.gastro;
  const bId = `b_demo_${rubro}_${Math.random().toString(36).substring(2, 6)}`;

  const categories: PosCategory[] = t.categories.map((c, i) => ({
    id: `cat_${c.name.toLowerCase().replace(/\s+/g, '_')}`,
    business_id: bId,
    name: c.name,
    type: c.type,
  }));

  const items: PosItem[] = t.items.map((it, i) => {
    // Buscar categoría que coincida por tipo
    const matchingCat = categories.find((c) => c.type === it.type) || categories[0];
    return {
      id: `item_${i + 1}`,
      business_id: bId,
      category_id: matchingCat?.id,
      name: it.name,
      price: it.price,
      type: it.type,
      stock: it.stock,
      is_active: it.is_active,
    };
  });

  const customers: PosCustomer[] = t.customers.map((c, i) => ({
    id: `cust_${i + 1}`,
    business_id: bId,
    name: c.name,
    phone: c.phone,
    birthday: c.birthday,
    total_spent: c.total_spent,
    visits_count: c.visits_count,
    last_visit_at: c.last_visit_at,
    status: c.status,
    notes: c.notes,
  }));

  const transactions: PosTransaction[] = t.transactions.map((tr, i) => ({
    id: `tx_${i + 1}`,
    business_id: bId,
    customer_id: customers[i % customers.length]?.id,
    customer_name: tr.customer_name,
    amount: tr.amount,
    payment_method: tr.payment_method,
    items_summary: tr.items_summary,
    created_at: tr.created_at,
  }));

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const inTwoDaysStr = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

  const expenses: PosExpense[] = [
    { id: 'exp_1', business_id: bId, category: 'Servicios Básicos', description: 'Pago Luz & Agua del mes', amount: 240.00, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'exp_2', business_id: bId, category: 'Proveedores & Insumos', description: 'Compra de Insumos / Stock', amount: 450.00, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: 'exp_3', business_id: bId, category: 'Nómina & Sueldos', description: 'Adelanto de Sueldo Personal', amount: 300.00, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  ];

  const appointments: PosAppointment[] = [
    { id: 'app_1', business_id: bId, customer_name: 'Valentina Torres', customer_phone: '51988776655', service_name: 'Tinte Global + Balayage Glow', time_slot: '10:00 AM', date: todayStr, status: 'confirmed' },
    { id: 'app_2', business_id: bId, customer_name: 'Camila Reyes', customer_phone: '51977665544', service_name: 'Manicure Rusa + Gel Color', time_slot: '11:30 AM', date: todayStr, status: 'in_progress' },
    { id: 'app_3', business_id: bId, customer_name: 'Carlos Mendoza (Mesa 4)', customer_phone: '51987654321', service_name: 'Reserva Mesa Almuerzo (4 pers)', time_slot: '01:30 PM', date: todayStr, status: 'confirmed' },
    { id: 'app_4', business_id: bId, customer_name: 'Mauricio & "Max" (Pug)', customer_phone: '51999888777', service_name: 'Baño Medicado + Corte Uñas', time_slot: '04:00 PM', date: todayStr, status: 'confirmed' },
    { id: 'app_5', business_id: bId, customer_name: 'Andrea Paredes', customer_phone: '51966554433', service_name: 'Tratamiento Olaplex Reparador', time_slot: '11:00 AM', date: tomorrowStr, status: 'confirmed' },
    { id: 'app_6', business_id: bId, customer_name: 'Mariano Silva', customer_phone: '51955443322', service_name: 'Corte de Cabello + Barba', time_slot: '03:30 PM', date: inTwoDaysStr, status: 'confirmed' },
    { id: 'app_7', business_id: bId, customer_name: 'Lucía Benavides', customer_phone: '51912345678', service_name: 'Pedicure Spa Completo', time_slot: '04:00 PM', date: yesterdayStr, status: 'completed' },
  ];

  return {
    business: { ...t.business, id: bId },
    categories,
    items,
    customers,
    transactions,
    expenses,
    appointments,
  };
};

export const registerSale = async (
  state: PosStateData,
  sale: {
    customer?: PosCustomer | null;
    amount: number;
    paymentMethod: PosTransaction['payment_method'];
    itemsSummary: PosTransactionItem[];
    status?: 'paid' | 'pending';
    tableNumber?: string;
    staffName?: string;
    note?: string;
  }
): Promise<PosStateData> => {
  const newTx: PosTransaction = {
    id: `tx_${Date.now()}`,
    business_id: state.business.id,
    customer_id: sale.customer?.id,
    customer_name: sale.customer ? sale.customer.name : 'Cliente Anónimo',
    amount: sale.amount,
    payment_method: sale.paymentMethod,
    items_summary: sale.itemsSummary,
    status: sale.status || 'paid',
    table_number: sale.tableNumber,
    staff_name: sale.staffName,
    note: sale.note,
    created_at: new Date().toISOString(),
  };

  let updatedCustomers = [...state.customers];
  if (sale.customer) {
    updatedCustomers = updatedCustomers.map((c) => {
      if (c.id === sale.customer?.id) {
        return {
          ...c,
          total_spent: Number((c.total_spent + sale.amount).toFixed(2)),
          visits_count: c.visits_count + 1,
          last_visit_at: newTx.created_at,
          status: 'active' as const,
        };
      }
      return c;
    });
  }

  const updatedItems = state.items.map((it) => {
    const foundInSale = sale.itemsSummary.find((s) => s.id === it.id);
    if (foundInSale && it.type === 'product' && it.stock > 0) {
      return {
        ...it,
        stock: Math.max(0, it.stock - foundInSale.quantity),
      };
    }
    return it;
  });

  const updatedState: PosStateData = {
    ...state,
    items: updatedItems,
    customers: updatedCustomers,
    transactions: [newTx, ...state.transactions],
  };

  savePosDataToStorage(updatedState);

  if (state.business.id && !state.business.id.startsWith('b_demo')) {
    try {
      await supabase.from('pos_transactions').insert({
        business_id: state.business.id,
        customer_id: sale.customer?.id || null,
        amount: sale.amount,
        payment_method: sale.paymentMethod,
        items_summary: sale.itemsSummary,
      });
    } catch (e) {
      console.warn('Supabase offline fallback active');
    }
  }

  return updatedState;
};

export const confirmTransactionPayment = async (
  state: PosStateData,
  txId: string
): Promise<PosStateData> => {
  const updatedTx = state.transactions.map((t) => {
    if (t.id === txId) {
      return { ...t, status: 'paid' as const };
    }
    return t;
  });

  const newState = { ...state, transactions: updatedTx };
  savePosDataToStorage(newState);
  return newState;
};

export const formatInternationalPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Si ingresa 9 dígitos iniciando con 9 (Perú), le añade el código de país 51
  if (digits.length === 9 && digits.startsWith('9')) {
    return `51${digits}`;
  }
  return digits;
};

export const buildCustomerWaUrl = (customer: PosCustomer, businessName: string, reward: string) => {
  const cleanPhone = formatInternationalPhone(customer.phone);
  let text = '';

  if (customer.status === 'inactive') {
    text = `¡Hola ${customer.name}! 👋 Te extrañamos en ${businessName}. Te tenemos guardado un beneficio especial: ${reward}. ¿Cuándo nos visitas esta semana?`;
  } else if (customer.status === 'risk') {
    text = `Hola ${customer.name} 😊 Hace días que no te vemos por ${businessName}. Recuerda que tienes tu beneficio exclusivo: ${reward}. ¡Te esperamos!`;
  } else {
    text = `¡Hola ${customer.name}! Gracias por ser cliente VIP en ${businessName}. Muestra este mensaje en tu próxima visita para reclamar: ${reward}. 🌟`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const exportPosDataToCsv = (state: PosStateData, type: 'customers' | 'transactions') => {
  let csvContent = 'data:text/csv;charset=utf-8,';

  if (type === 'customers') {
    csvContent += 'Nombre,Telefono,Total_Gastado,Visitas,Ultima_Visita,Estado\n';
    state.customers.forEach((c) => {
      csvContent += `"${c.name}","${c.phone}",${c.total_spent},${c.visits_count},"${c.last_visit_at}","${c.status}"\n`;
    });
  } else {
    csvContent += 'Fecha,Cliente,Monto,Metodo_Pago,Items\n';
    state.transactions.forEach((t) => {
      const itemsStr = t.items_summary.map((i) => `${i.name} x${i.quantity}`).join('; ');
      csvContent += `"${t.created_at}","${t.customer_name || 'Anonimo'}",${t.amount},"${t.payment_method}","${itemsStr}"\n`;
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `korat_pos_${type}_${state.business.rubro}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
