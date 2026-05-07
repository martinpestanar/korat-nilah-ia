/**
 * GodMode — Panel de detalle de un salón (5 tabs)
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
  fetchUsuariosNegocio, createUsuarioNegocio, updatePermisosUsuario
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

// ─── Toggle simple ────────────────────────────────────────────
const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
  on, onChange, disabled
}) => (
  <button
    onClick={() => !disabled && onChange(!on)}
    disabled={disabled}
    className={`w-10 h-5 rounded-full border transition-all flex-shrink-0 relative ${
      on ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-700 border-zinc-600'
    } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-0.5'}`} />
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
    <div className={`border rounded-xl overflow-hidden transition-colors ${
      modData.activo ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-800 bg-zinc-900/30'
    }`}>
      {/* Cabecera del módulo */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-base flex-shrink-0">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-200">{meta.label}</p>
            {!includedInPlan && (
              <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                Extra al plan
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 truncate">{meta.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Toggle on={modData.activo ?? false} onChange={toggleTop} />
          {allSubKeys.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Sub-pestañas / widgets */}
      {expanded && allSubKeys.length > 0 && (
        <div className="px-4 pb-3 border-t border-zinc-700/50 pt-2 space-y-1.5">
          {subKeys.map(sk => (
            <div key={sk} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-400 truncate">
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
                <span className="w-1 h-1 rounded-full bg-cyan-600 flex-shrink-0" />
                <span className="text-xs text-zinc-400 truncate">
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
  // Deep merge: la DB puede tener datos parciales (V1 o incompletos); completamos con el preset del plan
  const [recursos, setRecursos] = useState<RecursosSaaSV2>(() => {
    const preset = PLAN_PRESET[negocio.plan as PlanBase] || PLAN_PRESET['glow_pro'];
    return deepMerge(preset, negocio.recursos_saas || {}) as RecursosSaaSV2;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentNegocio, setCurrentNegocio] = useState<NegocioAdmin>(negocio);

  // Panel de Plan
  const _initialPlan = (negocio.plan && PLAN_PRESET[negocio.plan as PlanBase]) ? (negocio.plan as PlanBase) : 'glow_pro';
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a clientes
        </button>

        <div className="flex items-start gap-4 pb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: `${negocio.color_primario || '#10B981'}25`, border: `1px solid ${negocio.color_primario || '#10B981'}40` }}
          >
            {negocio.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white">{negocio.nombre}</h1>
            <p className="text-sm text-zinc-500">
              {ownerObj?.email || ownerObj?.nombre_persona || 'Sin usuario asignado'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Guardado
              </span>
            )}
            <button
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800 -mx-6 px-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1 overflow-y-auto p-6">

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
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Información</h3>
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
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-zinc-500">{r.label}</span>
                  <span className="text-zinc-300 font-medium">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Destellos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                ✨ Destellos (tokens de imágenes IA)
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-1">Disponibles ahora</p>
                  <input
                    type="number"
                    min="0"
                    value={destellosDisp}
                    onChange={e => setDestellosDisp(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-1">Límite mensual</p>
                  <input
                    type="number"
                    min="0"
                    value={destellosLimite}
                    onChange={e => setDestellosLimite(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleResetDestellos}
                className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
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
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Plan base</h3>
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['glow_pro',   '⭐', 'Glow Pro',   'IA Marketing + Automatizaciones habilitadas', 'S/ 249/mes'],
                  ['glow_elite', '🧠', 'Glow Elite', 'VIP · Copilot IA + Todas las automatizaciones', 'S/ 399/mes'],
                ] as const).map(([p, emoji, label, sub, price]) => (
                  <button
                    key={p}
                    onClick={() => applyPlanpreset(p)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      plan === p
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">{emoji}</div>
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">{price}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-600 mt-2 mb-6">
                Al cambiar el plan se activan/desactivan los módulos por defecto. Puedes ajustar manualmente después.
              </p>

              {/* Facturación Custom */}
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 mt-4">Facturación / Billing Override</h3>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <label className="block text-xs font-medium text-zinc-400 mb-2">Precio Acordado Especial (Soles - PEN)</label>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-bold">S/</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Dejar vacío para usar precio por defecto del plan"
                    value={recursos.precio_acordado_pen || ''}
                    onChange={e => setRecursos(prev => ({
                      ...prev,
                      precio_acordado_pen: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Si defines un valor numérico, sobrescribirá el precio por defecto del plan en los cálculos de ingresos <strong>(MRR/ARPU)</strong> del SuperAdmin. Ideal para clientes antiguos con precios especiales o descuentos activos.
                </p>
              </div>
            </div>

            {/* Estado */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Estado del cliente</h3>
              <div className="flex gap-2 flex-wrap">
                {(['activo', 'trial', 'suspendido', 'cancelado'] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                      estado === e
                        ? e === 'activo' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : e === 'trial' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : e === 'suspendido' ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-zinc-700 border-zinc-600 text-zinc-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                    }`}
                  >
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot mode */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                <span className="mr-1">🤖</span> Modo chatbot
              </h3>
              <div className="flex gap-2">
                {([['off', '❌ Desactivado'], ['on_demand', '🟡 On-Demand (responde cuando le hablan)']] as const).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setRecursos(prev => ({ ...prev, bot: { ...prev.bot, modo: m } }))}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      recursos.bot?.modo === m
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Módulos granulares */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Módulos y sub-pestañas
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
                {/* Módulos del preset que no estén aún en recursos */}
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
                <h3 className="text-sm font-semibold text-zinc-200">Usuarios del negocio</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Dueño, admins y staff con acceso a la plataforma</p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar usuario
              </button>
            </div>

            {/* Leyenda de roles */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { rol: 'Dueño', desc: 'Acceso total', color: 'text-violet-400', badge: 'bg-violet-500/15 border-violet-500/20' },
                { rol: 'Admin', desc: 'Todo por defecto, configurable', color: 'text-emerald-400', badge: 'bg-emerald-500/15 border-emerald-500/20' },
                { rol: 'Staff', desc: 'Solo Agenda, Inbox, CRM', color: 'text-amber-400', badge: 'bg-amber-500/15 border-amber-500/20' },
              ].map(r => (
                <div key={r.rol} className={`border rounded-xl p-2.5 ${r.badge}`}>
                  <p className={`text-xs font-bold ${r.color}`}>{r.rol}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>

            {loadingUsuarios ? (
              <div className="flex items-center justify-center h-24 text-zinc-600">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center h-24 flex flex-col items-center justify-center text-zinc-600 gap-2">
                <Users className="w-6 h-6" />
                <p className="text-sm">No hay usuarios asignados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usuarios.map((u: any) => {
                  const isDueno = u.role?.toLowerCase().includes('dueno') || u.role?.toLowerCase().includes('dueño') || u.role?.toLowerCase() === 'owner';
                  const isEditingThis = editandoPermisos === u.id;
                  const permisos: Record<string, boolean> = u.permisos_modulos || {};
                  const modKeys = Object.keys(MODULOS_META) as ModuloKey[];

                  return (
                    <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* Cabecera usuario */}
                      <div className="p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                          isDueno ? 'bg-gradient-to-br from-violet-500 to-violet-700' :
                          u.role?.toLowerCase() === 'admin' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                          'bg-gradient-to-br from-zinc-600 to-zinc-700'
                        }`}>
                          {u.nombre_persona?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200">{u.nombre_persona}</p>
                          <p className="text-xs text-zinc-500">{u.email}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isDueno ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' :
                          u.role?.toLowerCase() === 'admin' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                          'bg-zinc-700 text-zinc-400 border-zinc-600'
                        }`}>
                          {u.role || 'Staff'}
                        </span>
                        {!isDueno && (
                          <button
                            onClick={() => setEditandoPermisos(isEditingThis ? null : u.id)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              isEditingThis
                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                            }`}
                          >
                            {isEditingThis ? '✓ Listo' : '🔒 Permisos'}
                          </button>
                        )}
                      </div>

                      {/* Editor de permisos inline */}
                      {isEditingThis && !isDueno && (
                        <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
                          <p className="text-[11px] text-zinc-500 mb-3 font-medium">Módulos visibles para este usuario:</p>
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
                                      // Actualizar localmente sin recargar lista
                                      setUsuarios(prev => prev.map(usr =>
                                        usr.id === u.id ? { ...usr, permisos_modulos: newPerms } : usr
                                      ));
                                    } catch (e: any) { setErrorMsg(e.message); }
                                  }}
                                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all text-xs ${
                                    actual
                                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                                  }`}
                                >
                                  <span>{meta.emoji}</span>
                                  <span className="truncate">{meta.label}</span>
                                  <span className="ml-auto text-[10px]">{actual ? '✓' : '✗'}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={async () => {
                                const allTrue = modKeys.reduce((acc, k) => ({ ...acc, [k]: true }), {} as Record<string, boolean>);
                                try {
                                  await updatePermisosUsuario(u.id, allTrue);
                                  setUsuarios(prev => prev.map(usr => usr.id === u.id ? { ...usr, permisos_modulos: allTrue } : usr));
                                } catch (e: any) { setErrorMsg(e.message); }
                              }}
                              className="flex-1 py-1.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                            >
                              Activar todo
                            </button>
                            <button
                              onClick={async () => {
                                const staffDefaults = { ...PERMISOS_ROL_DEFECTO.Staff };
                                try {
                                  await updatePermisosUsuario(u.id, staffDefaults);
                                  setUsuarios(prev => prev.map(usr => usr.id === u.id ? { ...usr, permisos_modulos: staffDefaults } : usr));
                                } catch (e: any) { setErrorMsg(e.message); }
                              }}
                              className="flex-1 py-1.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
                            >
                              Reset a Staff
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Límites según plan */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-400">
                Plan <strong className="text-white">
                  {plan === 'free' ? 'Free (interno)' : plan === 'glow_pro' ? 'Glow Pro' : 'Glow Elite'}
                </strong> permite{' '}
                {plan === 'free' ? 'solo 1 usuario (Dueño)' :
                 plan === 'glow_pro' ? 'hasta 3 usuarios adicionales' :
                 'usuarios ilimitados'}.{' '}
                Límite máx. staff: <strong className="text-white">{recursos.limites?.max_staff ?? '∞'}</strong>
              </p>
            </div>
          </div>
        )}

        {/* ══ TAB 4: ONBOARDING ══ */}
        {tab === 'onboarding' && (
          <div className="max-w-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Links de onboarding</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Crea un link único y mándalo al cliente por WhatsApp</p>
            </div>

            <button
              onClick={crearToken}
              disabled={loadingToken}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {loadingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Crear nuevo link de onboarding
            </button>

            {tokenCreado && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-xs text-emerald-400 font-medium mb-2">✅ Link creado exitosamente</p>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 font-mono break-all">
                  {`${window.location.origin}/onboarding?token=${tokenCreado}`}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => copyLink(tokenCreado)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copiar link
                  </button>
                  <button
                    onClick={() => openWA(tokenCreado, negocio.telefono_recepcionista)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    📲 Enviar por WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Tokens existentes */}
            {tokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium">Historial de tokens</p>
                {tokens.map(t => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-400 font-mono truncate">{t.token}</p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">
                        {t.completado ? '✅ Completado' : `🔄 Paso ${t.paso_actual}/7`}
                        {' · '}
                        {new Date(t.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyLink(t.token)} className="text-zinc-500 hover:text-zinc-300 p-1" title="Copiar">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openWA(t.token, negocio.telefono_recepcionista)} className="text-green-500 hover:text-green-400 p-1" title="WhatsApp">
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


            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Fidelización</h3>
              <div className="flex gap-2">
                {(['global', 'staff'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTipoFidelizacion(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                      tipoFidelizacion === t
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {t === 'global' ? '🌐 Global' : '👩‍💼 Por Staff'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Límites</h3>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Max. staff permitido</label>
                <input
                  type="number"
                  min="1"
                  value={recursos.limites?.max_staff ?? 5}
                  onChange={e => setRecursos(prev => ({ ...prev, limites: { ...prev.limites, max_staff: parseInt(e.target.value) || 1 } }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Max. usuarios adicionales (0 = sin acceso, -1 = ilimitado)</label>
                <input
                  type="number"
                  min="-1"
                  value={recursos.limites?.max_usuarios_adicionales ?? 0}
                  onChange={e => setRecursos(prev => ({ ...prev, limites: { ...prev.limites, max_usuarios_adicionales: parseInt(e.target.value) || 0 } }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Control de Automatizaciones (n8n) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Automatizaciones Internas (n8n)
              </h3>
              <p className="text-[11px] text-zinc-500">
                Habilita si este negocio tiene acceso a usar estos flujos automáticos. Si lo habilitas, el cliente podrá encenderlos o apagarlos desde su pestaña "Piloto Automático".
              </p>
              
              <div className="space-y-4">
                {/* 1. Rescate Automático */}
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-emerald-400">Rescate Automático</label>
                      <p className="text-[11px] text-zinc-500">Permitir a este negocio usar el rescate (35/60/90 días).</p>
                    </div>
                    <Toggle
                      on={recursos.automatizaciones?.permitir_rescate ?? false}
                      onChange={v => setRecursos(prev => ({ 
                        ...prev, 
                        automatizaciones: { ...prev.automatizaciones, permitir_rescate: v, rescate_activo: v } as any 
                      }))}
                    />
                  </div>
                </div>

                {/* 2. Recordatorios de Citas */}
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-blue-400">Recordatorios de Citas</label>
                      <p className="text-[11px] text-zinc-500">Permitir avisos anti no-show de 24h y 3h.</p>
                    </div>
                    <Toggle
                      on={recursos.automatizaciones?.permitir_recordatorios ?? false}
                      onChange={v => setRecursos(prev => ({ 
                        ...prev, 
                        automatizaciones: { ...prev.automatizaciones, permitir_recordatorios: v, recordatorios_activos: v } as any 
                      }))}
                    />
                  </div>
                </div>

                {/* 3. Recordatorios de Mantenimiento */}
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-amber-400">Recordatorios de Mantenimiento</label>
                      <p className="text-[11px] text-zinc-500">Permitir avisos cíclicos (ej. retoques).</p>
                    </div>
                    <Toggle
                      on={recursos.automatizaciones?.permitir_mantenimiento ?? false}
                      onChange={v => setRecursos(prev => ({ 
                        ...prev, 
                        automatizaciones: { ...prev.automatizaciones, permitir_mantenimiento: v, mantenimiento_activo: v } as any 
                      }))}
                    />
                  </div>
                </div>

                {/* 4. Mensajes Post-Cita */}
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-purple-400">Mensajes Post-Cita</label>
                      <p className="text-[11px] text-zinc-500">Permitir pedir calificación/feedback tras la visita.</p>
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
            </div>

            {/* Zona Roja: Eliminar Negocio */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-4 mt-8">
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Zona Peligrosa
              </h3>
              <p className="text-[11px] text-zinc-400">
                Al eliminar este negocio, borrarás permanentemente sus citas, clientes, automatizaciones, staff y configuraciones. Esta acción es irreversible.
              </p>
              
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteConfirmText('');
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors"
                disabled={saving}
              >
                Eliminar Negocio Definitivamente
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Nuevo usuario</h3>
              <button onClick={() => setShowUserModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {[
              { label: 'Nombre', key: 'nombre', type: 'text', placeholder: 'María García' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'maria@salon.com' },
              { label: 'Contraseña', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-zinc-400 mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(nuevoUser as any)[f.key]}
                  onChange={e => setNuevoUser(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Rol</label>
              <select
                value={nuevoUser.role}
                onChange={e => {
                  const role = e.target.value;
                  const presetPermisos = PERMISOS_ROL_DEFECTO[role as keyof typeof PERMISOS_ROL_DEFECTO] || PERMISOS_ROL_DEFECTO.Staff;
                  setNuevoUser(prev => ({ ...prev, role, permisos: { ...presetPermisos } }));
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Admin">Admin</option>
                <option value="Staff">Staff / Empleada</option>
              </select>
            </div>

            {/* Preview de módulos activos según rol */}
            <div>
              <p className="text-[11px] text-zinc-500 mb-2 font-medium">Módulos activos con este rol (editable después):</p>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(MODULOS_META) as ModuloKey[]).map(mk => {
                  const active = nuevoUser.permisos[mk] ?? false;
                  return (
                    <div key={mk} className={`text-[9px] px-2 py-1 rounded truncate border ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                      {MODULOS_META[mk].label} {active ? '✓' : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearUsuario}
                disabled={creatingUser || !nuevoUser.nombre || !nuevoUser.email || !nuevoUser.password}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Negocio */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Eliminar Negocio
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-zinc-300">
              Esta acción es irreversible. Se eliminarán todos los datos, clientes, citas y configuraciones de este negocio.
            </p>

            <div>
              <label className="text-xs text-zinc-400 mb-1 block">
                Para confirmar, escribe: <strong className="text-white select-all">{negocio.nombre}</strong>
              </label>
              <input
                type="text"
                placeholder={negocio.nombre}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
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
                    alert(`✅ Negocio eliminado correctamente. Todos los datos han sido borrados.`);
                    await onReload();
                    onBack();
                  } catch (e: any) {
                    alert('Error al eliminar: ' + e.message);
                    setSaving(false);
                  }
                }}
                disabled={deleteConfirmText !== negocio.nombre || saving}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {saving ? 'Eliminando...' : 'Eliminar Base de Datos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeSalonPanel;
