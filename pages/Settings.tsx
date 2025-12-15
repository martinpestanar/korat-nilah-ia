
import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save, ShieldAlert, Plus, Trash2, X, Clock, DollarSign, Sparkles } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ServiceItem } from '../types';

const SettingsPage: React.FC = () => {
  const { services, updateService, addService, deleteService } = useData();
  const { user, isAdmin, isPro } = useAuth();
  
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // State for Add Service Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState<Partial<ServiceItem>>({
      name: '',
      durationMin: 30,
      price: 0
  });

  // --- HANDLERS ---
  const handleUpdate = (id: number, field: keyof ServiceItem, value: string | number) => {
    const service = services.find(s => s.id === id);
    if(service) {
        updateService({...service, [field]: value});
    }
  };

  const handleDelete = (id: number) => {
      if (window.confirm('¿Estás seguro de eliminar este servicio?')) {
          deleteService(id);
      }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newService.name && newService.price !== undefined && newService.durationMin) {
          addService({
              id: Date.now(),
              name: newService.name,
              price: Number(newService.price),
              durationMin: Number(newService.durationMin)
          });
          setIsModalOpen(false);
          setNewService({ name: '', durationMin: 30, price: 0 });
      }
  };

  // --- ACCESS DENIED FOR STAFF ---
  if (!isAdmin) {
      return (
          <div className="flex h-[80vh] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-500 dark:bg-rose-900/20">
                  <ShieldAlert size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Restringido</h1>
              <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                  Esta sección contiene configuraciones sensibles del negocio (precios, horarios, integraciones). Solo el administrador puede realizar cambios aquí.
              </p>
              <Link to="/app" className="mt-6 rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                  Volver al Dashboard
              </Link>
          </div>
      );
  }

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
       <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del Negocio</h1>

       {/* AI Settings - PRO ONLY */}
       {isPro && (
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            <div className="flex items-center justify-between">
            <div className="flex gap-3">
                <div className="mt-1">
                    <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asistente IA WhatsApp</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Permite que Nilah confirme y reagende citas automáticamente.</p>
                </div>
            </div>
            <button 
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`transition-colors duration-200 ${aiEnabled ? 'text-primary' : 'text-gray-400'}`}
            >
                {aiEnabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
            </button>
            </div>
        </section>
       )}

       {/* Services Management */}
       <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
         <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Catálogo de Servicios</h2>
                <p className="text-xs text-gray-500">Define los tratamientos disponibles, sus tiempos y costos.</p>
            </div>
            
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary-dim transition shadow-sm"
            >
               <Plus size={18} /> Nuevo Servicio
            </button>
         </div>

         <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-dark-border">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-700 dark:bg-dark-bg dark:text-gray-300">
                  <tr>
                     <th className="px-4 py-3 w-1/2">Nombre del Servicio</th>
                     <th className="px-4 py-3">Duración (min)</th>
                     <th className="px-4 py-3">Precio (S/)</th>
                     <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                  {services.map(service => (
                     <tr key={service.id} className="bg-white dark:bg-dark-card group hover:bg-gray-50 dark:hover:bg-[#252525]">
                        <td className="px-4 py-2">
                           <input 
                              type="text"
                              value={service.name}
                              onChange={(e) => handleUpdate(service.id, 'name', e.target.value)}
                              className="w-full rounded border-transparent bg-transparent px-2 py-1 font-medium text-gray-900 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary dark:text-white dark:focus:bg-dark-bg transition-colors"
                           />
                        </td>
                        <td className="px-4 py-2">
                           <div className="relative">
                               <input 
                                  type="number"
                                  value={service.durationMin}
                                  onChange={(e) => handleUpdate(service.id, 'durationMin', Number(e.target.value))}
                                  className="w-20 rounded border-transparent bg-transparent px-2 py-1 text-gray-600 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary dark:text-gray-300 dark:focus:bg-dark-bg"
                               />
                               <span className="pointer-events-none absolute right-4 top-1.5 text-xs text-gray-400">min</span>
                           </div>
                        </td>
                        <td className="px-4 py-2">
                           <div className="relative">
                               <span className="pointer-events-none absolute left-2 top-1.5 text-xs font-bold text-gray-400">S/</span>
                               <input 
                                  type="number"
                                  value={service.price}
                                  onChange={(e) => handleUpdate(service.id, 'price', Number(e.target.value))}
                                  className="w-24 rounded border-transparent bg-transparent pl-6 pr-2 py-1 font-bold text-gray-900 focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary dark:text-white dark:focus:bg-dark-bg"
                               />
                           </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                            <button 
                                onClick={() => handleDelete(service.id)}
                                className="rounded p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition"
                                title="Eliminar servicio"
                            >
                                <Trash2 size={16} />
                            </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {services.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No hay servicios registrados. Agrega uno nuevo para comenzar.
                </div>
            )}
         </div>
       </section>

       {/* User Role */}
       <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cuenta Activa</h2>
          <div className="flex items-center gap-4">
             <img src={user?.avatar || "https://picsum.photos/200"} className="h-16 w-16 rounded-full" alt="Profile" />
             <div>
                <p className="text-lg font-medium dark:text-white">{user?.name}</p>
                <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                <span className="mt-1 inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                   {user?.role} (Propietario)
                </span>
             </div>
          </div>
       </section>

       {/* --- ADD SERVICE MODAL --- */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agregar Nuevo Servicio</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-bg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nombre del Servicio</label>
                <input 
                   type="text" 
                   required
                   value={newService.name}
                   onChange={(e) => setNewService({...newService, name: e.target.value})}
                   className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-white"
                   placeholder="Ej. Lifting de Pestañas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Duración</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                        type="number" 
                        required
                        min="5"
                        step="5"
                        value={newService.durationMin}
                        onChange={(e) => setNewService({...newService, durationMin: Number(e.target.value)})}
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-9 text-sm focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-white"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-500">min</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Precio Base</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                        type="number" 
                        required
                        min="0"
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-9 text-sm focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-bg dark:text-white"
                        />
                    </div>
                  </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-bg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-black hover:bg-primary-dim shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
