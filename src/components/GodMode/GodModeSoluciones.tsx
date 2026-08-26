import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, RefreshCw, CheckCircle, Smartphone, MessageSquare, Tag, Download, Eye, TrendingUp, BarChart3, Layers, ArrowUp, ArrowDown, User, Sparkles } from 'lucide-react';
import { getSoluciones, saveSolucion, deleteSolucion, getCategorias, saveCategorias, getHeaderConfig, saveHeaderConfig, SolucionItem, CategoriaPersonalizada, SolucionesHeaderConfig, MODULOS_DEFAULT, CATEGORIAS_DEFAULT, HEADER_DEFAULT } from '../../services/solucionesService';

export const GodModeSoluciones: React.FC = () => {
  const [soluciones, setSoluciones] = useState<SolucionItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPersonalizada[]>([]);
  const [headerConfig, setHeaderConfig] = useState<SolucionesHeaderConfig>(HEADER_DEFAULT);
  const [activeTab, setActiveTab] = useState<'modulos' | 'categorias' | 'header'>('modulos');
  const [loading, setLoading] = useState(true);

  // Estados de edición de Soluciones
  const [editingItem, setEditingItem] = useState<Partial<SolucionItem> | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // Estados de edición de Categorías
  const [editingCat, setEditingCat] = useState<Partial<CategoriaPersonalizada> | null>(null);
  const [isNewCat, setIsNewCat] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [dataSoluciones, dataCats, dataHeader] = await Promise.all([
      getSoluciones(),
      getCategorias(),
      getHeaderConfig(),
    ]);
    setSoluciones(dataSoluciones);
    setCategorias(dataCats.sort((a, b) => a.orden - b.orden));
    setHeaderConfig(dataHeader);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const totalClics = soluciones.reduce((acc, curr) => acc + (curr.clics_count || 0), 0);
  const moduloMasPopular = [...soluciones].sort((a, b) => (b.clics_count || 0) - (a.clics_count || 0))[0];

  /* ── MANEJO DEL HEADER ── */
  const handleSaveHeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveHeaderConfig(headerConfig);
    setSaving(false);
    setMessage('¡Textos del Header guardados exitosamente!');
    setTimeout(() => setMessage(null), 3000);
    loadAll();
  };

  /* ── MANEJO DE CATEGORÍAS ── */
  const handleEditCat = (cat: CategoriaPersonalizada) => {
    setEditingCat({ ...cat });
    setIsNewCat(false);
  };

  const handleCreateCat = () => {
    setEditingCat({
      id: 'cat-' + Date.now(),
      label: 'Nueva Categoría',
      shortLabel: 'Nueva',
      icon: '🚀',
      orden: categorias.length + 1,
      activo: true
    });
    setIsNewCat(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.id || !editingCat.label) return;

    setSaving(true);
    let updatedCats = [...categorias];
    const index = updatedCats.findIndex(c => c.id === editingCat.id);
    if (index >= 0) {
      updatedCats[index] = editingCat as CategoriaPersonalizada;
    } else {
      updatedCats.push(editingCat as CategoriaPersonalizada);
    }
    await saveCategorias(updatedCats);
    setSaving(false);
    setMessage('¡Categoría guardada exitosamente!');
    setTimeout(() => setMessage(null), 3000);
    setEditingCat(null);
    loadAll();
  };

  const handleMoveCat = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categorias.length) return;

    const updated = [...categorias];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reordered = updated.map((cat, i) => ({ ...cat, orden: i + 1 }));
    setCategorias(reordered);
    await saveCategorias(reordered);
  };

  /* ── MANEJO DE MÓDULOS ── */
  const handleEditItem = (item: SolucionItem) => {
    setEditingItem({ ...item });
    setIsNewItem(false);
  };

  const handleCreateItem = () => {
    setEditingItem({
      id: 'solucion-' + Date.now(),
      categoria: categorias[0]?.id || 'infoproductos',
      titulo: '',
      subtitulo: 'Recurso Gratuito (PDF)',
      descripcion: '',
      badge: '🎁 100% Gratis',
      icono: '📚',
      precio: 'GRATIS',
      mensaje_whatsapp: 'Hola Martín! Quiero descargar este recurso...',
      url_checkout: '',
      url_demo: '',
      tipo_boton: 'descarga',
      clics_count: 0,
      orden: soluciones.length + 1,
      activo: true,
    });
    setIsNewItem(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.titulo || !editingItem.descripcion) return;

    setSaving(true);
    await saveSolucion(editingItem as SolucionItem);
    setSaving(false);
    setMessage('¡Ítem guardado exitosamente!');
    setTimeout(() => setMessage(null), 3000);
    setEditingItem(null);
    loadAll();
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este ítem?')) return;
    await deleteSolucion(id);
    loadAll();
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('¿Restablecer catálogo, encabezados y categorías predeterminadas?')) return;
    await saveHeaderConfig(HEADER_DEFAULT);
    await saveCategorias(CATEGORIAS_DEFAULT);
    for (const item of MODULOS_DEFAULT) {
      await saveSolucion(item as SolucionItem);
    }
    loadAll();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Gestor & Analytics TikTok /Soluciones</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Personaliza los textos del perfil (badges, nombre, subtítulo), gestiona las sub-pestañas, edita tus Ebooks y analiza los clics recibidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Cargar catálogo por defecto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          {activeTab === 'modulos' && (
            <button
              onClick={handleCreateItem}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Ítem / Ebook</span>
            </button>
          )}

          {activeTab === 'categorias' && (
            <button
              onClick={handleCreateCat}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Pestaña</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-NAVEGACIÓN INTERNA: MÓDULOS VS CATEGORÍAS VS HEADER */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('modulos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'modulos' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Ítems & Ebooks ({soluciones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('header')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'header' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
        >
          <User className="w-4 h-4" />
          <span>Editar Perfil & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${activeTab === 'categorias' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
        >
          <Layers className="w-4 h-4" />
          <span>Editar Pestañas & Orden ({categorias.length})</span>
        </button>
      </div>

      {/* METRICAS DE CLICS */}
      {activeTab === 'modulos' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Total Conversiones / Clics</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalClics}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Módulos Publicados</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{soluciones.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Eye className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-500 dark:text-zinc-400 block font-medium">Más Clickeado en TikTok</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                {moduloMasPopular ? `${moduloMasPopular.icono} ${moduloMasPopular.titulo}` : 'Sin datos'}
              </span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* VISTA 1: GESTIÓN DE MÓDULOS */}
      {activeTab === 'modulos' && (
        loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando catálogo...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soluciones.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-zinc-900 border rounded-xl p-4 flex flex-col justify-between relative transition-all shadow-sm ${item.activo ? 'border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50' : 'border-slate-100 opacity-60'}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                        {item.icono || '🚀'}
                      </span>
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                          {item.categoria}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {item.titulo}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.badge && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.badge}
                        </span>
                      )}
                      {item.precio && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-emerald-700 border border-emerald-200">
                          {item.precio}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-3 mb-3">
                    {item.descripcion}
                  </p>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-950 px-3 py-2 rounded-lg border border-slate-200/80 mb-4">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Clics:
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.clics_count || 0} clics
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditItem(item)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* VISTA 2: EDICIÓN DE TEXTOS GLOBALES, HERO FREEMIUM, BANNER & FOOTER */}
      {activeTab === 'header' && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-200 dark:border-zinc-800 pb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>Personalizar Todos los Copys y Textos de /soluciones</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Modifica en tiempo real los textos del perfil, la tarjeta del sistema gratis, la regla de oro, el botón de software a medida y el pie de página.
            </p>
          </div>

          <form onSubmit={handleSaveHeader} className="space-y-6">
            
            {/* SECCIÓN 1: PERFIL & CABECERA */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Sparkles size={14} /> 1. Encabezado, Perfil & WhatsApp
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Badge Superior de Estado / Disponibilidad
                </label>
                <input
                  type="text"
                  required
                  value={headerConfig.statusBadge || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, statusBadge: e.target.value })}
                  placeholder="Ej: 🟢 Cupos abiertos para salones & proyectos a medida"
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Nombre Principal
                  </label>
                  <input
                    type="text"
                    required
                    value={headerConfig.nombrePersona || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, nombrePersona: e.target.value })}
                    placeholder="Ej: Martín Pestana"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Número de WhatsApp (con código país, sin +)
                  </label>
                  <input
                    type="text"
                    required
                    value={headerConfig.whatsappNumber || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, whatsappNumber: e.target.value })}
                    placeholder="Ej: 51926285289"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Subtítulo de Marca / Especialidad
                </label>
                <input
                  type="text"
                  required
                  value={headerConfig.subtituloPersona || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, subtituloPersona: e.target.value })}
                  placeholder="Ej: Te enseño a multiplicar las ventas y retención de tu salón por WhatsApp..."
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge de Confianza 1 (Icono Check)
                  </label>
                  <input
                    type="text"
                    value={headerConfig.trustBadge1 || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, trustBadge1: e.target.value })}
                    placeholder="Ej: Cero Plantones en Citas"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge de Confianza 2 (Icono Estrella)
                  </label>
                  <input
                    type="text"
                    value={headerConfig.trustBadge2 || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, trustBadge2: e.target.value })}
                    placeholder="Ej: Retoques Automáticos a los 21d"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: REGLA DE ORO / FILOSOFÍA */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                💡 2. Banner de Regla de Oro / Filosofía de Retención
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Texto de la Regla de Oro
                </label>
                <textarea
                  rows={2}
                  value={headerConfig.filosofiaTexto || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, filosofiaTexto: e.target.value })}
                  placeholder="Ej: El 60% de tus clientas no regresan porque nadie les escribe a tiempo..."
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* SECCIÓN 3: HERO DEL SISTEMA GRATIS (FREEMIUM) */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                ⚡ 3. Tarjeta Hero del Sistema Gratuito (Freemium)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Badge de la Tarjeta
                  </label>
                  <input
                    type="text"
                    value={headerConfig.freemiumBadge || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumBadge: e.target.value })}
                    placeholder="SISTEMA GRATUITO (FREEMIUM)"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={headerConfig.freemiumTitulo || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumTitulo: e.target.value })}
                    placeholder="Nilah App — Sistema para Salones"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Subtítulo Explicativo
                </label>
                <input
                  type="text"
                  value={headerConfig.freemiumSubtitulo || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, freemiumSubtitulo: e.target.value })}
                  placeholder="¡Dile adiós al cuaderno y al Excel! Controla tus citas, fichas..."
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Las 4 características del Freemium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-400">BENEFICIO 1</span>
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature1Title || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature1Title: e.target.value })}
                    placeholder="Título 1 (Ej: Caja Chica & Ventas)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature1Desc || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature1Desc: e.target.value })}
                    placeholder="Descripción 1"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-slate-500"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-400">BENEFICIO 2</span>
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature2Title || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature2Title: e.target.value })}
                    placeholder="Título 2 (Ej: Fichas de Clientas)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature2Desc || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature2Desc: e.target.value })}
                    placeholder="Descripción 2"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-slate-500"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-400">BENEFICIO 3</span>
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature3Title || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature3Title: e.target.value })}
                    placeholder="Título 3 (Ej: Agenda & Citas)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature3Desc || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature3Desc: e.target.value })}
                    placeholder="Descripción 3"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-slate-500"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black text-slate-400">BENEFICIO 4</span>
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature4Title || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature4Title: e.target.value })}
                    placeholder="Título 4 (Ej: 100% en tu Celular)"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={headerConfig.freemiumFeature4Desc || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumFeature4Desc: e.target.value })}
                    placeholder="Descripción 4"
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Botón CTA
                  </label>
                  <input
                    type="text"
                    value={headerConfig.freemiumBotonTexto || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumBotonTexto: e.target.value })}
                    placeholder="EMPEZAR A USAR GRATIS AHORA"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    URL de Redirección del Botón
                  </label>
                  <input
                    type="text"
                    value={headerConfig.freemiumBotonUrl || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, freemiumBotonUrl: e.target.value })}
                    placeholder="/login?tab=register"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Texto Aclaratorio Inferior (Disclaimer)
                </label>
                <input
                  type="text"
                  value={headerConfig.freemiumDisclaimer || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, freemiumDisclaimer: e.target.value })}
                  placeholder="Ideal para Lashistas, Manicuristas y Salones. Sin tarjeta de crédito."
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* SECCIÓN 4: BANNER SOFTWARE A MEDIDA */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-violet-600 flex items-center gap-1.5">
                ⚡ 4. Banner / Botón de Software a Medida
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Título del Banner
                  </label>
                  <input
                    type="text"
                    value={headerConfig.aMedidaTitulo || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, aMedidaTitulo: e.target.value })}
                    placeholder="¿Buscas Software o Bots con IA a Medida?"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={headerConfig.aMedidaSubtitulo || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, aMedidaSubtitulo: e.target.value })}
                    placeholder="Para academias, clínicas estéticas o empresas de otros rubros."
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={headerConfig.aMedidaBotonTexto || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, aMedidaBotonTexto: e.target.value })}
                    placeholder="Cotizar en WhatsApp"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Mensaje Precargado de WhatsApp
                  </label>
                  <input
                    type="text"
                    value={headerConfig.aMedidaWhatsappMensaje || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, aMedidaWhatsappMensaje: e.target.value })}
                    placeholder="¡Hola Martín! Vi tus videos en TikTok y me gustaría cotizar..."
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: PIE DE PÁGINA / FOOTER */}
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                💬 5. Pie de Página y Contacto Directo
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Pregunta Final del Footer
                </label>
                <input
                  type="text"
                  value={headerConfig.footerPregunta || ''}
                  onChange={e => setHeaderConfig({ ...headerConfig, footerPregunta: e.target.value })}
                  placeholder="¿Tienes dudas o necesitas una recomendación para tu salón?"
                  className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Texto del Enlace / Botón
                  </label>
                  <input
                    type="text"
                    value={headerConfig.footerBotonTexto || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, footerBotonTexto: e.target.value })}
                    placeholder="Escríbeme directo al WhatsApp (+51 926 285 289)"
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Mensaje de WhatsApp del Footer
                  </label>
                  <input
                    type="text"
                    value={headerConfig.footerWhatsappMensaje || ''}
                    onChange={e => setHeaderConfig({ ...headerConfig, footerWhatsappMensaje: e.target.value })}
                    placeholder="Hola Martín! Vi tu perfil en TikTok y me gustaría consultarte..."
                    className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN GUARDAR */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900 py-3 z-10">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando cambios...' : 'Guardar Todos los Copys y Textos'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA 3: GESTIÓN Y ORDEN DE PESTAÑAS */}
      {activeTab === 'categorias' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Cambia los nombres, emojis o el orden en el que aparecen las pestañas superiores en tu enlace de TikTok. Usa las flechas para subir o bajar de lugar.
          </p>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl divide-y divide-slate-100 dark:divide-zinc-800 shadow-sm">
            {categorias.map((cat, index) => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-500">
                    #{index + 1}
                  </span>
                  <span className="text-xl p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200">
                    {cat.icon}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.label} <span className="text-xs font-normal text-slate-400">(Móvil: "{cat.shortLabel}")</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">ID interno: {cat.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveCat(index, 'up')}
                      className="p-1 text-slate-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded"
                      title="Subir posición"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === categorias.length - 1}
                      onClick={() => handleMoveCat(index, 'down')}
                      className="p-1 text-slate-600 dark:text-zinc-300 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded"
                      title="Bajar posición"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleEditCat(cat)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Edición de Categoría */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              {isNewCat ? 'Crear Nueva Pestaña' : 'Editar Pestaña'}
            </h3>

            <form onSubmit={handleSaveCat} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">ID de la Pestaña (Único)</label>
                <input
                  type="text"
                  required
                  disabled={!isNewCat}
                  value={editingCat.id || ''}
                  onChange={e => setEditingCat({ ...editingCat, id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre Completo (Ej: 💇‍♀️ Salones & Estética)</label>
                <input
                  type="text"
                  required
                  value={editingCat.label || ''}
                  onChange={e => setEditingCat({ ...editingCat, label: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre Corto Móvil (Ej: 💇‍♀️ Salones)</label>
                <input
                  type="text"
                  required
                  value={editingCat.shortLabel || ''}
                  onChange={e => setEditingCat({ ...editingCat, shortLabel: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Emoji / Icono</label>
                <input
                  type="text"
                  required
                  value={editingCat.icon || ''}
                  onChange={e => setEditingCat({ ...editingCat, icon: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingCat(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">Guardar Pestaña</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición de Módulo / Solución */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {isNewItem ? 'Crear Nuevo Ítem' : 'Editar Ítem'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Pestaña / Categoría</label>
                  <select
                    value={editingItem.categoria || categorias[0]?.id}
                    onChange={(e) => setEditingItem({ ...editingItem, categoria: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Clasificación / Rol</label>
                  <select
                    value={editingItem.subcategoria || 'standard'}
                    onChange={(e) => setEditingItem({ ...editingItem, subcategoria: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    <option value="standard">Estándar</option>
                    <option value="plan_basico">🟢 Plan Básico</option>
                    <option value="plan_pro">🔥 Plan PRO 360°</option>
                    <option value="addon">🧩 Add-On / Complemento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tipo de Botón</label>
                  <select
                    value={editingItem.tipo_boton || 'descarga'}
                    onChange={(e) => setEditingItem({ ...editingItem, tipo_boton: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="descarga">📥 Descarga Directa</option>
                    <option value="enlace">🛒 Checkout</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editingItem.titulo || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, titulo: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={editingItem.icono || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, icono: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={editingItem.subtitulo || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, subtitulo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-600 mb-1">Precio</label>
                  <input
                    type="text"
                    value={editingItem.precio || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, precio: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-zinc-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.descripcion || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Contenido Enriquecido / Landing Corta (Formato Markdown)
                </label>
                <textarea
                  rows={6}
                  placeholder="### 📚 Lo que aprenderás...&#10;#### 🔥 Beneficios&#10;* Puntos de impacto&#10;> 'Cita destacada'"
                  value={editingItem.contenido_detalle_markdown || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, contenido_detalle_markdown: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Usa ### para títulos, #### para subtítulos con icono, * para listas y &gt; para citas/testimonios en la sobre-pantalla.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1">
                  Texto del Botón Principal (Personalizable)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 💬 Ver Demo en Vivo o Consultar por WhatsApp"
                  value={editingItem.texto_boton_personalizado || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, texto_boton_personalizado: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Si lo dejas en blanco, usará el copy dinámico sugerido automáticamente.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1">Enlace (Drive / Hotmart)</label>
                <input
                  type="url"
                  value={editingItem.url_checkout || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url_checkout: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Mensaje WhatsApp</label>
                <textarea
                  rows={2}
                  required
                  value={editingItem.mensaje_whatsapp || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, mensaje_whatsapp: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activo-check"
                  checked={editingItem.activo ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, activo: e.target.checked })}
                />
                <label htmlFor="activo-check" className="text-xs text-slate-700 font-medium">Mostrar públicamente</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingItem(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs">Guardar Ítem</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
