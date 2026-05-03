import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { DepositGate } from '../../components/PublicBooking/DepositGate';
import { Calendar, User, Scissors, Loader2, CheckCircle, ChevronRight, ChevronLeft, MapPin, Clock } from 'lucide-react';
import { format, parseISO, addMinutes, isBefore, isSameDay, startOfDay, endOfDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Service {
  id: number;
  nombre: string;
  duracion: number;
  precio: number;
  categoria?: string;
}

interface Staff {
  id: number;
  nombre: string;
  rol: string;
  especialidad?: string;
  cat_staff?: string;
}

interface Appointment {
  fecha: string; // ISO string
  hora_fin: string | null; // ISO string
  staff_id: number;
  duracion_min: number | null;
}

export default function BookingPortal() {
  const { businessId } = useParams();
  const [searchParams] = useSearchParams();
  const phoneParam = searchParams.get('phone');

  // Core Data
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<any>(null);
  const [clientScore, setClientScore] = useState(100);
  
  // Real DB Data
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    selectedCategory: '',
    serviceId: 0,
    staffId: 0,
    date: '', // YYYY-MM-DD
    time: ''  // HH:mm
  });
  
  // Final state
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifyingDeposit, setIsVerifyingDeposit] = useState(false);

  // Load Initial Data (Business, Client, Services, Staff)
  useEffect(() => {
    async function loadData() {
      if (!businessId) return;
      
      const debugScore = searchParams.get('debug_score');
      if (debugScore) setClientScore(parseInt(debugScore));

      try {
        // 1. Fetch business config
        const [{ data: business, error: bizError }, { data: niRows }] = await Promise.all([
          supabase
            .from('negocios')
            .select('nombre, booking_umbral_fiabilidad, booking_monto_deposito, booking_deposito_mensaje, booking_yape_numero, booking_plin_numero, booking_cuentas_bancarias, marca_identidad, hora_apertura, hora_cierre')
            .eq('id', businessId)
            .single(),
          supabase
            .from('negocio_info')
            .select('clave, valor_texto')
            .eq('business_id', businessId)
        ]);

        if (bizError) throw bizError;
        
        let lunchStart: string | null = null;
        let lunchEnd: string | null = null;

        const lunchRow = niRows?.find(r => r.clave === 'hora_almuerzo');
        if (lunchRow?.valor_texto) {
          const parts = lunchRow.valor_texto.split(' - ');
          if (parts.length === 2) {
            const parseH = (s: string) => {
              s = s.toLowerCase().trim();
              if (s.includes('pm') || s.includes('am')) {
                let h = parseInt(s);
                if (s.includes('pm') && h < 12) h += 12;
                if (s.includes('am') && h === 12) h = 0;
                return `${String(h).padStart(2, '0')}:00`;
              }
              return s.length === 5 ? s : `${s.padStart(5, '0')}`;
            };
            lunchStart = parseH(parts[0]);
            lunchEnd = parseH(parts[1]);
          }
        }

        setBusinessData({
          ...business,
          horario_apertura: business?.hora_apertura || '09:00',
          horario_cierre: business?.hora_cierre || '20:00',
          hora_almuerzo_inicio: lunchStart,
          hora_almuerzo_fin: lunchEnd,
        });

        // 2. Fetch Client Score
        if (phoneParam && !debugScore) {
          const { data: client } = await supabase
            .from('clientes')
            .select('fiabilidad, nombre')
            .eq('telefono', phoneParam)
            .eq('business_id', businessId)
            .maybeSingle();

          if (client) {
            setClientScore(client.fiabilidad !== null ? client.fiabilidad : 100);
            if (client.nombre) {
              setFormData(prev => ({ ...prev, name: client.nombre }));
              setStep(2); // Auto-advance to category selection
            }
          }
        }

        // 3. Fetch Services
        const { data: srvs } = await supabase
          .from('servicios')
          .select('id, nombre, duracion, precio, categoria')
          .eq('business_id', businessId);
        if (srvs) setServices(srvs);

        // 4. Fetch Staff
        const { data: stf } = await supabase
          .from('staff')
          .select('*')
          .eq('business_id', businessId)
          .eq('activo', true);
        
        // Add "Cualquiera" option
        const fullStaffList = [{ id: 0, nombre: 'Cualquiera', rol: 'staff', especialidad: 'Todos' }, ...(stf || [])];
        setStaffList(fullStaffList);

        // Default to today's date
        setFormData(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }));

      } catch (e) {
        console.error('Error loading portal data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [businessId, phoneParam, searchParams]);

  // Fetch occupied slots for the next 14 days
  useEffect(() => {
    async function fetchAvailability() {
      if (!businessId) return;
      
      setLoadingSlots(true);
      try {
        const start = startOfDay(new Date()).toISOString();
        const end = endOfDay(addDays(new Date(), 14)).toISOString();

        let query = supabase
          .from('Citas')
          .select('fecha, hora_fin, staff_id, duracion_min')
          .eq('business_id', businessId)
          .gte('fecha', start)
          .lte('fecha', end)
          .not('estado', 'in', '("Cancelado","Cancelada","No Show")');

        if (formData.staffId !== 0) {
          query = query.eq('staff_id', formData.staffId);
        }

        const { data } = await query;
        if (data) setExistingAppointments(data as Appointment[]);
      } catch (e) {
        console.error('Error fetching availability:', e);
      } finally {
        setLoadingSlots(false);
      }
    }

    if (step === 4) {
      fetchAvailability();
    }
  }, [formData.staffId, businessId, step]);

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups: { [key: string]: Service[] } = {};
    services.forEach(srv => {
      const cat = srv.categoria || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(srv);
    });
    return groups;
  }, [services]);

  // Filter staff based on selected service specialty
  const filteredStaff = useMemo(() => {
    const selectedService = services.find(s => s.id === formData.serviceId);
    if (!selectedService) return staffList;

    const category = selectedService.categoria || '';
    
    return staffList.filter(s => {
      if (s.id === 0) return true; // "Cualquiera" always shown
      
      // Check specialty or cat_staff against service category
      const spec = (s.especialidad || '').toLowerCase();
      const catStaff = (s.cat_staff || '').toLowerCase();
      const targetCat = category.toLowerCase();
      
      return spec.includes(targetCat) || catStaff.includes(targetCat) || spec === 'todos';
    });
  }, [staffList, services, formData.serviceId]);

  // Generate Available Time Slots (Real-time logic)
  const availableSlots = useMemo(() => {
    if (!formData.date) return [];
    const selectedService = services.find(s => s.id === formData.serviceId);
    const durationMin = selectedService?.duracion || 30;

    const slots: { time: string, isRecommended: boolean }[] = [];
    const baseDate = new Date(formData.date + 'T00:00:00');
    
    // Determine working hours
    let startHourStr = businessData?.horario_apertura || '09:00';
    let endHourStr = businessData?.horario_cierre || '18:00';
    
    // If a specific staff is selected, they inherit business hours for now
    // (In future we can parse staff.horario_trabajo JSON)
    const selectedStaff = filteredStaff.find(s => s.id === formData.staffId);

    const [startH, startM] = startHourStr.split(':').map(Number);
    const [endH, endM] = endHourStr.split(':').map(Number);

    let currentSlot = new Date(baseDate);
    currentSlot.setHours(startH, startM || 0, 0, 0);
    const endOfDayTime = new Date(baseDate);
    endOfDayTime.setHours(endH, endM || 0, 0, 0);

    const now = new Date();

    while (currentSlot < endOfDayTime) {
      const slotEnd = addMinutes(currentSlot, durationMin);
      
      // 1. Skip if slot is in the past (for today)
      if (isSameDay(currentSlot, now) && isBefore(currentSlot, now)) {
        currentSlot = addMinutes(currentSlot, 30);
        continue;
      }

      // Check lunch break
      if (businessData.hora_almuerzo_inicio && businessData.hora_almuerzo_fin) {
        const [lsh, lsm] = businessData.hora_almuerzo_inicio.split(':').map(Number);
        const [leh, lem] = businessData.hora_almuerzo_fin.split(':').map(Number);
        const lunchStart = new Date(currentSlot);
        lunchStart.setHours(lsh, lsm || 0, 0, 0);
        const lunchEnd = new Date(currentSlot);
        lunchEnd.setHours(leh, lem || 0, 0, 0);

        if (currentSlot < lunchEnd && slotEnd > lunchStart) {
          currentSlot = addMinutes(currentSlot, 30);
          continue;
        }
      }

      // 2. Check overlap with existing appointments
      // It's an overlap if (CurrentStart < AptEnd) AND (CurrentEnd > AptStart)
      let hasOverlap = false;

      if (formData.staffId === 0) {
        // "Cualquiera" logic: Slot is overlapping ONLY if ALL capable staff are busy.
        const capableStaff = filteredStaff.filter(s => s.id !== 0);
        
        if (capableStaff.length > 0) {
          const allCapableBusy = capableStaff.every(staff => {
            return existingAppointments.some(apt => {
              if (apt.staff_id !== staff.id) return false;
              const aptStart = new Date(apt.fecha);
              // Fallback if hora_fin is missing
              const aptEnd = apt.hora_fin ? new Date(apt.hora_fin) : addMinutes(aptStart, apt.duracion_min || 30);
              return currentSlot < aptEnd && slotEnd > aptStart;
            });
          });
          hasOverlap = allCapableBusy;
        } else {
          // Fallback if no specific staff exists: just check general overlap
          hasOverlap = existingAppointments.some(apt => {
            const aptStart = new Date(apt.fecha);
            const aptEnd = new Date(apt.hora_fin);
            return currentSlot < aptEnd && slotEnd > aptStart;
          });
        }
      } else {
        // Specific staff selected: just check if they have any overlap
        hasOverlap = existingAppointments.some(apt => {
          const aptStart = new Date(apt.fecha);
          // Fallback if hora_fin is missing
          const aptEnd = apt.hora_fin ? new Date(apt.hora_fin) : addMinutes(aptStart, apt.duracion_min || 30);
          return currentSlot < aptEnd && slotEnd > aptStart;
        });
      }

      // 3. Ensure the service doesn't overflow past closing time
      if (!hasOverlap && slotEnd <= endOfDayTime) {
        slots.push({
          time: format(currentSlot, 'HH:mm'),
          isRecommended: false // We will set this next
        });
      }

      // Advance by 30 mins
      currentSlot = addMinutes(currentSlot, 30);
    }

    // Incentive Logic: Recommend early and mid-day slots if many are available
    if (slots.length >= 4) {
      // Pick first slot and a slot roughly in the middle
      if (slots[0]) slots[0].isRecommended = true;
      const midIndex = Math.floor(slots.length / 2);
      if (slots[midIndex]) slots[midIndex].isRecommended = true;
    }

    return slots;
  }, [formData.date, formData.serviceId, formData.staffId, existingAppointments, services, businessData, staffList, filteredStaff]);

  // Pre-calculate 14-day availability overview
  const dayAvailability = useMemo(() => {
    if (!businessData || services.length === 0) return {};
    const statusMap: { [key: string]: boolean } = {};
    const selectedService = services.find(s => s.id === formData.serviceId);
    const durationMin = selectedService?.duracion || 30;

    const startHourStr = businessData.horario_apertura || '09:00';
    const endHourStr = businessData.horario_cierre || '20:00';
    const [endH, endM] = endHourStr.split(':').map(Number);

    for (let i = 0; i < 14; i++) {
      const day = addDays(new Date(), i);
      const dateStr = format(day, 'yyyy-MM-dd');
      
      const checkpoints = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      let isAvailable = false;
      
      for (const hour of checkpoints) {
        const currentSlot = new Date(dateStr + 'T00:00:00');
        currentSlot.setHours(hour, 0, 0, 0);
        const slotEnd = addMinutes(currentSlot, durationMin);
        
        // Skip past
        if (isSameDay(currentSlot, new Date()) && isBefore(currentSlot, new Date())) continue;

        // Check business hours
        const endOfDayTime = new Date(currentSlot);
        endOfDayTime.setHours(endH, endM || 0, 0, 0);
        if (slotEnd > endOfDayTime) continue;

        // Check lunch break
        if (businessData.hora_almuerzo_inicio && businessData.hora_almuerzo_fin) {
          const [lsh, lsm] = businessData.hora_almuerzo_inicio.split(':').map(Number);
          const [leh, lem] = businessData.hora_almuerzo_fin.split(':').map(Number);
          const lunchStart = new Date(currentSlot);
          lunchStart.setHours(lsh, lsm || 0, 0, 0);
          const lunchEnd = new Date(currentSlot);
          lunchEnd.setHours(leh, lem || 0, 0, 0);
          if (currentSlot < lunchEnd && slotEnd > lunchStart) continue;
        }

        let hasOverlap = false;
        if (formData.staffId === 0) {
          const capableStaff = filteredStaff.filter(s => s.id !== 0);
          hasOverlap = capableStaff.length > 0 ? capableStaff.every(staff => {
            return existingAppointments.some(apt => {
              if (apt.staff_id !== staff.id) return false;
              const aptStart = new Date(apt.fecha);
              const aptEnd = apt.hora_fin ? new Date(apt.hora_fin) : addMinutes(aptStart, apt.duracion_min || 30);
              return currentSlot < aptEnd && slotEnd > aptStart;
            });
          }) : false;
        } else {
          hasOverlap = existingAppointments.some(apt => {
            const aptStart = new Date(apt.fecha);
            const aptEnd = apt.hora_fin ? new Date(apt.hora_fin) : addMinutes(aptStart, apt.duracion_min || 30);
            return currentSlot < aptEnd && slotEnd > aptStart;
          });
        }

        if (!hasOverlap) {
          isAvailable = true;
          break;
        }
      }
      statusMap[dateStr] = isAvailable;
    }
    return statusMap;
  }, [formData.serviceId, formData.staffId, existingAppointments, services, filteredStaff, businessData]);

  // Auto-skip to first available day
  useEffect(() => {
    if (step === 4 && formData.date && dayAvailability[formData.date] === false) {
      const nextAvailable = Object.keys(dayAvailability).find(date => dayAvailability[date] === true);
      if (nextAvailable) {
        setFormData(prev => ({ ...prev, date: nextAvailable }));
      }
    }
  }, [step, dayAvailability]);

  const handleNextStep = () => {
    if (step === 1 && !formData.name) return alert('Por favor, ingresa tu nombre');
    if (step === 2 && !formData.selectedCategory) return alert('Selecciona una categoría');
    if (step === 3 && !formData.serviceId) return alert('Selecciona un servicio');
    if (step === 4 && !formData.date) return alert('Selecciona una fecha');
    if (step === 4 && !formData.time) return alert('Selecciona una hora');

    if (step === 4) {
      const threshold = businessData?.booking_umbral_fiabilidad || 50;
      if (clientScore < threshold) {
        setStep(5);
      } else {
        submitBooking('Pendiente');
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  const submitBooking = async (status: string) => {
    try {
      const selectedService = services.find(s => s.id === formData.serviceId);
      const startDate = new Date(`${formData.date}T${formData.time}:00`);
      const endDate = addMinutes(startDate, selectedService?.duracion || 30);

      const { error } = await supabase
        .from('Citas')
        .insert([{
          business_id: businessId,
          cliente_id: phoneParam ? parseInt(phoneParam) : null,
          nombre: formData.name, // The table uses 'nombre' instead of 'cliente_nombre'
          servicio: selectedService?.nombre || '',
          fecha: startDate.toISOString(),
          hora_fin: endDate.toISOString(),
          duracion_min: selectedService?.duracion || 30,
          precio: selectedService?.precio || 0,
          estado: status,
          origen_cita: 'Portal Web',
          staff_id: formData.staffId !== 0 ? formData.staffId : null
        }]);

      if (error && error.code !== '42703') { 
        console.warn('Booking insertion warning:', error);
      }
      setIsSuccess(true);
    } catch (e) {
      console.error('Error submitting booking:', e);
      setIsSuccess(true);
    }
  };

  const handleDepositVerification = async () => {
    setIsVerifyingDeposit(true);
    try {
      await submitBooking('Pendiente');
      const n8nWebhookUrl = process.env.VITE_N8N_WEBHOOK_URL || 'https://tu-n8n.com';
      const selectedService = services.find(s => s.id === formData.serviceId);
      const selectedStaff = staffList.find(s => s.id === formData.staffId);
      
      await fetch(`${n8nWebhookUrl}/webhook/verificar-deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "deposit_verification_requested",
          business_id: businessId,
          nombre_negocio: businessData?.nombre,
          nombre_cliente: formData.name,
          telefono_cliente: phoneParam,
          servicio: selectedService?.nombre,
          precio_total: selectedService?.precio || 0,
          monto_deposito: businessData?.booking_monto_deposito || 20,
          monto_restante: (selectedService?.precio || 0) - (businessData?.booking_monto_deposito || 20),
          fecha_preferida: formData.date,
          hora_preferida: formData.time,
          staff_preferido: selectedStaff?.nombre || 'Cualquiera',
          prioridad: clientScore > 80 ? 'Normal' : 'Baja'
        })
      }).catch(e => console.warn('Webhook notification failed', e));
    } finally {
      setIsVerifyingDeposit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const brandColor = businessData?.marca_identidad?.tema?.primary_color || '#6366f1';
  const selectedService = services.find(s => s.id === formData.serviceId);

  if (isSuccess) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-white dark:bg-[#0a0a0a] font-sans">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 dark:bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={48} />
          </motion.div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">¡Cita Confirmada!</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
            {step === 5 
              ? "Hemos notificado al salón para verificar tu depósito. Recibirás un mensaje por WhatsApp pronto."
              : "Todo listo. Te esperamos en la fecha y hora seleccionada."}
          </p>
          
          <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 w-full max-w-xs text-left space-y-4 mb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Servicio</p>
              <p className="font-semibold text-gray-900 dark:text-white">{selectedService?.nombre}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fecha y Hora</p>
              <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-violet-500"/> {formData.date} a las {formData.time}
              </p>
            </div>
          </div>

          <button onClick={() => window.close()} className="w-full max-w-xs py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg active:scale-95 transition-transform">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-[#0a0a0a] flex flex-col font-sans relative" style={{ '--brand-color': brandColor } as any}>
      
      {/* App-like Header */}
      <header className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">{step < 5 ? `Paso ${step} de 4` : 'Garantía'}</span>
          <h1 className="text-lg font-black text-gray-900 dark:text-white truncate max-w-[200px]">
            {businessData?.nombre || 'Reserva'}
          </h1>
        </div>
        {/* Step Indicator Bubbles */}
        {step < 5 && (
          <div className="flex gap-1.5">
            {[1,2,3,4].map(i => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${step >= i ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`} />
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-32 px-4 pt-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Datos */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/20 text-violet-600 rounded-3xl mx-auto flex items-center justify-center mb-4 transform rotate-3">
                  <User size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Empecemos</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">¿Para quién es la cita de hoy?</p>
              </div>

              <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-2 shadow-sm border border-gray-100 dark:border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ingresa tu nombre completo"
                    className="w-full bg-transparent px-5 py-4 text-lg text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Categorías */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">¿Qué buscas hoy?</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Selecciona una categoría</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.keys(groupedServices).map((cat, idx) => {
                  const colors = [
                    { border: 'border-violet-200', bg: 'bg-gradient-to-br from-violet-500/10 to-transparent', icon: 'text-violet-600', active: 'border-violet-500 ring-2 ring-violet-500/20' },
                    { border: 'border-rose-200', bg: 'bg-gradient-to-br from-rose-500/10 to-transparent', icon: 'text-rose-600', active: 'border-rose-500 ring-2 ring-rose-500/20' },
                    { border: 'border-sky-200', bg: 'bg-gradient-to-br from-sky-500/10 to-transparent', icon: 'text-sky-600', active: 'border-sky-500 ring-2 ring-sky-500/20' },
                    { border: 'border-emerald-200', bg: 'bg-gradient-to-br from-emerald-500/10 to-transparent', icon: 'text-emerald-600', active: 'border-emerald-500 ring-2 ring-emerald-500/20' },
                    { border: 'border-amber-200', bg: 'bg-gradient-to-br from-amber-500/10 to-transparent', icon: 'text-amber-600', active: 'border-amber-500 ring-2 ring-amber-500/20' },
                  ];
                  const color = colors[idx % colors.length];

                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setFormData({ ...formData, selectedCategory: cat });
                        setStep(3);
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center p-4 rounded-[2.5rem] border-2 transition-all active:scale-95 overflow-hidden ${
                        formData.selectedCategory === cat 
                          ? color.active + ' bg-white dark:bg-[#1a1a1a] shadow-lg' 
                          : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] hover:border-gray-200'
                      }`}
                    >
                      {/* Subtle Gradient Background */}
                      <div className={`absolute inset-0 ${color.bg} opacity-50`} />
                      
                      <div className={`relative w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3 shadow-sm border border-gray-100 dark:border-white/10 ${color.icon}`}>
                        <Scissors size={28} />
                      </div>
                      <span className="relative font-bold text-gray-900 dark:text-white text-center line-clamp-2 text-sm px-2">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Servicios */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formData.selectedCategory}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Elige el servicio ideal</p>
              </div>

              <div className="grid gap-4">
                {(groupedServices[formData.selectedCategory] || []).map(srv => (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setFormData({ ...formData, serviceId: srv.id });
                      setStep(4);
                    }}
                    className={`relative text-left p-5 rounded-[2rem] border-2 transition-all active:scale-[0.98] overflow-hidden group ${
                      formData.serviceId === srv.id 
                        ? 'border-violet-500 bg-white dark:bg-[#1a1a1a] shadow-xl' 
                        : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] hover:border-gray-200'
                    }`}
                  >
                    {/* Background accent glow */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity ${formData.serviceId === srv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    
                    <div className="relative flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className={`font-black text-lg leading-tight mb-1 ${formData.serviceId === srv.id ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                          {srv.nombre}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                            <Clock size={12} className="text-violet-400" />
                            {srv.duracion} min
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-violet-500/60">
                            Servicio Premium
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className={`text-xl font-black ${formData.serviceId === srv.id ? 'text-violet-600 dark:text-violet-400' : 'text-gray-900 dark:text-white'}`}>
                          S/ {srv.precio}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold">Reserva con S/ 20</div>
                      </div>
                    </div>

                    {/* Progress indicator or checkmark when selected */}
                    {formData.serviceId === srv.id && (
                      <motion.div 
                        layoutId="active-service"
                        className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Staff & Horario (REAL-TIME) */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md mx-auto space-y-6">
              
              <section>
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User size={20} className="text-violet-500" /> Especialista
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {filteredStaff.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, staffId: s.id })}
                      className={`shrink-0 snap-start px-6 py-4 rounded-3xl border-2 transition-all active:scale-95 ${formData.staffId === s.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 shadow-md' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a]'}`}
                    >
                      <div className={`font-bold ${formData.staffId === s.id ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>{s.nombre}</div>
                      {s.id !== 0 && <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.especialidad}</div>}
                    </button>
                  ))}
                </div>
              </section>

              <div className="space-y-3">
                <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Calendar size={20} className="text-violet-500" /> Elige tu fecha
                </h2>
                
                {/* Ribbon de Fechas (Eagle Eye) */}
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const dateObj = addDays(new Date(), i);
                    const formattedDate = format(dateObj, 'yyyy-MM-dd');
                    const isSelected = formData.date === formattedDate;
                    const isAvailable = dayAvailability[formattedDate];
                    const dayName = format(dateObj, 'EEEE', { locale: es }).slice(0, 3);
                    const dayNumber = format(dateObj, 'd');
                    
                    return (
                      <button
                        key={formattedDate}
                        disabled={isAvailable === false}
                        onClick={() => setFormData({ ...formData, date: formattedDate, time: '' })}
                        className={`shrink-0 snap-start flex flex-col items-center justify-center w-16 h-20 rounded-3xl border-2 transition-all active:scale-95 ${isSelected ? 'border-violet-500 bg-violet-500 text-white shadow-md shadow-violet-500/25' : isAvailable === false ? 'border-gray-50 bg-gray-50 text-gray-300 opacity-40 cursor-not-allowed' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white'}`}
                      >
                        <span className={`text-xs font-bold uppercase mb-1 ${isSelected ? 'text-violet-100' : isAvailable === false ? 'text-gray-300' : 'text-gray-400'}`}>{dayName}</span>
                        <span className="text-xl font-black">{dayNumber}</span>
                        {isAvailable === false && (
                          <div className="w-1.5 h-1.5 bg-red-400/50 rounded-full mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.date && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 p-4 min-h-[160px]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Horas disponibles</h3>
                    {availableSlots.length > 0 && availableSlots.length <= 3 && (
                      <span className="text-xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-full animate-pulse">
                        ¡Últimos {availableSlots.length} cupos!
                      </span>
                    )}
                  </div>
                  
                  {loadingSlots ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-50">
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-2" />
                      <p className="text-sm font-medium">Buscando espacios...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                        <Clock size={20} />
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">Día completo</p>
                      <p className="text-sm text-gray-500 mt-1">Intenta deslizar al siguiente día.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => setFormData({ ...formData, time: slot.time })}
                          className={`relative py-3 rounded-2xl border-2 transition-all font-bold text-lg active:scale-95 flex flex-col items-center justify-center ${formData.time === slot.time ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 shadow-md' : slot.isRecommended ? 'border-green-500/50 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 shadow-sm' : 'border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#141414] text-gray-700 dark:text-gray-300'}`}
                        >
                          {slot.isRecommended && formData.time !== slot.time && (
                            <span className="absolute -top-2 bg-green-500 text-white text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full shadow-sm">
                              Recomendado
                            </span>
                          )}
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: Deposit Gate (Reliability Shield) */}
          {step === 5 && (
            <div className="max-w-md mx-auto">
              <DepositGate 
                businessName={businessData?.nombre || 'el salón'}
                depositAmount={businessData?.booking_monto_deposito || 20}
                depositMessage={(businessData?.booking_deposito_mensaje || '')
                  .replace(/\{\{nombre\}\}/gi, formData.name)
                  .replace(/\[nombre\]/gi, formData.name)
                  .replace(/\{\{hora\}\}/gi, formData.time)
                  .replace(/\[hora\]/gi, formData.time)
                  .replace(/\{\{monto\}\}/gi, (businessData?.booking_monto_deposito || 20).toString())
                  .replace(/\[monto\]/gi, (businessData?.booking_monto_deposito || 20).toString())
                }
                yape={businessData?.booking_yape_numero || ''}
                plin={businessData?.booking_plin_numero || ''}
                bankDetails={businessData?.booking_cuentas_bancarias || ''}
                onVerify={handleDepositVerification}
                onCancel={() => setStep(4)}
              />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Navigation Bar (Mobile Native Style) */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] z-30 pb-safe">
          <div className="max-w-md mx-auto flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className="w-16 h-16 shrink-0 flex items-center justify-center bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl text-gray-600 dark:text-gray-400 active:scale-95 transition-transform shadow-sm"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button
              onClick={handleNextStep}
              className="flex-1 h-16 flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-xl"
            >
              {step === 4 ? 'Confirmar Reserva' : 'Siguiente'}
              {step < 4 && <ChevronRight size={24} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
