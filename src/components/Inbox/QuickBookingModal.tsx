import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { crm, appointments } from '../../services/api';

interface QuickBookingModalProps {
  businessId: string;
  clienteId: string;
  clienteNombre: string;
  fiabilidadScore?: number;
  onClose: () => void;
  onSuccess: (citaResult?: any) => void;
}

const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  businessId,
  clienteId,
  clienteNombre,
  fiabilidadScore,
  onClose,
  onSuccess
}) => {
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [requiereDeposito, setRequiereDeposito] = useState(fiabilidadScore !== undefined && fiabilidadScore < 50);
  const [depositoVerificado, setDepositoVerificado] = useState(false);

  useEffect(() => {
    const fetchServicios = async () => {
      setLoading(true);
      try {
        const data = await crm.getServices();
        setServicios(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !fecha || !hora) return;

    setSaving(true);
    try {
      const servicioObj = servicios.find(s => s.id?.toString() === selectedService || s.nombre === selectedService);
      const nombreServicio = servicioObj ? servicioObj.nombre : selectedService;
      const precioServicio = servicioObj ? servicioObj.precio : 0;
      const duracionMin = servicioObj?.duracion_min || 60;

      const fechaHoraISO = `${fecha}T${hora}:00`;

      const result = await appointments.create({
        cliente_id: clienteId,
        client_name: clienteNombre,
        servicio: nombreServicio,
        fecha: fechaHoraISO,
        duracion_min: duracionMin,
        precio: precioServicio,
        requiere_deposito: requiereDeposito,
        monto_deposito: requiereDeposito ? (precioServicio * 0.5) : 0 // asumimos 50% anticipo por defecto
      });

      // Si se verificó manualmente en la misma operación, actualizamos el deposito (como shortcut)
      if (requiereDeposito && depositoVerificado && result?.id) {
         await appointments.verifyDeposit(result.id);
         result.deposito_verificado = true;
      }

      onSuccess(result);
    } catch (err) {
      alert('Error al agendar cita: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#1A1825] border border-gray-100 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <CalendarIcon size={16} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Cita Express</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {fiabilidadScore !== undefined && fiabilidadScore < 50 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <strong className="block font-bold">Cliente con bajo score ({fiabilidadScore}/100)</strong>
                <span>Historial de plantones. Se activó el requisito de depósito previo automáticamente.</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente</label>
            <div className="text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 p-2.5 rounded-lg flex items-center justify-between">
              <span>{clienteNombre}</span>
              {fiabilidadScore !== undefined && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  fiabilidadScore < 50 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
                  fiabilidadScore < 80 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}>
                  {fiabilidadScore} pts
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Servicio</label>
            <select
              required
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block p-2.5"
            >
              <option value="">Seleccionar servicio...</option>
              {servicios.map(s => (
                <option key={s.id} value={s.id}>{s.nombre} - S/{s.precio}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block p-2.5"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hora</label>
              <input
                type="time"
                required
                value={hora}
                onChange={e => setHora(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block p-2.5"
              />
            </div>
          </div>

          {/* Deposito Settings */}
          <div className="bg-gray-50 dark:bg-[#2A2640]/50 rounded-xl p-3 border border-gray-100 dark:border-white/5 space-y-3">
             <label className="flex items-center gap-2 cursor-pointer">
                <input
                   type="checkbox"
                   checked={requiereDeposito}
                   onChange={e => {
                      setRequiereDeposito(e.target.checked);
                      if (!e.target.checked) setDepositoVerificado(false);
                   }}
                   className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500 dark:focus:ring-violet-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                   Requerir depósito previo
                </span>
             </label>

             {requiereDeposito && (
                <label className={`flex items-center gap-2 cursor-pointer pl-6 transition-opacity ${depositoVerificado ? 'opacity-100' : 'opacity-70'}`}>
                   <input
                      type="checkbox"
                      checked={depositoVerificado}
                      onChange={e => setDepositoVerificado(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                   />
                   <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Marcar como ya verificado
                   </span>
                </label>
             )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl py-2.5 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {saving ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                'Confirmar y Agendar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickBookingModal;
