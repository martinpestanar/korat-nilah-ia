/**
 * GodMode — Precios de suscripción (Simplificado a Soles)
 */
import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { fetchPrecios, updatePrecio } from '../../services/godmode';

const fmt = (pen: number) => `S/. ${pen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PLANES_BASE = [
  { id: 'glow', nombre: '✨ Glow', desc: 'Suscripción Básica' },
  { id: 'glow_pro', nombre: '⭐ Glow Pro', desc: 'Suscripción Avanzada' },
  { id: 'glow_elite', nombre: '💎 Glow Elite', desc: 'Suscripción Premium' },
  { id: 'plan_setup_inicial', nombre: '🛠️ Setup Inicial', desc: 'Pago único de configuración' }
];

type PlanValues = {
  precio: string;
  precio_pen: string;
  precio_regular: string;
  precio_regular_pen: string;
};

const GodModePrecios: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, PlanValues>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPrecios();
      const vals: Record<string, PlanValues> = {};
      
      PLANES_BASE.forEach(p => {
        const found = data.find(d => d.id === p.id);
        vals[p.id] = {
          precio: found ? String(found.precio) : "0",
          precio_pen: found ? String(found.precio_pen) : "0",
          precio_regular: found ? String(found.precio_regular) : "0",
          precio_regular_pen: found ? String(found.precio_regular_pen) : "0",
        };
      });
      
      setEditValues(vals);
    } catch (e) {
      console.error('Error cargando precios:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    const v = editValues[id];
    setSaving(id);
    try {
      await updatePrecio(id, {
        precio: parseFloat(v.precio) || 0,
        precio_pen: parseFloat(v.precio_pen) || 0,
        precio_regular: parseFloat(v.precio_regular) || 0,
        precio_regular_pen: parseFloat(v.precio_regular_pen) || 0,
      });
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (planId: string, field: keyof PlanValues, val: string) => {
    setEditValues(prev => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: val }
    }));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">💰 Control Maestro de Precios</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Define los montos que se verán en la Landing Page (USD y Soles)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl">
            {PLANES_BASE.map(p => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{p.nombre}</p>
                    <p className="text-[10px] text-zinc-500">{p.desc}</p>
                  </div>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={saving === p.id}
                    className={`px-4 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${
                      saved === p.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {saving === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === p.id ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saved === p.id ? 'Guardado' : 'Guardar Cambios'}
                  </button>
                </div>
                
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* PRECIO ACTUAL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Precio USD</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio}
                        onChange={e => updateField(p.id, 'precio', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-6 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Precio Soles (PEN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">S/</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_pen}
                        onChange={e => updateField(p.id, 'precio_pen', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* PRECIO REGULAR (Tachado) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reg. USD (Tachado)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">$</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_regular}
                        onChange={e => updateField(p.id, 'precio_regular', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl pl-6 pr-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reg. PEN (Tachado)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">S/</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_regular_pen}
                        onChange={e => updateField(p.id, 'precio_regular_pen', e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700/50 rounded-xl pl-8 pr-3 py-2 text-sm text-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GodModePrecios;
