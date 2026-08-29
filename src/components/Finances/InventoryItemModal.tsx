import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Ruler, AlertTriangle, Check, Layers, Sparkles } from 'lucide-react';
import { inventoryService, ProductoInventario, Proveedor } from '../../services/inventory';
import { CategoriaCalendario } from '../../types';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  item?: ProductoInventario | null;
  onSaved: () => void;
  proveedores: Proveedor[];
  suggestedName?: string;
  defaultCategory?: string | null;
  categoriasDB: CategoriaCalendario[];
  existingBrands?: string[];
}

const POPULAR_BRANDS = [
  // Uñas
  'Cherimoya', 'Mia Secret', 'Organic Nails', 'OPI', 'Sally Beauty', 'Wapizima', 'MC Nails', 'Fantasy Nails', 'Gelaze', 'Madam Glam', 'KSD', 
  // Pestañas / Cejas
  'Nagaraku', 'Navina', 'London Lash', 'LashBox LA', 'Neicha', 'Gollee', 
  // Cabello
  'L\'Oréal', 'Wella', 'Schwarzkopf', 'Olaplex', 'Redken'
];

const POPULAR_PROVIDERS = [
  'Mercado Libre', 'Amazon', 'AliExpress', 'Distribuidor Oficial', 'Tienda Local Física', 'Compra Directa'
];

