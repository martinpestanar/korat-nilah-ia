import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { ClienteOpciones } from './InboxView';
import {
  TrendingUp, AlertTriangle, Calendar,
  Info, ChevronDown, ChevronUp, Tag, Scissors, ArrowLeft, Bell,
  Edit2, Check, X as CloseIcon, Save, Star, UserPlus
} from 'lucide-react';
import { crm } from '../../services/api';
import { format, differenceInDays, parseISO } from 'date-fns';
import BirthdayInput from '../Common/BirthdayInput';
import { es } from 'date-fns/locale';

interface Tag {
  id: string;
  etiqueta: string;
  color: string;
}

interface CitaReciente {
  id: string;
  fecha: string;
  servicio: string;
  estado: string;
  calificacion: number | null;
}

interface HistorialSistema {
  id: string;
  contenido: string;
  created_at: string;
  tipo_mensaje?: string;
  campana_origen?: string;
}

interface ClienteDetallado extends ClienteOpciones {
  primera_visita?: string;
  ultima_visita?: string;
  puntos_acumulados?: number;
  total_visitas?: number;
  LTV?: string;
  ticket_promedio?: string;
  fiabilidad_score?: number;
  nivel_riesgo?: string;
  cumpleanos?: string;
  ultimo_servicio?: string;
  notas?: string;
  alergias?: string;
  audiencia_segmento?: string;
  estado_lifecycle?: string;
}

interface Props {
  cliente: ClienteOpciones;
  businessId: string;
  onClose?: () => void;
  onClientUpdated?: (updated: ClienteOpciones) => void;
}

