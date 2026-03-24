import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { ClienteOpciones } from './InboxView';
import {
  Star, TrendingUp, AlertTriangle, Calendar,
  Heart, Info, ChevronDown, ChevronUp, Tag, Scissors, ArrowLeft, Bell
} from 'lucide-react';
import { format, differenceInDays, parseISO, isToday, getMonth, getDate } from 'date-fns';
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
}

const ClientProfilePanel: React.FC<Props> = ({ cliente, businessId, onClose }) => {
  const [clienteDetallado, setClienteDetallado] = useState<ClienteDetallado | null>(null);
  const [citasRecientes, setCitasRecientes] = useState<CitaReciente[]>([]);
  const [historialSistema, setHistorialSistema] = useState<HistorialSistema[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('resumen');
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const fetchCliente = async () => {
    try {
      const { data, error } = await supabase
        .from('Clientes')
        .select('*')
        .eq('id', cliente.id)
        .single();
      if (!error && data) setClienteDetallado(data);
    } catch (e) { /* silent */ }
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
    fetchTags();
  };

  useEffect(() => {
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
      <div className="w-72 shrink-0 flex items-center justify-center p-8 border-l border-gray-200 dark:border-[#2A2640] bg-white dark:bg-[#1A1825]">
        <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  const c = clienteDetallado;
  const bMonth = isBirthdayThisMonth(c?.cumpleanos);
  const diasSinVisita = c?.ultima_visita ? differenceInDays(new Date(), parseISO(c.ultima_visita)) : null;

  return (
    <div className="w-full lg:w-72 shrink-0 flex flex-col bg-gray-50 dark:bg-[#1A1825] overflow-y-auto h-full">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200 dark:border-[#2A2640] bg-white dark:bg-[#1E1C2D]">
        {/* Mobile back button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden mb-3 flex items-center gap-2 text-sm text-violet-500 font-semibold"
          >
            <ArrowLeft size={16} /> Volver al chat
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {c?.nombre?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight truncate">{c?.nombre || c?.telefono}</h3>
            <p className="text-xs text-gray-500">{c?.telefono}</p>
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
          </div>
        </div>
      </div>

      {/* Etiquetas (Tags) */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-[#2A2640] bg-white dark:bg-[#1E1C2D]">
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map(tag => (
            <span
              key={tag.id}
              onClick={() => removeTag(tag.id)}
              title="Click para eliminar"
              className="text-[10px] text-white px-2 py-0.5 rounded-full font-semibold cursor-pointer hover:opacity-75 transition-opacity"
              style={{ backgroundColor: tag.color }}
            >
              {tag.etiqueta} ×
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            className="flex-1 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-[#2A2640] bg-gray-50 dark:bg-[#13111C] text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
            placeholder="+ Agregar etiqueta..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
          />
          <button
            onClick={addTag}
            disabled={addingTag || !newTag.trim()}
            className="px-2 py-1 text-xs bg-primary text-white rounded-lg disabled:opacity-50"
          >
            <Tag size={12} />
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
            {c?.ultima_visita && (
              <p className="text-[10px] text-gray-500 mt-1">
                {format(parseISO(c.ultima_visita), "d 'de' MMMM, yyyy", { locale: es })}
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
                <div>
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
                  <span className="text-[10px] text-gray-400">{format(parseISO(hist.created_at), "d MMM, HH:mm", { locale: es })}</span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mt-0.5">{hist.contenido}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Alergias */}
      {c?.alergias && (
        <Section id="alergias" title="⚠️ Alergias / Contraindicaciones" icon={AlertTriangle}>
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{c.alergias}</p>
          </div>
        </Section>
      )}

      {/* Notas */}
      {c?.notas && (
        <Section id="notas" title="Notas del Equipo" icon={Info}>
          <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded-lg border border-yellow-200 dark:border-yellow-700/30">
            {c.notas}
          </p>
        </Section>
      )}
    </div>
  );
};

export default ClientProfilePanel;