const SMART_SUGGESTIONS: Record<string, {nombre: string, unidad_medida: string, rinde_servicios: number}[]> = {
  "manos": [
    { nombre: "Monómero", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 },
    { nombre: "Polvo Acrílico Cover", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Polvo Acrílico Clear", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Polvo Acrílico Blanco", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Base Coat", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Top Coat", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Top Coat Matte", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Primer / Adherente", unidad_medida: "Mililitros (ml)", rinde_servicios: 60 },
    { nombre: "Nail Prep / Deshidratador", unidad_medida: "Mililitros (ml)", rinde_servicios: 60 },
    { nombre: "Tips de Uñas", unidad_medida: "Cajas", rinde_servicios: 20 },
    { nombre: "Pegamento / Resina", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 },
    { nombre: "Polygel / Acrygel", unidad_medida: "Gramos (gr)", rinde_servicios: 20 },
    { nombre: "Gel de Construcción (Builder Gel)", unidad_medida: "Gramos (gr)", rinde_servicios: 20 },
    { nombre: "Esmalte Semipermanente (Color)", unidad_medida: "Unidades", rinde_servicios: 30 },
    { nombre: "Moldes para Esculpir", unidad_medida: "Unidades", rinde_servicios: 500 },
    { nombre: "Aceite de Cutícula", unidad_medida: "Mililitros (ml)", rinde_servicios: 80 },
    { nombre: "Cleanser / Limpiador de Gel", unidad_medida: "Mililitros (ml)", rinde_servicios: 60 },
    { nombre: "Limas 100/100", unidad_medida: "Unidades", rinde_servicios: 5 },
    { nombre: "Limas 150/150", unidad_medida: "Unidades", rinde_servicios: 5 },
    { nombre: "Limas 240/240", unidad_medida: "Unidades", rinde_servicios: 5 },
    { nombre: "Buffer / Sponge", unidad_medida: "Unidades", rinde_servicios: 5 },
    { nombre: "Palitos de Naranjo", unidad_medida: "Unidades", rinde_servicios: 100 },
    { nombre: "Wipes / Gasas sin pelusa", unidad_medida: "Unidades", rinde_servicios: 100 },
    { nombre: "Acetona Pura", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 }
  ],
  "pestañas": [
    { nombre: "Adhesivo para Pestañas", unidad_medida: "Mililitros (ml)", rinde_servicios: 60 },
    { nombre: "Blister Extensiones", unidad_medida: "Cajas", rinde_servicios: 5 },
    { nombre: "Parches de Hidrogel", unidad_medida: "Pares", rinde_servicios: 1 },
    { nombre: "Microbrush", unidad_medida: "Unidades", rinde_servicios: 100 },
    { nombre: "Lipbrush", unidad_medida: "Unidades", rinde_servicios: 50 },
    { nombre: "Lash Shampoo", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 },
    { nombre: "Primer de Pestañas", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Removedor en Crema / Gel", unidad_medida: "Mililitros (ml)", rinde_servicios: 30 },
    { nombre: "Superbonder / Sellador", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Cinta Micropore", unidad_medida: "Unidades", rinde_servicios: 50 },
    { nombre: "Anillos para Pegamento", unidad_medida: "Unidades", rinde_servicios: 100 }
  ],
  "cabello": [
    { nombre: "Decolorante en Polvo", unidad_medida: "Gramos (gr)", rinde_servicios: 10 },
    { nombre: "Oxigenta / Peróxido 10 Vol", unidad_medida: "Mililitros (ml)", rinde_servicios: 15 },
    { nombre: "Oxigenta / Peróxido 20 Vol", unidad_medida: "Mililitros (ml)", rinde_servicios: 15 },
    { nombre: "Oxigenta / Peróxido 30 Vol", unidad_medida: "Mililitros (ml)", rinde_servicios: 15 },
    { nombre: "Tubo de Tinte (Coloración)", unidad_medida: "Unidades", rinde_servicios: 2 },
    { nombre: "Shampoo Neutro (Litro)", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Mascarilla / Tratamiento Capilar", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Keratina / Alisado (Litro)", unidad_medida: "Mililitros (ml)", rinde_servicios: 15 },
    { nombre: "Botox Capilar", unidad_medida: "Gramos (gr)", rinde_servicios: 10 },
    { nombre: "Matizador / Shampoo Violeta", unidad_medida: "Mililitros (ml)", rinde_servicios: 30 },
    { nombre: "Papel Aluminio", unidad_medida: "Unidades", rinde_servicios: 20 },
    { nombre: "Capas Desechables", unidad_medida: "Unidades", rinde_servicios: 1 },
    { nombre: "Cuellos de Papel (Barbería)", unidad_medida: "Unidades", rinde_servicios: 100 },
    { nombre: "Hojillas / Navajas sueltas", unidad_medida: "Unidades", rinde_servicios: 100 },
    { nombre: "Talco de Barbería", unidad_medida: "Gramos (gr)", rinde_servicios: 60 }
  ],
  "pedicure": [
    { nombre: "Sales Relajantes", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Pastillas Efervescentes", unidad_medida: "Unidades", rinde_servicios: 20 },
    { nombre: "Removedor de Callos (Callus Remover)", unidad_medida: "Mililitros (ml)", rinde_servicios: 25 },
    { nombre: "Crema Exfoliante", unidad_medida: "Gramos (gr)", rinde_servicios: 40 },
    { nombre: "Crema Hidratante Pies", unidad_medida: "Gramos (gr)", rinde_servicios: 40 },
    { nombre: "Separador de Dedos", unidad_medida: "Pares", rinde_servicios: 1 }
  ],
  "facial": [
    { nombre: "Leche Limpiadora / Gel", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 },
    { nombre: "Agua Micelar", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Tónico Facial", unidad_medida: "Mililitros (ml)", rinde_servicios: 50 },
    { nombre: "Exfoliante Facial", unidad_medida: "Gramos (gr)", rinde_servicios: 30 },
    { nombre: "Mascarilla Arcilla / Hidroplástica", unidad_medida: "Gramos (gr)", rinde_servicios: 25 },
    { nombre: "Sérum Ácido Hialurónico", unidad_medida: "Mililitros (ml)", rinde_servicios: 30 },
    { nombre: "Sérum Vitamina C", unidad_medida: "Mililitros (ml)", rinde_servicios: 30 },
    { nombre: "Protector Solar Facial", unidad_medida: "Gramos (gr)", rinde_servicios: 40 },
    { nombre: "Esponjas Faciales Desechables", unidad_medida: "Unidades", rinde_servicios: 1 }
  ],
  "general": [
    { nombre: "Algodón", unidad_medida: "Gramos (gr)", rinde_servicios: 100 },
    { nombre: "Alcohol 70%", unidad_medida: "Mililitros (ml)", rinde_servicios: 100 },
    { nombre: "Alcohol 96%", unidad_medida: "Mililitros (ml)", rinde_servicios: 100 },
    { nombre: "Guantes de Nitrilo", unidad_medida: "Pares", rinde_servicios: 1 },
    { nombre: "Mascarillas Desechables / Cubrebocas", unidad_medida: "Unidades", rinde_servicios: 1 },
    { nombre: "Toallas Desechables / Toalla Facial", unidad_medida: "Unidades", rinde_servicios: 1 },
    { nombre: "Solución Desinfectante / Barbicide", unidad_medida: "Mililitros (ml)", rinde_servicios: 40 },
    { nombre: "Cepillos de Limpieza", unidad_medida: "Unidades", rinde_servicios: 20 },
    { nombre: "Sobres Esterilización (Papel Kraft)", unidad_medida: "Unidades", rinde_servicios: 1 }
  ]
};

export default function InventoryItemModal({ isOpen, onClose, businessId, item, onSaved, proveedores, suggestedName, defaultCategory, categoriasDB, existingBrands = [] }: InventoryItemModalProps) {
  const [newProviderName, setNewProviderName] = useState('');
  const [formData, setFormData] = useState<Partial<ProductoInventario>>({
    nombre: '',
    marca: '',
    cantidad_total: 1,
    unidad_medida: 'Unidades',
    rinde_servicios: 10,
    stock_minimo: 1,
    categorias_aplicables: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          ...item,
          categorias_aplicables: item.categorias_aplicables || []
        });
      } else {
        const initialCategories = defaultCategory ? [defaultCategory] : [];
        setFormData({
          nombre: suggestedName || '',
          marca: '',
          cantidad_total: 1,
          unidad_medida: 'Unidades',
          rinde_servicios: 10,
          stock_minimo: 1,
          categorias_aplicables: initialCategories,
          proveedor_id: proveedores.length > 0 ? proveedores[0].id : undefined
        });
      }
    }
  }, [isOpen, item, suggestedName, defaultCategory, proveedores]);

  const activeSuggestions = useMemo(() => {
    let suggestions: {nombre: string, unidad_medida: string, rinde_servicios: number}[] = [];
    const cats = formData.categorias_aplicables || [];
    
    cats.forEach(catName => {
      const lowerName = catName.toLowerCase();
      if (lowerName.includes('mano') || lowerName.includes('uña') || lowerName.includes('acrilic') || lowerName.includes('nail')) suggestions.push(...SMART_SUGGESTIONS["manos"]);
      if (lowerName.includes('pestaña') || lowerName.includes('ceja') || lowerName.includes('lash') || lowerName.includes('brow')) suggestions.push(...SMART_SUGGESTIONS["pestañas"]);
      if (lowerName.includes('pelo') || lowerName.includes('cabello') || lowerName.includes('barber') || lowerName.includes('color')) suggestions.push(...SMART_SUGGESTIONS["cabello"]);
      if (lowerName.includes('pie') || lowerName.includes('pedi') || lowerName.includes('podo')) suggestions.push(...SMART_SUGGESTIONS["pedicure"]);
      if (lowerName.includes('rostro') || lowerName.includes('cara') || lowerName.includes('facial') || lowerName.includes('maquillaje')) suggestions.push(...SMART_SUGGESTIONS["facial"]);
    });

    if (suggestions.length === 0) {
      suggestions = [...SMART_SUGGESTIONS["manos"].slice(0,5), ...SMART_SUGGESTIONS["cabello"].slice(0,3), ...SMART_SUGGESTIONS["general"]];
    }
    
    suggestions.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const unique = Array.from(new Set(suggestions.map(s => s.nombre)))
      .map(name => suggestions.find(s => s.nombre === name)!);

    return unique;
  }, [formData.categorias_aplicables]);

  const applySuggestion = (s: {nombre: string, unidad_medida: string, rinde_servicios: number}) => {
    setFormData(prev => ({
      ...prev,
      nombre: s.nombre,
      unidad_medida: s.unidad_medida,
      rinde_servicios: s.rinde_servicios
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;
    
    setIsSaving(true);
    try {
      let finalProveedorId = formData.proveedor_id;
      
      // Si el usuario tipeo un nombre nuevo de proveedor que no tiene ID aún, lo creamos ahora mismo!
      if (!finalProveedorId && newProviderName && newProviderName.trim() !== '') {
        const createdProv = await inventoryService.upsertProveedor({
          business_id: businessId,
          nombre: newProviderName.trim()
        });
        finalProveedorId = createdProv.id; // Y agarramos el nuevo ID que nos devuelve supabase!
      }

      const payload = {
        ...formData,
        proveedor_id: finalProveedorId,
        business_id: businessId,
        categorias_aplicables: formData.categorias_aplicables || [],
      };

      await inventoryService.upsertProducto(payload);
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error saving product exacto:", !!error ? JSON.parse(JSON.stringify(error)) : error);
      alert(`Hubo un error al guardar el producto (Detalle Técnico para Nilah): ${JSON.stringify(error, null, 2)} \n\nMensaje: ${error?.message || ''}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setFormData(prev => {
      const cats = prev.categorias_aplicables || [];
      if (cats.includes(catId)) {
        return { ...prev, categorias_aplicables: cats.filter(c => c !== catId) };
      } else {
        return { ...prev, categorias_aplicables: [...cats, catId] };
      }
    });
  };

  if (!isOpen) return null;

  const isCustomName = !activeSuggestions.some(s => s.nombre === formData.nombre);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pb-20 sm:pb-6 bg-gray-900/40 backdrop-blur-sm sm:p-6">
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
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {item ? 'Editar Insumo' : 'Nuevo Insumo'}
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Tu stock inteligente</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto custom-scrollbar">
            <form id="inventory-form" onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  <Layers size={14} className="text-emerald-500" />
                  Paso 1: ¿En qué servicios lo usarás?
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {categoriasDB.map(cat => {
                    const isSelected = formData.categorias_aplicables?.includes(cat.nombre);
                    return (
                      <button
                        type="button"
                        key={cat.id ? `cat-${cat.id}` : `cat-name-${cat.nombre}`}
                        onClick={() => toggleCategory(cat.nombre)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border flex items-center gap-1.5
                          ${isSelected 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-md' 
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300'
                          }`}
                      >
                        {cat.emoji || '📦'} {cat.nombre}
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  Paso 2: ¿Qué producto vas a añadir?
                </label>
                
                <div className="relative">
                  <select
                    value={!isCustomName ? formData.nombre : "custom"}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        const s = activeSuggestions.find(x => x.nombre === e.target.value);
                        if (s) applySuggestion(s);
                      } else {
                        setFormData({ ...formData, nombre: '' });
                      }
                    }}
                    className="w-full pl-4 pr-10 py-3.5 bg-emerald-50 dark:bg-gray-800 border border-emerald-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-shadow text-emerald-900 dark:text-white font-semibold appearance-none"
                  >
                    <option value="custom" disabled={!isCustomName} className="text-gray-500 bg-white dark:bg-gray-800 font-normal">-- Despliega la lista predictiva --</option>
                    {activeSuggestions.map((s, idx) => (
                      <option key={idx} value={s.nombre} className="text-gray-900 dark:text-white bg-white dark:bg-gray-800 font-medium">
                        {s.nombre}
                      </option>
                    ))}
                    <option value="custom" className="text-indigo-600 dark:text-emerald-400 bg-white dark:bg-gray-800 font-bold">+ Escribir mi propio producto personalizado...</option>
                  </select>
                  
                  {/* Custom Arrow */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-6 h-6 flex items-center justify-center bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>

                {isCustomName && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-2"
                  >
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Escribe el nombre de tu insumo..."
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white font-medium shadow-sm"
                      autoFocus
                    />
                  </motion.div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200">Marca</label>
                <input
                  type="text"
                  value={formData.marca || ''}
                  onChange={e => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ej. Mia Secret, Davines..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Set([...existingBrands, ...POPULAR_BRANDS])).map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setFormData({ ...formData, marca: brand })}
                      className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-700 transition-colors"
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center justify-between">
                  <span>Proveedor / Tienda <span className="text-gray-400 font-normal">(Opcional)</span></span>
                </label>
                <div className="relative">
                  <input
                    list="proveedores-datalist"
                    type="text"
                    placeholder="Elige o escribe el distribuidor"
                    value={formData.proveedor_id ? (proveedores?.find(p => p.id === formData.proveedor_id)?.nombre || '') : newProviderName}
                    onChange={e => {
                      const val = e.target.value;
                      setNewProviderName(val);
                      // Check if matches an existing provider exactly
                      const existing = proveedores?.find(p => p.nombre.toLowerCase() === val.toLowerCase());
                      if (existing) {
                        setFormData({ ...formData, proveedor_id: existing.id });
                      } else {
                        setFormData({ ...formData, proveedor_id: undefined }); // Limpiamos para forzar la creacion
                      }
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                  />
                  <datalist id="proveedores-datalist">
                    {/* Proveedores que ya tiene la tienda en BD */}
                    {proveedores?.map(p => (
                      <option key={p.id} value={p.nombre} />
                    ))}
                    {/* Más ideas super populares sugeridas, que no estén repetidas */}
                    {POPULAR_PROVIDERS
                      .filter(popName => !(proveedores?.some(dbP => dbP.nombre.toLowerCase() === popName.toLowerCase())))
                      .map(popName => (
                        <option key={popName} value={popName} />
                      ))
                    }
                  </datalist>
                </div>
                <p className="text-[10px] text-gray-500">Si escribes un nombre nuevo, lo agregaremos automáticamente a tu lista.</p>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="text-emerald-600 dark:text-emerald-400" size={18} />
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">Rendimiento (Autodescuento)</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-400">¿Cuánto tienes?</label>
                    <div className="flex items-center gap-1">
                       <input
                        type="number"
                        min="0"
                        step="0.1"
                        required
                        value={formData.cantidad_total || ''}
                        onChange={e => setFormData({ ...formData, cantidad_total: parseFloat(e.target.value) })}
                        className="w-14 sm:w-16 px-2 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-lg outline-none text-gray-900 dark:text-white font-medium text-center"
                      />
                      <select
                        value={formData.unidad_medida}
                        onChange={e => setFormData({ ...formData, unidad_medida: e.target.value })}
                        className="flex-1 px-1 sm:px-2 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-lg outline-none text-gray-900 dark:text-white font-medium text-xs sm:text-sm"
                      >
                        <option value="Unidades">Unid.</option>
                        <option value="Cajas">Cajas</option>
                        <option value="Pares">Pares</option>
                        <option value="Mililitros (ml)">Ml</option>
                        <option value="Gramos (gr)">Gr</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-400">Rinde aprox.</label>
                    <div className="flex items-center gap-1 relative">
                       <input
                        type="number"
                        min="1"
                        required
                        value={formData.rinde_servicios || ''}
                        onChange={e => setFormData({ ...formData, rinde_servicios: parseFloat(e.target.value) })}
                        className="w-full px-2 sm:px-3 py-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 rounded-lg outline-none text-gray-900 dark:text-white font-medium pr-16"
                      />
                      <span className="absolute right-2 text-[10px] text-gray-500">servicios</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-900 dark:text-gray-200 flex items-center justify-between">
                  Avisarme si me quedan menos de:
                </label>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={formData.stock_minimo || 1}
                    onChange={e => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) })}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="w-12 text-center font-bold text-gray-900 dark:text-white">{formData.stock_minimo}</span>
                </div>
              </div>

            </form>
          </div>

          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20 shrink-0">
            <button
              form="inventory-form"
              type="submit"
              disabled={isSaving || !formData.nombre || (formData.categorias_aplicables?.length === 0)}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/30 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {isSaving ? <span className="animate-pulse">Guardando...</span> : 'Guardar y Automatizar'}
            </button>
            {formData.categorias_aplicables?.length === 0 && (
              <p className="text-center text-[10px] text-rose-500 mt-2">Selecciona al menos 1 categoría de servicio para vincular</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
