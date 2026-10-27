import React, { useState, useEffect } from 'react';
import { Sparkles, Save, CheckCircle2, RefreshCw, MessageSquare, HelpCircle, Gift } from 'lucide-react';
import { supabase } from '../../services/supabase';

export interface PackCopyItem {
  sello: number;
  etapa: string;
  descripcion: string;
  copy: string;
}

export const GodModePackCalificacionSellos: React.FC = () => {
  const [copys, setCopys] = useState<PackCopyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSello, setSelectedSello] = useState<number>(1);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar desde nilah_config
  const cargarCopys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nilah_config')
        .select('copys_calificacion_sellos')
        .limit(1)
        .single();

      if (error) throw error;
      if (data?.copys_calificacion_sellos && Array.isArray(data.copys_calificacion_sellos)) {
        setCopys(data.copys_calificacion_sellos);
      }
    } catch (e: any) {
      setErrorMsg('Error cargando copys: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCopys();
  }, []);

  const currentItem = copys.find(c => c.sello === selectedSello) || copys[0];

  const handleUpdateCurrentCopy = (newText: string) => {
    setCopys(prev => prev.map(item => item.sello === selectedSello ? { ...item, copy: newText } : item));
  };

  const handleGuardar = async () => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('nilah_config')
        .update({ copys_calificacion_sellos: copys, updated_at: new Date().toISOString() })
        .not('id', 'is', null);

      if (error) throw error;
      setSuccessMsg('✅ ¡Plantillas del Pack Calificación + Sellos guardadas y sincronizadas!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (e: any) {
      setErrorMsg('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 gap-2 font-medium">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
        Cargando plantillas del Pack Calificación + Sellos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Plantillas del Pack "Calificación + Sellos Club Glow" (1 al 12)
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Mensajes en <strong>Tiempo 2</strong> diseñados para responder inmediatamente después de que la clienta envía su calificación (4 o 5 ⭐).
              No repiten el nombre de la clienta, agradecen su puntuación y adaptan la dopamina según el hito alcanzado.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Guardando...' : 'Guardar Todo'}</span>
          </button>
        </div>

        {successMsg && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-100/90 px-3 py-2 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mt-3 text-xs text-rose-800 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Selector de sellos 1 a 12 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
        {copys.map((item) => {
          const isSelected = item.sello === selectedSello;
          const isPremio = [4, 8, 12].includes(item.sello);
          return (
            <button
              key={item.sello}
              type="button"
              onClick={() => setSelectedSello(item.sello)}
              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                  : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="text-xs font-black">Sello {item.sello}</div>
              <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                {isPremio ? '🎁 Premio' : item.sello === 2 ? '✨ Bienvenida' : 'Progreso'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor del sello seleccionado y preview */}
      {currentItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          {/* Columna Izquierda: Editor */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>{currentItem.etapa}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentItem.descripcion}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                <span>Copy de WhatsApp para este hito:</span>
                <span className="text-slate-400 font-normal">Variables: {'{premio_proximo}'}, {'{premio_1}'}, {'{codigo}'}, {'{link_tarjeta}'}</span>
              </label>
              <textarea
                rows={9}
                value={currentItem.copy}
                onChange={(e) => handleUpdateCurrentCopy(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-hidden text-slate-800 leading-relaxed"
              />
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-600">
              <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Regla de oro:</strong> Este mensaje se envía inmediatamente después de que la clienta calificó con 4 o 5 estrellas. Agradece la nota y resalta los sellos sumados y cuántos faltan para su premio.
              </div>
            </div>
          </div>

          {/* Columna Derecha: Vista previa en burbuja de WhatsApp */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs font-black text-slate-700">
                <span>📱 Vista previa WhatsApp</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Tiempo 2</span>
              </div>

              {/* Burbuja chat */}
              <div className="mt-4 bg-[#DCF8C6] text-slate-800 rounded-2xl p-3.5 text-xs shadow-xs space-y-2 border border-emerald-200/60 leading-relaxed whitespace-pre-wrap font-sans">
                {currentItem.copy
                  .replace(/\{salon\}/g, 'Glamour y Capricho')
                  .replace(/\{premio_1\}/g, 'Bono Consentida S/ 10')
                  .replace(/\{premio_proximo\}/g, 'Bono Consentida S/ 10')
                  .replace(/\{codigo\}/g, 'GLOW-7A9B2C')
                  .replace(/\{link_tarjeta\}/g, 'https://koratflow.agency/club/glamour-y-capricho?c=2249')}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4">
              Las etiquetas entre llaves se sustituyen automáticamente con los datos del salón en tiempo real.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModePackCalificacionSellos;
