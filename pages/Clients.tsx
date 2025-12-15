
import React, { useState } from 'react';
import { Search, ChevronRight, X, UserPlus, Phone, Calendar, Clock, MapPin, Mail, Shield, ShieldAlert, ShieldCheck, HeartHandshake, Lock } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Client, Appointment } from '../types';
import { calculateChurnRisk, calculateReliabilityScore } from '../utils/metrics';
import { STATUS_LABELS, STATUS_COLORS, SIMULATION_DATE } from '../constants';

const ClientsPage: React.FC = () => {
  const { clients, appointments, addClient } = useData();
  const { isPro } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const filteredClients = clients.filter(client => 
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telefono.includes(searchTerm)
  );

  const getClientHistory = (clientId: number): Appointment[] => {
    return appointments
      .filter(a => a.cliente_id === clientId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const handleRescueClient = (client: Client) => {
     alert(`🤖 Nilah IA:\n\nEnviando mensaje de recuperación a ${client.nombre}...`);
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    const newClient: Client = {
        id: Date.now(),
        nombre: newClientName,
        telefono: newClientPhone,
        fecha_registro: new Date().toISOString().split('T')[0],
        primera_visita: '-',
        ultima_visita: '-',
        categoria: 'Nuevo',
        puntos_acumulados: 0,
        total_visitas: 0,
        Estado: 'Activo'
    };

    addClient(newClient);
    setNewClientName('');
    setNewClientPhone('');
    setIsAddModalOpen(false);
  };

  const getReliability = (clientId: number) => {
      const history = appointments.filter(a => a.cliente_id === clientId);
      return calculateReliabilityScore(history);
  };

  return (
    <div className="relative h-full">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Base de Clientes</h1>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary-dim shadow-md"
             >
                <UserPlus size={18} />
                Nuevo Cliente
             </button>

             <div className="relative w-full sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-card dark:text-white dark:placeholder-gray-400"
                />
             </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-dark-border dark:bg-dark-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-[#252525] dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Nombre</th>
                <th scope="col" className="px-6 py-3">Teléfono</th>
                <th scope="col" className="px-6 py-3">Categoría</th>
                <th scope="col" className="px-6 py-3">Última Visita</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                        <tr 
                          key={client.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525] cursor-pointer"
                          onClick={() => setSelectedClient(client)}
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
                            {client.nombre}
                          </td>
                          <td className="px-6 py-4">{client.telefono}</td>
                          <td className="px-6 py-4">
                             <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                                 client.categoria === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                             }`}>
                                 {client.categoria || 'Regular'}
                             </span>
                          </td>
                          <td className="px-6 py-4">{client.ultima_visita}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className={`mr-2 h-2.5 w-2.5 rounded-full ${client.Estado === 'Activo' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              {client.Estado}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight className="ml-auto h-5 w-5 text-gray-400" />
                          </td>
                        </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No se encontraron clientes.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail Sidebar - CLEAN PROFESSIONAL LOOK */}
      {selectedClient && (
         <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-dark-border dark:bg-dark-card flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-border">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ficha de Cliente</h2>
              <button 
                onClick={() => setSelectedClient(null)}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-border"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Header */}
                <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                        {selectedClient.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.nombre}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                             <Phone size={14} />
                             {selectedClient.telefono}
                        </div>
                        <div className="mt-2 flex gap-2">
                             <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {selectedClient.categoria || 'Regular'}
                             </span>
                             <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                {selectedClient.total_visitas} Visitas
                             </span>
                        </div>
                    </div>
                </div>

                {/* CRM DATA GRID */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-[#252525]">
                        <p className="text-xs uppercase text-gray-500">Puntos Fidelidad</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedClient.puntos_acumulados}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-[#252525]">
                        <p className="text-xs uppercase text-gray-500">Última Visita</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedClient.ultima_visita}</p>
                    </div>
                </div>

                {/* RISK / RELIABILITY ANALYSIS (Visible for All, Action is Pro) */}
                <div className="mb-6 space-y-3">
                    {/* Reliability */}
                    {(() => {
                        const rel = getReliability(selectedClient.id);
                        return (
                             <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-dark-border">
                                {rel.level === 'Low' ? <ShieldAlert className="text-rose-500" /> : <ShieldCheck className="text-indigo-500" />}
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {rel.level === 'High' ? 'Cliente Confiable' : rel.level === 'Low' ? 'Cliente de Riesgo' : 'Cliente Estándar'}
                                    </p>
                                    <p className="text-xs text-gray-500">Score de Fiabilidad: {rel.score}/100</p>
                                </div>
                             </div>
                        );
                    })()}

                    {/* Churn Risk & Rescue Action */}
                    {(() => {
                        const risk = calculateChurnRisk(selectedClient.ultima_visita, selectedClient.Estado, SIMULATION_DATE);
                        if (risk.level === 'High' || risk.level === 'Medium') {
                            return (
                                <div className={`rounded-lg border ${risk.border} ${risk.bg} p-4`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${risk.level === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                            <span className={`text-sm font-bold ${risk.color}`}>{risk.label}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{risk.days} días sin venir</span>
                                    </div>
                                    
                                    {/* PRO FEATURE: ACTION BUTTON */}
                                    {isPro ? (
                                        <button 
                                            onClick={() => handleRescueClient(selectedClient)}
                                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-xs font-bold text-black shadow-sm hover:bg-gray-50 border border-gray-200"
                                        >
                                            <HeartHandshake size={14} className="text-primary" />
                                            Rescatar con Nilah IA
                                        </button>
                                    ) : (
                                        <div className="mt-2 flex items-center justify-between rounded bg-white/50 p-2 dark:bg-black/20">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Lock size={10} /> Auto-rescate bloqueado
                                            </span>
                                            <span className="text-[10px] font-bold text-primary uppercase">Plan Pro</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>

                <h3 className="mb-3 text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Historial de Citas</h3>
                <div className="space-y-3">
                    {getClientHistory(selectedClient.id).map(apt => (
                        <div key={apt.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525]">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{apt.servicio}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={12} /> {apt.fecha}
                                </div>
                            </div>
                            <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[apt.estado]}`}>
                                {STATUS_LABELS[apt.estado] || apt.estado}
                            </span>
                        </div>
                    ))}
                    {getClientHistory(selectedClient.id).length === 0 && (
                        <p className="text-center text-sm text-gray-500">No hay historial disponible.</p>
                    )}
                </div>
            </div>
         </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-card shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Nuevo Cliente</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-border"
                >
                  <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                <input 
                   type="text" 
                   required
                   value={newClientName}
                   onChange={(e) => setNewClientName(e.target.value)}
                   className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-primary"
                   placeholder="Ej. Maria Perez"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input 
                   type="tel" 
                   required
                   value={newClientPhone}
                   onChange={(e) => setNewClientPhone(e.target.value)}
                   className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-primary"
                   placeholder="+51 999 999 999"
                />
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary-dim shadow-lg shadow-primary/20"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
