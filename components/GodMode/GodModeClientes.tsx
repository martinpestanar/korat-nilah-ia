/**
 * GodMode — Lista de Clientes + Panel detalle de salón
 */
import React, { useState, useEffect } from 'react';
import {
  Plus, Zap, Store, Check, AlertTriangle, Clock,
  ChevronRight, Eye, ExternalLink, Users, BarChart2,
  Settings2, Link2, Star, Bot, FileText, X
} from 'lucide-react';
import type { NegocioAdmin, PlanBase } from '../../types/godmode';
import GodModeSalonPanel from './GodModeSalonPanel';
import { supabase } from '@/services/supabase';

interface Props {
  negocios: NegocioAdmin[];
  searchTerm: string;
  onReload: () => Promise<void>;
}

const ESTADO_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  activo:     { label: 'Activo',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  trial:      { label: 'Trial',      cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400' },
  suspendido: { label: 'Suspendido', cls: 'bg-red-500/15 text-red-400 border-red-500/20',             dot: 'bg-red-400' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-zinc-700/50 text-zinc-500 border-zinc-700',             dot: 'bg-zinc-500' },
};

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free: { label: '🆓 Free', cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20' },
  glow:   { label: '🟢 Glow',   cls: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  glow_pro:   { label: '⭐ Glow Pro',   cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  glow_elite: { label: '🧠 Glow Elite', cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
};

// Modal crear nuevo salón
const CreateSalonModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [plan, setPlan] = useState<PlanBase>('glow');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('superadmin_crear_negocio', {
        p_nombre: nombre.trim(),
        p_plan: plan,
        p_estado: 'trial'
      });
      if (err) throw err;
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al crear el salón');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Nuevo salón</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Nombre del salón *</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Nail Studio Lima"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Plan inicial</label>
            <div className="grid grid-cols-4 gap-2">
              {([['free', '🆓 Free', '$0'], ['glow', '🟢 Glow', '$89'], ['glow_pro', '⭐ Glow Pro', '$159'], ['glow_elite', '🧠 Glow Elite', '$239']] as const).map(([p, label, precio]) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    plan === p
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <div className="text-base leading-tight">{label.split(' ')[0]} {label.split(' ').slice(1).join(' ')}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">{precio}/mes</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear salón'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────
const GodModeClientes: React.FC<Props> = ({ negocios, searchTerm, onReload }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const selectedNegocio = negocios.find(n => n.id === selectedId);

  // Si hay un negocio seleccionado, mostrar su panel
  if (selectedId && selectedNegocio) {
    return (
      <GodModeSalonPanel
        negocio={selectedNegocio}
        onBack={() => setSelectedId(null)}
        onReload={async () => { await onReload(); }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header de sección */}
      <div className="p-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{negocios.length} salones encontrados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo salón
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {negocios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-zinc-600 gap-2">
            <Store className="w-8 h-8" />
            <p className="text-sm">{searchTerm ? 'No se encontraron resultados' : 'No hay salones aún'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {negocios.map(n => {
              const estado = ESTADO_BADGE[n.estado] || ESTADO_BADGE.activo;
              const planBadge = PLAN_BADGE[n.plan] || PLAN_BADGE.nilah;
              const ownerObj = n.owner as any;

              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 flex items-center gap-4 transition-all text-left group"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ background: `${n.color_primario || '#10B981'}25`, border: `1px solid ${n.color_primario || '#10B981'}40` }}
                  >
                    {n.nombre.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-zinc-100">{n.nombre}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${planBadge.cls}`}>
                        {planBadge.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex items-center gap-1 ${estado.cls}`}>
                        <span className={`w-1 h-1 rounded-full ${estado.dot}`} />
                        {estado.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">
                      {ownerObj?.email || ownerObj?.nombre_persona || 'Sin usuario asignado'}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500 flex-shrink-0">
                    <span title="Staff">{n.total_staff} 👩‍💼</span>
                    <span title="Citas este mes">{n.citas_mes} 📅</span>
                    <span title={`${n.destellos_disponibles} destellos`}>✨ {n.destellos_disponibles}</span>
                    {!n.brief_completado && (
                      <span className="text-amber-400 text-[10px]" title="Brief pendiente">📋</span>
                    )}
                    {n.onboarding_completado === false && (
                      <span className="text-red-400 text-[10px]" title="Onboarding incompleto">⚠️</span>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateSalonModal
          onClose={() => setShowCreate(false)}
          onCreated={onReload}
        />
      )}
    </div>
  );
};

export default GodModeClientes;