const ClientProfilePanel: React.FC<Props> = ({ cliente, businessId, onClose, onClientUpdated }) => {
  const [clienteDetallado, setClienteDetallado] = useState<ClienteDetallado | null>(null);
  const [citasRecientes, setCitasRecientes] = useState<CitaReciente[]>([]);
  const [historialSistema, setHistorialSistema] = useState<HistorialSistema[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('resumen');
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [confirmRemoveTagId, setConfirmRemoveTagId] = useState<string | null>(null);

  // Edición de información
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal para registrar o editar clienta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNombre, setModalNombre] = useState('');
  const [modalTelefono, setModalTelefono] = useState('');
  const [modalCumpleanos, setModalCumpleanos] = useState('');
  const [modalNotas, setModalNotas] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);

  const fetchCliente = async (): Promise<ClienteDetallado | null> => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('*')
        .eq('id', cliente.id)
        .single();
      if (!error && data) {
        setClienteDetallado(data);
        return data;
      }
    } catch (e) { /* silent */ }
    return null;
  };

  const fetchCitas = async () => {
    try {
      const { data } = await supabase
        .from('Citas')
        .select('id, fecha, servicio, estado, calificacion')
        .eq('cliente_id', cliente.id)
        .order('fecha', { ascending: false })
        .limit(5);
      if (data) setCitasRecientes(data);
    } catch (e) { /* silent */ }
  };

  const fetchHistorial = async () => {
    try {
      const { data } = await supabase
        .from('mensajes')
        .select('id, contenido, created_at, tipo_mensaje, campana_origen')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) {
        setHistorialSistema(
          data.filter(m => m.tipo_mensaje === 'sistema' || !!m.campana_origen).slice(0, 5)
        );
      }
    } catch (e) { /* silent */ }
  };

  const fetchTags = async () => {
    try {
      const { data } = await supabase
        .from('chat_tags')
        .select('*')
        .eq('cliente_id', cliente.id);
      if (data) setTags(data);
    } catch (e) { /* silent */ }
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    setAddingTag(true);
    const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    await supabase.from('chat_tags').insert({ cliente_id: cliente.id, business_id: businessId, etiqueta: newTag.trim(), color });
    setNewTag('');
    setAddingTag(false);
    fetchTags();
  };

  const removeTag = async (tagId: string) => {
    await supabase.from('chat_tags').delete().eq('id', tagId);
    setConfirmRemoveTagId(null);
    fetchTags();
  };

  const handleTagTap = (tagId: string) => {
    if (confirmRemoveTagId === tagId) {
      removeTag(tagId);
    } else {
      setConfirmRemoveTagId(tagId);
    }
  };

  const updateClienteField = async (field: keyof ClienteDetallado, value: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('Clientes')
        .update({ [field]: value })
        .eq('id', cliente.id);

      if (!error) {
        const updatedCliente: ClienteDetallado = clienteDetallado
          ? { ...clienteDetallado, [field]: value }
          : { ...cliente, [field]: value };
        setClienteDetallado(updatedCliente);
        setEditingField(null);
        onClientUpdated?.(updatedCliente);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (field: string, currentVal: string = '') => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  const openRegisterModal = () => {
    const rawNombre = clienteDetallado?.nombre || cliente.nombre || '';
    const isOnlyDigits = /^\+?\d+$/.test(rawNombre.trim());
    setModalNombre(isOnlyDigits ? '' : rawNombre);

    let phone = clienteDetallado?.telefono || cliente.telefono || '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('9')) {
      phone = '51' + digits;
    }
    setModalTelefono(phone);
    setModalCumpleanos(clienteDetallado?.cumpleanos || '');
    setModalNotas(clienteDetallado?.notas || '');
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalNombre.trim()) {
      setModalError('Por favor ingresa el nombre de la clienta.');
      return;
    }

    let sanitizedPhone = modalTelefono.replace(/\D/g, '');
    if (sanitizedPhone.length === 9 && sanitizedPhone.startsWith('9')) {
      sanitizedPhone = '51' + sanitizedPhone;
    }

    if (!sanitizedPhone || sanitizedPhone.length < 8 || sanitizedPhone.length > 15) {
      setModalError('Ingresa un teléfono válido de 8 a 15 dígitos con prefijo de país (ej. 51 para Perú o 1 para EE.UU.).');
      return;
    }

    setIsSavingModal(true);
    setModalError(null);

    try {
      if (cliente.id) {
        const { error } = await supabase
          .from('Clientes')
          .update({
            nombre: modalNombre.trim(),
            telefono: sanitizedPhone,
            cumpleanos: modalCumpleanos.trim() || null,
            notas: modalNotas.trim() || null
          })
          .eq('id', cliente.id);

        if (error) throw error;
      } else {
        await crm.createClient({
          nombre: modalNombre.trim(),
          telefono: sanitizedPhone,
          cumpleanos: modalCumpleanos.trim() || null
        });
      }

      setModalSuccess(true);
      const updated = await fetchCliente();
      if (updated) {
        onClientUpdated?.(updated);
      } else if (cliente.id) {
        onClientUpdated?.({
          ...(clienteDetallado || cliente),
          nombre: modalNombre.trim(),
          telefono: sanitizedPhone,
          cumpleanos: modalCumpleanos.trim() || undefined,
        });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(false);
      }, 1000);
    } catch (err: any) {
      console.error('Error al guardar clienta:', err);
      setModalError(err.message || 'Error al guardar la clienta.');
    } finally {
      setIsSavingModal(false);
    }
  };

  useEffect(() => {
    setConfirmRemoveTagId(null);
    setEditingField(null);
    setLoading(true);
    Promise.all([fetchCliente(), fetchCitas(), fetchTags(), fetchHistorial()]).finally(() => setLoading(false));
  }, [cliente.id]);

  // Helpers de UI
  const getRiskColor = (nivel?: string) => {
    if (!nivel) return 'text-gray-500';
    if (nivel === 'alto') return 'text-red-500';
    if (nivel === 'medio') return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getFiabilidadColor = (score?: number) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const isBirthdayThisMonth = (cumpleanos?: string) => {
    if (!cumpleanos) return false;
    try {
      const parts = cumpleanos.split('-');
      const month = parseInt(parts[1]) - 1;
      return month === new Date().getMonth();
    } catch { return false; }
  };

  const getCategoriaBadge = (visitas: number = 0, ltvStr?: string) => {
    const ltv = parseFloat(ltvStr || '0');
    if (visitas >= 26 || ltv >= 2000) return { label: 'CLIENTA VIP', icon: '👑', color: 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
    if (visitas >= 13 || ltv >= 1000) return { label: 'CLIENTA FIEL', icon: '💎', color: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
    if (visitas >= 5 || ltv >= 400) return { label: 'REGULAR', icon: '⭐', color: 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' };
    if (visitas >= 2) return { label: 'CASUAL', icon: '💅', color: 'text-pink-600 bg-pink-100 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800' };
    return { label: 'NUEVA', icon: '🌱', color: 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' };
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) => (
    <div className="border-b border-gray-100 dark:border-[#2A2640] last:border-0">
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Icon size={14} className="text-primary" />
          {title}
        </div>
        {expandedSection === id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {expandedSection === id && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );

  const MetricRow = ({ label, value, extra }: { label: string; value: React.ReactNode; extra?: React.ReactNode }) => (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{value}</span>
      {extra}
    </div>
  );


  if (loading) {
    return (
      <div className="w-full h-full shrink-0 flex flex-col border-l border-gray-100 dark:border-white/5 panel-surface">
        {onClose && (
          <div
            className="lg:hidden px-4 pb-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between"
            style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.85rem))' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 font-bold text-xs active:scale-95 transition-all shadow-sm border border-violet-500/20 min-h-[44px]"
              aria-label="Volver al chat"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Volver al chat</span>
            </button>
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Resumen Cliente
            </span>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin h-6 w-6 border-b-2 border-brand rounded-full" />
        </div>
      </div>
    );
  }

  const c = clienteDetallado;
  const bMonth = isBirthdayThisMonth(c?.cumpleanos);
  const parsedUltimaVisita = c?.ultima_visita ? parseISO(c.ultima_visita) : null;
  const diasSinVisita =
    parsedUltimaVisita && !Number.isNaN(parsedUltimaVisita.getTime())
      ? differenceInDays(new Date(), parsedUltimaVisita)
      : null;

  return (
    <>
      <div className="w-full shrink-0 flex flex-col panel-surface overflow-y-auto h-full relative border-l border-gray-100 dark:border-white/5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
      {/* HEADER con Safe Area Top para no chocar con el notch/reloj */}
      <div 
        className="px-4 pb-4 border-b border-gray-100 dark:border-white/5 header-surface shadow-sm sticky top-0 z-20 backdrop-blur-xl"
        style={{ paddingTop: 'max(1rem, calc(env(safe-area-inset-top, 0px) + 0.85rem))' }}
      >
        {/* Mobile back button */}
        {onClose && (
          <div className="lg:hidden mb-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 font-bold text-xs active:scale-95 transition-all shadow-sm border border-violet-500/20 min-h-[44px]"
              aria-label="Volver al chat"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Volver al chat</span>
            </button>
            <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Resumen Cliente
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
            {c?.nombre?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{c?.nombre || c?.telefono}</h3>
            <p className="text-xs text-gray-500 truncate">{c?.telefono}</p>
            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-1">
              {bMonth && (
                <span className="text-[10px] bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-1.5 py-0.5 rounded-full font-semibold">
                  🎂 Cumple este mes
                </span>
              )}
              {c?.nivel_riesgo === 'alto' && (
                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                  ⚠ Riesgo Alto
                </span>
              )}
              {c?.alergias && (
                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-semibold">
                  🚫 Alergias
                </span>
              )}
            </div>
            
            {/* Categoria Badge & Botón Registrar */}
            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              {(() => {
                const cat = getCategoriaBadge(c?.total_visitas, c?.LTV);
                return (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wide shadow-sm ${cat.color}`}>
                     <span className="text-sm">{cat.icon}</span> {cat.label}
                  </div>
                );
              })()}
              <button
                type="button"
                onClick={openRegisterModal}
                className="inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-sm active:scale-95 transition-all"
                title="Registrar o editar datos de la clienta"
              >
                <UserPlus size={14} />
                <span>{c?.nombre && !/^\+?\d+$/.test(c.nombre) ? 'Editar' : 'Registrar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <>
        {/* Etiquetas (Tags) */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/5 bg-transparent">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => {
                const isConfirming = confirmRemoveTagId === tag.id;
                return (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => handleTagTap(tag.id)}
                    onBlur={() => {
                      if (isConfirming) setConfirmRemoveTagId(null);
                    }}
                    title={isConfirming ? 'Toca de nuevo para confirmar eliminación' : 'Toca para eliminar etiqueta'}
                    className={`inline-flex items-center gap-1 text-[11px] text-white px-2.5 py-1 min-h-[32px] rounded-full font-semibold cursor-pointer transition-all active:scale-95 ${
                      isConfirming ? 'ring-2 ring-rose-500 ring-offset-1 dark:ring-offset-[#1A1825] brightness-90' : 'hover:opacity-85'
                    }`}
                    style={{ backgroundColor: isConfirming ? '#e11d48' : tag.color }}
                  >
                    <span>{isConfirming ? `Eliminar "${tag.etiqueta}"?` : tag.etiqueta}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5 items-center">
              <input
                className="flex-1 min-w-0 text-base lg:text-xs px-3 min-h-[44px] rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-dark-850 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand/40"
                placeholder="+ Agregar etiqueta..."
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={addingTag || !newTag.trim()}
                aria-label="Agregar etiqueta"
                className="w-11 h-11 flex items-center justify-center text-xs bg-primary text-white rounded-lg disabled:opacity-50 shrink-0 active:scale-95 transition-transform"
              >
                <Tag size={15} />
              </button>
            </div>
          </div>

          {/* Sección de resumen de métricas */}
          <Section id="resumen" title="Resumen del Cliente" icon={TrendingUp}>
            <MetricRow label="LTV Total" value={c?.LTV ? `S/ ${c.LTV}` : '—'} />
            <MetricRow label="Visitas totales" value={c?.total_visitas ?? '—'} />
            <MetricRow label="Ticket promedio" value={c?.ticket_promedio ? `S/ ${c.ticket_promedio}` : '—'} />
            <MetricRow label="Puntos Nilah" value={c?.puntos_acumulados ?? '—'} />
            <MetricRow label="Última visita" value={diasSinVisita !== null ? `hace ${diasSinVisita} días` : '—'} />
            {c?.fiabilidad_score !== undefined && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Fiabilidad</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{c.fiabilidad_score}/100</span>
                </div>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getFiabilidadColor(c.fiabilidad_score)}`}
                    style={{ width: `${c.fiabilidad_score}%` }}
                  />
                </div>
              </div>
            )}
            {c?.nivel_riesgo && (
              <MetricRow
                label="Nivel de Riesgo"
                value={<span className={`capitalize font-bold ${getRiskColor(c.nivel_riesgo)}`}>{c.nivel_riesgo}</span>}
              />
            )}
            {c?.audiencia_segmento && (
              <MetricRow label="Segmento" value={<span className="text-primary">{c.audiencia_segmento}</span>} />
            )}
            {c?.estado_lifecycle && (
              <MetricRow label="Estado del Ciclo" value={c.estado_lifecycle} />
            )}
          </Section>

          {/* Último servicio */}
          <Section id="servicio" title="Último Servicio" icon={Scissors}>
            {c?.ultimo_servicio ? (
              <div className="p-2 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs font-semibold text-primary">{c.ultimo_servicio}</p>
                {parsedUltimaVisita && !Number.isNaN(parsedUltimaVisita.getTime()) && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    {format(parsedUltimaVisita, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Sin registro de servicios</p>
            )}
          </Section>

          {/* Historial de citas */}
          <Section id="citas" title="Historial de Citas" icon={Calendar}>
            {citasRecientes.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin citas registradas</p>
            ) : (
              <div className="space-y-2">
                {citasRecientes.map(cita => (
                  <div key={cita.id} className="flex items-start gap-2 text-xs">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${cita.estado === 'completada' ? 'bg-emerald-500' : cita.estado === 'cancelada' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{cita.servicio}</p>
                      <p className="text-gray-400">{cita.fecha}</p>
                      {cita.calificacion && (
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: cita.calificacion }).map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Historial de Nilah / Alertas */}
          <Section id="historial-sistema" title="Actividad de Nilah" icon={Bell}>
            {historialSistema.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No hay mensajes automáticos recientes</p>
            ) : (
              <div className="space-y-2">
                {historialSistema.map(hist => (
                  <div key={hist.id} className="flex flex-col gap-0.5 p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        {hist.campana_origen ? 'Campaña' : 'Alerta'}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {(() => {
                          const d = parseISO(hist.created_at);
                          return Number.isNaN(d.getTime()) ? '' : format(d, "d MMM, HH:mm", { locale: es });
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mt-0.5">{hist.contenido}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>


          {/* Alergias */}
          <Section id="alergias" title="⚠️ Alergias / Contraindicaciones" icon={AlertTriangle}>
            {editingField === 'alergias' ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-2.5 text-base lg:text-xs bg-white dark:bg-dark-900 border border-amber-200 dark:border-amber-700/50 rounded-lg focus:ring-1 focus:ring-amber-500 outline-none min-h-[72px]"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="Ej: Alérgica al acrílico, piel sensible..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    aria-label="Cancelar edición"
                    className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                  >
                    <CloseIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClienteField('alergias', tempValue)}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-xs bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 disabled:opacity-50"
                  >
                    {isSaving ? <span className="animate-spin h-3.5 w-3.5 border-b-2 border-white rounded-full" /> : <Save size={14} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => startEditing('alergias', c?.alergias)}
                className={`group relative p-2.5 min-h-[44px] flex items-center rounded-lg border border-dashed cursor-pointer transition-colors ${c?.alergias ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50' : 'bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-amber-300'}`}
              >
                {c?.alergias ? (
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium break-words pr-5">{c.alergias}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 italic pr-5">No hay alergias registradas. Click para agregar.</p>
                )}
                <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={12} className="text-amber-500" />
                </div>
              </div>
            )}
          </Section>

          {/* Notas */}
          <Section id="notas" title="Notas del Equipo" icon={Info}>
            {editingField === 'notas' ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-2.5 text-base lg:text-xs bg-white dark:bg-dark-900 border border-yellow-200 dark:border-yellow-700/30 rounded-lg focus:ring-1 focus:ring-yellow-500 outline-none min-h-[88px]"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="Notas internas, preferencias, historial personal..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    aria-label="Cancelar edición"
                    className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                  >
                    <CloseIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateClienteField('notas', tempValue)}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 px-4 min-h-[44px] text-xs bg-yellow-500 text-yellow-900 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {isSaving ? <span className="animate-spin h-3.5 w-3.5 border-b-2 border-yellow-900 rounded-full" /> : <Save size={14} />}
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => startEditing('notas', c?.notas)}
                className={`group relative p-2.5 min-h-[44px] flex items-center rounded-lg border border-dashed cursor-pointer transition-colors ${c?.notas ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-700/30' : 'bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-yellow-300'}`}
              >
                {c?.notas ? (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic break-words pr-5">{c.notas}</p>
                ) : (
                  <p className="text-[11px] text-gray-400 italic pr-5">Sin notas. Click para agregar notas internas.</p>
                )}
                <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Edit2 size={12} className="text-yellow-500" />
                </div>
              </div>
            )}
          </Section>
        </>
      </div>

      {/* Modal para Registrar o Editar Clienta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1E1E2D] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 animate-scale-in">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-violet-50/70 to-pink-50/70 dark:from-violet-900/20 dark:to-pink-900/20 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <UserPlus size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                    {modalSuccess ? '¡Clienta Guardada!' : (clienteDetallado?.nombre && !/^\+?\d+$/.test(clienteDetallado.nombre) ? 'Editar Clienta' : 'Registrar Clienta')}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {modalSuccess ? 'Datos actualizados con éxito' : 'Vincular ficha en la base de datos'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
                className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5">
              {modalError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{modalNombre}</p>
                  <p className="text-xs text-gray-500">Perfil actualizado en el salón</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={modalNombre}
                      onChange={(e) => setModalNombre(e.target.value)}
                      placeholder="Ej. Estrella More"
                      className="w-full text-base lg:text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      WhatsApp / Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={modalTelefono}
                      onChange={(e) => {
                        let val = e.target.value;
                        const digits = val.replace(/\D/g, '');
                        if (digits.length === 9 && digits.startsWith('9')) {
                          val = '51' + digits;
                        }
                        setModalTelefono(val);
                      }}
                      placeholder="Ej. 51987654321 o 19165957069"
                      className="w-full text-base lg:text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                      required
                    />
                    {modalTelefono && modalTelefono.replace(/\D/g, '').length > 0 && modalTelefono.replace(/\D/g, '').length < 8 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        Debe incluir prefijo de país (ej. 51 para Perú, 1 para EE.UU.)
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Cumpleaños (Opcional)
                      </label>
                      <span className="text-[10px] text-gray-400">Año opcional</span>
                    </div>
                    <BirthdayInput
                      value={modalCumpleanos}
                      onChange={(val) => setModalCumpleanos(val)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Notas del Salón (Opcional)
                    </label>
                    <textarea
                      value={modalNotas}
                      onChange={(e) => setModalNotas(e.target.value)}
                      placeholder="Preferencias, tipo de cabello, notas especiales..."
                      rows={2}
                      className="w-full text-base lg:text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 min-h-[44px] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingModal || !modalNombre.trim()}
                      className="flex items-center gap-1.5 px-4 min-h-[44px] text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSavingModal ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Guardar Clienta</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientProfilePanel;
