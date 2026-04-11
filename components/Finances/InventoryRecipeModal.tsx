import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Link as LinkIcon, Package } from 'lucide-react';
import { inventoryService, ProductoInventario, RecetaServicio } from '../../services/inventory';
import { supabase } from '../../services/supabase';

interface InventoryRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  productos: ProductoInventario[];
  onSaved: () => void;
}

export default function InventoryRecipeModal({ isOpen, onClose, businessId, productos, onSaved }: InventoryRecipeModalProps) {
  const [servicioNombre, setServicioNombre] = useState('');
  const [productoId, setProductoId] = useState<number | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [serviciosActivos, setServiciosActivos] = useState<{ nombre: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setServicioNombre('');
      setProductoId('');
      cargarServicios();
    }
  }, [isOpen]);

  const cargarServicios = async () => {
    try {
      const { data } = await supabase
        .from('servicios')
        .select('nombre')
        .eq('business_id', businessId)
        .order('nombre');
      if (data) {
        setServiciosActivos(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioNombre || productoId === '') return;
    
    setIsSaving(true);
    try {
      await inventoryService.upsertReceta({
        business_id: businessId,
        servicio_nombre: servicioNombre,
        producto_id: Number(productoId),
      });
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving recipe:", error);
      alert("Hubo un error al guardar la receta. Puede que ya exista una receta para este servicio y producto.");
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
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Conectar Receta
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enlazar servicio a un producto</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6">
            <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-200">Servicio (Agenda) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <LinkIcon size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    list="servicios-lista"
                    value={servicioNombre}
                    onChange={e => setServicioNombre(e.target.value)}
                    placeholder="Elige o escribe el servicio"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white font-medium"
                  />
                  <datalist id="servicios-lista">
                    {serviciosActivos.map((s, i) => (
                      <option key={i} value={s.nombre} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-200">Producto a descontar <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Package size={18} />
                  </div>
                  <select
                    required
                    value={productoId}
                    onChange={e => setProductoId(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white font-medium appearance-none"
                  >
                    <option value="" disabled>Selecciona producto de tu stock</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (Rinde {p.rinde_servicios} serv.)</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-xs text-gray-500 dark:text-gray-400 text-center">
                Cuando una cita con este <strong>servicio</strong> pase a completado, 
                tu stock de este producto se descontará según su rendimiento automático.
              </div>

            </form>
          </div>

          <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20">
            <button
              form="recipe-form"
              type="submit"
              disabled={isSaving || !servicioNombre || productoId === ''}
              className="w-full py-3.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white rounded-xl font-bold transition-colors shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
            >
              {isSaving ? 'Guardando...' : 'Guardar Receta'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
