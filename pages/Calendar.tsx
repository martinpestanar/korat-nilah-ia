
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, X, Calendar as CalendarIcon, DollarSign, CheckCircle, Ban, AlertCircle, Shield, ShieldAlert, ShieldCheck, ChevronRight, Eye, Clock, History, ListFilter, ThumbsUp, Bot } from 'lucide-react';
import { useData } from '../context/DataContext';
import { STATUS_COLORS, STATUS_LABELS, SIMULATION_DATE } from '../constants';
import { Appointment } from '../types';
import { calculateReliabilityScore } from '../utils/metrics';

type ViewMode = 'upcoming' | 'history';

const CalendarPage: React.FC = () => {
  const { appointments, clients, services, addAppointment } = useData();
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterService, setFilterService] = useState<string>('Todos');

  // New Appointment Form State
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formService, setFormService] = useState('');

  // --- FILTER & SORT LOGIC ---
  const filteredAppointments = useMemo(() => {
    // Definir el umbral de "Hoy" basado en la fecha simulada
    const today = new Date(SIMULATION_DATE);
    today.setHours(0, 0, 0, 0);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.fecha);
      const isPast = aptDate < today;

      // 1. Tab Filter (Strict Logic)
      if (viewMode === 'upcoming') {
         // Mostrar citas desde HOY a las 00:00 en adelante
         if (isPast) return false;
      } else {
         // Mostrar citas de AYER hacia atrás
         if (!isPast) return false;
      }

      // 2. Search & Dropdown Filters
      const matchesSearch = apt.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || apt.estado === filterStatus;
      const matchesService = filterService === 'Todos' || apt.servicio === filterService;
      
      return matchesSearch && matchesStatus && matchesService;
    }).sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        // Próximas: Ascendente (Lo más cercano primero)
        // Historial: Descendente (Lo más reciente primero)
        return viewMode === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  }, [appointments, searchTerm, filterStatus, filterService, viewMode]);

  // --- GROUPING LOGIC (BY DATE) ---
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    
    filteredAppointments.forEach(apt => {
        const dateKey = apt.fecha.split(' ')[0]; // YYYY-MM-DD
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(apt);
    });
    
    return groups;
  }, [filteredAppointments]);

  // --- HELPER: DATE HEADER LABEL ---
  const getDateHeaderLabel = (dateStr: string) => {
    const today = new Date(SIMULATION_DATE);
    today.setHours(0,0,0,0);
    
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d);

    // Format strings for comparison
    const targetStr = target.toDateString();
    const todayStr = today.toDateString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    if (targetStr === todayStr) return "HOY";
    if (targetStr === tomorrowStr) return "MAÑANA";

    return target.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // --- HELPER: CLIENT SHIELD ---
  const getClientContext = (clientId: number) => clients.find(c => c.id === clientId);

  const getClientShield = (clientId: number) => {
    const history = appointments.filter(a => a.cliente_id === clientId);
    return calculateReliabilityScore(history);
  };

  const renderShield = (level: 'High' | 'Medium' | 'Low', size = 16) => {
    // Escudo Rosa (Riesgo), Gris (Neutro), Índigo (Fiable)
    if (level === 'Low') {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" title="Riesgo: Historial de inasistencias">
                <ShieldAlert size={size} />
                <span className="hidden sm:inline">Riesgo</span>
            </div>
        );
    } 
    if (level === 'Medium') {
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400" title="Cliente Estándar">
                <Shield size={size} />
                <span className="hidden sm:inline">Neutro</span>
            </div>
        );
    }
    // High (Trust)
    return (
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" title="Cliente Confiable">
            <ShieldCheck size={size} />
            <span className="hidden sm:inline">Confiable</span>
        </div>
    );
  };

  // --- HANDLER: NEW APPOINTMENT ---
  const handleNewApptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient || !formService || !newDate || !newTime) return;

    const client = clients.find(c => c.id.toString() === formClient);
    const service = services.find(s => s.id.toString() === formService);

    if (client && service) {
      const newAppt: Appointment = {
        id: Math.floor(Math.random() * 10000),
        fecha: `${newDate} ${newTime}`,
        cliente_id: client.id,
        nombre_cliente: client.nombre,
        servicio: service.name,
        precio: service.price,
        estado: 'Pendiente',
        calificacion: 0,
        feedback_cliente: ''
      };
      addAppointment(newAppt);
      setIsNewApptModalOpen(false);
      setNewDate('');
      setNewTime('');
      setFormClient('');
      setFormService('');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda - {SIMULATION_DATE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
           <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tus citas de forma eficiente.</p>
        </div>
        <button 
          onClick={() => setIsNewApptModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-primary-dim shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Nueva Cita
        </button>
      </div>

      {/* TABS (VIEW MODE) */}
      <div className="flex border-b border-gray-200 dark:border-dark-border">
          <button 
            onClick={() => setViewMode('upcoming')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'upcoming' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
             <CalendarIcon size={16} />
             Próximas
             <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {/* Count strict upcoming */}
                {appointments.filter(a => new Date(a.fecha) >= new Date(SIMULATION_DATE.setHours(0,0,0,0))).length}
             </span>
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                viewMode === 'history' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
             <History size={16} />
             Historial
          </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:bg-dark-card border border-gray-100 dark:border-dark-border">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white"
            />
         </div>
         <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <ListFilter className="h-4 w-4 text-gray-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white"
            >
              <option value="Todos">Todos los Estados</option>
              {Object.keys(STATUS_LABELS).map(key => (
                  <option key={key} value={key}>{STATUS_LABELS[key]}</option>
              ))}
            </select>
            <select 
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white"
            >
              <option value="Todos">Todos los Servicios</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
         </div>
      </div>

      {/* APPOINTMENT LIST */}
      <div className="space-y-8">
        {Object.keys(groupedAppointments).length > 0 ? (
          Object.keys(groupedAppointments).map(dateKey => {
            const label = getDateHeaderLabel(dateKey);
            const isToday = label === 'HOY';

            return (
              <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* DATE HEADER */}
                <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 bg-gray-50/95 py-3 backdrop-blur dark:bg-dark-bg/95">
                   <span className={`rounded-md px-3 py-1 text-sm font-bold tracking-wide shadow-sm ${
                      isToday ? 'bg-primary text-black' : 'bg-white text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                   }`}>
                      {label}
                   </span>
                   <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupedAppointments[dateKey].map((apt) => {
                    const shield = getClientShield(apt.cliente_id);
                    const timePart = apt.fecha.split(' ')[1];

                    return (
                      <div 
                        key={apt.id} 
                        className="group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-primary/40 hover:shadow-md dark:border-dark-border dark:bg-dark-card"
                      >
                        {/* LEFT: TIME */}
                        <div className="flex w-full sm:w-24 items-center justify-between sm:justify-center border-b border-gray-100 bg-gray-50 px-4 py-2 sm:flex-col sm:border-b-0 sm:border-r dark:border-dark-border dark:bg-[#252525]">
                             <span className="text-lg font-bold text-gray-900 dark:text-white">{timePart}</span>
                             {/* AI INDICATOR */}
                             {apt.isAiGenerated && (
                                 <span className="mt-1 flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" title="Agendado por Nilah IA">
                                     <Bot size={10} /> IA
                                 </span>
                             )}
                        </div>

                        {/* CENTER: INFO */}
                        <div className="flex-1 p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{apt.nombre_cliente}</h3>
                                {renderShield(shield.level)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{apt.servicio}</span>
                                <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                <span>S/ {apt.precio.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* RIGHT: STATUS & ACTION */}
                        <div className="flex items-center justify-between p-4 sm:w-auto sm:justify-end sm:gap-4 sm:border-l sm:border-gray-100 dark:sm:border-dark-border">
                               <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[apt.estado]}`}>
                                    {STATUS_LABELS[apt.estado] || apt.estado}
                               </span>
                               
                               <button 
                                  onClick={() => setSelectedAppointment(apt)}
                                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-bg dark:text-gray-300 dark:hover:text-white transition-colors shadow-sm"
                               >
                                  Ver Detalles
                                  <ChevronRight size={14} />
                               </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-dark-card">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay citas en esta vista</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Intenta cambiar de pestaña o ajustar los filtros.</p>
          </div>
        )}
      </div>

      {/* --- NEW APPOINTMENT MODAL --- */}
      {isNewApptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Cita</h2>
              <button onClick={() => setIsNewApptModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleNewApptSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Cliente</label>
                <select 
                  required
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                
                {/* AUTO-DETECT BAD CLIENT */}
                {formClient && (() => {
                    const cId = parseInt(formClient);
                    const shield = getClientShield(cId);
                    if (shield.level === 'Low') {
                        return (
                            <div className="mt-3 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-300">
                                <AlertCircle size={20} className="shrink-0 text-rose-600" />
                                <div>
                                    <strong className="block font-bold text-rose-700 dark:text-rose-400">⚠️ ALERTA DE RIESGO</strong>
                                    <p className="mt-1 text-xs leading-relaxed">Cliente con historial de inasistencias. Se recomienda solicitar un <span className="font-bold underline">depósito del 50%</span>.</p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Servicio</label>
                <select 
                  required
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                >
                  <option value="">Seleccionar Servicio...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (S/ {s.price})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fecha</label>
                   <input 
                      type="date" 
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                   />
                </div>
                <div>
                   <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Hora</label>
                   <input 
                      type="time" 
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                   />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-dark-border">
                <button 
                  type="button" 
                  onClick={() => setIsNewApptModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-bg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary-dim shadow-md"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILS MODAL --- */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-card animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-dark-border dark:bg-[#252525]">
                 <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detalles de la Cita</h2>
                        {selectedAppointment.isAiGenerated && (
                            <span className="flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                                <Bot size={12} /> Nilah IA
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">ID: #{selectedAppointment.id}</p>
                 </div>
                 <button onClick={() => setSelectedAppointment(null)} className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <X size={20} className="text-gray-500" />
                 </button>
              </div>

              <div className="p-6">
                 {/* 1. Appointment Info */}
                 <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-bg">
                       <div className="flex items-center gap-2 mb-1">
                          <CalendarIcon size={16} className="text-primary" />
                          <span className="text-xs font-bold text-gray-500">FECHA</span>
                       </div>
                       <p className="font-semibold text-gray-900 dark:text-white">{selectedAppointment.fecha}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-bg">
                       <div className="flex items-center gap-2 mb-1">
                          <DollarSign size={16} className="text-green-500" />
                          <span className="text-xs font-bold text-gray-500">PRECIO</span>
                       </div>
                       <p className="font-semibold text-gray-900 dark:text-white">S/ {selectedAppointment.precio.toFixed(2)}</p>
                    </div>
                 </div>

                 {/* 2. Client Context */}
                 {(() => {
                    const client = getClientContext(selectedAppointment.cliente_id);
                    const shield = client ? getClientShield(client.id) : { score: 0, level: 'High' as const };
                    
                    return client ? (
                       <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Cliente</h3>
                          <div className="flex items-start justify-between">
                             <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{client.nombre}</span>
                                    {renderShield(shield.level)}
                                </div>
                                <div className="mt-1 flex gap-2">
                                   <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                      {client.categoria || 'Regular'}
                                   </span>
                                   <span className="text-xs text-gray-500">{client.telefono}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="block text-xl font-bold text-primary">{client.total_visitas}</span>
                                <span className="text-[10px] uppercase text-gray-400">Visitas</span>
                             </div>
                          </div>
                       </div>
                    ) : null;
                 })()}

                 {/* 3. Actions - RESTORED VIBRANT COLORS */}
                 <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Acciones Rápidas</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {/* Botón Completar (Verde fuerte) */}
                    <button className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-[1.02] hover:bg-emerald-500">
                       <ThumbsUp size={18} />
                       Marcar Completada
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                        {/* Botón No-Show (Gris) */}
                        <button className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                            <Eye size={16} />
                            No-Show
                        </button>
                        {/* Botón Cancelar (Rojo) */}
                        <button className="flex flex-col items-center justify-center gap-1 rounded-lg bg-red-100 py-2 text-[10px] font-bold text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
                            <Ban size={16} />
                            Cancelar
                        </button>
                    </div>
                 </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 text-center text-xs dark:bg-[#252525]">
                 Estado actual: <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${STATUS_COLORS[selectedAppointment.estado]}`}>{STATUS_LABELS[selectedAppointment.estado] || selectedAppointment.estado}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
