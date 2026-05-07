import { supabase, getSupabaseClient } from './supabase';
import { CategoriaCalendario } from '../types';

export interface Proveedor {
  id: number;
  business_id: string;
  nombre: string;
  whatsapp?: string;
  detalles?: string;
  direccion?: string;
  created_at?: string;
}

export interface ProductoInventario {
  id: number;
  business_id: string;
  nombre: string;
  marca?: string;
  proveedor_id?: number | null;
  cantidad_total: number;
  unidad_medida: string;
  rinde_servicios: number;
  costo_unidad?: number;
  stock_minimo?: number;
  categorias_aplicables?: string[];
  created_at?: string;
  proveedores?: Proveedor; // Para joins
}

const cleanPayload = (obj: any) => {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  }
  // Null is allowed for some fields like proveedor_id if explicitly removed,
  // but if it's empty string we removed it. If the user wants to set proveedor_id = null
  // we need to be careful. In this UI, empty isn't usually sent as null for foreign keys.
  // Wait, if proveedor_id is null, let's keep it null in the payload.
  if (obj.proveedor_id === null) cleaned.proveedor_id = null;
  return cleaned;
};

export const inventoryService = {
  // Categorias
  async getCategorias(businessId: string): Promise<CategoriaCalendario[]> {
    const client = getSupabaseClient(businessId);
    const { data, error } = await client
      .from('categorias_servicio')
      .select('id, nombre, descripcion, emoji, activo')
      .eq('business_id', businessId)
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Proveedores
  async getProveedores(businessId: string): Promise<Proveedor[]> {
    const client = getSupabaseClient(businessId);
    const { data, error } = await client
      .from('proveedores')
      .select('*')
      .eq('business_id', businessId)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertProveedor(proveedor: Partial<Proveedor>): Promise<Proveedor> {
    const payload = cleanPayload(proveedor);
    if (!payload.id) delete payload.id; // Prevent updating missing id as 0 or undefined securely

    const client = payload.business_id ? getSupabaseClient(payload.business_id) : supabase;
    const { data, error } = await client
      .from('proveedores')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProveedor(id: number): Promise<void> {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (error) throw error;
  },

  // Productos
  async getProductos(businessId: string): Promise<ProductoInventario[]> {
    const client = getSupabaseClient(businessId);
    const { data, error } = await client
      .from('productos_inventario')
      .select('*, proveedores(nombre, whatsapp)')
      .eq('business_id', businessId)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async upsertProducto(producto: Partial<ProductoInventario>): Promise<ProductoInventario> {
    const payload = cleanPayload(producto);
    if (!payload.id) delete payload.id; 
    
    // Si no enviaron categorias aplicables o esta vacio, lo enviamos como array vacio y no null
    if (!payload.categorias_aplicables) {
      payload.categorias_aplicables = [];
    }

    const client = payload.business_id ? getSupabaseClient(payload.business_id) : supabase;
    const { data, error } = await client
      .from('productos_inventario')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProducto(id: number): Promise<void> {
    const { error } = await supabase.from('productos_inventario').delete().eq('id', id);
    if (error) throw error;
  },

};
