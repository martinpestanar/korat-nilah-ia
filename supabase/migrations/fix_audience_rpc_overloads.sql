-- Migración para eliminar sobrecargas ambiguas (overloads) de funciones RPC de Marketing
-- PostgREST devuelve error PGRST203 ("Could not choose the best candidate function")
-- cuando existen simultáneamente firmas con 'p_business_id uuid' y 'p_business_id text'.

DROP FUNCTION IF EXISTS public.get_marketing_audience_counts(uuid);
DROP FUNCTION IF EXISTS public.get_combined_broadcast_audience(uuid, text, integer, text, boolean, integer);
