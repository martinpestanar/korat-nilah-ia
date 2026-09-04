import React, { useState } from 'react';
import {
  FlaskConical, Play, CheckCircle2, XCircle, Loader2,
  Copy, Check, Send, Smartphone, ShieldCheck, Sparkles,
  AlertTriangle, ExternalLink, RefreshCw
} from 'lucide-react';
import { triggerTestRun, type FlujoOrigen, type TestRunResult } from '../../services/autopilot';

const FLUJOS_TEST: { id: string; label: string; emoji: string; desc: string }[] = [
  { id: 'recordatorio_24h', label: 'Recordatorio 24h', emoji: '⏰', desc: 'Confirmación interactiva y liberación de huecos' },
  { id: 'recordatorio_3h',  label: 'Recordatorio 3h',  emoji: '⚡', desc: 'Aviso final con ubicación y puntualidad' },
  { id: 'retoque',          label: 'Retoque (18-24d)', emoji: '💅', desc: 'Invitación a mantenimiento según servicio' },
  { id: 'rescate_45d',      label: 'Rescate 45d',      emoji: '🌸', desc: 'Reactivación temprana con tono cálido' },
  { id: 'rescate_75d',      label: 'Rescate 75d',      emoji: '🎁', desc: 'Reactivación con incentivo o extra spa' },
  { id: 'rescate_120d',     label: 'Rescate 120d',     emoji: '⚡', desc: 'Última oportunidad con beneficio exclusivo' },
  { id: 'fidelizacion',     label: 'Calificación CSAT',emoji: '⭐', desc: 'Encuesta 1 a 5 estrellas post-cita + puntos' },
  { id: 'cuidados_24h',     label: 'Cuidados Post 24h',emoji: '✨', desc: 'Tip preventivo temprano para blindar el servicio' },
];

interface Props {
  negocios?: { id: string; nombre: string }[];
}

export const AutopilotTestRunner: React.FC<Props> = ({ negocios = [] }) => {
  const [flujo, setFlujo] = useState<string>('recordatorio_24h');
  const [businessId, setBusinessId] = useState('');
  const [telefonoTest, setTelefonoTest] = useState('');
  const [modoEnvio, setModoEnvio] = useState<'simulacion' | 'real'>('simulacion');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TestRunResult | null>(null);
  const [copied, setCopied] = useState(false);

  const flujoActual = FLUJOS_TEST.find(f => f.id === flujo) || FLUJOS_TEST[0];

  const handleRun = async () => {
    setRunning(true);
    setResult(null);

    const res = await triggerTestRun({
      flujo,
      business_id: businessId || undefined,
      telefono_prueba: telefonoTest.trim() || undefined,
      modo_simulacion: modoEnvio === 'simulacion',
    });

    setResult(res);
    setRunning(false);
  };

  const copyText = () => {
    if (result?.mensaje) {
      navigator.clipboard.writeText(result.mensaje);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl font-sans text-slate-900 transition-all">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Simulador Multisalón & Disparador de Test
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Prueba individual de flujos de n8n con IA Gemini sin alterar métricas del cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white border border-purple-200/70 rounded-full p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setModoEnvio('simulacion')}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
              modoEnvio === 'simulacion'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            🧪 Solo Simulación (IA)
          </button>
          <button
            type="button"
            onClick={() => setModoEnvio('real')}
            className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${
              modoEnvio === 'real'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            📱 Enviar a WhatsApp Real
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* ── Controles Principales ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Selector de Flujo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Flujo de Automatización</span>
              <span className="text-[10px] text-purple-600 font-semibold">{flujoActual.desc}</span>
            </label>
            <select
              value={flujo}
              onChange={e => setFlujo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
            >
              {FLUJOS_TEST.map(f => (
                <option key={f.id} value={f.id}>
                  {f.emoji} {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Salón */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Salón Tenant (Contexto de Negocio)
            </label>
            <select
              value={businessId}
              onChange={e => setBusinessId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
            >
              <option value="">🏢 Primer salón con datos activos</option>
              {negocios.map(n => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input condicional: Teléfono Real de Test */}
        {modoEnvio === 'real' && (
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <p className="text-xs font-black text-emerald-900">
                Número de WhatsApp para la prueba real
              </p>
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Ingresa el número con código de país (ej: <code className="font-mono font-bold">+51987654321</code>). Se enviará el mensaje real generado por Nilah a este número para que verifiques cómo se ve en el celular.
            </p>
            <input
              type="tel"
              value={telefonoTest}
              onChange={e => setTelefonoTest(e.target.value)}
              placeholder="+51 999 999 999"
              className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Banner Informativo de Modo */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold text-slate-800">
              {modoEnvio === 'simulacion' ? 'Modo Simulación Seguro:' : 'Modo Disparo Real:'}
            </span>{' '}
            {modoEnvio === 'simulacion'
              ? 'El webhook de n8n procesa la lógica, Gemini 2.5 genera el copy personalizado con variables y se crea el log como prueba sin gastar saldo ni molestar a clientas.'
              : 'Se conectará con la API de WhatsApp de n8n para entregar el mensaje instantáneamente en el chat del teléfono especificado.'}
          </div>
        </div>

        {/* Botón de Ejecución Mobile-First */}
        <button
          onClick={handleRun}
          disabled={running}
          className={`w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3 text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 ${
            modoEnvio === 'simulacion'
              ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
          }`}
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Conectando con n8n & Gemini IA...</span>
            </>
          ) : (
            <>
              {modoEnvio === 'simulacion' ? <Play className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>
                {modoEnvio === 'simulacion' ? 'Disparar Simulación de Flujo' : 'Enviar WhatsApp de Prueba Ahora'}
              </span>
            </>
          )}
        </button>

        {/* ── Resultado / Visualizador WhatsApp Mockup ── */}
        {result && (
          <div className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all ${
            result.ok ? 'bg-slate-50 border-emerald-200/90' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {result.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className={`text-xs font-black ${result.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {result.ok
                    ? modoEnvio === 'simulacion'
                      ? 'Simulación Exitosa — Payload Generado'
                      : '¡WhatsApp Enviado Exitosamente!'
                    : 'Error en la Ejecución'}
                </span>
                {result.estado && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {result.estado}
                  </span>
                )}
              </div>

              {result.ok && result.mensaje && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    onClick={copyText}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simulación en Burbuja de WhatsApp */}
            {result.mensaje && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mensaje Renderizado por Nilah:
                </p>
                <div className="bg-[#0b141a] rounded-2xl p-4 text-white shadow-inner">
                  <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-md ml-auto shadow-md">
                    <p className="whitespace-pre-wrap font-sans text-[12px]">{result.mensaje}</p>
                    <div className="text-[9px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata técnica */}
            {result.ok && (
              <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 flex-wrap">
                {result.log_id && (
                  <span>
                    Log Supabase ID: <strong className="font-mono text-slate-700">#{result.log_id}</strong>
                  </span>
                )}
                {result.telefono && (
                  <span>
                    Destino: <strong className="font-mono text-slate-700">{result.telefono}</strong>
                  </span>
                )}
                {result.execution_id && (
                  <span className="flex items-center gap-1 text-purple-600 font-bold">
                    <span>n8n Exec: {result.execution_id}</span>
                  </span>
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
