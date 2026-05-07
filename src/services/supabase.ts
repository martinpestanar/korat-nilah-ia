import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Filtro de consola para evitar que la UI vomite warnings falsos en modo Dev
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Multiple GoTrueClient instances')) return;
    originalWarn(...args);
  };
}

const clientsCache = new Map<string, any>();

export const getSupabaseClient = (businessId?: string) => {
  if (!businessId) return supabase;
  
  if (clientsCache.has(businessId)) {
    return clientsCache.get(businessId);
  }

  const headers = { 'x-business-id': businessId };
  const newClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers },
  });
  
  clientsCache.set(businessId, newClient);
  return newClient;
};
