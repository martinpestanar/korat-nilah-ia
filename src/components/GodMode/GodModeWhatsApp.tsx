/**
 * ============================================================
 * GodMode — Panel de WhatsApp & Evolution API (Clean Light Emerald Edition)
 * Gestión completa de instancias desde el SuperAdmin
 * ============================================================
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  QrCode, Hash, Phone, Trash2, Plus, Search, Wifi, WifiOff,
  Copy, Check, ExternalLink, X, ChevronDown, ArrowRight,
  MessageCircle, Link2, Eye, Unplug, Zap, Clock, Send,
} from 'lucide-react';
import type { NegocioAdmin } from '../../types/godmode';
import {
  fetchInstancesEnriched,
  createInstanceForBusiness,
  createStandaloneInstance,
  getPairingCode,
  checkConnection,
  deleteInstance,
  deleteInstanceByName,
  updateInstanceStatus,
  type EvolutionInstance,
  type ConnectionStateResult,
} from '../../services/evolutionAdmin';

// ─── Props ───────────────────────────────────────────────────

interface Props {
  negocios: NegocioAdmin[];
  onReload: () => Promise<void>;
}

// ─── Estado del modal de vinculación ─────────────────────────

type LinkMode = 'select' | 'qr' | 'pairing' | 'code_ready' | 'share_link' | 'connected' | 'error';

interface LinkState {
  open: boolean;
  mode: LinkMode;
  targetBusinessId: string;
  targetLabel: string;
  isStandalone: boolean;
  instanceName: string;
  qrBase64: string | null;
  pairingCode: string | null;
  phoneInput: string;
  errorMessage: string;
  loading: boolean;
}

const INITIAL_LINK_STATE: LinkState = {
  open: false,
  mode: 'select',
  targetBusinessId: '',
  targetLabel: '',
  isStandalone: false,
  instanceName: '',
  qrBase64: null,
  pairingCode: null,
  phoneInput: '',
  errorMessage: '',
  loading: false,
};

// ─── Badge de estado ─────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    conectado:    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Conectado' },
    pendiente:    { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-800',   dot: 'bg-amber-500 animate-pulse', label: 'Pendiente' },
    desconectado: { bg: 'bg-slate-50 border-slate-200',     text: 'text-slate-600',   dot: 'bg-slate-400', label: 'Desconectado' },
    error:        { bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    dot: 'bg-rose-500', label: 'Error' },
  };
  const c = config[status] || config.desconectado;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ═════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═════════════════════════════════════════════════════════════

const GodModeWhatsApp: React.FC<Props> = ({ negocios, onReload }) => {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkState, setLinkState] = useState<LinkState>(INITIAL_LINK_STATE);
  const [copied, setCopied] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [checkingState, setCheckingState] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Cargar instancias ──────────────────────────────────────

  const loadInstances = useCallback(async () => {
    try {
      const data = await fetchInstancesEnriched();
      setInstances(data);
    } catch (err) {
      console.error('Error loading instances:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInstances();
    setRefreshing(false);
  };

  // ─── Polling de conexión ────────────────────────────────────

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const startPolling = (instName: string) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const result = await checkConnection(instName);
        if (result.isConnected) {
          stopPolling();
          setLinkState(prev => ({ ...prev, mode: 'connected', loading: false }));
          await updateInstanceStatus(instName, 'conectado');
          await loadInstances();
        }
      } catch { /* silencio — seguir intentando */ }
    }, 3000);
    timeoutRef.current = setTimeout(() => stopPolling(), 120_000);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // ─── Verificar estado individual ────────────────────────────

  const handleCheckState = async (inst: EvolutionInstance) => {
    setCheckingState(inst.instance_name);
    try {
      const result = await checkConnection(inst.instance_name);
      const newStatus = result.isConnected ? 'conectado' : 'desconectado';
      await updateInstanceStatus(inst.instance_name, newStatus as EvolutionInstance['status']);
      await loadInstances();
    } catch (err) {
      console.error('Error checking state:', err);
    } finally {
      setCheckingState(null);
    }
  };

  // ─── Eliminar instancia ─────────────────────────────────────

  const handleDelete = async (inst: EvolutionInstance) => {
    try {
      await deleteInstance(inst.business_id, inst.instance_name);
      setConfirmDelete(null);
      await loadInstances();
    } catch (err) {
      console.error('Error deleting instance:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error'));
    }
  };

  // ─── Abrir modal de vinculación ─────────────────────────────

  const openLinkModal = (businessId: string, label: string, isStandalone = false) => {
    setLinkState({
      ...INITIAL_LINK_STATE,
      open: true,
      targetBusinessId: businessId,
      targetLabel: label,
      isStandalone,
    });
  };

  const closeLinkModal = () => {
    stopPolling();
    setLinkState(INITIAL_LINK_STATE);
  };

  // ─── Crear instancia (QR) ──────────────────────────────────

  const handleCreateQR = async () => {
    setLinkState(prev => ({ ...prev, mode: 'qr', loading: true, errorMessage: '' }));
    try {
      let result;
      if (linkState.isStandalone) {
        result = await createStandaloneInstance(linkState.targetLabel);
      } else {
        result = await createInstanceForBusiness(linkState.targetBusinessId);
      }

      if (!result.success) throw new Error(result.error || 'Error al crear instancia');
      if (!result.base64QR) throw new Error('Evolution API no devolvió QR. Prueba con Código de Emparejamiento.');

      setLinkState(prev => ({
        ...prev,
        instanceName: result.instanceName || '',
        qrBase64: result.base64QR || null,
        loading: false,
      }));
      startPolling(result.instanceName || '');
    } catch (e: unknown) {
      setLinkState(prev => ({
        ...prev,
        mode: 'error',
        errorMessage: e instanceof Error ? e.message : 'Error desconocido',
        loading: false,
      }));
    }
  };

  // ─── Solicitar Pairing Code ─────────────────────────────────

  const handleRequestPairingCode = async () => {
    const clean = linkState.phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setLinkState(prev => ({ ...prev, errorMessage: 'Ingresa un número con código de país (ej: 521XXXXXXXXXX)' }));
      return;
    }

    setLinkState(prev => ({ ...prev, loading: true, errorMessage: '' }));

    try {
      // Si no hay instancia, crearla primero
      let instName = linkState.instanceName;
      let pairingCode = linkState.pairingCode;
      if (!instName) {
        let createResult;
        if (linkState.isStandalone) {
          createResult = await createStandaloneInstance(linkState.targetLabel, clean);
        } else {
          createResult = await createInstanceForBusiness(linkState.targetBusinessId, undefined, clean);
        }
        if (!createResult.success) throw new Error(createResult.error || 'Error al crear instancia');
        instName = createResult.instanceName || '';
        if (createResult.pairingCode) {
          pairingCode = createResult.pairingCode;
        }
        setLinkState(prev => ({ ...prev, instanceName: instName }));
      }

      // Si no vino el pairingCode directamente de la creación, pedirlo
      if (!pairingCode) {
        const result = await getPairingCode({
          businessId: linkState.isStandalone ? undefined : linkState.targetBusinessId,
          instanceName: instName,
          phoneNumber: clean,
        });
        if (!result.success) throw new Error(result.error || 'No se pudo obtener el código');
        pairingCode = result.pairingCode || null;
      }

      setLinkState(prev => ({
        ...prev,
        mode: 'code_ready',
        pairingCode,
        loading: false,
      }));
      startPolling(instName);
    } catch (e: unknown) {
      setLinkState(prev => ({
        ...prev,
        mode: 'error',
        errorMessage: e instanceof Error ? e.message : 'Error desconocido',
        loading: false,
      }));
    }
  };

  // ─── Abrir modo Compartir Enlace ────────────────────────────

  const handleOpenShareLink = async () => {
    setLinkState(prev => ({ ...prev, loading: true, errorMessage: '' }));

    try {
      let instName = linkState.instanceName;
      if (!instName) {
        let createResult;
        if (linkState.isStandalone) {
          createResult = await createStandaloneInstance(linkState.targetLabel);
        } else {
          createResult = await createInstanceForBusiness(linkState.targetBusinessId);
        }
        if (!createResult.success) throw new Error(createResult.error || 'Error al crear instancia');
        instName = createResult.instanceName || '';
      }

      setLinkState(prev => ({
        ...prev,
        mode: 'share_link',
        instanceName: instName,
        loading: false,
      }));
      startPolling(instName);
    } catch (e: unknown) {
      setLinkState(prev => ({
        ...prev,
        mode: 'error',
        errorMessage: e instanceof Error ? e.message : 'Error desconocido',
        loading: false,
      }));
    }
  };

  // ─── Copiar al portapapeles ─────────────────────────────────

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2500);
  };

  // ─── Filtrado ───────────────────────────────────────────────

  const filtered = instances.filter(inst => {
    const term = searchTerm.toLowerCase();
    return (
      inst.instance_name.toLowerCase().includes(term) ||
      (inst.negocio_nombre || '').toLowerCase().includes(term) ||
      (inst.label || '').toLowerCase().includes(term) ||
      (inst.phone_number || '').includes(term)
    );
  });

  // Negocios sin instancia (para vincular)
  const negociosConInstancia = new Set(instances.map(i => i.business_id).filter(Boolean));
  const negociosSinInstancia = negocios.filter(n => !negociosConInstancia.has(n.id));

  // Stats
  const stats = {
    total: instances.length,
    conectados: instances.filter(i => i.status === 'conectado').length,
    pendientes: instances.filter(i => i.status === 'pendiente').length,
    desconectados: instances.filter(i => i.status === 'desconectado' || i.status === 'error').length,
  };

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 font-sans">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-green-600/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">WhatsApp & Evolution API</h1>
            <p className="text-[11px] text-slate-500 font-medium">Gestión de instancias y vinculación remota</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-emerald-50 transition-all ${refreshing ? 'animate-spin text-emerald-600' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openLinkModal('', 'Instancia independiente', true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instancia Independiente</span>
            <span className="sm:hidden">Independiente</span>
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: 'Total', value: stats.total, icon: <Smartphone className="w-4 h-4" />, color: 'text-slate-700 bg-slate-50 border-slate-200' },
          { label: 'Conectados', value: stats.conectados, icon: <Wifi className="w-4 h-4" />, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Pendientes', value: stats.pendientes, icon: <Clock className="w-4 h-4" />, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Desconectados', value: stats.desconectados, icon: <WifiOff className="w-4 h-4" />, color: 'text-slate-500 bg-slate-50 border-slate-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
            <div className="flex items-center gap-2 mb-1">
              {s.icon}
              <span className="text-[10px] font-bold uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── BARRA DE BÚSQUEDA + ACCIÓN ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por salón, instancia o número..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Selector rápido de salones sin instancia */}
        {negociosSinInstancia.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm whitespace-nowrap">
              <Plus className="w-3.5 h-3.5" />
              Vincular Salón ({negociosSinInstancia.length})
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-60 overflow-y-auto">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                Salones sin WhatsApp vinculado
              </p>
              {negociosSinInstancia.map(n => (
                <button
                  key={n.id}
                  onClick={() => openLinkModal(n.id, n.nombre)}
                  className="w-full px-3 py-2.5 text-left text-xs font-medium text-slate-800 hover:bg-emerald-50 flex items-center gap-2 transition border-b border-slate-50 last:border-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{n.nombre}</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── LISTA DE INSTANCIAS ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <WifiOff className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">No hay instancias registradas</p>
          <p className="text-xs text-slate-400 mt-1">Vincula un salón o crea una instancia independiente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inst => (
            <div
              key={inst.id || inst.instance_name}
              className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 hover:border-emerald-200 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-black text-slate-900 truncate">
                      {inst.negocio_nombre || inst.label || 'Sin asignar'}
                    </h3>
                    <StatusBadge status={inst.status} />
                    {inst.business_id?.startsWith('standalone_') && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
                        Independiente
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="font-mono">{inst.instance_name}</span>
                    {inst.phone_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {inst.phone_number}
                      </span>
                    )}
                    {inst.negocio_plan && (
                      <span className="font-bold text-emerald-600 uppercase text-[9px]">
                        {inst.negocio_plan === 'glow_pro' ? '✨ Pro' : 'Glow'}
                      </span>
                    )}
                    <span className="text-slate-400">
                      {new Date(inst.updated_at).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                  {/* Copiar instance name */}
                  <button
                    onClick={() => handleCopy(inst.instance_name, inst.instance_name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Copiar nombre de instancia"
                  >
                    {copied === inst.instance_name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Verificar estado */}
                  <button
                    onClick={() => handleCheckState(inst)}
                    disabled={checkingState === inst.instance_name}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition ${
                      checkingState === inst.instance_name ? 'animate-spin text-emerald-600' : ''
                    }`}
                    title="Verificar estado de conexión"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Re-vincular (si desconectado) */}
                  {(inst.status === 'desconectado' || inst.status === 'error') && (
                    <button
                      onClick={() => {
                        const bid = inst.business_id || '';
                        const label = inst.negocio_nombre || inst.label || inst.instance_name;
                        openLinkModal(bid, label, bid.startsWith('standalone_'));
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition border border-emerald-200"
                      title="Re-vincular"
                    >
                      <Link2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Vincular</span>
                    </button>
                  )}

                  {/* Generar Pairing Code (si ya tiene instancia) */}
                  {inst.status !== 'conectado' && inst.instance_name && (
                    <button
                      onClick={() => {
                        setLinkState({
                          ...INITIAL_LINK_STATE,
                          open: true,
                          mode: 'pairing',
                          targetBusinessId: inst.business_id || '',
                          targetLabel: inst.negocio_nombre || inst.label || inst.instance_name,
                          isStandalone: (inst.business_id || '').startsWith('standalone_'),
                          instanceName: inst.instance_name,
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-[10px] font-bold transition border border-violet-200"
                      title="Generar código de emparejamiento"
                    >
                      <Hash className="w-3 h-3" />
                      <span className="hidden sm:inline">Código</span>
                    </button>
                  )}

                  {/* Compartir enlace público con la clienta */}
                  {inst.status !== 'conectado' && inst.instance_name && (
                    <button
                      onClick={() => {
                        const bid = inst.business_id || '';
                        const label = inst.negocio_nombre || inst.label || inst.instance_name;
                        setLinkState({
                          ...INITIAL_LINK_STATE,
                          open: true,
                          mode: 'share_link',
                          targetBusinessId: bid,
                          targetLabel: label,
                          isStandalone: !bid || bid.startsWith('standalone_'),
                          instanceName: inst.instance_name,
                        });
                        startPolling(inst.instance_name);
                      }}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold transition border border-emerald-200"
                      title="Obtener enlace para la clienta"
                    >
                      <Link2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Link</span>
                    </button>
                  )}

                  {/* Eliminar */}
                  {confirmDelete === inst.instance_name ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(inst)}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700 transition"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(inst.instance_name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Eliminar instancia"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MODAL DE VINCULACIÓN
      ══════════════════════════════════════════════════════════ */}
      {linkState.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={closeLinkModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Vincular WhatsApp</h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-48">{linkState.targetLabel}</p>
                </div>
              </div>
              <button onClick={closeLinkModal} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ── STANDALONE: Input de label ─────────────────────── */}
              {linkState.isStandalone && linkState.mode === 'select' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nombre/Etiqueta de la instancia
                  </label>
                  <input
                    type="text"
                    value={linkState.targetLabel === 'Instancia independiente' ? '' : linkState.targetLabel}
                    onChange={e => setLinkState(prev => ({ ...prev, targetLabel: e.target.value }))}
                    placeholder="Ej: Cliente Perú - María, Prueba Demo..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              )}

              {/* ── SELECT: Elegir método ──────────────────────────── */}
              {linkState.mode === 'select' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-center">
                    <span className="text-xl">💡</span>
                    <p className="text-xs font-bold text-violet-800 mt-1">¿Cómo quieres vincular?</p>
                    <p className="text-[10px] text-violet-600 mt-0.5">Elige el método según la disponibilidad del cliente.</p>
                  </div>

                  {/* Opción 1: Enviar Enlace a la Clienta (Auto-servicio en su propio tiempo) */}
                  <button
                    onClick={handleOpenShareLink}
                    disabled={linkState.loading}
                    className="w-full relative group flex items-start gap-3 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-left transition-all hover:border-emerald-500 hover:shadow-lg disabled:opacity-50"
                  >
                    <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      🌟 Más cómodo · Auto-servicio
                    </span>
                    <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 mt-1 shrink-0">
                      <Link2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">Enviar Enlace a la Clienta</p>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Le mandas un link seguro. Ella lo abre cuando pueda, genera su código y se vincula sola.
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">No necesitan coordinar horario para estar conectados al mismo tiempo.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-500 self-center shrink-0" />
                  </button>

                  {/* Opción 2: Pairing Code en vivo */}
                  <button
                    onClick={() => setLinkState(prev => ({ ...prev, mode: 'pairing' }))}
                    className="w-full relative group flex items-start gap-3 rounded-2xl border-2 border-violet-300/80 bg-gradient-to-r from-violet-50/60 to-purple-50/60 p-4 text-left transition-all hover:border-violet-500 hover:shadow-md"
                  >
                    <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600 mt-1 shrink-0">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">Código de 8 dígitos en vivo</p>
                      <p className="text-[10px] text-violet-700 font-semibold mt-0.5">
                        Tú generas el código ahora mismo y se lo dictas (expira en 2 a 3 minutos).
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Ideal si estás chateando en tiempo real con ella.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-violet-400 self-center shrink-0" />
                  </button>

                  {/* Opción 3: QR Code presencial */}
                  <button
                    onClick={handleCreateQR}
                    className="w-full group flex items-start gap-3 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-left transition-all hover:border-slate-300 hover:bg-slate-100"
                  >
                    <div className="rounded-xl bg-white p-2.5 text-slate-600 shadow-xs mt-1 shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">Escanear Código QR</p>
                      <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Ideal si estás presencial con el celular o en videollamada.</p>
                      <p className="text-[10px] text-slate-500 mt-1">La clienta escanea la pantalla con la cámara de su WhatsApp.</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 self-center shrink-0" />
                  </button>
                </div>
              )}

              {/* ── PAIRING: Input de número ───────────────────────── */}
              {linkState.mode === 'pairing' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
                    <h4 className="flex items-center gap-2 font-bold text-violet-800 text-xs mb-2">
                      <Hash className="w-4 h-4" />
                      Código de Emparejamiento
                    </h4>
                    {[
                      'Ingresa el número de WhatsApp del cliente (con código de país).',
                      'Se genera un código de 8 letras en pantalla.',
                      'Envíale el código por WhatsApp al cliente.',
                      'El cliente va a WhatsApp → Dispositivos vinculados → Vincular con número → Ingresa el código.',
                    ].map((step, i) => (
                      <div key={i} className="flex items-start gap-2 mb-1.5">
                        <div className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-violet-200 text-center text-[9px] font-bold leading-4 text-violet-800">{i + 1}</div>
                        <p className="text-[11px] text-violet-700">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">Número del cliente</label>
                    <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-violet-400 transition">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="tel"
                        value={linkState.phoneInput}
                        onChange={e => setLinkState(prev => ({ ...prev, phoneInput: e.target.value, errorMessage: '' }))}
                        placeholder="521XXXXXXXXXX"
                        className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleRequestPairingCode()}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Incluye código de país. Ej: México=521, Perú=51, Colombia=57</p>
                    {linkState.errorMessage && (
                      <p className="text-xs text-rose-500 font-medium">{linkState.errorMessage}</p>
                    )}
                  </div>

                  <button
                    onClick={handleRequestPairingCode}
                    disabled={linkState.loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700 disabled:opacity-50"
                  >
                    {linkState.loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generando código...</>
                    ) : (
                      <><Hash className="w-4 h-4" /> Obtener Código de Emparejamiento</>
                    )}
                  </button>

                  <button
                    onClick={() => setLinkState(prev => ({ ...prev, mode: 'select' }))}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 text-center underline transition"
                  >
                    ← Volver a elegir método
                  </button>
                </div>
              )}

              {/* ── QR: Mostrar código QR ──────────────────────────── */}
              {linkState.mode === 'qr' && (
                <div className="space-y-4">
                  {linkState.loading ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
                      <p className="font-bold text-slate-900 text-sm">Generando conexión segura...</p>
                      <p className="text-xs text-slate-500 mt-1">Esto tarda unos segundos.</p>
                    </div>
                  ) : linkState.qrBase64 ? (
                    <>
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                        <h4 className="flex items-center gap-2 font-bold text-amber-800 text-xs mb-2">
                          <QrCode className="w-4 h-4" />
                          Cómo escanear
                        </h4>
                        {[
                          'Abre WhatsApp del negocio en el celular del cliente.',
                          'Ve a Ajustes → Dispositivos Vinculados → Vincular dispositivo.',
                          'Apunta la cámara al QR que aparece a continuación.',
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-2 mb-1.5">
                            <div className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-amber-200 text-center text-[9px] font-bold leading-4 text-amber-800">{i + 1}</div>
                            <p className="text-[11px] text-amber-700">{step}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-2xl border-4 border-slate-100 bg-white p-2 shadow-xl">
                          <img src={linkState.qrBase64} alt="QR WhatsApp" className="w-52 h-52 rounded-xl object-contain" />
                        </div>
                        <p className="text-xs text-slate-500 text-center animate-pulse">⏳ Esperando escaneo...</p>

                        <button onClick={handleCreateQR} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition">
                          <RefreshCw className="w-3 h-3" /> Recargar QR
                        </button>

                        <div className="w-full rounded-xl border border-violet-200 bg-violet-50 p-2.5 text-center">
                          <p className="text-[11px] text-violet-700 mb-1">¿El QR no funciona? Prueba el código.</p>
                          <button
                            onClick={() => { stopPolling(); setLinkState(prev => ({ ...prev, mode: 'pairing' })); }}
                            className="text-xs font-bold text-violet-600 hover:text-violet-700 underline"
                          >
                            Usar Código de Emparejamiento →
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* ── CODE_READY: Mostrar código para enviar ──────────── */}
              {linkState.mode === 'code_ready' && linkState.pairingCode && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-100 mb-2">
                      <Hash className="w-6 h-6 text-violet-600" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900">Código de Emparejamiento</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Envía este código al cliente por WhatsApp</p>
                  </div>

                  {/* Código destacado */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl border-2 border-violet-300 bg-violet-50 px-6 py-4">
                      <p className="text-3xl font-black tracking-[0.25em] text-violet-700 font-mono text-center">
                        {linkState.pairingCode}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(linkState.pairingCode!, 'pairing')}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 text-xs font-bold transition"
                    >
                      {copied === 'pairing' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'pairing' ? '¡Copiado!' : 'Copiar código'}
                    </button>
                  </div>

                  {/* Mensaje listo para enviar por WhatsApp */}
                  <div className="rounded-xl bg-green-50 border border-green-200 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Send className="w-3 h-3" />
                      Mensaje listo para enviar:
                    </p>
                    <div className="bg-white rounded-lg border border-green-100 p-3 text-xs text-slate-800 font-medium leading-relaxed">
                      ¡Hola! 🙌 Para vincular tu WhatsApp con Korat, sigue estos pasos:{'\n\n'}
                      1️⃣ Abre WhatsApp{'\n'}
                      2️⃣ Ve a Ajustes → Dispositivos Vinculados{'\n'}
                      3️⃣ Toca "Vincular dispositivo" → "Vincular con número de teléfono"{'\n'}
                      4️⃣ Ingresa este código: *{linkState.pairingCode}*{'\n\n'}
                      ⚠️ *IMPORTANTE:* Este código expira en 2 a 3 minutos por seguridad de WhatsApp.{'\n\n'}
                      ¡Listo! Tu cuenta quedará vinculada automáticamente. ✅
                    </div>
                    <button
                      onClick={() => {
                        const msg = `¡Hola! 🙌 Para vincular tu WhatsApp con Korat, sigue estos pasos:\n\n1️⃣ Abre WhatsApp\n2️⃣ Ve a Ajustes → Dispositivos Vinculados\n3️⃣ Toca "Vincular dispositivo" → "Vincular con número de teléfono"\n4️⃣ Ingresa este código: *${linkState.pairingCode}*\n\n⚠️ IMPORTANTE: Este código expira en 2 a 3 minutos por seguridad de WhatsApp.\n\n¡Listo! Tu cuenta quedará vinculada automáticamente. ✅`;
                        handleCopy(msg, 'msg');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition shadow-sm"
                    >
                      {copied === 'msg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'msg' ? '¡Mensaje copiado!' : 'Copiar mensaje completo'}
                    </button>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center gap-2 text-[11px] text-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span><strong>Expiración:</strong> Este código expira en 2 a 3 minutos si no se ingresa.</span>
                  </div>

                  <p className="text-xs text-slate-500 text-center animate-pulse">⏳ Esperando que el cliente ingrese el código...</p>

                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={handleRequestPairingCode}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
                    >
                      <RefreshCw className="w-3 h-3" /> Generar nuevo código
                    </button>
                  </div>
                </div>
              )}

              {/* ── SHARE_LINK: Enlace listo para enviar ───────────── */}
              {linkState.mode === 'share_link' && (
                <div className="space-y-4">
                  {linkState.loading ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <p className="text-xs font-bold text-slate-800">Preparando enlace seguro para la clienta...</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-1">
                        <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 mb-1">
                          <Link2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900">Enlace de Auto-Vinculación</h3>
                        <p className="text-[11px] text-slate-500">
                          La clienta abrirá este enlace desde su celular para conectarse cuando prefiera.
                        </p>
                      </div>

                      {/* Aviso de expiración de 2-3 min */}
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-900 leading-tight">
                          <strong className="block font-bold mb-0.5">⏳ Expiración en 2 a 3 minutos:</strong>
                          El enlace le advertirá a la clienta que, cuando toque "Generar Código", tiene 2 a 3 minutos para ingresarlo en WhatsApp.
                        </div>
                      </div>

                      {/* Enlace directo */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">Enlace para compartir:</label>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/vincular-whatsapp?instance=${linkState.instanceName}&name=${encodeURIComponent(linkState.targetLabel)}`}
                            className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none truncate"
                          />
                          <button
                            onClick={() => handleCopy(
                              `${window.location.origin}/vincular-whatsapp?instance=${linkState.instanceName}&name=${encodeURIComponent(linkState.targetLabel)}`,
                              'client_link'
                            )}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shrink-0"
                          >
                            {copied === 'client_link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`/vincular-whatsapp?instance=${linkState.instanceName}&name=${encodeURIComponent(linkState.targetLabel)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                            title="Probar enlace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* Mensaje prediseñado para WhatsApp */}
                      <div className="rounded-xl bg-green-50 border border-green-200 p-3 space-y-2">
                        <p className="text-[10px] font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Send className="w-3 h-3" />
                          Mensaje listo para enviar por WhatsApp:
                        </p>
                        <div className="bg-white rounded-lg border border-green-100 p-2.5 text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed select-all">
                          {`¡Hola ${linkState.targetLabel}! 🌸\nTe comparto tu enlace exclusivo para conectar tu WhatsApp a la plataforma Korat Flow:\n\n👉 ${window.location.origin}/vincular-whatsapp?instance=${linkState.instanceName}&name=${encodeURIComponent(linkState.targetLabel)}\n\nℹ️ Instrucciones rápidas:\n1️⃣ Abre el enlace desde tu celular.\n2️⃣ Escribe tu número y toca "Generar Código".\n3️⃣ ⚠️ El código expira en 2 a 3 minutos por seguridad de WhatsApp.\n4️⃣ En tu WhatsApp ve a: Ajustes > Dispositivos vinculados > Vincular con número, e ingresa el código.\n\n¡La pantalla te confirmará en cuanto quede listo! ✨`}
                        </div>
                        <button
                          onClick={() => {
                            const msg = `¡Hola ${linkState.targetLabel}! 🌸\nTe comparto tu enlace exclusivo para conectar tu WhatsApp a la plataforma Korat Flow:\n\n👉 ${window.location.origin}/vincular-whatsapp?instance=${linkState.instanceName}&name=${encodeURIComponent(linkState.targetLabel)}\n\nℹ️ Instrucciones rápidas:\n1️⃣ Abre el enlace desde tu celular.\n2️⃣ Escribe tu número y toca "Generar Código".\n3️⃣ ⚠️ El código expira en 2 a 3 minutos por seguridad de WhatsApp.\n4️⃣ En tu WhatsApp ve a: Ajustes > Dispositivos vinculados > Vincular con número, e ingresa el código.\n\n¡La pantalla te confirmará en cuanto quede listo! ✨`;
                            handleCopy(msg, 'wa_message');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition shadow-sm"
                        >
                          {copied === 'wa_message' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied === 'wa_message' ? '¡Mensaje Copiado!' : 'Copiar Mensaje Completo'}
                        </button>
                      </div>

                      {/* Radar de espera en tiempo real */}
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 font-medium animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        Esperando que la clienta complete la vinculación...
                      </div>

                      <button
                        onClick={() => setLinkState(prev => ({ ...prev, mode: 'select' }))}
                        className="w-full text-xs text-slate-400 hover:text-slate-600 text-center underline transition"
                      >
                        ← Volver a elegir método
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── CONNECTED: Vinculado con éxito ─────────────────── */}
              {linkState.mode === 'connected' && (
                <div className="text-center space-y-4 py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-800">¡WhatsApp Vinculado! ✅</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {linkState.targetLabel} ahora está conectado.
                    </p>
                    {linkState.instanceName && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{linkState.instanceName}</p>
                    )}
                  </div>
                  <button
                    onClick={closeLinkModal}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition shadow-sm"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {/* ── ERROR ──────────────────────────────────────────── */}
              {linkState.mode === 'error' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-sm">Algo salió mal</h3>
                  <p className="text-xs text-slate-600">{linkState.errorMessage}</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => setLinkState(prev => ({ ...prev, mode: 'select', errorMessage: '' }))}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      ← Elegir método
                    </button>
                    <button
                      onClick={() => {
                        if (linkState.phoneInput) {
                          setLinkState(prev => ({ ...prev, mode: 'pairing', errorMessage: '' }));
                        } else {
                          handleCreateQR();
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeWhatsApp;
