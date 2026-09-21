import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pencil, Trash2, X, Save, Loader2, Image as ImageIcon, Check, ChevronLeft, ChevronRight, AlertTriangle, Settings2 } from 'lucide-react';
import { servicios, preciosExtras, categoriasServicio, cartaServicios } from '../../services/api';
import { getSupabaseClient } from '../../services/supabase';
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

  // Delete Modal State (Mobile-first app modal instead of browser alert)
  const [serviceToDelete, setServiceToDelete] = useState<ServiceDB | null>(null);
  const [deletingService, setDeletingService] = useState(false);
  const [extraToDelete, setExtraToDelete] = useState<PrecioExtra | null>(null);
  const [deletingExtra, setDeletingExtra] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

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
  
  // Categorias List State
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [newCatNombre, setNewCatNombre] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [savingNewCategory, setSavingNewCategory] = useState(false);

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
      
      const dbCategorias = await categoriasServicio.getAll();
      setCategorias(dbCategorias);
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
      const businessId = localStorage.getItem('korat_business_id') || undefined;
      const client = getSupabaseClient(businessId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await client.storage
        .from('imagenes_servicios')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = client.storage
        .from('imagenes_servicios')
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;
      console.log('✅ Imagen subida, URL:', imageUrl);
      setServiceFormData(prev => ({ ...prev, imagen_url: imageUrl }));
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
        console.log('💾 Guardando servicio con imagen_url:', serviceFormData.imagen_url);
        const updated = await servicios.update(editingService.id, serviceFormData);
        setServicesFromDB(prev => prev.map(s => s.id === editingService.id ? (updated as ServiceDB) : s));
        // Sincronizar automáticamente con Mi Carta Digital
        cartaServicios.syncOneFromAjustes({ ...editingService, ...serviceFormData });
      } else {
        // Create
        const created = await servicios.create({
          ...serviceFormData,
          precio: Number(serviceFormData.precio),
          duracion_min: Number(serviceFormData.duracion_min),
          prioridad: Number(serviceFormData.prioridad) || 0
        });
        setServicesFromDB(prev => [created as ServiceDB, ...prev]);
        // Sincronizar automáticamente con Mi Carta Digital
        cartaServicios.syncOneFromAjustes(created);
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

  const handleDeleteService = async (service: ServiceDB) => {
    setServiceToDelete(service);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setDeletingService(true);
    try {
      await servicios.delete(serviceToDelete.id);
      setServicesFromDB(prev => prev.filter(s => s.id !== serviceToDelete.id));
      
      // Ajustar la paginación si borramos el último item de una página
      const updatedTotalPages = Math.ceil((servicesFromDB.length - 1) / itemsPerPage);
      if (currentPage > updatedTotalPages && updatedTotalPages > 0) {
        setCurrentPage(updatedTotalPages);
      }
      setServiceToDelete(null);
    } catch (e) {
      console.error('Error deleting', e);
      alert('Error eliminando servicio. Intente nuevamente.');
    } finally {
      setDeletingService(false);
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
    setIsAddingCategoryInline(false);
    setNewCatNombre('');
  };

  const handleCreateCategoryInline = async () => {
    const trimmed = newCatNombre.trim();
    if (!trimmed) return;
    setSavingNewCategory(true);
    try {
      const created = await categoriasServicio.create({
        nombre: trimmed,
        emoji: newCatEmoji || '✨',
        activo: true
      });
      setCategorias(prev => [...prev, created]);
      setServiceFormData(prev => ({ ...prev, categoria: created.nombre }));
      setIsAddingCategoryInline(false);
      setNewCatNombre('');
    } catch (e) {
      console.error('Error creando categoría:', e);
      alert('Hubo un error al crear la categoría. Por favor, inténtalo nuevamente.');
    } finally {
      setSavingNewCategory(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeletingCategory(true);
    try {
      await categoriasServicio.delete(categoryToDelete.id);
      setCategorias(prev => prev.filter(c => c.id !== categoryToDelete.id));
      if (serviceFormData.categoria === categoryToDelete.nombre) {
        setServiceFormData(prev => ({ ...prev, categoria: '' }));
      }
      setCategoryToDelete(null);
    } catch (e) {
      console.error('Error eliminando categoría:', e);
      alert('Error al eliminar la categoría.');
    } finally {
      setDeletingCategory(false);
    }
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

  const handleDeletePrecioExtra = async (extra: PrecioExtra) => {
    setExtraToDelete(extra);
  };

  const confirmDeletePrecioExtra = async () => {
    if (!extraToDelete) return;
    setDeletingExtra(true);
    try {
      await preciosExtras.delete(extraToDelete.id);
      setPreciosExtrasList(list => list.filter(p => p.id !== extraToDelete.id));
      setExtraToDelete(null);
    } catch (error) {
      console.error('Error deleting extra:', error);
      alert('Error eliminando precio extra.');
    } finally {
      setDeletingExtra(false);
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
                  {/* Actions Overlay: Siempre visibles en móviles para permitir edición táctil, con hover en desktop */}
                  <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openServiceModal(svc);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 text-violet-600 shadow-md backdrop-blur-md hover:bg-white active:scale-95 dark:bg-[#1A1A1A]/90 dark:text-violet-400 dark:hover:bg-[#252525] transition-all"
                      title="Editar servicio"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteService(svc);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 text-rose-600 shadow-md backdrop-blur-md hover:bg-white active:scale-95 dark:bg-[#1A1A1A]/90 dark:text-rose-400 dark:hover:bg-[#252525] transition-all"
                      title="Eliminar servicio"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Content - Clickeable para editar rápidamente */}
                <div
                  onClick={() => openServiceModal(svc)}
                  className="flex flex-1 flex-col p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="line-clamp-2 font-bold text-gray-900 dark:text-white leading-snug text-base">
                      {svc.nombre}
                    </h3>
                  </div>
                  
                  <div className="mt-auto pt-3 flex items-end justify-between border-t border-gray-100 dark:border-white/5">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mb-0.5">Precio</p>
                      <p className="font-extrabold text-lg text-violet-600 dark:text-violet-400">S/ {svc.precio.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mb-0.5">Tiempo</p>
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {svc.duracion_min} min
                      </span>
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
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, servicesFromDB.length)} de {servicesFromDB.length} servicios
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white dark:border-white/10 dark:bg-[#1a1a1a] dark:text-gray-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white dark:border-white/10 dark:bg-[#1a1a1a] dark:text-gray-300"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* 2. TABLA PRECIOS EXTRAS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Extras y Variables de Cotización</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opciones que el chatbot y el formulario web usan para cotizar (Largo, Dificultad, etc.)
            </p>
          </div>
          <button
            onClick={() => setShowPrecioExtraModal(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink-500/20 transition hover:bg-pink-600 self-start sm:self-auto"
          >
            <Plus size={16} /> Agregar Extra
          </button>
        </div>

        {loadingPreciosExtras ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
          </div>
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
                        onClick={() => handleDeletePrecioExtra(item)}
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

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Categoría
                      </label>
                      <div className="flex items-center gap-2">
                        {categorias.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowManageCategoriesModal(true)}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors px-1 py-0.5"
                          >
                            <Settings2 size={13} />
                            <span>Gestionar</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingCategoryInline(!isAddingCategoryInline);
                            setNewCatNombre('');
                          }}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 flex items-center gap-1 transition-colors px-1 py-0.5"
                        >
                          {isAddingCategoryInline ? (
                            <span>Cancelar</span>
                          ) : (
                            <>
                              <Plus size={14} className="stroke-[2.5]" />
                              <span>Nueva categoría</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isAddingCategoryInline ? (
                      <div className="rounded-2xl border border-violet-200/80 bg-violet-50/60 p-3.5 dark:border-violet-500/20 dark:bg-violet-950/20 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={newCatEmoji}
                            onChange={e => setNewCatEmoji(e.target.value)}
                            className="w-12 h-11 shrink-0 rounded-xl border border-gray-200 bg-white text-center text-lg focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-[#141414]"
                          >
                            {['💅', '🦶', '👁️', '✨', '💇', '💆', '🪮', '💄', '🌿', '🌸', '⭐', '🎨', '🏷️', '🧖', '💈'].map(emoji => (
                              <option key={emoji} value={emoji}>{emoji}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={newCatNombre}
                            onChange={e => setNewCatNombre(e.target.value)}
                            placeholder="Nombre de la categoría"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCategoryInline();
                              }
                            }}
                            className="min-w-0 flex-1 h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-violet-500 focus:outline-none dark:border-white/10 dark:bg-[#141414] dark:text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            Se añadirá y seleccionará de inmediato
                          </p>
                          <button
                            type="button"
                            onClick={handleCreateCategoryInline}
                            disabled={!newCatNombre.trim() || savingNewCategory}
                            className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {savingNewCategory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={serviceFormData.categoria}
                          onChange={e => setServiceFormData({ ...serviceFormData, categoria: e.target.value })}
                          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-white dark:focus:bg-[#1a1a1a] transition-all outline-none"
                        >
                          <option value="">Ninguna (Sin categoría)</option>
                          {categorias.map(cat => (
                            <option key={cat.id} value={cat.nombre}>
                              {cat.emoji} {cat.nombre}
                            </option>
                          ))}
                        </select>

                        {/* Botón para eliminar la categoría seleccionada si el usuario la creó por error */}
                        {(() => {
                          const selectedCatObj = categorias.find(c => c.nombre === serviceFormData.categoria);
                          if (!selectedCatObj) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => setCategoryToDelete(selectedCatObj)}
                              className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 active:scale-95 transition-all"
                              title={`Eliminar categoría "${selectedCatObj.nombre}"`}
                            >
                              <Trash2 size={16} />
                            </button>
                          );
                        })()}
                      </div>
                    )}
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

      {/* Modales de Confirmación portaleados a document.body para máxima cobertura y z-index limpio */}
      {typeof document !== 'undefined' && serviceToDelete && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => !deletingService && setServiceToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] flex flex-col items-center text-center animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-0"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 mb-4 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              ¿Eliminar servicio?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar <strong className="text-gray-800 dark:text-gray-200">"{serviceToDelete.nombre}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex w-full flex-col-reverse sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={deletingService}
                onClick={() => setServiceToDelete(null)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 active:scale-[0.98] dark:border-white/10 dark:bg-[#252525] dark:text-gray-300 dark:hover:bg-[#2c2c2c] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingService}
                onClick={confirmDeleteService}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {deletingService ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                <span>{deletingService ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {typeof document !== 'undefined' && extraToDelete && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => !deletingExtra && setExtraToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] flex flex-col items-center text-center animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-0"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 mb-4 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              ¿Eliminar extra?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ¿Deseas eliminar la opción <strong className="text-gray-800 dark:text-gray-200">"{extraToDelete.etiqueta}"</strong>?
            </p>
            <div className="mt-6 flex w-full flex-col-reverse sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={deletingExtra}
                onClick={() => setExtraToDelete(null)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 active:scale-[0.98] dark:border-white/10 dark:bg-[#252525] dark:text-gray-300 dark:hover:bg-[#2c2c2c] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingExtra}
                onClick={confirmDeletePrecioExtra}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {deletingExtra ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                <span>{deletingExtra ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {typeof document !== 'undefined' && categoryToDelete && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => !deletingCategory && setCategoryToDelete(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />
          <div
            className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] flex flex-col items-center text-center animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-0"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 mb-4 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              ¿Eliminar categoría?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que deseas eliminar la categoría <strong className="text-gray-800 dark:text-gray-200">"{categoryToDelete.emoji} {categoryToDelete.nombre}"</strong>?
            </p>
            <p className="mt-1 text-xs text-rose-500 font-medium">
              Los servicios que usen esta categoría quedarán sin categoría.
            </p>
            <div className="mt-6 flex w-full flex-col-reverse sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={deletingCategory}
                onClick={() => setCategoryToDelete(null)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 active:scale-[0.98] dark:border-white/10 dark:bg-[#252525] dark:text-gray-300 dark:hover:bg-[#2c2c2c] transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingCategory}
                onClick={confirmDeleteCategory}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {deletingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                <span>{deletingCategory ? 'Eliminando...' : 'Sí, eliminar'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {typeof document !== 'undefined' && showManageCategoriesModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setShowManageCategoriesModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />
          <div
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-0"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                  <Settings2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Gestionar Categorías
                  </h3>
                  <p className="text-xs text-gray-400">
                    {categorias.length} {categorias.length === 1 ? 'categoría registrada' : 'categorías registradas'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManageCategoriesModal(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {categorias.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  No hay categorías registradas todavía.
                </div>
              ) : (
                categorias.map(cat => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-[#141414] hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{cat.emoji || '✨'}</span>
                      <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                        {cat.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageCategoriesModal(false);
                        setCategoryToDelete(cat);
                      }}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 active:scale-95 transition-all"
                      title="Eliminar categoría"
                    >
                      <Trash2 size={15} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowManageCategoriesModal(false)}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-[#252525] dark:text-gray-300 dark:hover:bg-[#2c2c2c] transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
