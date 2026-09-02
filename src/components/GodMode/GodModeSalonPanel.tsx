/**
 * GodMode — Panel de detalle de un salón (Clean Light Emerald Edition)
 * Tab 1: Resumen | Tab 2: Plan & Módulos | Tab 3: Usuarios | Tab 4: Onboarding | Tab 5: Config avanzada
 */
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Store, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Save, Loader2, Check, AlertTriangle, Plus, Trash2,
  Users, Settings2, Link2, Zap, Bot, RefreshCw, Copy,
  PhoneCall, Mail, Globe, Calendar, FileText, Power,
  ExternalLink, Eye, EyeOff, X
} from 'lucide-react';
import type { NegocioAdmin, RecursosSaaSV2, PlanBase, ModuloKey } from '../../types/godmode';
import { PLAN_PRESET, MODULOS_META, PERMISOS_ROL_DEFECTO } from '../../types/godmode';
import {
  updateNegocioFull, resetDestellos,
  fetchUsuariosNegocio, createUsuarioNegocio, updatePermisosUsuario,
  fetchPrecios, type PrecioSuscripcion
} from '../../services/godmode';
import { supabase } from '@/services/supabase';

interface Props {
  negocio: NegocioAdmin;
  onBack: () => void;
  onReload: () => Promise<void>;
}

type Tab = 'resumen' | 'plan' | 'usuarios' | 'onboarding' | 'config';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'resumen',    label: 'Resumen',    emoji: '📊' },
  { id: 'plan',       label: 'Plan & Módulos', emoji: '🚀' },
  { id: 'usuarios',   label: 'Usuarios',   emoji: '👥' },
  { id: 'onboarding', label: 'Onboarding', emoji: '📬' },
  { id: 'config',     label: 'Config',     emoji: '⚙️' },
];

// ─── Toggle simple (Light Clean) ───────────────────────────────
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  on, onChange, disabled
}) => (
  <button
    onClick={() => !disabled && onChange(!on)}
    disabled={disabled}
    className={`w-10 h-5 rounded-full border transition-all flex-shrink-0 relative ${
      on ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-300 border-slate-300'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-all ${on ? 'left-5' : 'left-0.5'}`} />
  </button>
);

