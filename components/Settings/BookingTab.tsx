import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Save, Loader2, DollarSign, 
  Smartphone, CreditCard, Activity, Target, MessageSquare, AlertTriangle, Link as LinkIcon, Copy, Check
} from 'lucide-react';
import { negocios } from '../../services/api';
import { motion } from 'framer-motion';

export const BookingTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const businessId = localStorage.getItem('korat_business_id') || 'TU_ID';

  // Dinámico para que funcione en localhost y en koratflow.agency automáticamente
  const bookingUrl = `${window.location.origin}/reservar/${businessId}`;

  const [config, setConfig] = useState({
    booking_umbral_fiabilidad: 50,
    booking_monto_deposito: 20,
    booking_deposito_mensaje: '¡Excelente elección, [Nombre]! Tenemos el espacio reservado para ti por los próximos 5 minutos. Para confirmar, transfiere o yapea el monto de S/[Monto] (Garantía de asistencia).',
    booking_yape_numero: '',
    booking_plin_numero: '',
    booking_cuentas_bancarias: '',
    pts_ganados_completada: 10,
    pts_perdidos_noshow: -40,
    pts_perdidos_cancelado_temprano: 0,
    pts_perdidos_cancelado_tarde: -20,
    pts_perdidos_reagendado_tarde: -10,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await negocios.get();
      // data could be an array or an object
      const negocioInfo = Array.isArray(data) ? data[0] : data;
      
      if (negocioInfo) {
        setConfig(prev => ({
          ...prev,
          booking_umbral_fiabilidad: negocioInfo.booking_umbral_fiabilidad ?? 50,
          booking_monto_deposito: negocioInfo.booking_monto_deposito ?? 20,
          booking_deposito_mensaje: negocioInfo.booking_deposito_mensaje ?? prev.booking_deposito_mensaje,
          booking_yape_numero: negocioInfo.booking_yape_numero ?? '',
          booking_plin_numero: negocioInfo.booking_plin_numero ?? '',
          booking_cuentas_bancarias: negocioInfo.booking_cuentas_bancarias ?? '',
          pts_ganados_completada: negocioInfo.pts_ganados_completada ?? 10,
          pts_perdidos_noshow: negocioInfo.pts_perdidos_noshow ?? -40,
          pts_perdidos_cancelado_temprano: negocioInfo.pts_perdidos_cancelado_temprano ?? 0,
          pts_perdidos_cancelado_tarde: negocioInfo.pts_perdidos_cancelado_tarde ?? -20,
          pts_perdidos_reagendado_tarde: negocioInfo.pts_perdidos_reagendado_tarde ?? -10,
        }));
      }
    } catch (error) {
      console.error('Error al cargar configuración de reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof config, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      await negocios.updateBookingConfig({
        booking_umbral_fiabilidad: Number(config.booking_umbral_fiabilidad),
        booking_monto_deposito: Number(config.booking_monto_deposito),
        booking_deposito_mensaje: config.booking_deposito_mensaje,
        booking_yape_numero: config.booking_yape_numero,
        booking_plin_numero: config.booking_plin_numero,
        booking_cuentas_bancarias: config.booking_cuentas_bancarias,
        pts_ganados_completada: Number(config.pts_ganados_completada),
        pts_perdidos_noshow: Number(config.pts_perdidos_noshow),
        pts_perdidos_cancelado_temprano: Number(config.pts_perdidos_cancelado_temprano),
        pts_perdidos_cancelado_tarde: Number(config.pts_perdidos_cancelado_tarde),
        pts_perdidos_reagendado_tarde: Number(config.pts_perdidos_reagendado_tarde),
      });
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      alert('Error al guardar configuración');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de cambios sin guardar */}
      {hasChanges && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Tienes cambios sin guardar
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar Cambios
          </button>
        </div>
      )}

      {/* Introducción y Link */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-white p-6 shadow-sm dark:border-white/5 dark:from-[#1A1A1A] dark:to-[#141414]">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Escudo de Fiabilidad (Agenda Pública)</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Configura cómo el sistema califica a tus clientes y cuándo exigirles un depósito para agendar citas desde tu enlace público.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Tu Link de Reservas</span>
              <div className="flex items-center gap-2 bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-xl p-1.5 pl-3">
                <code className="text-xs text-violet-600 dark:text-violet-400 font-mono truncate max-w-[150px]">
                  {bookingUrl.replace('http://', '').replace('https://', '')}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECCIÓN: Escudo y Depósitos */}
        <div className="space-y-6">
          <motion.section className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1A1A1A] overflow-hidden">
            <div className="border-b border-gray-100 bg-rose-50/50 p-5 dark:border-white/5 dark:bg-rose-500/5">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <Target className="h-5 w-5 text-rose-500" /> Reglas del Escudo
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  Umbral de Fiabilidad
                  <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full dark:bg-rose-500/20 dark:text-rose-400">
                    &lt; {config.booking_umbral_fiabilidad} puntos
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 leading-tight mb-2">
                  Los clientes con un puntaje menor a este umbral deberán pagar un depósito obligatoriamente al agendar.
                </p>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={config.booking_umbral_fiabilidad}
                  onChange={(e) => handleChange('booking_umbral_fiabilidad', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-rose-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0 (Muy estricto)</span>
                  <span>100 (Todos pagan)</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monto del Depósito (S/)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={config.booking_monto_deposito}
                    onChange={(e) => handleChange('booking_monto_deposito', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mensaje de Solicitud de Depósito
                </label>
                <p className="text-[11px] text-gray-500 leading-tight mb-2">
                  Este mensaje aparecerá en el paso de confirmación. Puedes usar las variables <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">[Nombre]</code> y <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">[Monto]</code>.
                </p>
                <textarea
                  value={config.booking_deposito_mensaje}
                  onChange={(e) => handleChange('booking_deposito_mensaje', e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm resize-none dark:border-white/10 dark:bg-[#141414] dark:text-white"
                />
              </div>
            </div>
          </motion.section>

          <motion.section className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1A1A1A] overflow-hidden">
            <div className="border-b border-gray-100 bg-emerald-50/50 p-5 dark:border-white/5 dark:bg-emerald-500/5">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <CreditCard className="h-5 w-5 text-emerald-500" /> Cuentas de Recepción
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1.5">
                  <Smartphone className="h-4 w-4 text-purple-500" /> Número Yape
                </label>
                <input
                  type="text"
                  value={config.booking_yape_numero}
                  onChange={(e) => handleChange('booking_yape_numero', e.target.value)}
                  placeholder="Ej: 987654321 (Juan Pérez)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1.5">
                  <Smartphone className="h-4 w-4 text-cyan-500" /> Número Plin
                </label>
                <input
                  type="text"
                  value={config.booking_plin_numero}
                  onChange={(e) => handleChange('booking_plin_numero', e.target.value)}
                  placeholder="Ej: 987654321 (Juan Pérez)"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1.5">
                  <Activity className="h-4 w-4 text-emerald-500" /> Cuentas Bancarias
                </label>
                <textarea
                  value={config.booking_cuentas_bancarias}
                  onChange={(e) => handleChange('booking_cuentas_bancarias', e.target.value)}
                  rows={3}
                  placeholder="Ej: BCP: 191-12345678-0-12 (CCI: 00219112345678012)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm resize-none dark:border-white/10 dark:bg-[#141414] dark:text-white"
                />
              </div>
            </div>
          </motion.section>
        </div>

        {/* SECCIÓN: Sistema de Puntos */}
        <div className="space-y-6">
          <motion.section className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1A1A1A] overflow-hidden">
            <div className="border-b border-gray-100 bg-blue-50/50 p-5 dark:border-white/5 dark:bg-blue-500/5">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <Activity className="h-5 w-5 text-blue-500" /> Reglas de Puntuación
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Puntos sumados o restados automáticamente al cambiar el estado de una cita. Todos inician con 100 pts.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-500/10 dark:bg-emerald-500/5">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Cita Completada</p>
                  <p className="text-xs text-gray-500">Premio por asistencia responsable.</p>
                </div>
                <input
                  type="number"
                  value={config.pts_ganados_completada}
                  onChange={(e) => handleChange('pts_ganados_completada', e.target.value)}
                  className="w-20 text-center rounded-lg border border-emerald-200 bg-white py-1.5 text-sm font-bold text-emerald-600 dark:border-emerald-500/20 dark:bg-[#141414] dark:text-emerald-400"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-red-100 bg-red-50/50 dark:border-red-500/10 dark:bg-red-500/5">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">No-Show</p>
                  <p className="text-xs text-gray-500">Inasistencia sin avisar.</p>
                </div>
                <input
                  type="number"
                  value={config.pts_perdidos_noshow}
                  onChange={(e) => handleChange('pts_perdidos_noshow', e.target.value)}
                  className="w-20 text-center rounded-lg border border-red-200 bg-white py-1.5 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-[#141414] dark:text-red-400"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-orange-100 bg-orange-50/50 dark:border-orange-500/10 dark:bg-orange-500/5">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Cancelado (Tarde)</p>
                  <p className="text-xs text-gray-500">Menos de 24h de anticipación.</p>
                </div>
                <input
                  type="number"
                  value={config.pts_perdidos_cancelado_tarde}
                  onChange={(e) => handleChange('pts_perdidos_cancelado_tarde', e.target.value)}
                  className="w-20 text-center rounded-lg border border-orange-200 bg-white py-1.5 text-sm font-bold text-orange-600 dark:border-orange-500/20 dark:bg-[#141414] dark:text-orange-400"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-amber-100 bg-amber-50/50 dark:border-amber-500/10 dark:bg-amber-500/5">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Reagendado (Tarde)</p>
                  <p className="text-xs text-gray-500">Cambio de hora a última hora.</p>
                </div>
                <input
                  type="number"
                  value={config.pts_perdidos_reagendado_tarde}
                  onChange={(e) => handleChange('pts_perdidos_reagendado_tarde', e.target.value)}
                  className="w-20 text-center rounded-lg border border-amber-200 bg-white py-1.5 text-sm font-bold text-amber-600 dark:border-amber-500/20 dark:bg-[#141414] dark:text-amber-400"
                />
              </div>

              <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-200 bg-gray-50/50 dark:border-white/10 dark:bg-[#141414]/50">
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">Cancelado (Con tiempo)</p>
                  <p className="text-xs text-gray-500">Avisó a tiempo.</p>
                </div>
                <input
                  type="number"
                  value={config.pts_perdidos_cancelado_temprano}
                  onChange={(e) => handleChange('pts_perdidos_cancelado_temprano', e.target.value)}
                  className="w-20 text-center rounded-lg border border-gray-300 bg-white py-1.5 text-sm font-bold text-gray-600 dark:border-white/20 dark:bg-[#1A1A1A] dark:text-gray-400"
                />
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};
