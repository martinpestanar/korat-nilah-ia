import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Play, CheckCircle2, XCircle, Loader2,
  Copy, Check, Send, Smartphone, ShieldCheck, Sparkles,
  AlertTriangle, ExternalLink, RefreshCw, User, Calendar,
  Clock, Scissors, HeartHandshake, MessageSquare, Star, ArrowRight
} from 'lucide-react';
import {
  fetchNegociosAutopilot,
  fetchCitasRecientes,
  dispararPruebaProduccion,
  simularRespuestaTiempo2,
  type NegocioAutopilotStatus,
  type CitaRecientePrueba,
  type TestRunResult
} from '../../services/autopilot';

const FLUJOS_TEST: { id: string; label: string; emoji: string; desc: string; variables: string[] }[] = [
  { id: 'recordatorio_24h', label: 'Recordatorio 24h', emoji: '⏰', desc: 'Confirmación interactiva 24h antes', variables: ['cliente', 'servicio', 'fecha', 'hora', 'especialista'] },
  { id: 'recordatorio_3h',  label: 'Recordatorio 3h',  emoji: '⚡', desc: 'Aviso de salida y puntualidad 3h antes', variables: ['cliente', 'servicio', 'hora'] },
  { id: 'fidelizacion',     label: 'Fidelización Post-Cita (2 Tiempos)', emoji: '⭐', desc: 'Encuesta 1 a 5 ⭐ + Puntos/Premios', variables: ['cliente', 'servicio'] },
  { id: 'retoque',          label: 'Retoque (18-24d)', emoji: '💅', desc: 'Invitación a mantenimiento según servicio', variables: ['cliente', 'servicio'] },
  { id: 'cuidados_24h',     label: 'Cuidados Post 24h', emoji: '✨', desc: 'Tip preventivo de oro temprano', variables: ['cliente', 'servicio'] },
  { id: 'rescate_45d',      label: 'Rescate 45d',      emoji: '🌸', desc: 'Reactivación temprana con calidez', variables: ['cliente', 'servicio'] },
  { id: 'rescate_75d',      label: 'Rescate 75d',      emoji: '🎁', desc: 'Reactivación con extra spa/incentivo', variables: ['cliente'] },
  { id: 'rescate_120d',     label: 'Rescate Final 120d', emoji: '🚨', desc: 'Última oportunidad beneficio VIP', variables: ['cliente'] },
];

interface Props {
  negocios?: { id: string; nombre: string }[];
}