// ─── Módulo accordion con sub-pestañas ───────────────────────
const ModuloRow: React.FC<{
  modKey: ModuloKey;
  modData: any;
  planBase: PlanBase;
  onChange: (key: ModuloKey, data: any) => void;
}> = ({ modKey, modData, planBase, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = MODULOS_META[modKey];
  const includedInPlan = meta.planes_incluidos.includes(planBase);
  const subKeys = meta.sub_pestanas ? Object.keys(meta.sub_pestanas) : [];
  const widgetKeys = meta.widgets ? Object.keys(meta.widgets) : [];
  const allSubKeys = [...subKeys, ...widgetKeys];

  const toggleTop = () => {
    onChange(modKey, { ...modData, activo: !modData.activo });
  };

  const toggleSub = (subKey: string, isWidget: boolean) => {
    if (isWidget) {
      onChange(modKey, {
        ...modData,
        widgets: { ...(modData.widgets || {}), [subKey]: !(modData.widgets?.[subKey] ?? false) }
      });
    } else {
      onChange(modKey, {
        ...modData,
        sub_pestanas: { ...(modData.sub_pestanas || {}), [subKey]: !(modData.sub_pestanas?.[subKey] ?? false) }
      });
    }
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all shadow-2xs ${
      modData.activo ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-slate-50/50 opacity-80'
    }`}>
      {/* Cabecera del módulo */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-base flex-shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-black text-slate-900">{meta.label}</p>
            {!includedInPlan && (
              <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full">
                Extra al plan
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate font-medium">{meta.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle on={modData.activo ?? false} onChange={toggleTop} />
          {allSubKeys.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Sub-pestañas / widgets */}
      {expanded && allSubKeys.length > 0 && (
        <div className="px-4 pb-3 border-t border-slate-100 pt-2 space-y-1.5 bg-slate-50/70">
          {subKeys.map(sk => (
            <div key={sk} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-medium truncate">
                  {meta.sub_pestanas![sk]}
                </span>
              </div>
              <Toggle
                on={modData.sub_pestanas?.[sk] ?? false}
                onChange={() => toggleSub(sk, false)}
                disabled={!modData.activo}
              />
            </div>
          ))}
          {widgetKeys.map(wk => (
            <div key={wk} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-medium truncate">
                  Widget: {meta.widgets![wk]}
                </span>
              </div>
              <Toggle
                on={modData.widgets?.[wk] ?? false}
                onChange={() => toggleSub(wk, true)}
                disabled={!modData.activo}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Deep merge dos objetos recursivamente
function deepMerge(base: any, override: any): any {
  if (!override || typeof override !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (override[key] !== null && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────────
const GodModeSalonPanel: React.FC<Props> = ({ negocio, onBack, onReload }) => {
  const [tab, setTab] = useState<Tab>('resumen');
  const [recursos, setRecursos] = useState<RecursosSaaSV2>(() => {
    const preset = PLAN_PRESET[negocio.plan as PlanBase] || PLAN_PRESET['glow'];
    return deepMerge(preset, negocio.recursos_saas || {}) as RecursosSaaSV2;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Panel de Plan
  const _initialPlan = (negocio.plan && PLAN_PRESET[negocio.plan as PlanBase]) ? (negocio.plan as PlanBase) : 'glow';
  const [plan, setPlan] = useState<PlanBase>(_initialPlan);
  const [estado, setEstado] = useState(negocio.estado || 'activo');
  const [destellosDisp, setDestellosDisp] = useState(negocio.destellos_disponibles ?? 0);
  const [destellosLimite, setDestellosLimite] = useState(negocio.destellos_limite_mensual ?? 0);
  const [tipoFidelizacion, setTipoFidelizacion] = useState(negocio.tipo_fidelizacion || 'global');

  // Usuarios
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [editandoPermisos, setEditandoPermisos] = useState<number | null>(null);

  // Onboarding
  const [tokens, setTokens] = useState<any[]>([]);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenCreado, setTokenCreado] = useState('');

  // Usuario nuevo modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({
    nombre: '', email: '', password: '', role: 'Admin',
    permisos: { ...PERMISOS_ROL_DEFECTO.Admin } as Record<string, boolean>
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Modal de eliminar negocio
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Precios dinámicos desde DB
  const [dbPrecios, setDbPrecios] = useState<Record<string, { usd: number; pen: number }>>({
    glow: { usd: 0, pen: 0 },
    glow_pro: { usd: 39, pen: 149 },
    glow_elite: { usd: 89, pen: 349 },
  });

  useEffect(() => {
    fetchPrecios().then(data => {
      const map: Record<string, { usd: number; pen: number }> = {};
      data.forEach(p => {
        map[p.id] = { usd: p.precio || 0, pen: p.precio_pen || 0 };
      });
      setDbPrecios(prev => ({ ...prev, ...map }));
    }).catch(err => console.warn('Error fetching precios in GodModeSalonPanel:', err));
  }, []);

  useEffect(() => {
    if (tab === 'usuarios') loadUsuarios();
    if (tab === 'onboarding') loadTokens();
  }, [tab]);

  const loadUsuarios = async () => {
    setLoadingUsuarios(true);
    const data = await fetchUsuariosNegocio(negocio.id);
    setUsuarios(data);
    setLoadingUsuarios(false);
  };

  const loadTokens = async () => {
    const { data } = await supabase
      .from('onboarding_tokens')
      .select('*')
      .or(`business_id.eq.${negocio.id},email.eq.${negocio.email_negocio || ''}`)
      .order('created_at', { ascending: false });
    setTokens(data || []);
  };

  const applyPlanpreset = (p: PlanBase) => {
    setPlan(p);
    setRecursos(PLAN_PRESET[p]);
  };

  const saveAll = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      await updateNegocioFull(negocio.id, {
        recursos,
        plan: plan,
        estado: estado as any,
        destellos_disponibles: destellosDisp,
        destellos_limite_mensual: destellosLimite,
        tipo_fidelizacion: tipoFidelizacion
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await onReload();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleModuloChange = (key: ModuloKey, data: any) => {
    setRecursos(prev => ({
      ...prev,
      modulos: { ...prev.modulos, [key]: data }
    }));
  };

  const handleResetDestellos = async () => {
    await resetDestellos(negocio.id);
    setDestellosDisp(destellosLimite);
    await onReload();
  };

  const crearToken = async () => {
    setLoadingToken(true);
    try {
      const { data, error } = await supabase.rpc('superadmin_create_onboarding_token', {
        p_email: negocio.email_negocio || '',
        p_nombre_salon: negocio.nombre,
        p_plan_inicial: plan,
        p_whatsapp: null
      });
      if (error) throw error;
      setTokenCreado(data as string);
      await loadTokens();
    } catch (e: any) { setErrorMsg(e.message); }
    finally { setLoadingToken(false); }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/onboarding?token=${token}`;
    navigator.clipboard.writeText(url);
  };

  const openWA = (token: string, phone?: string) => {
    const url = `${window.location.origin}/onboarding?token=${token}`;
    const msg = encodeURIComponent(`Hola 👋 Aquí tienes tu link para configurar tu sistema Korat Flow:\n\n${url}\n\nExpira en 7 días ⏰`);
    const waNum = phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
  };

  const handleCrearUsuario = async () => {
    setCreatingUser(true);
    try {
      await createUsuarioNegocio({
        business_id: negocio.id,
        nombre_persona: nuevoUser.nombre,
        email: nuevoUser.email,
        password: nuevoUser.password,
        role: nuevoUser.role,
        permisos: nuevoUser.permisos,
      });
      await loadUsuarios();
      setShowUserModal(false);
      setNuevoUser({ nombre: '', email: '', password: '', role: 'Admin', permisos: { ...PERMISOS_ROL_DEFECTO.Admin } });
    } catch (e: any) { setErrorMsg(e.message); }
    finally { setCreatingUser(false); }
  };

  const ownerObj = negocio.owner as any;

  return (
    <div className="h-full flex flex-col font-sans text-slate-900">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-5 pb-0 flex-shrink-0 bg-white/70 backdrop-blur-xs">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 text-xs font-bold mb-3 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Volver a Directorio de Salones
        </button>

        <div className="flex items-start gap-4 pb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black text-emerald-900 bg-emerald-100 border border-emerald-200 flex-shrink-0 shadow-2xs"
          >
            {negocio.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-slate-900 leading-tight">{negocio.nombre}</h1>
            <p className="text-xs text-slate-500 font-medium">
              {ownerObj?.email || ownerObj?.nombre_persona || 'Sin usuario asignado'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-xs font-black border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">

        {/* ══ TAB 1: RESUMEN ══ */}
        {tab === 'resumen' && (
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Staff', value: negocio.total_staff },
                { label: 'Usuarios', value: negocio.total_usuarios },
                { label: 'Citas mes', value: negocio.citas_mes },
                { label: 'Clientes activos', value: (negocio as any).clientes_activos ?? '—' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-2xs">
                  <p className="text-xl font-black text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Información del Salón</h3>
              {[
                { label: 'Dueño', value: ownerObj?.nombre_persona || '—' },
                { label: 'Email', value: ownerObj?.email || negocio.email_negocio || '—' },
                { label: 'Teléfono', value: negocio.telefono_recepcionista || '—' },
                { label: 'País', value: (negocio as any).pais || '—' },
                { label: 'Moneda', value: (negocio as any).moneda || 'S/.' },
                { label: 'Registro', value: negocio.fecha_registro ? new Date(negocio.fecha_registro).toLocaleDateString('es-PE') : '—' },
                { label: 'Brief completado', value: negocio.brief_completado ? '✅ Sí' : '❌ Pendiente' },
                { label: 'Onboarding', value: negocio.onboarding_completado ? '✅ Completado' : `🔄 Paso ${(negocio as any).onboarding_paso || 1} de 7` },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 font-bold">{r.label}</span>
                  <span className="text-slate-900 font-bold">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Destellos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                ✨ Destellos (tokens de imágenes IA)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 font-bold mb-1">Disponibles ahora</p>
                  <input
                    type="number"
                    min="0"
                    value={destellosDisp}
                    onChange={e => setDestellosDisp(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-bold mb-1">Límite mensual</p>
                  <input
                    type="number"
                    min="0"
                    value={destellosLimite}
                    onChange={e => setDestellosLimite(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleResetDestellos}
                className="flex items-center gap-1.5 text-xs text-amber-700 font-bold hover:underline transition-colors pt-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset manual al límite mensual
              </button>
            </div>
          </div>
        )}

        {/* ══ TAB 2: PLAN & MÓDULOS ══ */}
        {tab === 'plan' && (
          <div className="space-y-6 max-w-2xl">
            {/* Plan selector */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Plan Base Asignado</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  ['glow',       '🌱', 'Glow Básico', 'Dashboard + Agenda + CRM + Finanzas', dbPrecios['glow']?.usd === 0 ? 'Gratis (S/ 0)' : `$${dbPrecios['glow']?.usd || 0} USD (~ S/ ${dbPrecios['glow']?.pen || 0})`],
                  ['glow_pro',   '⭐', 'Glow Pro',    'IA Marketing + Recordatorios WhatsApp', `$${dbPrecios['glow_pro']?.usd || 39} USD/mes (~ S/ ${dbPrecios['glow_pro']?.pen || 149})`],
                  ['glow_elite', '💎', 'Glow Elite',  'VIP · Copilot IA + Auto 360°', `$${dbPrecios['glow_elite']?.usd || 89} USD/mes (~ S/ ${dbPrecios['glow_elite']?.pen || 349})`],
                ] as const).map(([p, emoji, label, sub, price]) => (
                  <button
                    key={p}
                    onClick={() => applyPlanpreset(p as PlanBase)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      plan === p
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{emoji}</div>
                    <div className="text-xs font-black text-slate-900">{label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{sub}</div>
                    <div className="text-[10px] font-black text-emerald-700 mt-1">{price}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 mb-5">
                Al cambiar el plan se activan/desactivan los módulos por defecto. Puedes ajustar manualmente después.
              </p>

              {/* Facturación Custom */}
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Facturación / Tarifa Personalizada</h3>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <label className="block text-xs font-bold text-slate-700 mb-2">Precio Acordado Especial (Soles - PEN)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-black">S/</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Dejar vacío para usar precio por defecto del plan"
                    value={recursos.precio_acordado_pen || ''}
                    onChange={e => setRecursos(prev => ({
                      ...prev,
                      precio_acordado_pen: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed font-medium">
                  Si defines un valor numérico, sobrescribirá el precio por defecto del plan en los cálculos de ingresos <strong>(MRR/ARPU)</strong> del SuperAdmin.
                </p>
              </div>
            </div>

            {/* Estado */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">Estado del Cliente</h3>
              <div className="flex gap-2 flex-wrap">
                {(['activo', 'trial', 'suspendido', 'cancelado'] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      estado === e
                        ? e === 'activo' ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : e === 'trial' ? 'bg-amber-50 border-amber-400 text-amber-800'
                          : e === 'suspendido' ? 'bg-rose-50 border-rose-400 text-rose-800'
                          : 'bg-slate-200 border-slate-300 text-slate-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot mode */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                <span className="mr-1">🤖</span> Modo Chatbot
              </h3>
              <div className="flex gap-2">
                {([['off', '❌ Desactivado'], ['on_demand', '🟡 On-Demand (responde cuando le hablan)']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setRecursos(prev => ({ ...prev, bot: { ...prev.bot, modo: m } }))}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                      recursos.bot?.modo === m
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Módulos granulares */}
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                Módulos y Sub-Pestañas Habilitadas
              </h3>
              <div className="space-y-2">
                {(Object.keys(recursos.modulos || {}) as ModuloKey[]).map(key => (
                  MODULOS_META[key] && (
                    <ModuloRow
                      key={key}
                      modKey={key}
                      modData={(recursos.modulos as any)[key] || { activo: false }}
                      planBase={plan}
                      onChange={handleModuloChange}
                    />
                  )
                ))}
                {(Object.keys(PLAN_PRESET[plan].modulos) as ModuloKey[]).filter(
                  k => !(recursos.modulos && k in recursos.modulos)
                ).map(key => (
                  MODULOS_META[key] && (
                    <ModuloRow
                      key={key}
                      modKey={key}
                      modData={{ activo: false }}
                      planBase={plan}
                      onChange={(k, d) => setRecursos(prev => ({
                        ...prev,
                        modulos: { ...(prev.modulos as any), [k]: d }
                      }))}
                    />
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB 3: USUARIOS ══ */}
        {tab === 'usuarios' && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Usuarios del Negocio</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Dueño, admins y staff con acceso</p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> <span>Agregar usuario</span>
              </button>
            </div>

            {/* Leyenda de roles */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { rol: 'Dueño', desc: 'Acceso total', color: 'text-violet-800', badge: 'bg-violet-50 border-violet-200' },
                { rol: 'Admin', desc: 'Todo por defecto', color: 'text-emerald-800', badge: 'bg-emerald-50 border-emerald-200' },
                { rol: 'Staff', desc: 'Agenda, Inbox, CRM', color: 'text-amber-800', badge: 'bg-amber-50 border-amber-200' },
              ].map(r => (
                <div key={r.rol} className={`border rounded-2xl p-2.5 shadow-2xs ${r.badge}`}>
                  <p className={`text-xs font-black ${r.color}`}>{r.rol}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>

            {loadingUsuarios ? (
              <div className="flex items-center justify-center h-24 text-emerald-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center h-28 flex flex-col items-center justify-center text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200">
                <Users className="w-6 h-6" />
                <p className="text-xs font-bold text-slate-500">No hay usuarios asignados</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {usuarios.map((u: any) => {
                  const isDueno = u.role?.toLowerCase().includes('dueno') || u.role?.toLowerCase().includes('dueño') || u.role?.toLowerCase() === 'owner';
                  const isEditingThis = editandoPermisos === u.id;
                  const permisos: Record<string, boolean> = u.permisos_modulos || {};
                  const modKeys = Object.keys(MODULOS_META) as ModuloKey[];

                  return (
                    <div key={u.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      {/* Cabecera usuario */}
                      <div className="p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${
                          isDueno ? 'bg-violet-600' :
                          u.role?.toLowerCase() === 'admin' ? 'bg-emerald-600' :
                          'bg-slate-600'
                        }`}>
                          {u.nombre_persona?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900">{u.nombre_persona}</p>
                          <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                          isDueno ? 'bg-violet-50 text-violet-800 border-violet-200' :
                          u.role?.toLowerCase() === 'admin' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {u.role || 'Staff'}
                        </span>
                        {!isDueno && (
                          <button
                            onClick={() => setEditandoPermisos(isEditingThis ? null : u.id)}
                            className={`text-xs px-2.5 py-1 rounded-xl border font-bold transition-all cursor-pointer ${
                              isEditingThis
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {isEditingThis ? '✓ Listo' : '🔒 Permisos'}
                          </button>
                        )}
                      </div>

                      {/* Editor de permisos inline */}
                      {isEditingThis && !isDueno && (
                        <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50">
                          <p className="text-[11px] text-slate-600 mb-3 font-bold">Módulos visibles para este usuario:</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {modKeys.map(mk => {
                              const meta = MODULOS_META[mk];
                              const actual = permisos[mk] ?? false;
                              return (
                                <button
                                  key={mk}
                                  onClick={async () => {
                                    const newPerms = { ...permisos, [mk]: !actual };
                                    try {
                                      await updatePermisosUsuario(u.id, newPerms);
                                      setUsuarios(prev => prev.map(usr =>
                                        usr.id === u.id ? { ...usr, permisos_modulos: newPerms } : usr
                                      ));
                                    } catch (e: any) { setErrorMsg(e.message); }
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-xs font-bold cursor-pointer ${
                                    actual
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <span>{meta.emoji}</span>
                                  <span className="truncate">{meta.label}</span>
                                  <span className="ml-auto text-[10px]">{actual ? '✓' : '✗'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 4: ONBOARDING ══ */}
        {tab === 'onboarding' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Links de Onboarding para este Salón</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Crea un link único y mándalo por WhatsApp</p>
            </div>

            <button
              onClick={crearToken}
              disabled={loadingToken}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loadingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 stroke-[2.5]" />}
              <span>Crear nuevo link de onboarding</span>
            </button>

            {tokenCreado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-emerald-800 font-black mb-2 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" /> Link creado exitosamente
                </p>
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono break-all">
                  {`${window.location.origin}/onboarding?token=${tokenCreado}`}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyLink(tokenCreado)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar link
                  </button>
                  <button
                    onClick={() => openWA(tokenCreado, negocio.telefono_recepcionista)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20"
                  >
                    📲 Enviar por WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Tokens existentes */}
            {tokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold">Historial de tokens</p>
                {tokens.map(t => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 font-mono truncate font-bold">{t.token}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        {t.completado ? '✅ Completado' : `🔄 Paso ${t.paso_actual}/7`}
                        {' · '}
                        {new Date(t.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyLink(t.token)} className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100" title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openWA(t.token, negocio.telefono_recepcionista)} className="text-emerald-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-emerald-50" title="WhatsApp">
                        📲
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 5: CONFIG AVANZADA ══ */}
        {tab === 'config' && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Fidelización</h3>
              <div className="flex gap-2">
                {(['global', 'staff'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoFidelizacion(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      tipoFidelizacion === t
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {t === 'global' ? '🌐 Global' : '👩‍💼 Por Staff'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Límites de Uso</h3>
              <div>
                <label className="text-xs text-slate-700 font-bold mb-1 block">Max. staff permitido</label>
                <input
                  type="number"
                  min="1"
                  value={recursos.limites?.max_staff ?? 5}
                  onChange={e => setRecursos(prev => ({ ...prev, limites: { ...prev.limites, max_staff: parseInt(e.target.value) || 1 } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-700 font-bold mb-1 block">Max. usuarios adicionales (0 = sin acceso, -1 = ilimitado)</label>
                <input
                  type="number"
                  min="-1"
                  value={recursos.limites?.max_usuarios_adicionales ?? 0}
                  onChange={e => setRecursos(prev => ({ ...prev, limites: { ...prev.limites, max_usuarios_adicionales: parseInt(e.target.value) || 0 } }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Control de Automatizaciones (n8n) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" /> Automatizaciones Internas (n8n)
              </h3>
              
              <div className="space-y-3">
                {/* 1. Rescate Automático */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-emerald-800">Rescate Automático</label>
                    <p className="text-[11px] text-slate-500 font-medium">Permitir a este negocio usar el rescate (35/60/90 días).</p>
                  </div>
                  <Toggle
                    on={recursos.automatizaciones?.permitir_rescate ?? false}
                    onChange={v => setRecursos(prev => ({ 
                      ...prev, 
                      automatizaciones: { ...prev.automatizaciones, permitir_rescate: v, rescate_activo: v } as any 
                    }))}
                  />
                </div>

                {/* 2. Recordatorios de Citas */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-blue-800">Recordatorios de Citas</label>
                    <p className="text-[11px] text-slate-500 font-medium">Permitir avisos anti no-show de 24h y 3h.</p>
                  </div>
                  <Toggle
                    on={recursos.automatizaciones?.permitir_recordatorios ?? false}
                    onChange={v => setRecursos(prev => ({ 
                      ...prev, 
                      automatizaciones: { ...prev.automatizaciones, permitir_recordatorios: v, recordatorios_activos: v } as any 
                    }))}
                  />
                </div>

                {/* 3. Recordatorios de Mantenimiento */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-amber-800">Recordatorios de Mantenimiento</label>
                    <p className="text-[11px] text-slate-500 font-medium">Permitir avisos cíclicos (ej. retoques).</p>
                  </div>
                  <Toggle
                    on={recursos.automatizaciones?.permitir_mantenimiento ?? false}
                    onChange={v => setRecursos(prev => ({ 
                      ...prev, 
                      automatizaciones: { ...prev.automatizaciones, permitir_mantenimiento: v, mantenimiento_activo: v } as any 
                    }))}
                  />
                </div>

                {/* 4. Mensajes Post-Cita */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-purple-800">Mensajes Post-Cita</label>
                    <p className="text-[11px] text-slate-500 font-medium">Permitir pedir calificación/feedback tras la visita.</p>
                  </div>
                  <Toggle
                    on={recursos.automatizaciones?.permitir_post_cita ?? false}
                    onChange={v => setRecursos(prev => ({ 
                      ...prev, 
                      automatizaciones: { ...prev.automatizaciones, permitir_post_cita: v, post_cita_activo: v } as any 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Zona Roja: Eliminar Negocio */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 mt-8">
              <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" /> Zona Peligrosa
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Al eliminar este negocio, borrarás permanentemente sus citas, clientes, automatizaciones, staff y configuraciones.
              </p>
              
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteConfirmText('');
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
                disabled={saving}
              >
                Eliminar Negocio Definitivamente
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Modal crear usuario (Light Clean) */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            {[
              { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'María García' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'maria@salon.com' },
              { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-slate-700 font-bold mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(nuevoUser as any)[f.key]}
                  onChange={e => setNuevoUser(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-700 font-bold mb-1 block">Rol Asignado</label>
              <select
                value={nuevoUser.role}
                onChange={e => {
                  const role = e.target.value;
                  const presetPermisos = PERMISOS_ROL_DEFECTO[role as keyof typeof PERMISOS_ROL_DEFECTO] || PERMISOS_ROL_DEFECTO.Staff;
                  setNuevoUser(prev => ({ ...prev, role, permisos: { ...presetPermisos } }));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff / Empleada</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearUsuario}
                disabled={creatingUser || !nuevoUser.nombre || !nuevoUser.email || !nuevoUser.password}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Negocio */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <h3 className="text-sm font-black text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Eliminar Salón
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Esta acción es irreversible. Se eliminarán permanentemente todas las citas, clientes y staff de <strong>{negocio.nombre}</strong>.
            </p>

            <div>
              <label className="text-[11px] text-slate-700 font-bold mb-1 block">
                Para confirmar, escribe: <span className="text-rose-700 font-black">{negocio.nombre}</span>
              </label>
              <input
                type="text"
                placeholder={negocio.nombre}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmText !== negocio.nombre) return;
                  try {
                    setSaving(true);
                    setShowDeleteModal(false);
                    const { data, error } = await supabase.rpc('eliminar_negocio_completo', { p_business_id: negocio.id });
                    if (error) throw error;
                    if (data && data.success === false) throw new Error(data.error || 'Error desconocido');
                    alert(`✅ Salón eliminado correctamente.`);
                    await onReload();
                    onBack();
                  } catch (e: any) {
                    alert('Error al eliminar: ' + e.message);
                    setSaving(false);
                  }
                }}
                disabled={deleteConfirmText !== negocio.nombre || saving}
                className="flex-1 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-md shadow-rose-600/20"
              >
                {saving ? 'Eliminando...' : 'Eliminar Salón'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeSalonPanel;
