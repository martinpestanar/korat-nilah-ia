/**
 * GodMode — Precios de suscripción
 */
import React, { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, Check } from 'lucide-react';
import { fetchPrecios, updatePrecio } from '../../services/godmode';
import type { PrecioSuscripcion } from '../../types/godmode';

const TC = 3.75; // Tasa de cambio referencial PEN/USD

const fmt = (usd: number) => `S/. ${Math.round(usd * TC).toLocaleString('es-PE')}`;
const fmtUsd = (usd: number) => `$${usd} USD`;

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  'CHATBOT':      { label: 'Bot / IA', emoji: '🤖', desc: 'Costo del agente conversacional' },
  'PLAN BASE':    { label: 'Plan base', emoji: '📦', desc: 'Precio mensual según tier' },
  'COMPLEMENTOS': { label: 'Módulos extra', emoji: '⚡', desc: 'Módulos adicionales al plan' },
  'WEBAPP':       { label: 'Web App', emoji: '🌐', desc: 'Dashboard web del salón' },
};

const GodModePrecios: React.FC = () => {
  const [precios, setPrecios] = useState<PrecioSuscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await fetchPrecios();
    setPrecios(data);
    const vals: Record<string, string> = {};
    data.forEach(p => { vals[p.id] = String(p.precio); });
    setEditValues(vals);
    setLoading(false);
  };

  const handleSave = async (id: string) => {
    const val = parseFloat(editValues[id]);
    if (isNaN(val)) return;
    setSaving(id);
    try {
      await updatePrecio(id, val);
      setPrecios(prev => prev.map(p => p.id === id ? { ...p, precio: val } : p));
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const grouped = (precios as PrecioSuscripcion[]).reduce<Record<string, PrecioSuscripcion[]>>((acc, p) => {
    const cat = p.categoria?.toUpperCase() || 'OTROS';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white">Precios de suscripción</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Ajusta los precios de cada componente del servicio</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {Object.entries(grouped).map(([cat, items]) => {
              const meta = CATEGORY_LABELS[cat] || { label: cat, emoji: '💲', desc: '' };
              return (
                <div key={cat} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">{meta.label}</p>
                        <p className="text-[11px] text-zinc-500">{meta.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {items.map(p => (
                      <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-300">{p.nombre}</p>
                            <p className="text-[11px] text-zinc-600">{fmtUsd(p.precio)} ref.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-white">{fmt(p.precio)}</p>
                              <p className="text-[11px] text-zinc-600">/mes</p>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editValues[p.id] ?? p.precio}
                                onChange={e => setEditValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-20 bg-zinc-800 border border-zinc-700 rounded-xl pl-6 pr-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 text-right"
                              />
                            </div>
                            <button
                              onClick={() => handleSave(p.id)}
                              disabled={saving === p.id}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                saved === p.id
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {saving === p.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : saved === p.id
                                ? <Check className="w-3.5 h-3.5" />
                                : <Save className="w-3.5 h-3.5" />
                              }
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GodModePrecios;
