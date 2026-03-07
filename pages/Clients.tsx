import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, UserPlus, RefreshCw, Loader2, AlertCircle, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboardData, Client } from '../context/DashboardDataContext';
import { crm } from '../services/api';
import { ClientsMetrics } from '../components/Clients/ClientsMetrics';
import { ClientCard, getUXStatus } from '../components/Clients/ClientCard';
import { ClientModal } from '../components/Clients/ClientModal';
import { BottomSheet } from '../components/UI/BottomSheet';

const TABS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Perdidos', label: '🔴 Perdidos', filter: (c: Client) => (c.dias_ausente || 0) >= 90 },
  { id: 'En Riesgo', label: '🟠 En Riesgo', filter: (c: Client) => { const d = c.dias_ausente || 0; return d >= 60 && d < 90; } },
  { id: 'Enfriándose', label: '🟡 Enfriándose', filter: (c: Client) => { const d = c.dias_ausente || 0; return d >= 30 && d < 60; } },
  { id: 'Activos', label: '🟢 Activos', filter: (c: Client) => (c.dias_ausente || 0) < 30 },
  { id: 'VIP', label: '⭐ VIP', filter: (c: Client) => c.categoria === 'VIP' }
];

const ClientsPage: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const { clients, appointments, isLoading, refresh, error: loadError } = useDashboardData();

  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form & Actions states
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [rescueStates, setRescueStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [clientNotes, setClientNotes] = useState<Record<number, string>>({});

  // Pagination
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Logic
  const filteredClients = useMemo(() => {
    let result = clients || [];

    // Búsqueda por texto (nombre, teléfono)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.nombre.toLowerCase().includes(term) ||
        (c.telefono && c.telefono.includes(term))
      );
    }

    // Filtro por Tab Segmento
    const tab = TABS.find(t => t.id === activeTab);
    if (tab && tab.filter) {
      result = result.filter(tab.filter);
    }

    // Ordenamiento: Por defecto, los que necesitan atención primero, luego por fecha
    result.sort((a, b) => {
      // 1. Mostrar clientes a rescatar primero (riesgo alto sin cooldown)
      const aNeedsRescue = (a.dias_ausente || 0) >= 45 && !a.rescate_exitoso && (!a.bloqueado_hasta || new Date(a.bloqueado_hasta) <= new Date());
      const bNeedsRescue = (b.dias_ausente || 0) >= 45 && !b.rescate_exitoso && (!b.bloqueado_hasta || new Date(b.bloqueado_hasta) <= new Date());

      if (aNeedsRescue && !bNeedsRescue) return -1;
      if (!aNeedsRescue && bNeedsRescue) return 1;

      // 2. Mayor LTV = más importante
      if ((b.ltv || 0) !== (a.ltv || 0)) return (b.ltv || 0) - (a.ltv || 0);

      // 3. Orden alfabético
      return a.nombre.localeCompare(b.nombre);
    });

    return result;
  }, [clients, searchTerm, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
  const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);

  // Handlers
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingClient(true);
    try {
      await crm.createClient({
        nombre: newClientName,
        telefono: newClientPhone
      });
      setIsAddModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      refresh(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleRescueClient = async (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    console.log("handleRescueClient called for:", client.nombre);
    setRescueStates(prev => ({ ...prev, [client.id]: 'sending' }));
    try {
      await crm.rescueClient(String(client.id));
      setRescueStates(prev => ({ ...prev, [client.id]: 'sent' }));
      setTimeout(() => refresh(true), 1500); // Refrescar para traer la data actualizada (cooldown/impacto)
    } catch (error) {
      setRescueStates(prev => ({ ...prev, [client.id]: 'error' }));
      setTimeout(() => setRescueStates(prev => ({ ...prev, [client.id]: 'idle' })), 3000);
    }
  };

  // Helpers func
  const getTotalSpent = useCallback(() => selectedClient?.ltv || 0, [selectedClient]);

  const getNextAppointment = useCallback(() => {
    if (!selectedClient || !appointments) return null;
    const clientAppts = appointments.filter((a: any) =>
      (a.cliente_id === selectedClient.id || a.client_id === selectedClient.id) &&
      new Date(a.fecha || a.start_time) > new Date()
    );
    if (clientAppts.length === 0) return null;
    clientAppts.sort((a: any, b: any) => new Date(a.fecha || a.start_time).getTime() - new Date(b.fecha || b.start_time).getTime());
    const next = clientAppts[0] as any;
    return {
      id: next.id,
      servicio: next.servicio || next.service_name || 'Servicio Programado',
      fecha: next.fecha || next.start_time,
      estado: next.estado || next.status
    };
  }, [selectedClient, appointments]);

  const getClientHistory = useCallback(() => {
    if (!selectedClient || !appointments) return [];
    return appointments
      .filter((a: any) => a.cliente_id === selectedClient.id || a.client_id === selectedClient.id)
      .filter((a: any) => new Date(a.fecha || a.start_time) <= new Date())
      .map((a: any) => ({
        id: a.id,
        servicio: a.servicio || a.service_name || 'Servicio',
        fecha: a.fecha || a.start_time,
        estado: a.estado || a.status || 'Completada'
      }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 5); // Últimas 5
  }, [selectedClient, appointments]);

  const handleDeleteClient = () => { }; // Mock

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          {/* Título: compact en mobile, grande en desktop */}
          <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            CRM de Clientes
          </h1>
          {/* Descripción: solo en sm+ para no ocupar espacio en mobile */}
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Gestiona tu base de datos, mide la retención y envía campañas de rescate.
          </p>
        </div>
        {/* Acciones: refresh icon-only + Nuevo Cliente */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh(true)}
            disabled={isLoading}
            className="flex items-center justify-center h-11 w-11 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 active:scale-95 transition-all"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white hover:bg-primary-dim active:scale-95 transition-all shadow-sm min-h-[44px]"
          >
            <UserPlus size={17} />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      {!isLoading && clients && <ClientsMetrics clients={clients} />}

      {/* ── Filtros + Búsqueda ───────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">

        {/* Buscador — siempre full-width */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border-none bg-gray-100 pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Tabs con scroll horizontal + fade a la derecha */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar scroll-smooth">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`
                  shrink-0 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all min-h-[42px]
                  ${activeTab === tab.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black shadow-md scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Fade gradient a la derecha, hint de scroll */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-dark-bg to-transparent" />
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-gray-500 font-medium">Cargando base de datos CRM...</span>
          </div>
        ) : paginatedClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedClients.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => setSelectedClient(client)}
                onRescue={(e) => handleRescueClient(e, client)}
                rescueState={rescueStates[client.id] || 'idle'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3 border-2 border-dashed border-gray-200 rounded-2xl dark:border-gray-800">
            <UserPlus className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-lg">No hay clientes en esta sección</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
              className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-200 disabled:opacity-50 dark:bg-dark-card dark:border-dark-border"
            >
              Anterior
            </button>
            <span className="px-4 py-2 font-medium text-gray-500">
              {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
              className="px-4 py-2 rounded-xl font-bold bg-white border border-gray-200 disabled:opacity-50 dark:bg-dark-card dark:border-dark-border"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalle Completo */}
      {console.log("Render: selectedClient is: ", selectedClient?.nombre)}
      {selectedClient && (
        <ClientModal
          client={selectedClient}
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          onRescue={(e) => handleRescueClient(e, selectedClient)}
          rescueState={rescueStates[selectedClient.id] || 'idle'}
          onSaveNotes={(notes) => setClientNotes(prev => ({ ...prev, [selectedClient.id]: notes }))}
          clientNotes={clientNotes[selectedClient.id] || ''}
          getTotalSpent={getTotalSpent}
          getNextAppointment={getNextAppointment}
          getClientHistory={getClientHistory}
          isAdmin={isAdmin}
          onDelete={handleDeleteClient}
        />
      )}

      <BottomSheet
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registrar Nuevo Cliente"
      >
        <form onSubmit={handleAddClient} className="space-y-5 px-5 py-4">

          {/* Nombre */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              disabled={isCreatingClient}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              placeholder="Ej. Maria Perez"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
              Teléfono WhatsApp
            </label>
            <input
              type="tel"
              required
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              disabled={isCreatingClient}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              placeholder="+51 999 999 999"
            />
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={isCreatingClient || !newClientName || !newClientPhone}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-black text-white hover:bg-primary-dim shadow-premium active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
            {isCreatingClient ? <Loader2 size={20} className="animate-spin" /> : '✓ Guardar Cliente'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

export default ClientsPage;
