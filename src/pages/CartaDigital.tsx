/**
 * CartaDigital.tsx — Panel de Administración
 * Módulo: Mi Carta Digital Interactiva
 * Plan: Glow (Freemium) + todos los planes superiores
 * 
 * Sub-pestañas:
 * 1. servicios — CRUD de categorías y servicios
 * 2. promos    — Promo del Mes + Oferta de la Semana
 * 3. stories   — Circles de inspiración estilo Instagram
 * 4. apariencia — Paletas de colores + datos del header
 * 5. preview   — Vista previa + link público + QR
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Palette, Eye, Sparkles, Tag, Plus, Trash2, Edit3,
  Save, X, ChevronDown, ChevronUp, Image, Video, Clock, DollarSign,
  Link2, Copy, Check, MapPin, Phone, Globe, Star, ToggleLeft,
  ToggleRight, Calendar, AlertCircle, Loader2, ExternalLink, QrCode,
  Info, ChevronRight, Scissors, RefreshCw, Instagram, Upload, Camera,
  Flame, Sliders, Crown, Lock, Search
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CartaCategoria, CartaServicio, CartaConfig, CartaFOMOBanner,
  CartaPromoMes, CartaOfertaSemana, CartaPromoDia, CartaPaleta, CARTA_PALETAS,
  CartaLayoutEstilo, CartaOfertasDiaConfig
} from '../types';
import { cartaCategorias, cartaServicios, cartaConfig } from '../services/api.js';
import CartaPlaybook from '../components/Carta/CartaPlaybook';
import { optimizeImageClient } from '../utils/clientImageOptimizer';

// ─── Types de Tab ───────────────────────────────────────────────────
type CartaTab = 'servicios' | 'promos' | 'fomo' | 'apariencia' | 'playbook' | 'preview';

// ─── Tabs Config ────────────────────────────────────────────────────
const TABS: { id: CartaTab; label: string; icon: React.ReactNode; isPro?: boolean }[] = [
  { id: 'servicios',  label: 'Servicios',        icon: <Scissors size={15} /> },
  { id: 'promos',     label: 'Promos',           icon: <Tag size={15} /> },
  { id: 'fomo',       label: '⚡ Flash FOMO',    icon: <Flame size={15} />, isPro: true },
  { id: 'apariencia', label: 'Apariencia',       icon: <Palette size={15} /> },
  { id: 'playbook',   label: '📚 Manual & Copys', icon: <BookOpen size={15} /> },
  { id: 'preview',    label: 'Preview',          icon: <Eye size={15} /> },
];

// ─── Helpers ────────────────────────────────────────────────────────
const EMOJIS_CATEGORIA = ['💅','💇','💆','🦶','👁️','💄','✂️','🌸','💎','✨','🧖','🛁','💐','🪭','🌺'];

const formatPrecio = (precio?: number | null, desde?: boolean) => {
  if (!precio) return 'Precio a consultar';
  return desde ? `Desde S/ ${precio.toFixed(2)}` : `S/ ${precio.toFixed(2)}`;
};

// ─── Blank forms ────────────────────────────────────────────────────
const blankServicio = (): Partial<CartaServicio> => ({
  nombre: '', descripcion: '', precio: undefined, precio_desde: false,
  duracion_min: undefined, media_url: '', media_tipo: 'imagen',
  destacado: false, activo: true, orden: 0,
});

const blankCategoria = (): Partial<CartaCategoria> => ({
  nombre: '', emoji: '✨', orden: 0, activo: true,
});

// ─── Sub-componente: Empty State ─────────────────────────────────────
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; action?: React.ReactNode }> = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-brand)/10', color: 'var(--color-brand)' }}>
      {icon}
    </div>
    <h3 className="text-base font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
    <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
    {action}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────
const CartaDigital: React.FC = () => {
  const { user, isPro, hasSaaSFeature } = useAuth();
  const businessId = user?.business_id || '';

  // Permisos Pro específicos otorgados o habilitados desde SuperAdmin
  const canDirectBooking = isPro || hasSaaSFeature('carta_digital', 'agendamiento_directo');
  const canFomoCountdown = isPro || hasSaaSFeature('carta_digital', 'fomo_countdown');
  const canAntesDespues = isPro || hasSaaSFeature('carta_digital', 'antes_despues');
  const canBrandingPro = isPro || hasSaaSFeature('carta_digital', 'branding_pro');

  const [activeTab, setActiveTab] = useState<CartaTab>('servicios');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Data
  const [categorias, setCategorias] = useState<CartaCategoria[]>([]);
  const [serviciosData, setServiciosData] = useState<CartaServicio[]>([]);
  const [config, setConfig] = useState<CartaConfig>({
    business_id: businessId,
    paleta: 'rose',
    color_primario: CARTA_PALETAS.rose.primario,
    color_secundario: CARTA_PALETAS.rose.secundario,
    color_acento: CARTA_PALETAS.rose.acento,
    nombre_salon: '',
    logo_url: '',
    descripcion_header: '',
    telefono_whatsapp: '',
    maps_url: '',
    horario: '',
    promo_mes: null,
    oferta_semana: null,
    fomo_banner: {
      activo: false,
      titulo: '⚡ Flash Sale Especial',
      subtitulo: 'Aprovecha solo por hoy nuestro descuento exclusivo',
      descuento_tag: '25% OFF',
      badge_emoji: '🔥',
      expira_en: '',
      enlace_whatsapp: true,
    },
  });

  // UI states — Servicios
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [busquedaServicios, setBusquedaServicios] = useState('');
  const [busquedaAntesDespues, setBusquedaAntesDespues] = useState('');
  const [busquedaEspecialesDia, setBusquedaEspecialesDia] = useState('');
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCat, setNewCat] = useState<Partial<CartaCategoria>>(blankCategoria());
  const [showNewServForm, setShowNewServForm] = useState<string | null>(null); // categoria_id
  const [newServ, setNewServ] = useState<Partial<CartaServicio>>(blankServicio());
  const [editingServId, setEditingServId] = useState<string | null>(null);
  const [editingServ, setEditingServ] = useState<Partial<CartaServicio>>({});

  // UI states — Apariencia
  const [copiedLink, setCopiedLink] = useState(false);
  const publicLink = `${window.location.origin}/carta/${businessId}`;

  // ─── Load Data ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, srvs, cfg] = await Promise.all([
        cartaCategorias.list(),
        cartaServicios.listAll(),
        cartaConfig.get(),
      ]);
      setCategorias(cats);
      setServiciosData(srvs);
      if (cfg) {
        setConfig(prev => ({
          ...prev,
          ...cfg,
          nombre_salon: cfg.nombre_salon || user?.nombreNegocio || prev.nombre_salon || '',
        }));
      } else if (user?.nombreNegocio) {
        setConfig(prev => ({ ...prev, nombre_salon: user.nombreNegocio }));
      }
    } catch (e) {
      console.error('Error cargando carta:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.nombreNegocio]);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Handlers: Categorías ────────────────────────────────────────
  const handleCreateCategoria = async () => {
    if (!newCat.nombre?.trim()) return;
    setSaving(true);
    try {
      const created = await cartaCategorias.create({ ...newCat, orden: categorias.length });
      setCategorias(prev => [...prev, created]);
      setNewCat(blankCategoria());
      setShowNewCatForm(false);
      setExpandedCat(created.id);
      showToast('Categoría creada ✨');
    } catch { showToast('Error al crear categoría', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los servicios quedarán sin categoría.')) return;
    try {
      await cartaCategorias.remove(id);
      setCategorias(prev => prev.filter(c => c.id !== id));
      showToast('Categoría eliminada');
    } catch { showToast('Error al eliminar', 'error'); }
  };

  // ─── Handlers: Servicios ─────────────────────────────────────────
  const handleCreateServicio = async (categoriaId?: string) => {
    if (!newServ.nombre?.trim()) return;
    setSaving(true);
    try {
      const created = await cartaServicios.create({
        ...newServ,
        categoria_id: categoriaId || null,
        orden: serviciosData.filter(s => s.categoria_id === categoriaId).length,
      });
      setServiciosData(prev => [...prev, created]);
      setNewServ(blankServicio());
      setShowNewServForm(null);
      showToast('Servicio añadido 💅');
    } catch { showToast('Error al crear servicio', 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdateServicio = async (id: string) => {
    setSaving(true);
    try {
      const updated = await cartaServicios.update(id, editingServ);
      setServiciosData(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
      setEditingServId(null);
      showToast('Servicio actualizado ✅');
    } catch { showToast('Error al actualizar', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggleDestacado = async (srv: CartaServicio) => {
    const nextVal = !srv.destacado;
    // Optimistic update
    setServiciosData(prev => prev.map(s => s.id === srv.id ? { ...s, destacado: nextVal } : s));
    try {
      await cartaServicios.update(srv.id, { destacado: nextVal });
      showToast(nextVal ? 'Marcado como Top / Oferta del Día ⭐' : 'Quitado de Top');
    } catch {
      // Revert on error
      setServiciosData(prev => prev.map(s => s.id === srv.id ? { ...s, destacado: srv.destacado } : s));
      showToast('Error al actualizar Top', 'error');
    }
  };

  const handleQuickUpdateServicio = async (id: string, updates: Partial<CartaServicio>) => {
    setServiciosData(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      await cartaServicios.update(id, updates);
      showToast('Actualizado con éxito ✅');
    } catch {
      await loadData();
      showToast('Error al guardar cambios', 'error');
    }
  };

  const handleDeleteServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    try {
      await cartaServicios.remove(id);
      setServiciosData(prev => prev.filter(s => s.id !== id));
      showToast('Servicio eliminado');
    } catch { showToast('Error al eliminar', 'error'); }
  };

  // ─── Sincronización con Ajustes > Mi Salón ───────────────────────
  const [syncing, setSyncing] = useState(false);
  const handleSincronizarAjustes = async () => {
    setSyncing(true);
    try {
      const res = await cartaServicios.sincronizarDesdeAjustes();
      await loadData();
      showToast(res.mensaje || '¡Sincronizado con éxito! 💅');
    } catch (e: any) {
      console.error('Error sincronizando:', e);
      showToast('Error al sincronizar con Ajustes', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const [syncingInfo, setSyncingInfo] = useState(false);
  const handleSincronizarInfoAjustes = async () => {
    setSyncingInfo(true);
    try {
      const updated = await cartaConfig.sincronizarDesdeAjustes();
      if (updated) setConfig(prev => ({ ...prev, ...updated }));
      showToast('¡Datos del salón sincronizados con éxito! ✨');
    } catch (e: any) {
      console.error('Error sincronizando datos del salón:', e);
      showToast('Error al sincronizar datos del salón', 'error');
    } finally {
      setSyncingInfo(false);
    }
  };

  // ─── Handlers: Config (Promos / Stories / Apariencia) ─────────────
  const handleSaveConfig = async (partial?: Partial<CartaConfig>) => {
    setSaving(true);
    try {
      const toSave = partial ? { ...config, ...partial } : config;
      const saved = await cartaConfig.upsert(toSave);
      setConfig(prev => ({ ...prev, ...saved }));
      showToast('Cambios guardados ✨');
    } catch { showToast('Error al guardar', 'error'); }
    finally { setSaving(false); }
  };

  const handlePaleta = (paleta: CartaPaleta) => {
    const p = CARTA_PALETAS[paleta];
    setConfig(prev => ({
      ...prev,
      paleta,
      color_primario: p.primario,
      color_secundario: p.secundario,
      color_acento: p.acento,
    }));
  };

  // ─── Helpers de render ───────────────────────────────────────────
  const query = busquedaServicios.trim().toLowerCase();
  const serviciosFiltrados = query
    ? serviciosData.filter(s => s.nombre.toLowerCase().includes(query) || (s.descripcion && s.descripcion.toLowerCase().includes(query)))
    : serviciosData;

  const serviciosDeCat = (catId: string) => serviciosFiltrados.filter(s => s.categoria_id === catId && s.activo !== false);
  const sinCategoria = serviciosFiltrados.filter(s => !s.categoria_id && s.activo !== false);

  // ─── Render: Tab Servicios ────────────────────────────────────────
  const renderServicios = () => (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Categorías y Servicios</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Organiza tu carta por categorías. Marca con ⭐ tus servicios Top para mostrarlos en Ofertas del Día.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSincronizarAjustes}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--color-brand)/40', color: 'var(--color-brand)' }}
            title="Importa o sincroniza todos los servicios cargados en Ajustes > Mi Salón"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar con Mi Salón'}
          </button>
          <button
            onClick={() => setShowNewCatForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ background: 'var(--color-brand)' }}
          >
            <Plus size={14} /> Categoría
          </button>
        </div>
      </div>

      {/* Buscador de servicios */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar servicio por nombre (ej: Balayage, Manicure, Lifting)..."
          value={busquedaServicios}
          onChange={e => setBusquedaServicios(e.target.value)}
          className="input-field w-full pl-9 pr-8 text-xs py-2 rounded-xl border"
        />
        {busquedaServicios && (
          <button
            onClick={() => setBusquedaServicios('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Form nueva categoría */}
      <AnimatePresence>
        {showNewCatForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="card-glass rounded-2xl p-4 border" style={{ borderColor: 'var(--color-brand)/20' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Nueva Categoría</p>
            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {EMOJIS_CATEGORIA.map(e => (
                <button key={e} onClick={() => setNewCat(prev => ({ ...prev, emoji: e }))}
                  className={`w-8 h-8 rounded-lg text-base transition-all ${newCat.emoji === e ? 'ring-2 scale-110' : 'hover:scale-105'}`}
                  style={{ ringColor: 'var(--color-brand)', background: newCat.emoji === e ? 'var(--color-brand)/15' : 'transparent' }}>
                  {e}
                </button>
              ))}
            </div>
            <input
              type="text" placeholder="Nombre de la categoría (ej: Colorimetría)"
              className="input-field w-full mb-3 text-sm"
              value={newCat.nombre || ''}
              onChange={e => setNewCat(prev => ({ ...prev, nombre: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateCategoria()}
            />
            <div className="flex gap-2">
              <button onClick={handleCreateCategoria} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                style={{ background: 'var(--color-brand)' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Crear
              </button>
              <button onClick={() => { setShowNewCatForm(false); setNewCat(blankCategoria()); }}
                className="px-4 py-2 rounded-xl text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de categorías */}
      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--color-surface-hover)' }} />)}</div>
      ) : categorias.length === 0 ? (
        <EmptyState icon={<Scissors size={28} />} title="Sin categorías aún"
          subtitle="Crea tu primera categoría para empezar a armar tu carta digital."
          action={<button onClick={() => setShowNewCatForm(true)} className="btn-primary text-sm px-4 py-2 rounded-xl">+ Crear primera categoría</button>} />
      ) : (
        <div className="space-y-2">
          {categorias.map(cat => {
            const count = serviciosDeCat(cat.id).length;
            const isAutoExpanded = Boolean(query && count > 0);
            const isOpen = isAutoExpanded || expandedCat === cat.id;

            // Si hay búsqueda y esta categoría no tiene coincidencias, no mostrarla
            if (query && count === 0) return null;

            return (
              <div key={cat.id} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                {/* Header de categoría */}
                <button className="w-full flex items-center gap-3 p-3.5 text-left transition-all hover:bg-opacity-50"
                  style={{ background: isOpen ? 'var(--color-brand)/5' : 'var(--color-surface)' }}
                  onClick={() => setExpandedCat(prev => prev === cat.id ? null : cat.id)}>
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{cat.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{count} servicios</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); handleDeleteCategoria(cat.id); }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={13} />
                    </button>
                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
                  </div>
                </button>

                {/* Servicios de la categoría */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="px-3 pb-3 space-y-2" style={{ background: 'var(--color-surface-hover)' }}>
                        {serviciosDeCat(cat.id).map(srv => (
                          <ServicioCard key={srv.id} srv={srv}
                            isEditing={editingServId === srv.id}
                            editingData={editingServ}
                            onEdit={() => { setEditingServId(srv.id); setEditingServ({ ...srv }); }}
                            onCancelEdit={() => setEditingServId(null)}
                            onSave={() => handleUpdateServicio(srv.id)}
                            onChange={data => setEditingServ(prev => ({ ...prev, ...data }))}
                            onDelete={() => handleDeleteServicio(srv.id)}
                            onToggleDestacado={() => handleToggleDestacado(srv)}
                            saving={saving} />
                        ))}

                        {/* Form nuevo servicio */}
                        <AnimatePresence>
                          {showNewServForm === cat.id && (
                            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                              <ServicioForm data={newServ} onChange={data => setNewServ(prev => ({ ...prev, ...data }))}
                                onSave={() => handleCreateServicio(cat.id)} onCancel={() => { setShowNewServForm(null); setNewServ(blankServicio()); }}
                                saving={saving} />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {showNewServForm !== cat.id && (
                          <button onClick={() => { setShowNewServForm(cat.id); setNewServ(blankServicio()); }}
                            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 border-2 border-dashed transition-all hover:border-solid"
                            style={{ borderColor: 'var(--color-brand)/30', color: 'var(--color-brand)' }}>
                            <Plus size={14} /> Añadir servicio
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}


          {/* Servicios sin categoría */}
          {sinCategoria.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-dashed" style={{ borderColor: 'var(--color-border)' }}>
              <div className="p-3 flex items-center gap-2">
                <AlertCircle size={14} style={{ color: 'var(--color-text-muted)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  {sinCategoria.length} servicio(s) sin categoría asignada
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ─── Render: Tab Promos ───────────────────────────────────────────
  // ─── Render: Tab Promos ───────────────────────────────────────────
  const renderPromos = () => {
    const pm = config.promo_mes || { activa: false, titulo: '', descripcion: '', badge_emoji: '🌸', badge_texto: 'Este Mes' };
    const os = config.oferta_semana || { activa: false, titulo: '', descripcion: '', precio_original: undefined, precio_oferta: undefined, expira_en: '' };

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Promociones & Ofertas Destacadas</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Configura las secciones de alto impacto visual que verán tus clientas al inicio de tu carta pública.
            </p>
          </div>
        </div>

        {/* Promo del Mes */}
        <div className={`card-glass rounded-2xl p-4 sm:p-5 space-y-4 border transition-all ${
          pm.activa
            ? 'border-purple-300/80 dark:border-purple-600/40 shadow-sm bg-gradient-to-b from-purple-50/30 via-transparent to-transparent dark:from-purple-950/15'
            : 'border-gray-200/70 dark:border-white/10'
        }`}>
          {/* Header Card */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
                🌸
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>Promo del Mes</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 shrink-0">
                    Inspiracional
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>Destacado visual superior sin precio visible (ideal para paquetes premium)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = { ...pm, activa: !pm.activa };
                setConfig(prev => ({ ...prev, promo_mes: next }));
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
                pm.activa
                  ? 'bg-purple-600 text-white shadow-purple-500/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {pm.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {pm.activa ? 'Activa' : 'Inactiva'}
            </button>
          </div>

          {pm.activa && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
              {/* Badge & Emoji selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10">
                <div className="min-w-0 space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Emoji Distintivo</span>
                    <span className="text-[10px] font-normal text-gray-400">Selecciona el ícono</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-900/60">
                    {['🌸','✨','💜','🔥','🎁','💅','🌺','⭐','💎','🌟'].map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, promo_mes: { ...pm, badge_emoji: e } }))}
                        className={`w-8 h-8 rounded-lg text-base transition-all flex items-center justify-center ${
                          pm.badge_emoji === e
                            ? 'ring-2 ring-purple-500 bg-purple-100/80 dark:bg-purple-900/50 scale-105 shadow-xs font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-white/10 opacity-75 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`Elegir ${e}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="flex items-center gap-1.5">
                      <Tag size={12} className="text-purple-500" /> Texto del Badge / Etiqueta
                    </span>
                    {/* Live Badge Preview */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-2xs truncate max-w-[140px]">
                      {pm.badge_emoji || '🌸'} {pm.badge_texto || 'PROMO DEL MES'}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-sm font-semibold"
                    placeholder="ej: PROMO DEL MES, TENDENCIA, o el mes actual"
                    value={pm.badge_texto || ''}
                    onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, badge_texto: e.target.value } }))}
                  />
                  <p className="text-[10px] text-gray-400">Aparece en la cinta superior de la tarjeta promocional.</p>
                </div>
              </div>

              {/* Título de la Promo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Sparkles size={12} className="text-purple-500" /> Título Principal de la Promo
                </label>
                <input
                  type="text"
                  className="input-field w-full text-sm font-bold"
                  placeholder="ej: Dúo Mirada de Impacto: Lifting Keratina & Botox ✨"
                  value={pm.titulo || ''}
                  onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, titulo: e.target.value } }))}
                />
              </div>

              {/* Descripción corta */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <BookOpen size={12} className="text-purple-500" /> Descripción inspiracional
                </label>
                <textarea
                  className="input-field w-full text-sm resize-none leading-relaxed"
                  rows={2}
                  placeholder="Describe los beneficios clave y qué incluye la experiencia..."
                  value={pm.descripcion || ''}
                  onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, descripcion: e.target.value } }))}
                />
              </div>

              {/* Vigencia y Auto-Apagado */}
              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/25 border border-purple-200/70 dark:border-purple-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5 text-purple-900 dark:text-purple-200">
                    <Calendar size={13} className="text-purple-600" /> Vigencia y Auto-expiración inteligente
                  </label>
                  {pm.expira_en ? (
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700/50">
                      Expira: {pm.expira_en.split('T')[0]}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      Siempre activa
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                      setConfig(prev => ({
                        ...prev,
                        promo_mes: { ...pm, expira_en: lastDay.toISOString(), duracion_tipo: 'fin_de_mes' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      pm.duracion_tipo === 'fin_de_mes'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-purple-200/70 dark:border-purple-800/40 hover:bg-purple-50/50'
                    }`}
                  >
                    📅 Hasta fin de mes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = new Date(Date.now() + 30 * 86400000);
                      setConfig(prev => ({
                        ...prev,
                        promo_mes: { ...pm, expira_en: target.toISOString(), duracion_tipo: '30_dias' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      pm.duracion_tipo === '30_dias'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-purple-200/70 dark:border-purple-800/40 hover:bg-purple-50/50'
                    }`}
                  >
                    ⚡ Exacto 30 días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        promo_mes: { ...pm, expira_en: undefined, duracion_tipo: 'permanente' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      pm.duracion_tipo === 'permanente' || (!pm.expira_en && pm.duracion_tipo !== 'personalizado')
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-purple-200/70 dark:border-purple-800/40 hover:bg-purple-50/50'
                    }`}
                  >
                    ♾️ Sin fecha (Fija)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        promo_mes: { ...pm, duracion_tipo: 'personalizado' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      pm.duracion_tipo === 'personalizado'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-purple-200/70 dark:border-purple-800/40 hover:bg-purple-50/50'
                    }`}
                  >
                    ✏️ Manual
                  </button>
                </div>

                {pm.duracion_tipo === 'personalizado' && (
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-purple-900 dark:text-purple-200 mb-1 block">Elige la fecha de cierre:</label>
                    <input
                      type="date"
                      className="input-field w-full text-xs font-medium"
                      value={pm.expira_en?.split('T')[0] || ''}
                      onChange={e => {
                        const val = e.target.value ? `${e.target.value}T23:59:59` : undefined;
                        setConfig(prev => ({
                          ...prev,
                          promo_mes: { ...pm, expira_en: val, duracion_tipo: 'personalizado' }
                        }));
                      }}
                    />
                  </div>
                )}
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/70 flex items-center gap-1.5">
                  <Info size={12} className="shrink-0" />
                  Al cumplirse la fecha, la promo se apagará automáticamente de tu vitrina para no mostrar ofertas vencidas.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Oferta de la Semana */}
        <div className={`card-glass rounded-2xl p-4 sm:p-5 space-y-4 border transition-all ${
          os.activa
            ? 'border-rose-300/80 dark:border-rose-600/40 shadow-sm bg-gradient-to-b from-rose-50/30 via-transparent to-transparent dark:from-rose-950/15'
            : 'border-gray-200/70 dark:border-white/10'
        }`}>
          {/* Header Card */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
                🔥
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>Oferta de la Semana / Combo Flash</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100/80 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 shrink-0">
                    Con Precio
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>Muestra precio tachado y genera urgencia con expiración</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = { ...os, activa: !os.activa };
                setConfig(prev => ({ ...prev, oferta_semana: next }));
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
                os.activa
                  ? 'bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {os.activa ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {os.activa ? 'Activa' : 'Inactiva'}
            </button>
          </div>

          {os.activa && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Tag size={12} className="text-rose-500" /> Nombre del Combo u Oferta
                </label>
                <input
                  type="text"
                  className="input-field w-full text-sm font-bold"
                  placeholder="ej: Manicure Gel Spa + Cepillado Express"
                  value={os.titulo || ''}
                  onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, titulo: e.target.value } }))}
                />
              </div>

              {/* Precios con feedback visual de descuento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1 text-gray-500">
                    Precio Normal / Original (Tachado)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/</span>
                    <input
                      type="number"
                      step="0.5"
                      className="input-field w-full pl-8 text-sm font-medium"
                      placeholder="150"
                      value={os.precio_original || ''}
                      onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, precio_original: parseFloat(e.target.value) || undefined } }))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1"><Tag size={11} /> Precio Oferta de la Semana</span>
                    {os.precio_original && os.precio_oferta && os.precio_original > os.precio_oferta && (
                      <span className="text-[10px] font-black text-rose-600 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full">
                        🔥 {Math.round(((os.precio_original - os.precio_oferta) / os.precio_original) * 100)}% OFF
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">S/</span>
                    <input
                      type="number"
                      step="0.5"
                      className="input-field w-full pl-8 text-sm font-extrabold text-rose-600 dark:text-rose-400"
                      placeholder="99"
                      value={os.precio_oferta || ''}
                      onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, precio_oferta: parseFloat(e.target.value) || undefined } }))}
                    />
                  </div>
                </div>
              </div>

              {/* Vigencia Rápida de la Semana */}
              <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                    <Calendar size={13} className="text-rose-600" /> Vigencia de la Semana
                  </label>
                  {os.expira_en ? (
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-700/50">
                      Expira: {os.expira_en.split('T')[0]}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      Sin fecha límite
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const daysUntilSunday = (7 - now.getDay()) % 7;
                      const sunday = new Date(now.getTime() + (daysUntilSunday === 0 ? 7 : daysUntilSunday) * 86400000);
                      sunday.setHours(23, 59, 59);
                      setConfig(prev => ({
                        ...prev,
                        oferta_semana: { ...os, expira_en: sunday.toISOString(), duracion_tipo: 'fin_de_semana' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      os.duracion_tipo === 'fin_de_semana'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-rose-200/70 dark:border-rose-800/40 hover:bg-rose-50/50'
                    }`}
                  >
                    🗓️ Fin de semana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = new Date(Date.now() + 7 * 86400000);
                      setConfig(prev => ({
                        ...prev,
                        oferta_semana: { ...os, expira_en: target.toISOString(), duracion_tipo: '7_dias' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      os.duracion_tipo === '7_dias'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-rose-200/70 dark:border-rose-800/40 hover:bg-rose-50/50'
                    }`}
                  >
                    ⚡ 7 días
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        oferta_semana: { ...os, expira_en: undefined, duracion_tipo: 'permanente' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      os.duracion_tipo === 'permanente' || (!os.expira_en && os.duracion_tipo !== 'personalizado')
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-rose-200/70 dark:border-rose-800/40 hover:bg-rose-50/50'
                    }`}
                  >
                    ♾️ Sin fecha (Fija)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        oferta_semana: { ...os, duracion_tipo: 'personalizado' }
                      }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-center ${
                      os.duracion_tipo === 'personalizado'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-rose-200/70 dark:border-rose-800/40 hover:bg-rose-50/50'
                    }`}
                  >
                    ✏️ Manual
                  </button>
                </div>

                {os.duracion_tipo === 'personalizado' && (
                  <div className="pt-1">
                    <label className="text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1 block">Elige la fecha límite:</label>
                    <input
                      type="date"
                      className="input-field w-full text-xs font-medium"
                      value={os.expira_en?.split('T')[0] || ''}
                      onChange={e => {
                        const val = e.target.value ? `${e.target.value}T23:59:59` : undefined;
                        setConfig(prev => ({
                          ...prev,
                          oferta_semana: { ...os, expira_en: val, duracion_tipo: 'personalizado' }
                        }));
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ✨ GATILLO DE ESCASEZ: Cupos Semanales Limitados */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    <div>
                      <label className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                        Cupos Limitados de la Semana (Gatillo de Escasez)
                      </label>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                        Muestra cuántos cupos quedan para activar la psicología de aversión a la pérdida
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !os.cupos_activos;
                      setConfig(prev => ({
                        ...prev,
                        oferta_semana: {
                          ...os,
                          cupos_activos: next,
                          cupos_totales: os.cupos_totales || 5,
                          cupos_ocupados: os.cupos_ocupados ?? 3
                        }
                      }));
                    }}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl transition-all shadow-2xs ${
                      os.cupos_activos
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-white/10 text-gray-500 border border-amber-200 dark:border-white/10'
                    }`}
                  >
                    {os.cupos_activos ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {os.cupos_activos ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                {os.cupos_activos && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Total de Cupos de la Semana</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="input-field w-full text-sm font-bold text-center"
                          placeholder="5"
                          value={os.cupos_totales ?? 5}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            oferta_semana: { ...os, cupos_totales: parseInt(e.target.value) || 1 }
                          }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Cupos ya Reservados / Ocupados</label>
                        <input
                          type="number"
                          min="0"
                          max={os.cupos_totales || 5}
                          className="input-field w-full text-sm font-bold text-center text-rose-600"
                          placeholder="3"
                          value={os.cupos_ocupados ?? 3}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            oferta_semana: { ...os, cupos_ocupados: Math.max(0, parseInt(e.target.value) || 0) }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Previsualización en vivo de la barra de dopamina */}
                    {(() => {
                      const total = os.cupos_totales || 5;
                      const ocupados = Math.min(total, os.cupos_ocupados ?? 3);
                      const restantes = Math.max(0, total - ocupados);
                      const pct = Math.round((ocupados / total) * 100);

                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/40 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                              <Flame size={14} className="animate-bounce" />
                              {restantes === 1 ? '¡ÚLTIMO CUPO DISPONIBLE!' : `¡Solo quedan ${restantes} de ${total} cupos!`}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500">{ocupados}/{total} reservados ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-500 shadow-xs"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            Así de dinámico se verá en la carta pública para acelerar la decisión de compra.
                          </p>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  <Info size={12} className="text-rose-500" /> Condiciones o descripción opcional
                </label>
                <textarea
                  className="input-field w-full text-sm resize-none leading-relaxed"
                  rows={2}
                  placeholder="ej: Válido solo para citas de martes a jueves reservando por la web..."
                  value={os.descripcion || ''}
                  onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, descripcion: e.target.value } }))}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* 🌟 NUEVA SECCIÓN: Rituales Semanales / Promos por Día de la Semana */}
        <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4 border border-rose-300/60 dark:border-rose-800/40 bg-gradient-to-b from-rose-50/20 via-transparent to-transparent dark:from-rose-950/15">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                🗓️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Días Temáticos & Rituales Semanales</p>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Llena tus días lentos
                  </span>
                </div>
                <p className="text-xs text-gray-400">Activa promociones fijas para días específicos (ej: "Martes de Uñas", "Miércoles de Botox")</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const currentList = config.promos_dias || [];
                const nuevoDia: CartaPromoDia = {
                  id: `dia_${Date.now()}`,
                  dia_semana: 2, // Martes por defecto
                  activo: true,
                  titulo: '💅 Martes de Uñas & Glow',
                  badge_emoji: '💅',
                  descripcion: 'Manicura rusa o spa con descuento exclusivo por agendar hoy',
                  precio_regular: 70,
                  precio_promo: 49,
                  cupos_activos: true,
                  cupos_totales: 5,
                  cupos_ocupados: 2,
                  servicios_nombres: 'Manicura Rusa + Esmaltado'
                };
                setConfig(prev => ({ ...prev, promos_dias: [...currentList, nuevoDia] }));
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:scale-95 transition-all"
            >
              <Plus size={14} /> + Agregar Día Temático
            </button>
          </div>

          {/* Lista de Promociones de Días */}
          {(!config.promos_dias || config.promos_dias.length === 0) ? (
            <div className="py-6 px-4 rounded-xl border border-dashed border-rose-200 dark:border-rose-900/40 text-center space-y-2">
              <span className="text-2xl block">💡</span>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                ¿Lunes o martes con pocas reservas?
              </p>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                Crea un ritual semanal como <strong className="text-rose-600">"Martes de Uñas 2x1"</strong> o <strong className="text-rose-600">"Miércoles de Spa Capilar"</strong>. Las clientas lo verán en su carta e incluso podrán reservar con días de anticipación.
              </p>
              <button
                type="button"
                onClick={() => {
                  const defaultMartes: CartaPromoDia = {
                    id: `dia_${Date.now()}`,
                    dia_semana: 2, // Martes
                    activo: true,
                    titulo: '💅 Martes de Uñas & Glow',
                    badge_emoji: '💅',
                    descripcion: 'Manicura completa + hidratación profunda a precio especial',
                    precio_regular: 65,
                    precio_promo: 45,
                    cupos_activos: true,
                    cupos_totales: 5,
                    cupos_ocupados: 2,
                    servicios_nombres: 'Manicura Rusa'
                  };
                  setConfig(prev => ({ ...prev, promos_dias: [defaultMartes] }));
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3.5 py-1.5 rounded-xl hover:bg-rose-100 transition-colors"
              >
                ⚡ Crear plantilla rápida: "Martes de Uñas"
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {config.promos_dias.map((pDia, index) => {
                const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const pct = pDia.cupos_activos
                  ? Math.min(100, Math.round(((pDia.cupos_ocupados || 0) / Math.max(1, pDia.cupos_totales || 5)) * 100))
                  : 0;

                const updateCurrentPromoDia = (updates: Partial<CartaPromoDia>) => {
                  const updated = [...(config.promos_dias || [])];
                  updated[index] = { ...updated[index], ...updates };
                  setConfig(prev => ({ ...prev, promos_dias: updated }));
                };

                const removePromoDia = () => {
                  const filtered = (config.promos_dias || []).filter((_, i) => i !== index);
                  setConfig(prev => ({ ...prev, promos_dias: filtered }));
                };

                return (
                  <div
                    key={pDia.id || index}
                    className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                      pDia.activo
                        ? 'border-rose-300 dark:border-rose-800/60 bg-white/80 dark:bg-neutral-900/60 shadow-xs'
                        : 'border-gray-200/70 dark:border-white/10 opacity-70 bg-gray-50/50 dark:bg-neutral-900/30'
                    }`}
                  >
                    {/* Header de la Card del Día */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Selector de Día de la Semana */}
                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-white/10">
                          {diasNombres.map((nombre, dIdx) => (
                            <button
                              key={nombre}
                              type="button"
                              onClick={() => updateCurrentPromoDia({ dia_semana: dIdx as CartaPromoDia['dia_semana'] })}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                pDia.dia_semana === dIdx
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                              }`}
                            >
                              {nombre.slice(0, 3)}
                            </button>
                          ))}
                        </div>

                        <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                          {diasNombres[pDia.dia_semana]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCurrentPromoDia({ activo: !pDia.activo })}
                          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition-all shadow-2xs ${
                            pDia.activo ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {pDia.activo ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          {pDia.activo ? 'Visible' : 'Pausado'}
                        </button>
                        <button
                          type="button"
                          onClick={removePromoDia}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                          title="Eliminar promo de este día"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Inputs de Título, Emoji y Servicios */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Emoji</label>
                        <div className="flex gap-1.5 p-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-neutral-900">
                          {['💅', '💆‍♀️', '✨', '⚡', '👁️'].map(em => (
                            <button
                              key={em}
                              type="button"
                              onClick={() => updateCurrentPromoDia({ badge_emoji: em })}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                                pDia.badge_emoji === em ? 'bg-rose-500/15 border border-rose-500 text-rose-600 scale-105' : 'hover:bg-gray-100'
                              }`}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Título de la Promo del Día</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-bold"
                          placeholder="ej: Martes de Uñas & Glow"
                          value={pDia.titulo || ''}
                          onChange={e => updateCurrentPromoDia({ titulo: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Servicios o Combo</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-medium"
                          placeholder="ej: Manicura Rusa + Nail Art"
                          value={pDia.servicios_nombres || ''}
                          onChange={e => updateCurrentPromoDia({ servicios_nombres: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Descripción y Precios */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Detalle o beneficio para la clienta</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          placeholder="ej: Válido agendando para los martes, incluye hidratación"
                          value={pDia.descripcion || ''}
                          onChange={e => updateCurrentPromoDia({ descripcion: e.target.value })}
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Precio Normal (Tachado)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">S/</span>
                          <input
                            type="number"
                            className="input-field w-full pl-7 text-xs font-medium"
                            placeholder="70"
                            value={pDia.precio_regular || ''}
                            onChange={e => updateCurrentPromoDia({ precio_regular: parseFloat(e.target.value) || undefined })}
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-black">
                          Precio Promo del Día
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-rose-500 font-bold">S/</span>
                          <input
                            type="number"
                            className="input-field w-full pl-7 text-xs font-black text-rose-600 dark:text-rose-400"
                            placeholder="49"
                            value={pDia.precio_promo || ''}
                            onChange={e => updateCurrentPromoDia({ precio_promo: parseFloat(e.target.value) || undefined })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Gatillo de Escasez / Cupos para ese día */}
                    <div className="p-2.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚡</span>
                        <div>
                          <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                            Cupos para este día:
                          </span>
                          <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                            Muestra cuántos lugares quedan disponibles para ese día
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500">Reservados:</span>
                          <input
                            type="number"
                            min="0"
                            max={pDia.cupos_totales || 5}
                            className="w-12 text-center text-xs font-bold bg-white dark:bg-neutral-800 border rounded-lg py-1 text-rose-600"
                            value={pDia.cupos_ocupados ?? 2}
                            onChange={e => updateCurrentPromoDia({ cupos_ocupados: Math.max(0, parseInt(e.target.value) || 0) })}
                          />
                        </div>
                        <span className="text-gray-400 text-xs">/</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500">Total:</span>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            className="w-12 text-center text-xs font-bold bg-white dark:bg-neutral-800 border rounded-lg py-1"
                            value={pDia.cupos_totales ?? 5}
                            onChange={e => updateCurrentPromoDia({ cupos_totales: Math.max(1, parseInt(e.target.value) || 1) })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vista previa miniatura de la barra */}
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔥 GESTOR DE ESPECIALES DEL DÍA & FLASH CARDS (Dopamina & Impulso Táctil) */}
        {(() => {
          const ofCfg = config.ofertas_dia_config || {
            activo: true,
            titulo: '🔥 ANTOJOS & ESPECIALES DEL DÍA',
            subtitulo: 'Aprovecha solo por hoy · Cupos limitados',
            badge_superior: '⚡ Solo por Hoy',
            mostrar_cupos: true,
            rotacion_automatica: true,
            cantidad_visibles: 3,
          };
          const destacadosCount = serviciosData.filter(s => s.destacado).length;

          return (
            <div className={`card-glass rounded-2xl p-4 sm:p-5 space-y-4 border transition-all ${
              ofCfg.activo
                ? 'border-orange-400/80 dark:border-orange-600/50 shadow-sm bg-gradient-to-b from-orange-50/30 via-transparent to-transparent dark:from-orange-950/20'
                : 'border-gray-200/70 dark:border-white/10'
            }`}>
              {/* Header de la sección */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
                    🔥
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        Especiales del Día (Flash Cards Dopaminérgicas)
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                        {destacadosCount} en carrusel
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                      Personaliza títulos, precios tachados, regalos 🎁 y badges para detonar la compra impulsiva
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const next = { ...ofCfg, activo: !ofCfg.activo };
                    setConfig(prev => ({ ...prev, ofertas_dia_config: next }));
                    try {
                      await cartaConfig.save({ ...config, ofertas_dia_config: next });
                      showToast(next.activo ? 'Sección de Especiales activada 🔥' : 'Sección pausada');
                    } catch {
                      showToast('Error al guardar configuración', 'error');
                    }
                  }}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
                    ofCfg.activo
                      ? 'bg-orange-600 text-white shadow-orange-500/20'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {ofCfg.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {ofCfg.activo ? 'Visible en Carta' : 'Oculto'}
                </button>
              </div>

              {ofCfg.activo && (
                <div className="space-y-4 pt-1">
                  {/* Personalización de Textos de la Cabecera */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/70 dark:bg-neutral-800/40 border border-orange-200/60 dark:border-white/10">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>🏷️</span> Título de la Sección
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-bold"
                        placeholder="ej: 🔥 ESPECIALES DEL DÍA"
                        value={ofCfg.titulo || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setConfig(prev => ({
                            ...prev,
                            ofertas_dia_config: { ...ofCfg, titulo: val }
                          }));
                        }}
                        onBlur={async () => {
                          try {
                            await cartaConfig.save(config);
                          } catch (e) { console.error(e); }
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <span>✨</span> Badge de Urgencia (Píldora)
                      </label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-medium"
                        placeholder="ej: Solo por Hoy, Cupos Limitados..."
                        value={ofCfg.badge_superior || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setConfig(prev => ({
                            ...prev,
                            ofertas_dia_config: { ...ofCfg, badge_superior: val }
                          }));
                        }}
                        onBlur={async () => {
                          try {
                            await cartaConfig.save(config);
                          } catch (e) { console.error(e); }
                        }}
                      />
                    </div>
                  </div>

                  {/* 🔄 MODO AUTOMÁTICO: Rotación Diaria Inteligente (Smart Daily Rotation) */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/70 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/40 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm font-black">
                          🔄
                        </div>
                        <div>
                          <p className="text-xs font-black text-orange-950 dark:text-orange-200">
                            Rotación Automática Diaria (Smart Rotation)
                          </p>
                          <p className="text-[10px] text-orange-800/80 dark:text-orange-300">
                            Rota tus ofertas a las 12:00 AM cada día automáticamente sin que muevas un dedo
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const nextVal = !ofCfg.rotacion_automatica;
                          const updated = { ...ofCfg, rotacion_automatica: nextVal, cantidad_visibles: ofCfg.cantidad_visibles || 3 };
                          setConfig(prev => ({ ...prev, ofertas_dia_config: updated }));
                          try {
                            await cartaConfig.save({ ...config, ofertas_dia_config: updated });
                            showToast(nextVal ? 'Rotación diaria activada 🔄' : 'Rotación fijada en manual');
                          } catch {
                            showToast('Error al actualizar rotación', 'error');
                          }
                        }}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
                          ofCfg.rotacion_automatica
                            ? 'bg-orange-600 text-white shadow-orange-500/25'
                            : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-orange-200'
                        }`}
                      >
                        {ofCfg.rotacion_automatica ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        {ofCfg.rotacion_automatica ? 'Auto-Rotar ON' : 'Modo Fijo'}
                      </button>
                    </div>

                    {ofCfg.rotacion_automatica && (
                      <div className="pt-2 border-t border-orange-200/60 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          Mostrar por día del pool ({destacadosCount} disponibles):
                        </span>
                        <div className="flex items-center gap-1.5">
                          {[2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={async () => {
                                const updated = { ...ofCfg, cantidad_visibles: num };
                                setConfig(prev => ({ ...prev, ofertas_dia_config: updated }));
                                try {
                                  await cartaConfig.save({ ...config, ofertas_dia_config: updated });
                                  showToast(`Se mostrarán ${num} ofertas diarias 🎯`);
                                } catch (e) { console.error(e); }
                              }}
                              className={`px-3 py-1 rounded-xl font-black text-xs transition-all ${
                                (ofCfg.cantidad_visibles || 3) === num
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-orange-200 hover:bg-orange-100/50'
                              }`}
                            >
                              {num} cards
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buscador y Selección Rápida de Servicios para el Carrusel */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-orange-950 dark:text-orange-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-orange-500" /> Servicios Seleccionados para el Carrusel ({destacadosCount})
                      </label>
                      <span className="text-[10px] text-gray-500">
                        {destacadosCount === 0 ? '⚠️ Elige al menos 1 servicio' : '💡 Recomendado: 2 a 4 servicios'}
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar y seleccionar servicios para agregar o editar..."
                        value={busquedaEspecialesDia}
                        onChange={e => setBusquedaEspecialesDia(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-orange-400/50 outline-none transition-all shadow-2xs"
                      />
                      {busquedaEspecialesDia && (
                        <button
                          type="button"
                          onClick={() => setBusquedaEspecialesDia('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Lista scrollable de servicios configurables */}
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 pt-1">
                      {(() => {
                        const filtered = serviciosData.filter(s =>
                          s.nombre.toLowerCase().includes(busquedaEspecialesDia.trim().toLowerCase())
                        );

                        // Priorizar los que ya están destacados arriba
                        const sorted = [...filtered].sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));

                        if (sorted.length === 0) {
                          return (
                            <div className="py-6 text-center text-xs text-gray-400 bg-white/40 dark:bg-neutral-800/40 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                              No hay servicios que coincidan con la búsqueda.
                            </div>
                          );
                        }

                        return sorted.map(srv => {
                          const isDest = Boolean(srv.destacado);
                          return (
                            <div
                              key={srv.id}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isDest
                                  ? 'border-orange-400/80 bg-orange-50/40 dark:bg-orange-950/30 shadow-xs'
                                  : 'border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.02]'
                              }`}
                            >
                              {/* Barra superior del servicio */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 relative">
                                    {srv.media_url ? (
                                      <img src={srv.media_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Image size={18} />
                                      </div>
                                    )}
                                    {isDest && (
                                      <span className="absolute top-1 left-1 bg-orange-500 text-white text-[8px] font-black uppercase px-1 rounded-sm">
                                        PROMO
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate text-gray-900 dark:text-white leading-tight">
                                      {srv.nombre}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                                        S/ {Number(srv.precio || 0).toFixed(2)}
                                      </span>
                                      {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                                        <span className="text-[10px] line-through text-gray-400">
                                          S/ {Number(srv.precio_original).toFixed(2)}
                                        </span>
                                      )}
                                      {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded">
                                          -{Math.round(((srv.precio_original - srv.precio) / srv.precio_original) * 100)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleToggleDestacado(srv)}
                                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                                    isDest
                                      ? 'bg-orange-500 text-white shadow-xs'
                                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-orange-50 hover:text-orange-600'
                                  }`}
                                >
                                  {isDest ? <Check size={14} /> : <Plus size={14} />}
                                  {isDest ? 'En Ofertas' : '+ Incluir'}
                                </button>
                              </div>

                              {/* Formulario rápido desplegado cuando el servicio está incluido en el carrusel */}
                              {isDest && (
                                <div className="mt-3 pt-3 border-t border-orange-200/60 dark:border-white/10 space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {/* Precio Oferta */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-orange-900 dark:text-orange-300">
                                        Precio Oferta (S/)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        className="input-field w-full text-xs font-extrabold text-orange-600"
                                        placeholder="ej: 110"
                                        value={srv.precio ?? ''}
                                        onChange={e => {
                                          const val = parseFloat(e.target.value) || 0;
                                          handleQuickUpdateServicio(srv.id, { precio: val });
                                        }}
                                      />
                                    </div>

                                    {/* Precio Original Tachado */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-500">
                                        Precio Normal (Tachado)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        className="input-field w-full text-xs font-medium"
                                        placeholder="ej: 150"
                                        value={srv.precio_original ?? ''}
                                        onChange={e => {
                                          const val = e.target.value ? parseFloat(e.target.value) : null;
                                          handleQuickUpdateServicio(srv.id, { precio_original: val });
                                        }}
                                      />
                                    </div>

                                    {/* Cupos Restantes de Urgencia */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        Cupos Hoy (Urgencia)
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        className="input-field w-full text-xs font-bold text-center"
                                        placeholder="ej: 2"
                                        value={srv.cupos_restantes ?? ''}
                                        onChange={e => {
                                          const val = e.target.value ? parseInt(e.target.value) : null;
                                          handleQuickUpdateServicio(srv.id, { cupos_restantes: val });
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {/* Bono o Regalo Gratis Extra */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                        <span>🎁</span> Regalo o Bono Extra (Dopamina)
                                      </label>
                                      <input
                                        type="text"
                                        className="input-field w-full text-xs"
                                        placeholder="ej: Incluye Cepillito + Sérum Gratis 🎁"
                                        value={srv.bono_regalo || ''}
                                        onChange={e => {
                                          handleQuickUpdateServicio(srv.id, { bono_regalo: e.target.value });
                                        }}
                                      />
                                    </div>

                                    {/* Badge Personalizado de la Card */}
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <span>🏷️</span> Badge en la Tarjeta
                                      </label>
                                      <div className="flex gap-1.5">
                                        <input
                                          type="text"
                                          className="input-field w-full text-xs font-semibold"
                                          placeholder="ej: 🔥 Más Pedido, ⚡ Flash, TOP"
                                          value={srv.badge_promo || ''}
                                          onChange={e => {
                                            handleQuickUpdateServicio(srv.id, { badge_promo: e.target.value });
                                          }}
                                        />
                                        <div className="flex gap-1 shrink-0">
                                          {['🔥 Top', '🎁 Regalo', '⚡ Flash'].map(tag => (
                                            <button
                                              key={tag}
                                              type="button"
                                              onClick={() => handleQuickUpdateServicio(srv.id, { badge_promo: tag })}
                                              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 transition-all"
                                            >
                                              {tag}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ✨ GESTOR CENTRALIZADO: Transformaciones Antes y Después */}
        <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4 border border-amber-300/50 dark:border-amber-700/40 bg-gradient-to-b from-amber-50/20 via-transparent to-transparent dark:from-amber-950/10">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
                ✨
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    Transformaciones Antes & Después (Sliders)
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Crown size={11} /> PRO
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                  Activa y configura comparativas táctiles de resultados reales en tus servicios
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              {serviciosData.filter(s => s.antes_despues?.activo && s.antes_despues.foto_antes && s.antes_despues.foto_despues).length} activos
            </span>
          </div>

          {/* Buscador de servicios para Antes & Después */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Buscar servicio por nombre (ej: Balayage, Manicura, Lifting)..."
              value={busquedaAntesDespues}
              onChange={e => setBusquedaAntesDespues(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400/50 outline-none transition-all shadow-2xs"
            />
            {busquedaAntesDespues && (
              <button
                type="button"
                onClick={() => setBusquedaAntesDespues('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="space-y-2 pt-1 max-h-96 overflow-y-auto pr-1">
            {(() => {
              const filteredList = serviciosData.filter(srv =>
                srv.nombre.toLowerCase().includes(busquedaAntesDespues.trim().toLowerCase())
              );

              if (filteredList.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-gray-400 bg-white/40 dark:bg-neutral-800/40 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    No se encontraron servicios que coincidan con "<span className="font-semibold">{busquedaAntesDespues}</span>".
                  </div>
                );
              }

              return filteredList.map(srv => {
                const ad = srv.antes_despues || { activo: false, foto_antes: '', foto_despues: '', etiqueta: 'Transformación Real' };
                const isAdActive = Boolean(ad.activo);

              return (
                <div
                  key={srv.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isAdActive
                      ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/30 shadow-2xs'
                      : 'border-gray-200/70 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 aspect-[3/4] bg-gray-100 dark:bg-white/10 flex items-center justify-center border border-gray-200 dark:border-white/10">
                        {srv.media_url ? (
                          <img src={srv.media_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Image size={16} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{srv.nombre}</p>
                        <p className="text-[11px] text-gray-500">
                          {srv.precio ? `S/ ${Number(srv.precio).toFixed(2)}` : 'Consultar'}
                          {srv.destacado && <span className="ml-2 text-amber-500 font-bold">★ Top</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...ad, activo: !ad.activo };
                        handleQuickUpdateServicio(srv.id, { antes_despues: next });
                      }}
                      className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                        isAdActive
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
                    >
                      {isAdActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {isAdActive ? 'Slider Activo' : 'Activar Slider'}
                    </button>
                  </div>

                  {/* Subidor rápido si está activo */}
                  {isAdActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-200/60 dark:border-white/10">
                      {/* Foto Antes */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Foto Antes</label>
                          <label className="text-[11px] text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1 font-bold">
                            <Camera size={12} /> Subir archivo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const opt = await optimizeImageClient(file, { maxWidth: 1080, quality: 0.85, aspectRatio: '3:4' });
                                  const filePath = `servicios/antes-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
                                  let bucket = 'nilah_assets';
                                  let res = await supabase.storage.from('nilah_assets').upload(filePath, opt.file, { upsert: true });
                                  if (res.error) {
                                    res = await supabase.storage.from('brand_assets').upload(filePath, opt.file, { upsert: true });
                                    bucket = 'brand_assets';
                                  }
                                  const finalUrl = res.data ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl : opt.dataUrl;
                                  handleQuickUpdateServicio(srv.id, {
                                    antes_despues: { ...ad, foto_antes: finalUrl }
                                  });
                                } catch (err) { console.error(err); }
                              }}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          placeholder="o pega URL de foto Antes..."
                          value={ad.foto_antes || ''}
                          onChange={e => handleQuickUpdateServicio(srv.id, { antes_despues: { ...ad, foto_antes: e.target.value } })}
                        />
                        {ad.foto_antes && (
                          <div className="w-14 h-18 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mt-1 aspect-[3/4] shadow-2xs">
                            <img src={ad.foto_antes} alt="Antes" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Foto Después */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Foto Después</label>
                          <label className="text-[11px] text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1 font-bold">
                            <Camera size={12} /> Subir archivo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const opt = await optimizeImageClient(file, { maxWidth: 1080, quality: 0.85, aspectRatio: '3:4' });
                                  const filePath = `servicios/despues-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
                                  let bucket = 'nilah_assets';
                                  let res = await supabase.storage.from('nilah_assets').upload(filePath, opt.file, { upsert: true });
                                  if (res.error) {
                                    res = await supabase.storage.from('brand_assets').upload(filePath, opt.file, { upsert: true });
                                    bucket = 'brand_assets';
                                  }
                                  const finalUrl = res.data ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl : opt.dataUrl;
                                  handleQuickUpdateServicio(srv.id, {
                                    antes_despues: { ...ad, foto_despues: finalUrl }
                                  });
                                } catch (err) { console.error(err); }
                              }}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          className="input-field w-full text-xs"
                          placeholder="o pega URL de foto Después..."
                          value={ad.foto_despues || ''}
                          onChange={e => handleQuickUpdateServicio(srv.id, { antes_despues: { ...ad, foto_despues: e.target.value } })}
                        />
                        {ad.foto_despues && (
                          <div className="w-14 h-18 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mt-1 aspect-[3/4] shadow-2xs">
                            <img src={ad.foto_despues} alt="Después" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
        </div>

        {/* Acceso directo a Copys y Estrategias del Manual */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300/40 dark:border-purple-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-xs font-black text-gray-950 dark:text-white">¿Buscas ideas de promos y combos que conviertan?</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Revisa la Matriz Estratégica, el Calendario Festivo y los Copys listos en el Manual.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('playbook')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 shadow-xs flex items-center gap-1 transition-all active:scale-95"
            style={{ background: 'var(--color-brand)' }}
          >
            Ver Manual & Copys ➔
          </button>
        </div>

        <button
          onClick={() => handleSaveConfig()}
          disabled={saving}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 hover:brightness-105"
          style={{ background: 'var(--color-brand)' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Promociones & Ofertas
        </button>
      </div>
    );
  };

  // ─── Render: Tab Flash FOMO (Solo PRO) ───────────────────────────
  const renderFomo = () => {
    const fb = config.fomo_banner || {
      activo: false,
      titulo: '⚡ Flash Sale Especial',
      subtitulo: 'Descuento exclusivo por tiempo limitado',
      descuento_tag: '25% OFF',
      badge_emoji: '🔥',
      expira_en: '',
      enlace_whatsapp: true,
    };

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Banners FOMO & Flash Sales
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Crown size={11} /> PRO
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Crea urgencia y llena días lentos con una barra de cuenta regresiva en vivo sobre tu vitrina.
            </p>
          </div>
          {!canFomoCountdown && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1 shrink-0">
              <Lock size={12} /> Plan PRO
            </span>
          )}
        </div>

        {/* Card de Configuración de Banner FOMO */}
        <div className={`card-glass rounded-2xl p-4 sm:p-5 space-y-4 border transition-all ${
          fb.activo
            ? 'border-amber-400/80 dark:border-amber-600/40 shadow-sm bg-gradient-to-b from-amber-50/25 via-transparent to-transparent dark:from-amber-950/15'
            : 'border-gray-200/70 dark:border-white/10'
        } ${!canFomoCountdown ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {fb.badge_emoji || '🔥'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Banner con Reloj Regresivo</p>
                <p className="text-xs text-gray-400">Aparece en la parte superior fija de tu carta digital</p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = { ...fb, activo: !fb.activo };
                setConfig(prev => ({ ...prev, fomo_banner: next }));
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs ${
                fb.activo
                  ? 'bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {fb.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {fb.activo ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          {fb.activo && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>
                    Título del Gancho FOMO
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-sm font-bold"
                    placeholder="ej: ¡Solo Hoy! 2x1 en Alisado Japonés"
                    value={fb.titulo || ''}
                    onChange={e => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, titulo: e.target.value } }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>
                    Badge Descuento
                  </label>
                  <input
                    type="text"
                    className="input-field w-full text-sm font-black text-rose-500"
                    placeholder="ej: 30% OFF"
                    value={fb.descuento_tag || ''}
                    onChange={e => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, descuento_tag: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>
                  Subtítulo explicativo
                </label>
                <input
                  type="text"
                  className="input-field w-full text-sm"
                  placeholder="ej: Válido agendando antes de medianoche para atenderte esta semana"
                  value={fb.subtitulo || ''}
                  onChange={e => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, subtitulo: e.target.value } }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Clock size={13} className="text-rose-500" /> Fecha y Hora límite de expiración
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field w-full text-sm font-medium"
                    value={fb.expira_en || ''}
                    onChange={e => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, expira_en: e.target.value } }))}
                  />
                  <p className="text-[10px] text-gray-400">El reloj contará hacia atrás horas, minutos y segundos.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Emoji del Ícono
                  </label>
                  <div className="flex gap-2 p-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-neutral-900/60">
                    {['⚡', '🔥', '⏳', '✨', '🎁', '💎'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, badge_emoji: em } }))}
                        className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                          fb.badge_emoji === em ? 'ring-2 ring-rose-500 scale-105 bg-rose-500/10 font-bold shadow-2xs' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ✨ GATILLO DE ESCASEZ: Cupos Flash Diarios */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/70 dark:border-amber-700/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔥</span>
                    <div>
                      <label className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                        Cupos Flash para Hoy (Escasez del Día)
                      </label>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-400">
                        Genera urgencia inmediata para llenar huecos de hoy mismo (ej: "Solo 3 cupos para hoy")
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !fb.cupos_activos;
                      setConfig(prev => ({
                        ...prev,
                        fomo_banner: {
                          ...fb,
                          cupos_activos: next,
                          cupos_totales: fb.cupos_totales || 3,
                          cupos_ocupados: fb.cupos_ocupados ?? 2
                        }
                      }));
                    }}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl transition-all shadow-2xs ${
                      fb.cupos_activos
                        ? 'bg-amber-500 text-white'
                        : 'bg-white dark:bg-white/10 text-gray-500 border border-amber-200 dark:border-white/10'
                    }`}
                  >
                    {fb.cupos_activos ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {fb.cupos_activos ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                {fb.cupos_activos && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Total Cupos de Hoy</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          className="input-field w-full text-sm font-bold text-center"
                          placeholder="3"
                          value={fb.cupos_totales ?? 3}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            fomo_banner: { ...fb, cupos_totales: parseInt(e.target.value) || 1 }
                          }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Cupos Ocupados Hoy</label>
                        <input
                          type="number"
                          min="0"
                          max={fb.cupos_totales || 3}
                          className="input-field w-full text-sm font-bold text-center text-rose-600"
                          placeholder="2"
                          value={fb.cupos_ocupados ?? 2}
                          onChange={e => setConfig(prev => ({
                            ...prev,
                            fomo_banner: { ...fb, cupos_ocupados: Math.max(0, parseInt(e.target.value) || 0) }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Previsualización en vivo */}
                    {(() => {
                      const total = fb.cupos_totales || 3;
                      const ocupados = Math.min(total, fb.cupos_ocupados ?? 2);
                      const restantes = Math.max(0, total - ocupados);
                      const pct = Math.round((ocupados / total) * 100);

                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/40 shadow-xs space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                              <Flame size={14} className="animate-bounce" />
                              {restantes === 1 ? '¡ÚLTIMO CUPO DE HOY!' : `¡Solo quedan ${restantes} de ${total} cupos hoy!`}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500">{ocupados}/{total} reservados ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-500 shadow-xs"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </div>

              {/* Vista previa en vivo del banner */}
              <div className="pt-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vista Previa en Vivo</p>
                <div className="rounded-2xl p-4 bg-gradient-to-r from-neutral-950 via-rose-950 to-neutral-950 text-white shadow-lg border border-rose-500/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl animate-bounce">{fb.badge_emoji || '⚡'}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-rose-300 bg-rose-500/30 border border-rose-500/40 px-2 py-0.5 rounded-md">
                            {fb.descuento_tag || 'OFERTA'}
                          </span>
                          <p className="text-xs font-black truncate">{fb.titulo || 'Flash Sale Especial'}</p>
                        </div>
                        <p className="text-[11px] text-white/70 truncate mt-0.5">{fb.subtitulo || 'Por tiempo limitado'}</p>
                      </div>
                    </div>
                    <div className="shrink-0 bg-black/60 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-rose-300">
                      ⏱️ 04:32:19
                    </div>
                  </div>

                  {fb.cupos_activos && (() => {
                    const total = fb.cupos_totales || 3;
                    const ocupados = Math.min(total, fb.cupos_ocupados ?? 2);
                    const restantes = Math.max(0, total - ocupados);
                    const pct = Math.round((ocupados / total) * 100);

                    return (
                      <div className="pt-1.5 border-t border-white/10 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span className="flex items-center gap-1">
                            <Flame size={12} className="text-rose-400" />
                            {restantes === 1 ? '¡Último cupo disponible para hoy!' : `Solo ${restantes} cupos restantes (${ocupados}/${total} reservados)`}
                          </span>
                          <span>{pct}% lleno</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Acceso rápido a Copys de FOMO del Manual */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-300/40 dark:border-purple-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📚</span>
            <div>
              <p className="text-xs font-black text-gray-950 dark:text-white">¿No sabes qué copy escribir para tu oferta?</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Revisa los copys testeados y gatillos de dopamina en el Manual.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('playbook')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 shadow-xs flex items-center gap-1 transition-all active:scale-95"
            style={{ background: 'var(--color-brand)' }}
          >
            Ver Copys Listos ➔
          </button>
        </div>

        <button
          onClick={() => handleSaveConfig()}
          disabled={saving || !canFomoCountdown}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 hover:brightness-105"
          style={{ background: 'var(--color-brand)' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Flash Sale FOMO
        </button>
      </div>
    );
  };

  // ─── Render: Tab Apariencia ───────────────────────────────────────
  const renderApariencia = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Apariencia & Identidad de tu Carta</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Personaliza los colores, layout mobile-first y los datos de contacto del header de tu vitrina.
        </p>
      </div>

      {/* Selector de Estilo de Layout de Cards */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              ✨ Estilo Visual de Servicios (Cards)
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Elige la experiencia de navegación visual de tus clientas en smartphones.
            </p>
          </div>
          <span className="text-[10px] uppercase font-black bg-pink-500/15 text-pink-500 px-2 py-0.5 rounded-full border border-pink-500/20">
            Mobile-First
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            {
              id: 'pinterest' as CartaLayoutEstilo,
              nombre: '📌 Pinterest Moodboard',
              badge: 'Recomendado Nails & Pestañas',
              desc: 'Doble columna visual, fotos de gran tamaño, likes táctiles y tarjetas Hero dinámicas.'
            },
            {
              id: 'editorial' as CartaLayoutEstilo,
              nombre: '📖 Vogue Editorial Luxury',
              badge: 'Ideal Spas & Balayage',
              desc: 'Tarjetas verticales cinematográficas ancho completo con texto estilizado superpuesto.'
            },
            {
              id: 'stories' as CartaLayoutEstilo,
              nombre: '🪞 Boutique Story Feed',
              badge: 'Estilo TikTok / Instagram',
              desc: 'Tarjetas inmersivas 3:4 con foto 100% de fondo y llamado a la acción flotante.'
            },
            {
              id: 'minimal' as CartaLayoutEstilo,
              nombre: '⚡ Express Clean Minimal',
              badge: 'Ultra Rápido y Compacto',
              desc: 'Lista limpia y minimalista, ideal para reservas inmediatas sin distracciones.'
            },
          ].map(estilo => {
            const isSelected = (config.layout_estilo || 'pinterest') === estilo.id;
            return (
              <button
                key={estilo.id}
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, layout_estilo: estilo.id }))}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                  isSelected ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/20 shadow-sm scale-[1.01]' : 'border-gray-200/80 dark:border-white/10 hover:border-purple-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Check size={12} />
                  </div>
                )}
                <p className="text-xs font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {estilo.nombre}
                </p>
                <span className="inline-block text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-900/40 px-2 py-0.5 rounded-md mt-1.5">
                  {estilo.badge}
                </span>
                <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {estilo.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paletas de colores */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-3">
        <p className="text-sm font-bold pb-2 border-b border-gray-100 dark:border-white/10" style={{ color: 'var(--color-text-primary)' }}>🎨 Paleta de Colores de Marca</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(Object.entries(CARTA_PALETAS) as [CartaPaleta, typeof CARTA_PALETAS[CartaPaleta]][]).map(([key, paleta]) => (
            <button key={key} onClick={() => handlePaleta(key)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${config.paleta === key ? 'scale-[1.02] ring-2 ring-purple-500 shadow-sm' : ''}`}
              style={{ borderColor: config.paleta === key ? paleta.primario : 'var(--color-border)', background: paleta.acento }}>
              {config.paleta === key && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-xs" style={{ background: paleta.primario }}>
                  <Check size={10} />
                </div>
              )}
              <div className="flex gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-full shadow-2xs" style={{ background: paleta.primario }} />
                <div className="w-5 h-5 rounded-full shadow-2xs" style={{ background: paleta.secundario }} />
              </div>
              <p className="text-xs font-bold truncate" style={{ color: paleta.primario }}>{paleta.emoji} {paleta.label}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: paleta.primario + 'cc' }}>{paleta.descripcion}</p>
            </button>
          ))}
        </div>
        {/* Custom colors */}
        {config.paleta === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>Color Primario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded-xl border-0 cursor-pointer shadow-2xs p-0.5"
                  value={config.color_primario || '#ec4899'} onChange={e => setConfig(prev => ({ ...prev, color_primario: e.target.value }))} />
                <input className="input-field flex-1 text-sm font-mono" value={config.color_primario || ''} onChange={e => setConfig(prev => ({ ...prev, color_primario: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>Color Secundario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded-xl border-0 cursor-pointer shadow-2xs p-0.5"
                  value={config.color_secundario || '#fbcfe8'} onChange={e => setConfig(prev => ({ ...prev, color_secundario: e.target.value }))} />
                <input className="input-field flex-1 text-sm font-mono" value={config.color_secundario || ''} onChange={e => setConfig(prev => ({ ...prev, color_secundario: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎭 Atmósfera & Temporadas Especiales (Halloween / Navidad) */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4 border border-rose-300/40 dark:border-rose-700/30 bg-gradient-to-br from-rose-500/5 via-purple-500/5 to-amber-500/5">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5 text-gray-900 dark:text-white">
              🎭 Atmósfera & Temporadas Especiales
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Viste tu vitrina con estética de alta gama para fechas de máxima facturación.
            </p>
          </div>
          <span className="text-[10px] uppercase font-black bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
            Edición Limitada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opción 1: Estándar Salón */}
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, tema_estacional: 'normal' }))}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              (!config.tema_estacional || config.tema_estacional === 'normal')
                ? 'border-purple-500 ring-2 ring-purple-400 bg-white dark:bg-neutral-800 shadow-sm'
                : 'border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-neutral-900/50 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">🌸</span>
              {(!config.tema_estacional || config.tema_estacional === 'normal') && (
                <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-black text-gray-900 dark:text-white">Estándar Elegante</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              Paleta y diseño clásico de tu salón para todo el año.
            </p>
          </button>

          {/* Opción 2: Halloween Glam */}
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, tema_estacional: 'halloween' }))}
            className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
              config.tema_estacional === 'halloween'
                ? 'border-purple-400 ring-2 ring-purple-500 bg-neutral-950 text-white shadow-md'
                : 'border-purple-300/40 bg-purple-950/20 hover:bg-purple-950/40 text-gray-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">🌙 🕷️</span>
              {config.tema_estacional === 'halloween' && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-black">Halloween Glam</p>
            <p className="text-[10px] text-purple-200/80 mt-0.5 leading-snug">
              Terciopelo ciruela, mármol oscuro, acentos oro rosa y niebla mística.
            </p>
          </button>

          {/* Opción 3: Navidad Luxe */}
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, tema_estacional: 'navidad' }))}
            className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
              config.tema_estacional === 'navidad'
                ? 'border-amber-400 ring-2 ring-amber-500 bg-gradient-to-br from-amber-950 via-rose-950 to-neutral-950 text-white shadow-md'
                : 'border-amber-300/40 bg-amber-950/20 hover:bg-amber-950/40 text-gray-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg">🎄 ✨</span>
              {config.tema_estacional === 'navidad' && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-black">Navidad & Fin de Año</p>
            <p className="text-[10px] text-amber-200/80 mt-0.5 leading-snug">
              Luces bokeh champán, lazo rubí terciopelo y copos de nieve suaves.
            </p>
          </button>
        </div>

        {/* Switch de Micro-animaciones (Copos / Partículas) */}
        {config.tema_estacional && config.tema_estacional !== 'normal' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Micro-animaciones Festivas en Vivo
                </p>
                <p className="text-[10px] text-gray-500">
                  {config.tema_estacional === 'halloween'
                    ? 'Partículas místicas y estrellas titilantes flotantes'
                    : 'Caída suave y elegante de copos de nieve'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConfig(prev => ({ ...prev, efectos_animados: !(prev.efectos_animados ?? true) }))}
              className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-xl transition-all ${
                (config.efectos_animados ?? true)
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500'
              }`}
            >
              {(config.efectos_animados ?? true) ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {(config.efectos_animados ?? true) ? 'Activado' : 'Desactivado'}
            </button>
          </div>
        )}
      </div>

      {/* Datos del header */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-white/10">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>📋 Datos del Salón & Contacto</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sincronízalos automáticamente con tus Ajustes o edítalos aquí.</p>
          </div>
          <button
            type="button"
            onClick={handleSincronizarInfoAjustes}
            disabled={syncingInfo}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all active:scale-95 whitespace-nowrap bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700/50 text-purple-600 dark:text-purple-300"
            title="Importa el nombre, teléfono, horarios, dirección y logo desde Ajustes > Mi Salón"
          >
            <RefreshCw size={12} className={syncingInfo ? 'animate-spin' : ''} />
            {syncingInfo ? 'Sincronizando...' : 'Sincronizar con Ajustes'}
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>Nombre del salón</label>
          <input className="input-field w-full text-sm font-semibold" placeholder="ej: Salón Divina Studio"
            value={config.nombre_salon || ''} onChange={e => setConfig(prev => ({ ...prev, nombre_salon: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>Descripción corta / Eslogan</label>
          <input className="input-field w-full text-sm" placeholder="ej: Tu salón de confianza y estética avanzada en Miraflores ✨"
            value={config.descripcion_header || ''} onChange={e => setConfig(prev => ({ ...prev, descripcion_header: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Phone size={12} className="text-emerald-500" /> WhatsApp (con código de país)
            </label>
            <input className="input-field w-full text-sm font-mono" placeholder="ej: 51987654321"
              value={config.telefono_whatsapp || ''} onChange={e => setConfig(prev => ({ ...prev, telefono_whatsapp: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Instagram size={12} className="text-pink-500" /> Instagram (@usuario o URL)
            </label>
            <input className="input-field w-full text-sm" placeholder="https://instagram.com/... o @usuario"
              value={config.instagram_url || ''} onChange={e => setConfig(prev => ({ ...prev, instagram_url: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock size={12} className="text-purple-500" /> Horario de atención
            </label>
            <input className="input-field w-full text-sm" placeholder="ej: Lun-Vie: 9am - 8pm · Sáb: 9am - 6pm"
              value={config.horario || ''} onChange={e => setConfig(prev => ({ ...prev, horario: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <MapPin size={12} className="text-rose-500" /> Dirección física
            </label>
            <input className="input-field w-full text-sm" placeholder="ej: Av. Larco 123, Miraflores, Lima"
              value={config.direccion || ''} onChange={e => setConfig(prev => ({ ...prev, direccion: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Globe size={12} className="text-blue-500" /> Link de Google Maps
            </label>
            <input className="input-field w-full text-sm font-mono text-xs" placeholder="https://maps.google.com/..."
              value={config.maps_url || ''} onChange={e => setConfig(prev => ({ ...prev, maps_url: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Image size={12} className="text-indigo-500" /> URL del Logo (enlace web)
            </label>
            <input className="input-field w-full text-sm font-mono text-xs" placeholder="https://... (jpg, png, webp)"
              value={config.logo_url || ''} onChange={e => setConfig(prev => ({ ...prev, logo_url: e.target.value }))} />
          </div>
        </div>
      </div>

      <button onClick={() => handleSaveConfig()} disabled={saving}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 hover:brightness-105"
        style={{ background: 'var(--color-brand)' }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Guardar Apariencia & Datos
      </button>
    </div>
  );

  // ─── Render: Tab Preview ──────────────────────────────────────────
  const renderPreview = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Vista Previa y Compartir</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Así verán tu carta tus clientas. Copia el link y compártelo en WhatsApp, Instagram bio o Stories.
        </p>
      </div>

      {/* Link público */}
      <div className="card-glass rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Tu link público</p>
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--color-surface-hover)' }}>
          <Link2 size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
          <p className="text-sm font-mono flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{publicLink}</p>
          <button onClick={() => { navigator.clipboard.writeText(publicLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
            style={{ background: copiedLink ? '#10b981/15' : 'var(--color-brand)/10', color: copiedLink ? '#10b981' : 'var(--color-brand)' }}>
            {copiedLink ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
          </button>
        </div>
        <a href={publicLink} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.01]"
          style={{ borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}>
          <ExternalLink size={14} /> Abrir mi carta en nueva pestaña
        </a>
      </div>

      {/* Tips */}
      <div className="card-glass rounded-2xl p-4">
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>💡 Tips para compartir</p>
        <ul className="space-y-2">
          {[
            { emoji: '📱', text: 'Añade el link a tu bio de Instagram para que tus seguidoras vean tus servicios' },
            { emoji: '💬', text: 'Compártelo en tu WhatsApp Business como link rápido de consulta de precios' },
            { emoji: '🖨️', text: 'Imprime un QR code del link y ponlo en recepción o en los espejos del salón' },
            { emoji: '📸', text: 'Graba un video corto recorriendo la carta y compártelo en tus Stories' },
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="text-base leading-none mt-0.5">{tip.emoji}</span>
              <span>{tip.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* iframe preview */}
      {businessId && (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--color-surface)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>Vista Previa Mobile</p>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="flex justify-center py-4" style={{ background: 'var(--color-surface-hover)' }}>
            <div className="w-[320px] h-[568px] rounded-[32px] overflow-hidden shadow-2xl border-4" style={{ borderColor: 'var(--color-brand)/30' }}>
              <iframe src={publicLink} className="w-full h-full" title="Vista previa de tu carta digital" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Render Principal ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--color-text-primary)' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg flex items-center gap-2"
            style={{ background: toast.type === 'success' ? '#10b981' : '#ef4444' }}>
            {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-brand)/15' }}>
            <BookOpen size={18} style={{ color: 'var(--color-brand)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Vitrina Digital</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Tu vitrina & lookbook interactivo · <span className="font-semibold" style={{ color: '#10b981' }}>✓ Incluido en plan Glow</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 px-4 sm:px-6 pb-0" style={{ background: 'var(--color-bg)' }}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-3 pt-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${activeTab === tab.id ? 'text-white shadow-md' : 'hover:bg-white/5'}`}
              style={{
                background: activeTab === tab.id ? 'var(--color-brand)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-muted)',
              }}>
              {tab.icon}
              {tab.label}
              {tab.isPro && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-500'
                }`}>
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="h-px" style={{ background: 'var(--color-border)' }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            {activeTab === 'servicios'  && renderServicios()}
            {activeTab === 'promos'     && renderPromos()}
            {activeTab === 'fomo'       && renderFomo()}
            {activeTab === 'apariencia' && renderApariencia()}
            {activeTab === 'playbook'   && <CartaPlaybook businessId={businessId} />}
            {activeTab === 'preview'    && renderPreview()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Sub-componente: ServicioCard ─────────────────────────────────────
interface ServicioCardProps {
  srv: CartaServicio;
  isEditing: boolean;
  editingData: Partial<CartaServicio>;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onChange: (data: Partial<CartaServicio>) => void;
  onDelete: () => void;
  onToggleDestacado?: () => void;
  saving: boolean;
}

const ServicioCard: React.FC<ServicioCardProps> = ({ srv, isEditing, editingData, onEdit, onCancelEdit, onSave, onChange, onDelete, onToggleDestacado, saving }) => {
  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-brand)/30', background: 'var(--color-brand)/5' }}>
        <ServicioForm data={editingData} onChange={onChange} onSave={onSave} onCancel={onCancelEdit} saving={saving} isEdit />
      </motion.div>
    );
  }

  const hasAntesDespues = Boolean(srv.antes_despues?.activo && srv.antes_despues.foto_antes && srv.antes_despues.foto_despues);

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:border-gray-300 dark:hover:border-white/20 transition-all border border-transparent" style={{ background: 'var(--color-surface)' }}>
      {/* Media thumbnail */}
      <div className="w-12 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative aspect-[3/4]"
        style={{ background: 'var(--color-surface-hover)' }}>
        {srv.media_url ? (
          srv.media_tipo === 'video'
            ? <video src={srv.media_url} className="w-full h-full object-cover" muted playsInline />
            : <img src={srv.media_url} alt={srv.nombre} className="w-full h-full object-cover" />
        ) : <Image size={18} style={{ color: 'var(--color-text-muted)' }} />}
        {hasAntesDespues && (
          <span className="absolute bottom-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-black px-1 rounded shadow-xs" title="Tiene Slider Antes/Después">
            A/D
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{srv.nombre}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
            {srv.precio ? `${srv.precio_desde ? 'Desde ' : ''}S/ ${Number(srv.precio).toFixed(2)}` : 'Consultar'}
          </span>
          {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
            <span className="text-[11px] line-through text-gray-400">
              S/ {Number(srv.precio_original).toFixed(2)}
            </span>
          )}
          {srv.duracion_min && <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--color-text-muted)' }}><Clock size={10} />{srv.duracion_min} min</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 1-Click Destacado / Top Button */}
        <button
          onClick={onToggleDestacado}
          className={`p-1.5 rounded-lg transition-all ${
            srv.destacado
              ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 ring-1 ring-amber-500/30'
              : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-amber-500/10'
          }`}
          title={srv.destacado ? 'Quitar de Ofertas del Día / Top' : 'Marcar como Oferta del Día / Top'}
        >
          <Star size={15} className={srv.destacado ? 'fill-amber-400 text-amber-500' : ''} />
        </button>

        <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: 'var(--color-text-muted)' }} title="Editar servicio completo">
          <Edit3 size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar servicio">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Sub-componente: ServicioForm ─────────────────────────────────────
interface ServicioFormProps {
  data: Partial<CartaServicio>;
  onChange: (data: Partial<CartaServicio>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}

const ServicioForm: React.FC<ServicioFormProps> = ({ data, onChange, onSave, onCancel, saving, isEdit }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // Límite de tamaño inicial: 15MB
    if (rawFile.size > 15 * 1024 * 1024) {
      alert('El archivo no debe superar los 15MB.');
      return;
    }

    setUploading(true);
    try {
      let uploadFile = rawFile;
      let finalDataUrl = '';

      // Si es una imagen, optimizar automáticamente en el cliente a 3:4 HD WebP
      if (rawFile.type.startsWith('image/')) {
        try {
          const optimized = await optimizeImageClient(rawFile, {
            maxWidth: 1080,
            quality: 0.85,
            aspectRatio: '3:4',
          });
          uploadFile = optimized.file;
          finalDataUrl = optimized.dataUrl;
        } catch (optErr) {
          console.warn('Fallback a imagen original:', optErr);
        }
      }

      const fileExt = uploadFile.name.split('.').pop() || 'webp';
      const fileName = `servicio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `servicios/${fileName}`;

      // Intentar subir al bucket 'nilah_assets' o 'brand_assets'
      let uploadResult = await supabase.storage.from('nilah_assets').upload(filePath, uploadFile, { upsert: true });
      let bucket = 'nilah_assets';
      
      if (uploadResult.error) {
        // Fallback a 'brand_assets'
        uploadResult = await supabase.storage.from('brand_assets').upload(filePath, uploadFile, { upsert: true });
        bucket = 'brand_assets';
      }

      if (uploadResult.error) {
        // Si no hay bucket en Supabase o da error, usar Data URL base64 optimizada instantáneamente
        if (finalDataUrl) {
          onChange({
            media_url: finalDataUrl,
            media_tipo: rawFile.type.startsWith('video/') ? 'video' : 'imagen',
          });
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            onChange({
              media_url: reader.result as string,
              media_tipo: rawFile.type.startsWith('video/') ? 'video' : 'imagen',
            });
          };
          reader.readAsDataURL(rawFile);
        }
      } else {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          onChange({
            media_url: publicData.publicUrl,
            media_tipo: rawFile.type.startsWith('video/') ? 'video' : 'imagen',
          });
        }
      }
    } catch (err) {
      console.error('Error al subir archivo:', err);
      alert('No se pudo subir la foto directamente, puedes pegar la URL.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-5 space-y-4 rounded-2xl border border-purple-200/80 dark:border-purple-800/40 bg-white/95 dark:bg-dark-850 shadow-sm" style={{ color: 'var(--color-text-primary)' }}>
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
        <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-brand)' }}>
          <Sparkles size={14} /> {isEdit ? 'Editando Servicio' : 'Nuevo Servicio'}
        </p>
        <span className="text-[10px] text-gray-400 font-medium">Campos con * son obligatorios</span>
      </div>
      
      {/* Nombre y Descripción */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>Nombre del servicio *</label>
        <input className="input-field w-full text-sm font-semibold" placeholder="ej: Lifting de Pestañas + Tinte"
          value={data.nombre || ''} onChange={e => onChange({ nombre: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold block" style={{ color: 'var(--color-text-secondary)' }}>
          Descripción y procedimiento (se muestra a las clientas)
        </label>
        <textarea className="input-field w-full text-sm resize-none leading-relaxed" rows={2.5} placeholder="Describe el procedimiento, beneficios y qué incluye la cita..."
          value={data.descripcion || ''} onChange={e => onChange({ descripcion: e.target.value })} />
      </div>

      {/* Precios y Duración */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/10">
        <div className="space-y-1.5">
          <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <DollarSign size={12} className="text-purple-600" /> Precio Venta (S/) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/</span>
            <input type="number" step="0.5" className="input-field w-full pl-8 text-sm font-bold" placeholder="0.00"
              value={data.precio || ''} onChange={e => onChange({ precio: parseFloat(e.target.value) || undefined })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold flex items-center gap-1 text-gray-500">
            <Tag size={12} /> Precio Normal (Tachado)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">S/</span>
            <input type="number" step="0.5" className="input-field w-full pl-8 text-sm font-medium" placeholder="Opcional (ej: 120)"
              value={data.precio_original || ''} onChange={e => onChange({ precio_original: parseFloat(e.target.value) || undefined })} />
          </div>
          {data.precio_original && data.precio && data.precio_original > data.precio && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block mt-0.5">
              🔥 {Math.round(((data.precio_original - data.precio) / data.precio_original) * 100)}% de ahorro
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Clock size={12} className="text-purple-600" /> Duración (min)
          </label>
          <input type="number" className="input-field w-full text-sm font-medium" placeholder="60"
            value={data.duracion_min || ''} onChange={e => onChange({ duracion_min: parseInt(e.target.value) || undefined })} />
        </div>
      </div>

      {/* Imagen o Foto Real */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
            <span>Foto o Video del Look</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
              Formato ideal: 3:4 o 1:1
            </span>
          </label>
          {data.media_url && (
            <button
              type="button"
              onClick={() => onChange({ media_url: '' })}
              className="text-[11px] text-rose-500 hover:underline font-bold"
            >
              Quitar foto
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 shrink-0 bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700/50 text-purple-600 dark:text-purple-300 shadow-2xs"
          >
            {uploading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Camera size={13} />
            )}
            {uploading ? 'Subiendo...' : 'Subir desde Celular / PC'}
          </button>

          <input className="input-field flex-1 text-xs" placeholder="o pega la URL de imagen https://..."
            value={data.media_url || ''} onChange={e => onChange({ media_url: e.target.value })} />
        </div>

        {/* Vista previa miniatura si hay imagen */}
        {data.media_url && (
          <div className="flex items-center gap-3 p-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/10 shrink-0 border border-gray-200 dark:border-white/10 aspect-[3/4] shadow-2xs">
              {data.media_tipo === 'video' ? (
                <video src={data.media_url} className="w-full h-full object-cover" muted autoPlay playsInline loop />
              ) : (
                <img src={data.media_url} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">Foto asignada correctamente</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{data.media_url}</p>
            </div>
          </div>
        )}
      </div>

      {/* ✨ MÓDULO PRO: Slider Interactivo Antes y Después */}
      <div className="p-3.5 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/20 dark:bg-amber-950/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-600" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">Slider Antes y Después</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.2 rounded-md shadow-2xs">
              PRO
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const current = data.antes_despues || { activo: false, foto_antes: '', foto_despues: '', etiqueta: 'Transformación Real' };
              onChange({ antes_despues: { ...current, activo: !current.activo } });
            }}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all shadow-2xs ${
              data.antes_despues?.activo
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-500'
            }`}
          >
            {data.antes_despues?.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {data.antes_despues?.activo ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        {data.antes_despues?.activo && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] text-gray-500 leading-tight">
              Permite a tus clientas deslizar interactivamente entre la foto del antes y el resultado final en tu vitrina.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto Antes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Foto Antes</label>
                  <label className="text-[11px] text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1 font-bold">
                    <Camera size={12} /> Subir archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const opt = await optimizeImageClient(file, { maxWidth: 1080, quality: 0.85, aspectRatio: '3:4' });
                          const fileExt = 'webp';
                          const fileName = `antes-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                          const filePath = `servicios/${fileName}`;
                          let bucket = 'nilah_assets';
                          let res = await supabase.storage.from('nilah_assets').upload(filePath, opt.file, { upsert: true });
                          if (res.error) {
                            res = await supabase.storage.from('brand_assets').upload(filePath, opt.file, { upsert: true });
                            bucket = 'brand_assets';
                          }
                          const finalUrl = res.data ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl : opt.dataUrl;
                          onChange({
                            antes_despues: { ...data.antes_despues!, foto_antes: finalUrl }
                          });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  className="input-field w-full text-xs"
                  placeholder="o pega URL (https://...)"
                  value={data.antes_despues.foto_antes || ''}
                  onChange={e => onChange({
                    antes_despues: { ...data.antes_despues!, foto_antes: e.target.value }
                  })}
                />
                {data.antes_despues.foto_antes && (
                  <div className="w-14 h-18 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mt-1 aspect-[3/4] shadow-2xs">
                    <img src={data.antes_despues.foto_antes} alt="Antes" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Foto Después */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Foto Después</label>
                  <label className="text-[11px] text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-1 font-bold">
                    <Camera size={12} /> Subir archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const opt = await optimizeImageClient(file, { maxWidth: 1080, quality: 0.85, aspectRatio: '3:4' });
                          const fileExt = 'webp';
                          const fileName = `despues-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                          const filePath = `servicios/${fileName}`;
                          let bucket = 'nilah_assets';
                          let res = await supabase.storage.from('nilah_assets').upload(filePath, opt.file, { upsert: true });
                          if (res.error) {
                            res = await supabase.storage.from('brand_assets').upload(filePath, opt.file, { upsert: true });
                            bucket = 'brand_assets';
                          }
                          const finalUrl = res.data ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl : opt.dataUrl;
                          onChange({
                            antes_despues: { ...data.antes_despues!, foto_despues: finalUrl }
                          });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  className="input-field w-full text-xs"
                  placeholder="o pega URL (https://...)"
                  value={data.antes_despues.foto_despues || ''}
                  onChange={e => onChange({
                    antes_despues: { ...data.antes_despues!, foto_despues: e.target.value }
                  })}
                />
                {data.antes_despues.foto_despues && (
                  <div className="w-14 h-18 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 mt-1 aspect-[3/4] shadow-2xs">
                    <img src={data.antes_despues.foto_despues} alt="Después" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🖼️ Galería Extendida del Lookbook */}
      <div className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🖼️</span> Galería Lookbook (Fotos extra)
            </span>
            <p className="text-[10px] text-gray-400">Añade hasta 4 fotos adicionales para el modal de detalle del servicio</p>
          </div>
          <span className="text-[10px] font-bold text-gray-500 bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/10">
            {(data.galeria || []).length}/4 fotos
          </span>
        </div>

        {/* Lista de fotos en galería */}
        {(data.galeria || []).length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {(data.galeria || []).map((imgUrl, idx) => (
              <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black/5 shadow-2xs">
                <img src={imgUrl} alt={`Lookbook ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const next = (data.galeria || []).filter((_, i) => i !== idx);
                    onChange({ galeria: next });
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity shadow-sm"
                  title="Eliminar foto"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input para agregar foto a galería */}
        {(data.galeria || []).length < 4 && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              id="gallery-input-new"
              className="input-field flex-1 text-xs"
              placeholder="Pega URL de foto extra (https://...)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    onChange({ galeria: [...(data.galeria || []), val] });
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('gallery-input-new') as HTMLInputElement;
                if (input && input.value.trim()) {
                  onChange({ galeria: [...(data.galeria || []), input.value.trim()] });
                  input.value = '';
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0 shadow-sm"
              style={{ background: 'var(--color-brand)' }}
            >
              + Añadir
            </button>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => onChange({ precio_desde: !data.precio_desde })}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold border transition-all ${
            data.precio_desde
              ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10'
          }`}
        >
          {data.precio_desde ? <Check size={11} /> : null} "Desde S/"
        </button>
        <button type="button" onClick={() => onChange({ destacado: !data.destacado })}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold border transition-all ${
            data.destacado
              ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10'
          }`}
        >
          <Star size={11} className={data.destacado ? 'fill-white' : ''} /> Destacado (TOP)
        </button>
        <button type="button" onClick={() => onChange({ media_tipo: data.media_tipo === 'video' ? 'imagen' : 'video' })}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10">
          {data.media_tipo === 'video' ? <Video size={11} /> : <Image size={11} />}
          {data.media_tipo === 'video' ? 'Video' : 'Imagen'}
        </button>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button type="button" onClick={onSave} disabled={saving || !data.nombre?.trim()}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md transition-all active:scale-98 hover:brightness-105"
          style={{ background: 'var(--color-brand)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {isEdit ? 'Guardar Cambios del Servicio' : 'Añadir a la Carta'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-3 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5" style={{ color: 'var(--color-text-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CartaDigital;
