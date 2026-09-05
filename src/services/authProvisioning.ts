import { supabase } from './supabase';

export interface ProvisionUserParams {
  userId: string;
  email: string;
  salonName?: string;
  password?: string;
  especialidad?: string;
  initialServices?: Array<{ name: string; price: number; durationMin: number }>;
}

export interface ProvisionResult {
  success: boolean;
  businessId: string | null;
  usuario: any | null;
  error?: string;
}

// Mutex / In-flight promises map to prevent concurrent provisioning runs for the same user
const inFlightProvisions = new Map<string, Promise<ProvisionResult>>();

/**
 * Ensures that a user profile and associated business are cleanly provisioned in Supabase.
 * Thread-safe / Concurrency-safe: If called multiple times simultaneously for the same userId/email,
 * callers share the exact same Promise execution.
 */
export async function provisionUserAccount(params: ProvisionUserParams): Promise<ProvisionResult> {
  const cacheKey = params.userId || params.email.toLowerCase().trim();

  if (inFlightProvisions.has(cacheKey)) {
    return inFlightProvisions.get(cacheKey)!;
  }

  const promise = (async (): Promise<ProvisionResult> => {
    try {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanSalon = (params.salonName || '').trim() || cleanEmail.replace('@nilah.app', '').replace(/[^a-zA-Z0-9_-]/g, ' ') || 'Mi Salón';
      const userId = params.userId;

      // 1. Check if user profile already exists in Usuarios
      const { data: existingUser, error: checkErr } = await supabase
        .from('Usuarios')
        .select('*')
        .eq('auth_uid', userId)
        .maybeSingle();

      if (!checkErr && existingUser && existingUser.business_id) {
        return {
          success: true,
          businessId: existingUser.business_id,
          usuario: existingUser,
        };
      }

      // 2. Call create_free_negocio RPC
      const { data: negId, error: rpcErr } = await supabase.rpc('create_free_negocio', {
        p_nombre_persona: cleanSalon,
        p_nombre_negocio: cleanSalon,
        p_email: cleanEmail,
        p_user_uid: userId,
        p_password: params.password || '',
      });

      if (rpcErr) {
        console.error('[authProvisioning] RPC create_free_negocio error:', rpcErr);
        // If RPC failed, check if user was created regardless
        const { data: fallbackUser } = await supabase
          .from('Usuarios')
          .select('*')
          .eq('auth_uid', userId)
          .maybeSingle();

        if (fallbackUser && fallbackUser.business_id) {
          return {
            success: true,
            businessId: fallbackUser.business_id,
            usuario: fallbackUser,
          };
        }

        return {
          success: false,
          businessId: null,
          usuario: null,
          error: rpcErr.message || 'Error al aprovisionar el negocio',
        };
      }

      const businessId = negId as string;

      // 3. Confirm business plan
      if (businessId) {
        try {
          await supabase
            .from('negocios')
            .update({ plan: 'glow', plan_suscripcion: 'glow' })
            .eq('id', businessId);
        } catch (e) {
          console.warn('[authProvisioning] Error updating negocio plan:', e);
        }

        try {
          await supabase
            .from('Usuarios')
            .update({ plan: 'Glow' })
            .eq('auth_uid', userId);
        } catch (e) {
          console.warn('[authProvisioning] Error updating usuario plan:', e);
        }

        // 4. Insert initial services if provided
        if (params.initialServices && params.initialServices.length > 0) {
          const servicesPayload = params.initialServices.map((serv) => ({
            business_id: businessId,
            nombre: serv.name,
            precio: serv.price,
            duracion: serv.durationMin,
            activo: true,
          }));

          try {
            await supabase.from('servicios').insert(servicesPayload);
          } catch (e) {
            console.warn('[authProvisioning] Error inserting initial services:', e);
          }
        }
      }

      // 5. Fetch and verify final user profile
      const { data: finalUser, error: finalErr } = await supabase
        .from('Usuarios')
        .select('*')
        .eq('auth_uid', userId)
        .maybeSingle();

      if (finalErr || !finalUser) {
        return {
          success: false,
          businessId: businessId || null,
          usuario: null,
          error: 'No se pudo recuperar el perfil del usuario tras aprovisionar.',
        };
      }

      return {
        success: true,
        businessId: finalUser.business_id || businessId,
        usuario: finalUser,
      };
    } catch (err: any) {
      console.error('[authProvisioning] Unexpected error during provisioning:', err);
      return {
        success: false,
        businessId: null,
        usuario: null,
        error: err?.message || 'Error inesperado durante el aprovisionamiento.',
      };
    } finally {
      // Clear mutex cache key after execution
      inFlightProvisions.delete(cacheKey);
    }
  })();

  inFlightProvisions.set(cacheKey, promise);
  return promise;
}
