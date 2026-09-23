/**
 * GodMode — Lista de Clientes + Panel detalle de salón (Clean Light Emerald Edition)
 */
import React, { useState } from 'react';
import {
  Plus, Zap, Store, Check, AlertTriangle, Clock,
  ChevronRight, Eye, ExternalLink, Users, BarChart2,
  Settings2, Link2, Star, Bot, FileText, X, Trash2
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
  activo:     { label: 'Activo',     cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  trial:      { label: 'Trial',      cls: 'bg-amber-50 text-amber-800 border-amber-200',       dot: 'bg-amber-500' },
  suspendido: { label: 'Suspendido', cls: 'bg-rose-50 text-rose-800 border-rose-200',         dot: 'bg-rose-500' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-slate-100 text-slate-700 border-slate-200',     dot: 'bg-slate-400' },
};

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  glow:     { label: '✨ Glow (Básico Gratis)', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  glow_pro: { label: '⭐ Glow Pro',            cls: 'bg-violet-50 text-violet-800 border-violet-200' },
};

// Modal crear nuevo salón (Light Clean)
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
        p_estado: 'activo'
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-black text-slate-900">Registrar Nuevo Salón</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4 text-xs font-medium text-slate-700">
          <div>
            <label className="text-xs text-slate-800 font-bold mb-1.5 block">Nombre del Salón *</label>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Genesis Studio Lima"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs text-slate-800 font-bold mb-1.5 block">Plan Inicial</label>
            <div className="grid grid-cols-2 gap-2.5">
              {([['glow', '✨ Glow', 'Gratis para siempre'], ['glow_pro', '⭐ Glow Pro', 'S/ 149 / mes']] as const).map(([p, label, precio]) => (
                <button
                  key={p}
                  onClick={() => setPlan(p as PlanBase)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    plan === p
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-black leading-tight">{label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{precio}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            {loading ? 'Creando...' : 'Crear salón'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal Confirmar Eliminación de Raíz ─────────────────────
const DeleteSalonModal: React.FC<{
  negocio: NegocioAdmin;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}> = ({ negocio, onClose, onDeleted }) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmText.trim().toLowerCase() === negocio.nombre.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('eliminar_negocio_completo', {
        p_business_id: negocio.id,
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data && data.success === false) throw new Error(data.error || 'Error al eliminar');

      await onDeleted();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error eliminando el salón por completo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-600">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-base font-black text-slate-900">Eliminar Salón de Raíz</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 space-y-1.5">
            <p className="font-black text-rose-900">⚠️ Esta acción es irreversible e inmediata</p>
            <p className="text-rose-700 text-[11px] leading-relaxed">
              Se eliminará de raíz el negocio <strong>{negocio.nombre}</strong> con todos sus datos asociados:
              citas, servicios, clientes, staff, configuraciones, tokens de acceso y cuentas de usuario asociadas en el sistema.
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-800 font-bold mb-1.5 block">
              Escribe el nombre del salón <span className="text-rose-600 font-mono select-all font-black">"{negocio.nombre}"</span> para confirmar:
            </label>
            <input
              autoFocus
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={negocio.nombre}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {loading ? 'Eliminando de raíz...' : 'Eliminar por completo'}
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
  const [salonToDelete, setSalonToDelete] = useState<NegocioAdmin | null>(null);

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
    <div className="h-full flex flex-col font-sans text-slate-900">
      {/* Header de sección */}
      <div className="p-4 sm:p-6 pb-4 border-b border-emerald-100 bg-white/70 backdrop-blur-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Directorio de Salones</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{negocios.length} salones registrados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo salón</span>
        </button>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4">
        {negocios.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200 p-8">
            <Store className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">{searchTerm ? 'No se encontraron resultados' : 'No hay salones aún'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {negocios.map(n => {
              const estado = ESTADO_BADGE[n.estado] || ESTADO_BADGE.activo;
              const planBadge = PLAN_BADGE[n.plan] || PLAN_BADGE.glow;
              const ownerObj = n.owner as any;

              return (
                <div
                  key={n.id}
                  className="w-full bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-4 flex items-center gap-4 transition-all text-left shadow-2xs hover:shadow-md group"
                >
                  {/* Clickable Area for Selecting Salon */}
                  <div
                    onClick={() => setSelectedId(n.id)}
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black text-emerald-900 bg-emerald-50 border border-emerald-200 flex-shrink-0"
                    >
                      {n.nombre.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{n.nombre}</p>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${planBadge.cls}`}>
                          {planBadge.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${estado.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
                          {estado.label}
                        </span>
                        {n.recursos_saas?.estado_pago && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                            n.recursos_saas.estado_pago === 'vencido' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            n.recursos_saas.estado_pago === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {n.recursos_saas.estado_pago === 'vencido' ? '🔴 Vencido' :
                             n.recursos_saas.estado_pago === 'pendiente' ? '🟡 Por Cobrar' : '🟢 Al día'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate font-medium">
                        {ownerObj?.email || ownerObj?.nombre_persona || 'Sin usuario asignado'}
                        {n.recursos_saas?.proximo_cobro && ` · Vence: ${n.recursos_saas.proximo_cobro}`}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 flex-shrink-0 font-medium">
                      <span className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100" title="Staff">{n.total_staff} 👩‍💼</span>
                      <span className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100" title="Citas este mes">{n.citas_mes} 📅</span>
                      <span className="px-2 py-1 bg-slate-50 rounded-lg border border-slate-100" title={`${n.destellos_disponibles} destellos`}>✨ {n.destellos_disponibles}</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 flex-shrink-0 transition-colors" />
                  </div>

                  {/* Actions: Delete button */}
                  <div className="flex items-center pl-2 border-l border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSalonToDelete(n);
                      }}
                      title="Eliminar salón de raíz"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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

      {salonToDelete && (
        <DeleteSalonModal
          negocio={salonToDelete}
          onClose={() => setSalonToDelete(null)}
          onDeleted={onReload}
        />
      )}
    </div>
  );
};

export default GodModeClientes;
