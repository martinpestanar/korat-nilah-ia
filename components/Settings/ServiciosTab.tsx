import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Save, Loader2, Image as ImageIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { servicios, preciosExtras } from '../../services/api';
import { supabase } from '../../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

// Types
export interface ServiceDB {
  id: number;
  nombre: string;
  duracion_min: number;
  precio: number;
  business_id?: string;
  categoria?: string;
  prioridad?: number;
  imagen_url?: string;
}

interface PrecioExtra {
  id: number;
  categoria: string;
  nombre: string;
  etiqueta: string;
  precio: number;
  descripcion?: string;
  orden?: number;
}

export const ServiciosTab: React.FC = () => {
  // Services State
  const [servicesFromDB, setServicesFromDB] = useState<ServiceDB[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Modal State for Service
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDB | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<ServiceDB>>({
    nombre: '',
    duracion_min: 30,
    precio: 0,
    categoria: '',
    prioridad: 0,
    imagen_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Precios Extras State
  const [preciosExtrasList, setPreciosExtrasList] = useState<PrecioExtra[]>([]);
  const [loadingPreciosExtras, setLoadingPreciosExtras] = useState(true);
  const [showPrecioExtraModal, setShowPrecioExtraModal] = useState(false);
  const [newPrecioExtra, setNewPrecioExtra] = useState({
    categoria: 'largo',
    nombre: '',
    etiqueta: '',
    precio: 0,
    descripcion: ''
  });
  const [savingPrecioExtra, setSavingPrecioExtra] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Data Fetching
  const loadData = async () => {
    setLoadingServices(true);
    setLoadingPreciosExtras(true);
    try {
      const dbServices = (await servicios.getAll()) as ServiceDB[];
      // Sort priority descending, id ascending
      dbServices.sort((a, b) => {
        if ((b.prioridad || 0) !== (a.prioridad || 0)) {
          return (b.prioridad || 0) - (a.prioridad || 0);
        }
        return a.id - b.id;
      });
      setServicesFromDB(dbServices);

      const dbExtras = await preciosExtras.getAll();
      setPreciosExtrasList(dbExtras as PrecioExtra[]);
    } catch (error) {
      console.error('Error loading tab data:', error);
    } finally {
      setLoadingServices(false);
      setLoadingPreciosExtras(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Service Image Upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from('Imagenes Servicios')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('Imagenes Servicios')
        .getPublicUrl(filePath);

      setServiceFormData(prev => ({ ...prev, imagen_url: publicUrlData.publicUrl }));
    } catch (e) {
      console.error('Error upload image', e);
      alert('Error subiendo imagen. Intente de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  // 3. Service Save/Update
  const handleSaveService = async () => {
    if (!serviceFormData.nombre || serviceFormData.precio === undefined) return;
    setSavingService(true);
    try {
      if (editingService) {
        // Update
        const updated = await servicios.update(editingService.id, serviceFormData);
        setServicesFromDB(prev => prev.map(s => s.id === editingService.id ? (updated as ServiceDB) : s));
      } else {
        // Create
        const created = await servicios.create({
          ...serviceFormData,
          precio: Number(serviceFormData.precio),
          duracion_min: Number(serviceFormData.duracion_min),
          prioridad: Number(serviceFormData.prioridad) || 0
        });
        setServicesFromDB(prev => [created as ServiceDB, ...prev]);
      }
      closeServiceModal();
      // Re-sort after mutation later
      loadData();
      setCurrentPage(1);
    } catch (e) {
      console.error('Error saving', e);
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!window.confirm('¿Eliminar servicio?')) return;
    try {
      await servicios.delete(id);
      setServicesFromDB(prev => prev.filter(s => s.id !== id));
      
      // Ajustar la paginación si borramos el último item de una página
      const updatedTotalPages = Math.ceil((servicesFromDB.length - 1) / itemsPerPage);
      if (currentPage > updatedTotalPages && updatedTotalPages > 0) {
        setCurrentPage(updatedTotalPages);
      }
    } catch (e) {
      console.error('Error deleting', e);
    }
  };

  const openServiceModal = (service?: ServiceDB) => {
    if (service) {
      setEditingService(service);
      setServiceFormData({
        nombre: service.nombre,
        categoria: service.categoria || '',
        duracion_min: service.duracion_min,
        precio: service.precio,
        prioridad: service.prioridad || 0,
        imagen_url: service.imagen_url || ''
      });
    } else {
      setEditingService(null);
      setServiceFormData({
        nombre: '',
        categoria: '',
        duracion_min: 30,
        precio: 0,
        prioridad: 0,
        imagen_url: ''
      });
    }
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  // 4. Precios Extras Methods
  const handleAddPrecioExtra = async () => {
    setSavingPrecioExtra(true);
    try {
      const result = await preciosExtras.create(newPrecioExtra);
      setPreciosExtrasList([...preciosExtrasList, result as PrecioExtra]);
      setShowPrecioExtraModal(false);
      setNewPrecioExtra({ categoria: 'largo', nombre: '', etiqueta: '', precio: 0, descripcion: '' });
    } catch (error) {
      console.error('Error adding extra:', error);
    } finally {
      setSavingPrecioExtra(false);
    }
  };

  const handleUpdatePrecioExtra = async (id: number, data: Partial<PrecioExtra>) => {
    try {
      await preciosExtras.update(id, data);
      setPreciosExtrasList(list => list.map(p => p.id === id ? { ...p, ...data } : p));
    } catch (error) {
      console.error('Error updating extra:', error);
    }
  };

  const handleDeletePrecioExtra = async (id: number) => {
    if (!window.confirm('¿Eliminar este extra?')) return;
    try {
      await preciosExtras.delete(id);
      setPreciosExtrasList(list => list.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting extra:', error);
    }
  };

  // UI Helpers
  const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('uña')) return 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400';
    if (c.includes('pestaña')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
    if (c.includes('cabello')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
    if (c.includes('rostro') || c.includes('facial')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  // Pagination Logic
  const totalPages = Math.ceil(servicesFromDB.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentServices = servicesFromDB.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* ───── SERVICIOS PRINCIPALES ───── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-white/5 dark:bg-[#141414]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Catálogo de Servicios</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Administra los servicios de tu salón, tiempos, precios y fotos referenciales.</p>
          </div>
          <button
            onClick={() => openServiceModal()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-600 hover:scale-[1.02]"
          >
            <Plus size={18} /> Nuevo Servicio
          </button>
        </div>

        {loadingServices ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>
        ) : servicesFromDB.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
              <ImageIcon className="h-8 w-8 text-violet-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Aún no hay servicios</h3>
            <p className="text-sm text-gray-500">Comienza agregando el primer servicio de tu negocio.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentServices.map(svc => (
              <div key={svc.id} className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-[#1a1a1a]">
                
                {/* Image header */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-black/50">
                  {svc.imagen_url ? (
                    <img src={svc.imagen_url} alt={svc.nombre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-gray-700">
                      <ImageIcon className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  {/* Badges Overlay */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1.5 items-start">
                    {svc.categoria && (
                      <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${getCategoryColor(svc.categoria)}`}>
                        {svc.categoria}
                      </span>
                    )}
                    {Number(svc.prioridad) > 0 && (
                      <span className="rounded-md bg-amber-500/90 text-white shadow-sm backdrop-blur-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                        ⭐ Destacado
                      </span>
                    )}
                  </div>
                  {/* Actions Overlay */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => openServiceModal(svc)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-violet-600 shadow-sm backdrop-blur-md hover:bg-white dark:bg-black/60 dark:text-violet-400 dark:hover:bg-black/80 transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteService(svc.id)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-sm backdrop-blur-md hover:bg-white dark:bg-black/60 dark:text-rose-400 dark:hover:bg-black/80 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 font-semibold text-gray-900 dark:text-white leading-tight mb-2">
                    {svc.nombre}
                  </h3>
                  <div className="mt-auto pt-3 flex items-end justify-between border-t border-gray-50 dark:border-white/5">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-0.5">Precio</p>
                      <p className="font-bold text-lg text-violet-600 dark:text-violet-400">S/ {svc.precio.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium mb-0.5">Tiempo</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{svc.duracion_min} min</p>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando <span className="font-semibold text-gray-900 dark:text-white">{startIndex + 1}</span> a <span className="font-semibold text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, servicesFromDB.length)}</span> de <span className="font-semibold text-gray-900 dark:text-white">{servicesFromDB.length}</span> servicios
                </span>
                
                <div className="flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:shadow-none disabled:hover:bg-white dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:bg-[#222] dark:hover:text-white transition-all disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all ${
                          currentPage === i + 1
                            ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                            : 'text-gray-500 border border-transparent hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#222] dark:hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:shadow-none disabled:hover:bg-white dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:bg-[#222] dark:hover:text-white transition-all disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ───── PRECIOS EXTRAS ───── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-white/5 dark:bg-[#141414]">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Precios Extras (Nail Art, Tamaños)</h2>
            <p className="text-xs text-gray-500">Variaciones adicionales en precio que se suman al servicio de manera dinámica.</p>
          </div>
          <button
            onClick={() => setShowPrecioExtraModal(true)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:bg-pink-600 hover:scale-[1.02]"
          >
            <Plus size={18} /> Nuevo Extra
          </button>
        </div>

        {loadingPreciosExtras ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-pink-500" /></div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar rounded-xl border border-gray-100 dark:border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold dark:bg-[#1A1A1A] dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Etiqueta</th>
                  <th className="px-4 py-3">Precio (+S/)</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {preciosExtrasList.map(item => (
                  <tr key={item.id} className="bg-white dark:bg-[#141414] group hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-md px-2 py-1 text-xs font-bold uppercase ${item.categoria === 'largo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                          item.categoria === 'diseño' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        }`}>
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.etiqueta}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-flex items-center">
                        <span className="text-gray-400 font-bold mr-1">+S/</span>
                        <input
                          type="number"
                          value={item.precio}
                          onChange={(e) => handleUpdatePrecioExtra(item.id, { precio: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-transparent bg-gray-50 px-2 py-1 font-bold text-gray-900 focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeletePrecioExtra(item.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preciosExtrasList.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay precios extras configurados aún.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ───── MODALS ───── */}
      {/* Service Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeServiceModal} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl dark:bg-[#1A1A1A] sm:max-h-[90vh] flex flex-col overflow-hidden max-h-[95vh]"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#1A1A1A]/80">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <button onClick={closeServiceModal} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Photo Upload Area */}
                <div className="flex flex-col items-center">
                  <input type="file" ref={fileInputRef} onChange={e => e.target.files && handleImageUpload(e.target.files[0])} accept="image/*" className="hidden" />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 transition-all hover:border-violet-400 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/5 dark:hover:border-violet-500/50"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                    ) : serviceFormData.imagen_url ? (
                      <>
                        <img src={serviceFormData.imagen_url} alt="Service" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Pencil className="h-6 w-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mb-2 h-8 w-8 text-violet-400" />
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">Subir foto</span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">Formatos recomendados: JPG, PNG, WEBP (1:1)</p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre del Servicio <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={serviceFormData.nombre}
                      onChange={e => setServiceFormData({ ...serviceFormData, nombre: e.target.value })}
                      placeholder="Ej: Manicura Acrílica"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Categoría</label>
                      <select
                        value={serviceFormData.categoria}
                        onChange={e => setServiceFormData({ ...serviceFormData, categoria: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                      >
                        <option value="">Ninguna</option>
                        <option value="Uñas">💅 Uñas</option>
                        <option value="Pestañas">👁️ Pestañas / Cejas</option>
                        <option value="Cabello">💇 Cabello</option>
                        <option value="Rostro">💆 Rostro / Spa</option>
                        <option value="Cuerpo">✨ Cuerpo</option>
                        <option value="Maquillaje">💄 Maquillaje</option>
                        <option value="Otros">📦 Otros</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Prioridad</label>
                      <select
                        value={serviceFormData.prioridad}
                        onChange={e => setServiceFormData({ ...serviceFormData, prioridad: Number(e.target.value) })}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                      >
                        <option value="0">⚪ Normal (0)</option>
                        <option value="1">🔵 Media (1)</option>
                        <option value="2">🟣 Alta (2)</option>
                        <option value="3">⭐ Máxima (3)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Precio (S/) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">S/</span>
                        <input
                          type="number"
                          value={serviceFormData.precio || ''}
                          onChange={e => setServiceFormData({ ...serviceFormData, precio: Number(e.target.value) })}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm font-bold focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tiempo (Min) <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          value={serviceFormData.duracion_min || ''}
                          onChange={e => setServiceFormData({ ...serviceFormData, duracion_min: Number(e.target.value) })}
                          placeholder="30"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-4 pr-12 text-sm font-bold focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6 dark:border-white/5 dark:bg-[#111]">
                <button
                  onClick={handleSaveService}
                  disabled={!serviceFormData.nombre || savingService || uploadingImage || (serviceFormData.precio ?? 0) <= 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 py-3.5 font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {savingService ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  {savingService ? 'Guardando...' : editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Extra Precio */}
        {showPrecioExtraModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPrecioExtraModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl dark:bg-[#1A1A1A] flex flex-col overflow-hidden max-h-[95vh]"
            >
               <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-xl dark:border-white/5 dark:bg-[#1A1A1A]/80">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nuevo Precio Extra</h3>
                <button onClick={() => setShowPrecioExtraModal(false)} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Categoría</label>
                  <select
                    value={newPrecioExtra.categoria}
                    onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, categoria: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  >
                    <option value="largo">📏 Largo</option>
                    <option value="diseño">🎨 Diseño</option>
                    <option value="extras">✨ Extras</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre Interno (código sin espacios)</label>
                  <input
                    type="text"
                    value={newPrecioExtra.nombre}
                    onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, nombre: e.target.value })}
                    placeholder="Ej: largo_xl"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Etiqueta Visible (Cliente)</label>
                  <input
                    type="text"
                    value={newPrecioExtra.etiqueta}
                    onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, etiqueta: e.target.value })}
                    placeholder="Ej: Uñas extra largas"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Precio Adicional (S/)</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">+S/</span>
                    <input
                      type="number"
                      value={newPrecioExtra.precio || ''}
                      onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, precio: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 pl-12 text-sm font-bold dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-gray-50 p-4 sm:p-6 dark:border-white/5 dark:bg-[#111]">
                <button
                  onClick={handleAddPrecioExtra}
                  disabled={!newPrecioExtra.nombre || !newPrecioExtra.etiqueta || savingPrecioExtra}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 py-3.5 font-bold text-white shadow-lg shadow-pink-500/25 transition-all hover:bg-pink-600 disabled:opacity-50 active:scale-[0.98]"
                >
                  {savingPrecioExtra ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  {savingPrecioExtra ? 'Agregando...' : 'Agregar Extra'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
