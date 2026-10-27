const fs = require('fs');
let code = fs.readFileSync('src/pages/Calendar.tsx', 'utf8');

// Insertar el useEffect
const anchor = '  // Multi-servicio: array de servicios seleccionados para esta sesión';
const newCode = `  // Consultar sutilmente si la clienta seleccionada tiene premios del Club Glow pendientes
  useEffect(() => {
    if (!formClient || !businessId) {
      setClientPendingPrize(null);
      return;
    }
    const checkPrize = async () => {
      try {
        setLoadingPendingPrize(true);
        const { data, error } = await supabase
          .from('sellos_premios_ganados')
          .select('roadmap_id, sellos_roadmap(nombre, hito_sello)')
          .eq('business_id', businessId)
          .eq('cliente_id', formClient)
          .eq('estado', 'pendiente')
          .gte('expira_en', new Date().toISOString())
          .order('ganado_en', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.sellos_roadmap) {
          const rm: any = data.sellos_roadmap;
          setClientPendingPrize({
            nombre: rm?.nombre || 'Regalo Club Glow',
            hito_sello: rm?.hito_sello || 4
          });
        } else {
          setClientPendingPrize(null);
        }
      } catch (err) {
        setClientPendingPrize(null);
      } finally {
        setLoadingPendingPrize(false);
      }
    };
    checkPrize();
  }, [formClient, businessId]);

${anchor}`;

if (code.includes(anchor)) {
  code = code.replace(anchor, newCode);
  fs.writeFileSync('src/pages/Calendar.tsx', code, 'utf8');
  console.log('Calendar.tsx: Hook de chequeo de premio insertado correctamente.');
} else {
  console.log('Anchor no encontrado.');
}
