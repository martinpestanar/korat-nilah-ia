/**
 * GodMode — Precios de suscripción (Clean Light Emerald Edition)
 */
import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check, DollarSign } from 'lucide-react';
import { fetchPrecios, updatePrecio } from '../../services/godmode';

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
    <div className="h-full flex flex-col font-sans text-slate-900">
      <div className="p-4 sm:p-6 pb-4 border-b border-emerald-100 bg-white/70 backdrop-blur-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>💰 Control Maestro de Planes SaaS</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Define las tarifas en Soles y USD para la Landing y Checkout</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-emerald-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {PLANES_BASE.map(p => (
              <div key={p.id} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:border-emerald-200 transition-all">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.nombre}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{p.desc}</p>
                  </div>
                  <button
                    onClick={() => handleSave(p.id)}
                    disabled={saving === p.id}
                    className={`px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
                      saved === p.id
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
                    }`}
                  >
                    {saving === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved === p.id ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saved === p.id ? 'Guardado' : 'Guardar'}</span>
                  </button>
                </div>
                
                <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {/* PRECIO ACTUAL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Precio USD ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio}
                        onChange={e => updateField(p.id, 'precio', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Precio Soles (PEN)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">S/</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_pen}
                        onChange={e => updateField(p.id, 'precio_pen', e.target.value)}
                        className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl pl-8 pr-3 py-2 text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* PRECIO REGULAR (Tachado) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tachado USD</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_regular}
                        onChange={e => updateField(p.id, 'precio_regular', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 text-xs font-medium text-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors line-through"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tachado PEN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">S/</span>
                      <input
                        type="number"
                        value={editValues[p.id].precio_regular_pen}
                        onChange={e => updateField(p.id, 'precio_regular_pen', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-500 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors line-through"
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