export const AutopilotTestRunner: React.FC<Props> = () => {
  // Salones y Citas
  const [salones, setSalones] = useState<NegocioAutopilotStatus[]>([]);
  const [loadingSalones, setLoadingSalones] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [citasRecientes, setCitasRecientes] = useState<CitaRecientePrueba[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  // Parámetros del Test
  const [flujo, setFlujo] = useState<string>('recordatorio_24h');
  const [modoEnvio, setModoEnvio] = useState<'real' | 'simulacion'>('real');
  const [telefonoTest, setTelefonoTest] = useState('');
  const [nombreCliente, setNombreCliente] = useState('Valeria');
  const [servicio, setServicio] = useState('Lifting de Pestañas');
  const [fechaCita, setFechaCita] = useState('mañana 04/09');
  const [horaCita, setHoraCita] = useState('4:30 PM');
  const [especialista, setEspecialista] = useState('Paola Chau');
  const [citaSeleccionadaId, setCitaSeleccionadaId] = useState<number | null>(null);

  // Estados de Ejecución
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Fidelización Tiempo 2
  const [tiempo2Simulado, setTiempo2Simulado] = useState<any | null>(null);
  const [runningT2, setRunningT2] = useState(false);

  // Cargar salones con estado de Evolution API
  useEffect(() => {
    const loadSalones = async () => {
      setLoadingSalones(true);
      try {
        const data = await fetchNegociosAutopilot();
        setSalones(data);
        // Pre-seleccionar Paola Chau si está conectada o el primer salón conectado
        const paola = data.find(s => s.nombre.toLowerCase().includes('paola') || s.evo_status === 'conectado');
        if (paola) {
          setSelectedBusinessId(paola.id);
        } else if (data.length > 0) {
          setSelectedBusinessId(data[0].id);
        }
      } catch (e) {
        console.error('Error cargando salones en TestRunner:', e);
      } finally {
        setLoadingSalones(false);
      }
    };
    loadSalones();
  }, []);

  // Cargar citas recientes al cambiar de salón
  useEffect(() => {
    if (!selectedBusinessId) return;
    const loadCitas = async () => {
      setLoadingCitas(true);
      try {
        const citas = await fetchCitasRecientes(selectedBusinessId);
        setCitasRecientes(citas);
      } catch (e) {
        console.error('Error cargando citas:', e);
      } finally {
        setLoadingCitas(false);
      }
    };
    loadCitas();
  }, [selectedBusinessId]);

  const salonActivo = salones.find(s => s.id === selectedBusinessId);
  const flujoActual = FLUJOS_TEST.find(f => f.id === flujo) || FLUJOS_TEST[0];
  const estaConectado = salonActivo?.evo_status === 'conectado';

  // Helper para calcular hora inteligente relativa al momento actual
  const calcularHoraSegunFlujo = (tipoFlujo: string) => {
    const ahora = new Date();
    if (tipoFlujo === 'recordatorio_3h') {
      // Si probamos 3 horas antes, la cita debería ser en 3 horas desde YA
      const citaEn3h = new Date(ahora.getTime() + 3 * 60 * 60 * 1000);
      setFechaCita('Hoy ' + citaEn3h.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));
      setHoraCita(citaEn3h.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }));
    } else if (tipoFlujo === 'recordatorio_24h') {
      // Cita mañana a esta misma hora
      const citaEn24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
      setFechaCita('Mañana ' + citaEn24h.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));
      setHoraCita(citaEn24h.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }));
    } else {
      setFechaCita('Hoy ' + ahora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));
      setHoraCita(ahora.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }
  };

  // Función auxiliar para obtener únicamente el primer nombre limpio
  const extraerPrimerNombre = (nombreCompleto: string): string => {
    if (!nombreCompleto) return 'Valeria';
    // Quitar textos entre paréntesis, después de /, guión o pipe
    const sinAclaraciones = nombreCompleto.split(/[/(|\-–]/)[0] || '';
    // Extraer solo la primera palabra alfabética
    const match = sinAclaraciones.trim().match(/^[A-Za-zÁÉÍÓÚáéíóúñÑ]+/);
    if (match && match[0]) {
      const palabra = match[0].toLowerCase();
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    }
    return sinAclaraciones.trim().split(/\s+/)[0] || 'Valeria';
  };

  // Aplicar datos de una cita real
  const handleSelectCita = (c: CitaRecientePrueba) => {
    setCitaSeleccionadaId(c.cita_id);
    setNombreCliente(extraerPrimerNombre(c.cliente_nombre));
    setServicio(c.servicio);
    setFechaCita(c.fecha_formateada);
    setHoraCita(c.hora_formateada);
    if (c.especialista) setEspecialista(c.especialista);
    // Si no ha puesto teléfono aún, pre-rellenar con el de la clienta
    if (!telefonoTest) setTelefonoTest(c.cliente_telefono);
  };

  // Disparo del Test
  const handleRun = async () => {
    if (!selectedBusinessId) return;
    setRunning(true);
    setResult(null);
    setTiempo2Simulado(null);

    const res = await dispararPruebaProduccion({
      business_id: selectedBusinessId,
      flujo,
      telefono_destino: telefonoTest.trim() || salonActivo?.telefono_recepcionista || '51999999999',
      nombre_cliente: extraerPrimerNombre(nombreCliente.trim()),
      servicio: servicio.trim() || 'Servicio',
      fecha_cita: fechaCita.trim(),
      hora_cita: horaCita.trim(),
      especialista: especialista.trim(),
      cita_id: citaSeleccionadaId,
      es_simulacion: modoEnvio === 'simulacion',
    });

    setResult(res);
    setRunning(false);
  };

  // Simular Tiempo 2 de Fidelización
  const handleTriggerTiempo2 = async (nota: string) => {
    if (!selectedBusinessId) return;
    setRunningT2(true);
    try {
      const res = await simularRespuestaTiempo2({
        business_id: selectedBusinessId,
        telefono_cliente: telefonoTest.trim() || '51999999999',
        nota,
        nombre_cliente: extraerPrimerNombre(nombreCliente.trim()),
        servicio: servicio.trim() || 'Servicio',
        es_simulacion: modoEnvio === 'simulacion',
      });
      setTiempo2Simulado(res);
    } finally {
      setRunningT2(false);
    }
  };

  const copyText = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl font-sans text-slate-900 transition-all">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Test Studio — Disparador Real en Producción
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                Multi-Tenant Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Envía mensajes reales por WhatsApp desde las instancias conectadas o simula payloads con plantillas reales
            </p>
          </div>
        </div>

        {/* Selector de Modo Envio */}
        <div className="flex items-center gap-1 bg-white border border-emerald-200/80 rounded-full p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setModoEnvio('real')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              modoEnvio === 'real'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>WhatsApp Real (Live)</span>
          </button>
          <button
            type="button"
            onClick={() => setModoEnvio('simulacion')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
              modoEnvio === 'simulacion'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador Seguro</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* ── 1. SELECTOR DE SALÓN INTELIGENTE CON STATUS DE EVOLUTION ── */}
        <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-black text-slate-900 flex items-center gap-2">
              <span>1. Salón Emisor (Tenant)</span>
              {loadingSalones && <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />}
            </label>
            {salonActivo && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-slate-500">Instancia Evolution:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                  {salonActivo.instance_name || 'Sin instancia'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  estaConectado
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estaConectado ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
                  {estaConectado ? 'WhatsApp Conectado' : 'Desconectado'}
                </span>
              </div>
            )}
          </div>

          <select
            value={selectedBusinessId}
            onChange={e => setSelectedBusinessId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
          >
            {salones.map(s => (
              <option key={s.id} value={s.id}>
                {s.evo_status === 'conectado' ? '🟢' : '⚪'} {s.nombre} {s.evo_status === 'conectado' ? '— (WhatsApp Conectado ✓)' : '— (Desconectado)'}
              </option>
            ))}
          </select>

          {modoEnvio === 'real' && !estaConectado && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Este salón tiene su WhatsApp desconectado en Evolution API. Para enviar a WhatsApp real se usará el simulador o debes seleccionar <strong>Paola Chau Beauty Studio</strong> (que sí está conectada).
              </span>
            </div>
          )}
        </div>

        {/* ── 2. SELECCIÓN DE FLUJO Y DESTINO ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              2. Flujo Automatizado a Probar
            </label>
            <select
              value={flujo}
              onChange={e => {
                const nuevoFlujo = e.target.value;
                setFlujo(nuevoFlujo);
                setTiempo2Simulado(null);
                calcularHoraSegunFlujo(nuevoFlujo);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              {FLUJOS_TEST.map(f => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">{flujoActual.desc}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Número de WhatsApp Destino</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Tu número de prueba</span>
            </label>
            <input
              type="tel"
              value={telefonoTest}
              onChange={e => setTelefonoTest(e.target.value)}
              placeholder="Ej: +51 987 654 321 o 987654321"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Recibirás el mensaje directamente en tu WhatsApp con el remitente de <strong>{salonActivo?.nombre || 'este salón'}</strong>.
            </p>
          </div>
        </div>

        {/* ── 3. CARGAR DATOS REALES VS PERSONALIZADOS ── */}
        <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Parámetros y Variables del Mensaje</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCitaSeleccionadaId(null);
                  calcularHoraSegunFlujo(flujo);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-2xs"
                title="Calcula automáticamente la hora de la cita según el flujo a partir de este momento"
              >
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>⚡ Calcular con hora actual</span>
              </button>
              {citasRecientes.length > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  o elige una cita:
                </span>
              )}
            </div>
          </div>

          {/* Chips de Citas Recientes para Cargar en 1 Clic */}
          {citasRecientes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {citasRecientes.slice(0, 4).map(c => (
                <button
                  key={c.cita_id}
                  type="button"
                  onClick={() => handleSelectCita(c)}
                  className={`text-left px-3 py-1.5 rounded-xl border text-xs shrink-0 transition-all cursor-pointer ${
                    citaSeleccionadaId === c.cita_id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <p className="font-bold truncate max-w-[140px]">{c.cliente_nombre}</p>
                  <p className={`text-[10px] truncate max-w-[140px] ${citaSeleccionadaId === c.cita_id ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {c.servicio} · {c.hora_formateada}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Campos Personalizables */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nombre Clienta</label>
              <input
                type="text"
                value={nombreCliente}
                onChange={e => {
                  setNombreCliente(e.target.value);
                  setCitaSeleccionadaId(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                placeholder="Ej: Valeria"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Servicio</label>
                <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">Gramática auto ✨</span>
              </div>
              <input
                type="text"
                value={servicio}
                onChange={e => {
                  setServicio(e.target.value);
                  setCitaSeleccionadaId(null);
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                placeholder="Ej: Uñas Acrílicas o Lifting"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Fecha Cita</label>
              <input
                type="text"
                value={fechaCita}
                onChange={e => setFechaCita(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                placeholder="Ej: mañana 04/09"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Hora Cita</label>
              <input
                type="text"
                value={horaCita}
                onChange={e => setHoraCita(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                placeholder="Ej: 4:30 PM"
              />
            </div>
          </div>
        </div>

        {/* ── BOTÓN DE DISPARO PRINCIPAL ── */}
        <button
          type="button"
          onClick={handleRun}
          disabled={running || !selectedBusinessId}
          className={`w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3.5 text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${
            modoEnvio === 'real'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
          }`}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Conectando con Evolution API & {salonActivo?.nombre}...</span>
            </>
          ) : (
            <>
              {modoEnvio === 'real' ? <Send className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>
                {modoEnvio === 'real'
                  ? `Disparar WhatsApp Real a ${telefonoTest || 'Destino'} desde ${salonActivo?.nombre || 'el salón'}`
                  : `Ejecutar Simulación de ${flujoActual.label}`}
              </span>
            </>
          )}
        </button>

        {/* ── RESULTADO: BURBUJA DE WHATSAPP REALISTA ── */}
        {result && (
          <div className={`rounded-3xl border p-4 sm:p-5 space-y-4 transition-all ${
            result.ok ? 'bg-slate-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {result.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                <p className={`text-xs font-black ${result.ok ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {result.ok
                    ? modoEnvio === 'real'
                      ? `¡Mensaje enviado a WhatsApp exitosamente!`
                      : 'Simulación completada con éxito'
                    : 'Error en la ejecución'}
                </p>
                {result.estado && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {result.estado}
                  </span>
                )}
              </div>

              {result.mensaje && (
                <button
                  type="button"
                  onClick={() => copyText(result.mensaje!)}
                  className="flex items-center gap-1 text-[11px] font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              )}
            </div>

            {/* Burbuja WhatsApp */}
            {result.mensaje && (
              <div className="bg-[#0b141a] rounded-2xl p-4 text-white shadow-inner">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-xs text-slate-300">
                  <span className="font-bold text-emerald-400">{salonActivo?.nombre}</span>
                  <span className="text-slate-500">➔ Destino: {result.telefono}</span>
                </div>
                <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-md ml-auto shadow-md">
                  <p className="whitespace-pre-wrap font-sans text-[12px]">{result.mensaje}</p>
                  <div className="text-[9px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                    <span>{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECCIÓN ESPECIAL: PROBAR TIEMPO 2 DE FIDELIZACIÓN ── */}
            {flujo.startsWith('fidelizacion') && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs font-black text-emerald-900">
                    Prueba del Tiempo 2: Respuesta de la Clienta (Puntos vs Queja)
                  </p>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  <strong>Opción Orgánica:</strong> Como tu número recibió el mensaje en WhatsApp, responde simplemente con un <code className="font-mono bg-white px-1.5 py-0.5 rounded font-bold border border-emerald-300">5</code> desde tu celular y el sistema te responderá automáticamente con los puntos y el premio.<br />
                  <strong>Opción Rápida:</strong> O haz clic en una de las calificaciones de abajo para simular la respuesta instantáneamente:
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={runningT2}
                    onClick={() => handleTriggerTiempo2('5')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-black text-emerald-900 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>5 Estrellas (Excelente + Puntos)</span>
                  </button>
                  <button
                    type="button"
                    disabled={runningT2}
                    onClick={() => handleTriggerTiempo2('4')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>4 Estrellas (Bueno)</span>
                  </button>
                  <button
                    type="button"
                    disabled={runningT2}
                    onClick={() => handleTriggerTiempo2('2')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-800 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>⚠️ 2 Estrellas (Queja + Pausa Bot)</span>
                  </button>
                </div>

                {/* Respuesta del Tiempo 2 */}
                {tiempo2Simulado && (
                  <div className="bg-[#0b141a] rounded-2xl p-4 text-white shadow-inner mt-2">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">
                      Respuesta del Sistema (Tiempo 2 — {tiempo2Simulado.tipo === 'queja' ? 'Atención a Queja' : 'Premio & Puntos'}):
                    </p>
                    <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-md ml-auto shadow-md">
                      <p className="whitespace-pre-wrap font-sans text-[12px]">{tiempo2Simulado.mensaje}</p>
                      <div className="text-[9px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                        <span>{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.error && (
              <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs text-rose-700 font-bold">
                ⚠️ {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutopilotTestRunner;
