/**
 * GodMode — Precios de suscripción (Simplificado a Soles)
 */
import React, { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { fetchPrecios, updatePrecio } from '../../services/godmode';

const fmt = (pen: number) => `S/. ${pen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PLANES_BASE = [
  { id: 'glow', nombre: '✨ Glow', desc: 'Plan Inicial' },
  { id: 'glow_pro', nombre: '⭐ Glow Pro', desc: 'Plan Avanzado con Marketing' },
  { id: 'glow_elite', nombre: '💎 Glow Elite', desc: 'Plan Premium con Copilot' }
];

const GodModePrecios: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPrecios();
      const vals: Record<string, string> = {};
      
      // Intentar cargar desde BD, si no existen asignar default 0
      PLANES_BASE.forEach(p => {
        const found = data.find(d => d.id === p.id);
        vals[p.id] = found ? String(found.precio) : "0";
      });
      
      setEditValues(vals);
    } catch (e) {
      console.error('Error cargando precios:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    const val = parseFloat(editValues[id]);
    if (isNaN(val)) return;
    setSaving(id);
    try {
      await updatePrecio(id, val);
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">Precios de Suscripción (Soles)</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Control de contabilidad en moneda local (PEN)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇵🇪</span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Planes Nilah IA</p>
                    <p className="text-[11px] text-zinc-500">Montos mensuales a cobrar por salón</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-zinc-800 flex flex-col">
                {PLANES_BASE.map(p => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 font-medium">{p.nombre}</p>
                        <p className="text-[11px] text-zinc-600">{p.desc}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <p className="text-[10px] text-zinc-600 mb-0.5">Precio Guardado</p>
                          <p className="text-sm font-bold text-emerald-400">
                            {fmt(parseFloat(editValues[p.id] || "0"))}
                          </p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">S/</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValues[p.id]}
                            onChange={e => setEditValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 text-right font-medium transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => handleSave(p.id)}
                          disabled={saving === p.id}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            saved === p.id
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          {saving === p.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : saved === p.id
                            ? <Check className="w-4 h-4" />
                            : <Save className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GodModePrecios;
