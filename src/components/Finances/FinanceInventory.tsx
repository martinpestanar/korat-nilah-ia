import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Truck, Plus, Loader2, Search, ArrowRight, Layers } from 'lucide-react';
import { inventoryService, ProductoInventario, Proveedor } from '../../services/inventory';
import { useAuth } from '../../context/AuthContext';
import InventoryItemModal from './InventoryItemModal';
import InventoryProviderModal from './InventoryProviderModal';
import { CategoriaCalendario } from '../../types';

const TABS = [
  { id: 'categorias', label: 'Categorías', icon: Layers },
  { id: 'stock', label: 'Stock Total', icon: Package },
  { id: 'proveedores', label: 'Proveedores', icon: Truck }
];

export default function FinanceInventory() {
  const { user } = useAuth();
  const businessId = user?.business_id;

  const [activeTab, setActiveTab] = useState('categorias');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [categoriasDB, setCategoriasDB] = useState<CategoriaCalendario[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalData, setItemModalData] = useState<ProductoInventario | null>(null);
  const [itemSuggestion, setItemSuggestion] = useState<string>('');
  
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerModalData, setProviderModalData] = useState<Proveedor | null>(null);

  useEffect(() => {
    if (!businessId) return;
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, prod, prov] = await Promise.all([
        inventoryService.getCategorias(businessId!),
        inventoryService.getProductos(businessId!),
        inventoryService.getProveedores(businessId!)
      ]);
      setCategoriasDB(cats.length > 0 ? cats : [
        { id: 9991, nombre: 'Manos y Uñas', emoji: '💅', activo: true },
        { id: 9992, nombre: 'Pedicure', emoji: '🦶', activo: true },
        { id: 9993, nombre: 'Pestañas y Cejas', emoji: '👁️', activo: true },
        { id: 9994, nombre: 'Cabello', emoji: '💇', activo: true }
      ]);
      setProductos(prod);
      setProveedores(prov);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductosByCategoria = (catId: string) => {
    return productos.filter(p => p.categorias_aplicables?.includes(catId));
  };

  const renderStockList = (items: ProductoInventario[], showCategoryLabel = true) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400 text-sm">
          No hay productos aquí aún.
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {items.map(prod => {
            const agotandose = prod.cantidad_total <= (prod.stock_minimo || 1);
            const agotado = prod.cantidad_total <= 0;
            return (
            <div key={prod.id ? `prod-${prod.id}` : `prod-name-${prod.nombre}`} 
              onClick={() => {
                setItemModalData(prod);
                setItemSuggestion('');
                setIsItemModalOpen(true);
              }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{prod.nombre}</h4>
                  {agotado ? (
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-bold uppercase">Agotado</span>
                  ) : agotandose ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-bold uppercase">Escaso</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {prod.marca && <span>{prod.marca}</span>}
                  <span>Rinde ~{prod.rinde_servicios} und.</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {Number(prod.cantidad_total).toFixed(1)} <span className="text-sm font-medium text-gray-500">{prod.unidad_medida}</span>
                </div>
              </div>
            </div>
            );
        })}
      </div>
    );
  };

  const renderCategorias = () => {
    if (activeCategory) {
      const cat = categoriasDB.find(c => c.nombre === activeCategory);
      if (!cat) return null;
      
      const items = getProductosByCategoria(activeCategory);

      return (
        <div className="mt-4 animate-fade-in fade-in">
          <button 
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors"
          >
            ← Volver a Categorías
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               {cat.emoji || '📦'} {cat.nombre}
            </h3>
            <button 
              onClick={() => {
                setItemSuggestion('');
                setItemModalData(null); // Clear item
                setIsItemModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-emerald-500/20"
            >
              + Añadir Insumo
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Todos los productos en esta lista se reducirán automáticamente de tu stock cuando se complete una cita bajo la categoría <strong>{cat.nombre}</strong>.
          </p>

          {renderStockList(items, false)}
        </div>
      );
    }

    return (
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categoriasDB.map(cat => {
          const itemCount = getProductosByCategoria(cat.nombre).length;
          return (
            <div 
              key={cat.id ? `cat-${cat.id}` : `cat-name-${cat.nombre}`}
              onClick={() => setActiveCategory(cat.nombre)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center text-center aspect-square justify-center gap-3"
            >
              <div className="text-4xl">{cat.emoji || '📦'}</div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{cat.nombre}</h4>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {itemCount} Insumos
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStockTotal = () => {
    return (
      <div className="mt-4 space-y-4">
         <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar cualquier producto..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-shadow font-medium placeholder-gray-400"
            />
          </div>
          {renderStockList(productos)}
      </div>
    );
  };

  const renderProveedores = () => {
    return (
      <div className="mt-4 space-y-4">
        <button 
          onClick={() => {
            setProviderModalData(null);
            setIsProviderModalOpen(true);
          }}
          className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2">
          <Plus size={18} /> Añadir Proveedor
        </button>
        <div className="grid gap-3">
          {proveedores.map(prov => (
             <div key={prov.id ? `prov-${prov.id}` : `prov-name-${prov.nombre}`} 
                onClick={() => {
                  setProviderModalData(prov);
                  setIsProviderModalOpen(true);
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-500/50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{prov.nombre}</h4>
                  {prov.detalles && <p className="text-xs text-gray-400 mt-1">{prov.detalles}</p>}
                </div>
                {prov.whatsapp && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${prov.whatsapp}`, '_blank')}}
                    className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Truck size={18} />
                  </button>
                )}
             </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 pb-24 lg:pb-8 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl shrink-0 mt-2">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'categorias') setActiveCategory(null);
              }}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
                active ? 'text-emerald-800 dark:text-emerald-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="inventory_subtab"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-emerald-500/20 shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">
                <Icon size={16} className="mb-0.5" />
              </span>
              <span className="relative z-10 text-[10px] sm:text-xs text-center leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 mt-4 overflow-y-auto w-full scrollbar-hide">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'categorias' && renderCategorias()}
              {activeTab === 'stock' && renderStockTotal()}
              {activeTab === 'proveedores' && renderProveedores()}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      {/* Modals — each in its own AnimatePresence to avoid duplicate-key warnings */}
      <AnimatePresence>
        {isItemModalOpen && (
          <InventoryItemModal
            key="item-modal"
            isOpen={isItemModalOpen}
            onClose={() => setIsItemModalOpen(false)}
            businessId={businessId!}
            item={itemModalData}
            suggestedName={itemSuggestion}
            defaultCategory={activeCategory}
            onSaved={loadData}
            proveedores={proveedores}
            categoriasDB={categoriasDB}
            existingBrands={Array.from(new Set(productos.map(i => i.marca).filter(Boolean))) as string[]}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProviderModalOpen && (
          <InventoryProviderModal
            key="provider-modal"
            isOpen={isProviderModalOpen}
            onClose={() => setIsProviderModalOpen(false)}
            businessId={businessId!}
            provider={providerModalData}
            onSaved={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
