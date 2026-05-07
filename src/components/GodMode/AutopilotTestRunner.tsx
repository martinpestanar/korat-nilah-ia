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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-purple-400" />
        <p className="text-sm font-semibold text-white">Test Run — Simulación Real</p>
        <span className="ml-auto text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          Gemini corre · WhatsApp NO envía
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Flujo a probar</label>
            <select
              value={flujo}
              onChange={e => setFlujo(e.target.value as FlujoOrigen)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              {FLUJOS.map(f => (
                <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Salón (opcional)</label>
            <select
              value={businessId}
              onChange={e => setBusinessId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
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
          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition-all"
        >
          {running
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Ejecutando flujo real...</>
            : <><Play className="w-4 h-4" /> Lanzar Test</>
          }
        </button>

        {running && (
          <p className="text-xs text-zinc-500 text-center animate-pulse">
            El flujo de n8n está corriendo + Gemini generando mensaje...
          </p>
        )}

        {result && (
          <div className={`rounded-xl border p-4 space-y-3 ${result.ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="flex items-center gap-2">
              {result.ok
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-red-400" />
              }
              <p className={`text-sm font-medium ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.ok ? '✅ Mensaje generado correctamente' : '❌ Error en el test'}
              </p>
              {result.ok && result.mensaje && (
                <button onClick={copy} className="ml-auto text-zinc-500 hover:text-white">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            {result.mensaje && (
              <div className="bg-zinc-800/60 rounded-lg p-3 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {result.mensaje}
              </div>
            )}
            {result.error && (
              <p className="text-xs text-red-400">{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutopilotTestRunner;
