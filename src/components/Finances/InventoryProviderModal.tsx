import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, User, Phone, MapPin, Check } from 'lucide-react';
import { inventoryService, Proveedor } from '../../services/inventory';

interface InventoryProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  provider?: Proveedor | null;
  onSaved: () => void;
}

export default function InventoryProviderModal({ isOpen, onClose, businessId, provider, onSaved }: InventoryProviderModalProps) {
  const [formData, setFormData] = useState<Partial<Proveedor>>({
    nombre: '',
    whatsapp: '',
    detalles: '',
    direccion: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (provider) {
        setFormData(provider);
      } else {
        setFormData({ 
          nombre: '', 
          whatsapp: '', 
          detalles: '',
          direccion: '' 
        });
      }
    }
  }, [isOpen, provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    
    setIsSaving(true);
    try {
      await inventoryService.upsertProveedor({
        ...formData,
        business_id: businessId,
      });
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving provider:", error);
      alert("Hubo un error al guardar el proveedor.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Truck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {provider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gestión de abastecimiento</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 overflow-y-auto custom-scrollbar">
            <form id="provider-form" onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200">Nombre de tu proveedor (o marca)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white font-medium"
                    placeholder="Ej. Distribuidora Nails Pro"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200">WhatsApp de contacto</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={formData.whatsapp || ''}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white"
                    placeholder="+51 999 888 777"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200">Dirección</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <textarea
                    value={formData.direccion || ''}
                    onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                    rows={2}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white resize-none"
                    placeholder="Ej. Av. Principal 123, Ciudad"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200">Detalles adicionales</label>
                <textarea
                  value={formData.detalles || ''}
                  onChange={e => setFormData({ ...formData, detalles: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white resize-none"
                  placeholder="Ej. Entregas los martes, crédito a 30 días..."
                />
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20 shrink-0">
            <button
              form="provider-form"
              type="submit"
              disabled={isSaving || !formData.nombre}
              className="w-full flex justify-center items-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:dark:bg-gray-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Guardar Proveedor
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
