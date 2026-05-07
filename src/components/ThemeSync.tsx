/**
 * ThemeSync — Puente entre ThemeContext y Supabase
 *
 * Este componente NO renderiza nada. Su único trabajo es:
 *  1. Al montar (login): leer el tema guardado en negocios.marca_identidad.tema
 *     y aplicarlo al ThemeContext.
 *  2. Cuando el usuario cambia de paleta MANUALMENTE: guardar en Supabase.
 *
 * Vive dentro de ProtectedAppLayout para tener acceso al usuario autenticado.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';

const THEME_KEY = 'korat-brand-palette';
const THEME_CUSTOM_KEY = 'korat-brand-custom';

export const ThemeSync: React.FC = () => {
  const { user } = useAuth();
  const { activePaletteId, customPalette, setActivePalette } = useTheme();

  // true = la carga inicial desde DB terminó, ya se pueden guardar cambios
  const [readyToSave, setReadyToSave] = useState(false);
  // Guardamos el paletteId cargado desde DB para no re-guardarlo en loop
  const loadedPaletteId = useRef<string | null>(null);

  // ── 1. Al hacer login: cargar tema desde Supabase ──────────────────────────
  useEffect(() => {
    if (!user) {
      // Al cerrar sesión, resetear para el próximo login
      setReadyToSave(false);
      loadedPaletteId.current = null;
      return;
    }

    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) {
      setReadyToSave(true);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from('negocios')
          .select('marca_identidad')
          .eq('id', businessId)
          .maybeSingle();

        const temaGuardado = data?.marca_identidad?.tema;

        if (temaGuardado?.paleta_id) {
          const { paleta_id, custom_palette } = temaGuardado;

          if (paleta_id === 'custom' && custom_palette) {
            setActivePalette('custom', custom_palette);
            localStorage.setItem(THEME_KEY, 'custom');
            localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(custom_palette));
          } else {
            setActivePalette(paleta_id);
            localStorage.setItem(THEME_KEY, paleta_id);
          }

          loadedPaletteId.current = paleta_id;
        } else {
          // No hay tema guardado aún → restaurar al valor por defecto para no 'heredar'
          // el tema guardado en localStorage de una sesión/negocio anterior
          setActivePalette('default');
          localStorage.setItem(THEME_KEY, 'default');
          loadedPaletteId.current = 'default';
        }
      } catch {
        // En caso de error, también es más seguro asumir 'default'
        setActivePalette('default');
        localStorage.setItem(THEME_KEY, 'default');
        loadedPaletteId.current = 'default';
      } finally {
        // A partir de aquí ya podemos guardar cambios futuros
        setReadyToSave(true);
      }
    })();
  // Solo re-ejecutar cuando cambie el usuario (login/logout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── 2. Cuando el usuario cambia la paleta: guardar en Supabase ─────────────
  useEffect(() => {
    if (!readyToSave) return;
    if (!user) return;

    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return;

    // Si es la misma paleta que se cargó desde DB, no guardar en loop
    if (loadedPaletteId.current === activePaletteId) return;

    const temaData: Record<string, any> = { paleta_id: activePaletteId };
    if (activePaletteId === 'custom') {
      temaData.custom_palette = customPalette;
    }

    (async () => {
      try {
        // Leer marca_identidad actual para no pisar otros campos
        const { data: current } = await supabase
          .from('negocios')
          .select('marca_identidad')
          .eq('id', businessId)
          .maybeSingle();

        const existingMarca =
          current?.marca_identidad && typeof current.marca_identidad === 'object'
            ? current.marca_identidad
            : {};

        await supabase
          .from('negocios')
          .update({ marca_identidad: { ...existingMarca, tema: temaData } })
          .eq('id', businessId);

        // Actualizar ref para evitar loops
        loadedPaletteId.current = activePaletteId;
      } catch {
        // Silenciar — localStorage ya tiene el valor como fallback
      }
    })();
  }, [activePaletteId, customPalette, readyToSave, user]);

  return null;
};
