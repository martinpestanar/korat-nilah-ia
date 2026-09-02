import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { triggerTestRun, type FlujoOrigen, type TestRunResult } from '../../services/autopilot';

const FLUJOS: { id: FlujoOrigen; label: string; emoji: string }[] = [
  { id: 'retencion',        label: 'Retención',        emoji: '🎯' },
  { id: 'recordatorio_24h', label: 'Recordatorio 24h',  emoji: '⏰' },
  { id: 'recordatorio_3h',  label: 'Recordatorio 3h',   emoji: '⚡' },
  { id: 'retoque',          label: 'Retoque',           emoji: '✂️' },
  { id: 'fidelizacion',     label: 'Fidelización',      emoji: '🎖️' },
];

interface Props { negocios?: { id: string; nombre: string }[] }

const AutopilotTestRunner: React.FC<Props> = ({ negocios = [] }) => {
  const [flujo, setFlujo]         = useState<FlujoOrigen>('retencion');
  const [businessId, setBusinessId] = useState('');
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState<TestRunResult | null>(null);
  const [copied, setCopied]       = useState(false);

  const run = async () => {
    setRunning(true);
    setResult(null);
    const res = await triggerTestRun({
      flujo,
      business_id: businessId || undefined,
    });
    setResult(res);
    setRunning(false);
  };

  const copy = () => {
    if (result?.mensaje) {
      navigator.clipboard.writeText(result.mensaje);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm font-sans text-slate-900">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-purple-600" />
        <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Test Run — Simulación Real</p>
        <span className="ml-auto text-[10px] font-bold text-slate-600 bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full">
          Gemini corre · WhatsApp NO envía
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Flujo a probar</label>
            <select
              value={flujo}
              onChange={e => setFlujo(e.target.value as FlujoOrigen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
            >
              {FLUJOS.map(f => (
                <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Salón (opcional)</label>
            <select
              value={businessId}
              onChange={e => setBusinessId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
            >
              <option value="">Primer salón disponible</option>
              {negocios.map(n => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={run}
          disabled={running}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-xs font-black transition-all shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
        >
          {running
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando flujo real con IA...</>
            : <><Play className="w-4 h-4" /> Lanzar Test de Simulación</>
          }
        </button>

        {running && (
          <p className="text-xs text-slate-500 text-center font-medium animate-pulse">
            El flujo de n8n está corriendo + Gemini generando mensaje...
          </p>
        )}

        {result && (
          <div className={`rounded-2xl border p-4 space-y-3 ${result.ok ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
            <div className="flex items-center gap-2">
              {result.ok
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                : <XCircle className="w-4 h-4 text-rose-600" />
              }
              <p className={`text-xs font-black ${result.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                {result.ok ? 'Mensaje generado correctamente por IA' : 'Error en el test'}
              </p>
              {result.ok && result.mensaje && (
                <button onClick={copy} className="ml-auto text-slate-500 hover:text-slate-900">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {result.mensaje && (
              <div className="bg-white border border-emerald-100 rounded-xl p-3 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                {result.mensaje}
              </div>
            )}
            {result.error && (
              <p className="text-xs text-rose-700 font-bold">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutopilotTestRunner;
