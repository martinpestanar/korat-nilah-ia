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
  Flame, Sliders, Crown, Lock
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
  CartaCategoria, CartaServicio, CartaConfig, CartaFOMOBanner,
  CartaPromoMes, CartaOfertaSemana, CartaPaleta, CARTA_PALETAS,
  CartaLayoutEstilo
} from '../types';
import { cartaCategorias, cartaServicios, cartaConfig } from '../services/api.js';
import CartaPlaybook from '../components/Carta/CartaPlaybook';

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
  const serviciosDeCat = (catId: string) => serviciosData.filter(s => s.categoria_id === catId && s.activo !== false);
  const sinCategoria = serviciosData.filter(s => !s.categoria_id && s.activo !== false);

  // ─── Render: Tab Servicios ────────────────────────────────────────
  const renderServicios = () => (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Categorías y Servicios</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Organiza tu carta por categorías. Sincroniza desde Mi Salón o añade personalizados.
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
          {categorias.map(cat => (
            <div key={cat.id} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
              {/* Header de categoría */}
              <button className="w-full flex items-center gap-3 p-3.5 text-left transition-all hover:bg-opacity-50"
                style={{ background: expandedCat === cat.id ? 'var(--color-brand)/5' : 'var(--color-surface)' }}
                onClick={() => setExpandedCat(prev => prev === cat.id ? null : cat.id)}>
                <span className="text-xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{cat.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{serviciosDeCat(cat.id).length} servicios</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={e => { e.stopPropagation(); handleDeleteCategoria(cat.id); }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  {expandedCat === cat.id ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
                </div>
              </button>

              {/* Servicios de la categoría */}
              <AnimatePresence>
                {expandedCat === cat.id && (
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
          ))}

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
  const renderPromos = () => {
    const pm = config.promo_mes || { activa: false, titulo: '', descripcion: '', badge_emoji: '🌸', badge_texto: 'Este Mes' };
    const os = config.oferta_semana || { activa: false, titulo: '', descripcion: '', precio_original: undefined, precio_oferta: undefined, expira_en: '' };

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Promociones y Ofertas</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Estas secciones aparecen destacadas en tu carta pública. Actívalas cuando tengas algo especial.
          </p>
        </div>

        {/* Promo del Mes */}
        <div className="card-glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌸</span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Promo del Mes</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Destacado inspiracional — sin precio</p>
              </div>
            </div>
            <button onClick={() => {
              const next = { ...pm, activa: !pm.activa };
              setConfig(prev => ({ ...prev, promo_mes: next }));
            }} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: pm.activa ? 'var(--color-brand)/15' : 'var(--color-surface-hover)', color: pm.activa ? 'var(--color-brand)' : 'var(--color-text-muted)' }}>
              {pm.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {pm.activa ? 'Activa' : 'Inactiva'}
            </button>
          </div>
          {pm.activa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Emoji Badge</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 rounded-xl border border-white/10 bg-white/5">
                    {['🌸','✨','💜','🔥','🎁','💅','🌺','⭐','💎','🌟'].map(e => (
                      <button key={e} type="button" onClick={() => setConfig(prev => ({ ...prev, promo_mes: { ...pm, badge_emoji: e } }))}
                        className={`w-7 h-7 rounded-lg text-sm transition-all flex items-center justify-center ${pm.badge_emoji === e ? 'ring-2 scale-105 shadow-xs font-bold' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                        style={{ ringColor: 'var(--color-brand)', background: pm.badge_emoji === e ? 'var(--color-brand)/20' : 'transparent' }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Texto del Badge</label>
                  <input className="input-field w-full text-sm box-border" placeholder="ej: Septiembre" value={pm.badge_texto || ''}
                    onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, badge_texto: e.target.value } }))} />
                  <p className="text-[10px] mt-1 text-gray-400">Etiqueta destacada en el banner</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Título de la Promo</label>
                <input className="input-field w-full text-sm" placeholder="ej: Balayage de Temporada ✨"
                  value={pm.titulo || ''} onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, titulo: e.target.value } }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Descripción corta</label>
                <textarea className="input-field w-full text-sm resize-none" rows={2}
                  placeholder="ej: Iluminación natural perfecta para el verano. Agenda ya y sorpréndete."
                  value={pm.descripcion || ''} onChange={e => setConfig(prev => ({ ...prev, promo_mes: { ...pm, descripcion: e.target.value } }))} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Oferta de la Semana */}
        <div className="card-glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Oferta de la Semana</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Con precio tachado y cuenta regresiva</p>
              </div>
            </div>
            <button onClick={() => {
              const next = { ...os, activa: !os.activa };
              setConfig(prev => ({ ...prev, oferta_semana: next }));
            }} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: os.activa ? '#ef4444/15' : 'var(--color-surface-hover)', color: os.activa ? '#ef4444' : 'var(--color-text-muted)' }}>
              {os.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {os.activa ? 'Activa' : 'Inactiva'}
            </button>
          </div>
          {os.activa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Nombre de la oferta</label>
                <input className="input-field w-full text-sm" placeholder="ej: Manicure Gel + Cepillado"
                  value={os.titulo || ''} onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, titulo: e.target.value } }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Precio original (S/)</label>
                  <input type="number" className="input-field w-full text-sm" placeholder="150"
                    value={os.precio_original || ''} onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, precio_original: parseFloat(e.target.value) || undefined } }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: '#ef4444' }}>
                    <Tag size={11} /> Precio oferta (S/)
                  </label>
                  <input type="number" className="input-field w-full text-sm" placeholder="99"
                    value={os.precio_oferta || ''} onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, precio_oferta: parseFloat(e.target.value) || undefined } }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                  <Calendar size={11} className="inline mr-1" />
                  Válida hasta (la oferta desaparece automáticamente)
                </label>
                <input type="date" className="input-field w-full text-sm"
                  value={os.expira_en?.split('T')[0] || ''} onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, expira_en: e.target.value } }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Descripción (opcional)</label>
                <textarea className="input-field w-full text-sm resize-none" rows={2}
                  placeholder="ej: Solo válido para citas de martes a jueves."
                  value={os.descripcion || ''} onChange={e => setConfig(prev => ({ ...prev, oferta_semana: { ...os, descripcion: e.target.value } }))} />
              </div>
            </motion.div>
          )}
        </div>

        <button onClick={() => handleSaveConfig()} disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: 'var(--color-brand)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar Promociones
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Banners FOMO & Flash Sales
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/20">
                <Crown size={11} /> PRO
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Crea urgencia y llena días lentos con una barra de cuenta regresiva en vivo sobre la carta.
            </p>
          </div>
          {!canFomoCountdown && (
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Lock size={12} /> Requiere Plan PRO
            </span>
          )}
        </div>

        {/* Card de Configuración de Banner FOMO */}
        <div className={`card-glass rounded-2xl p-4 space-y-4 ${!canFomoCountdown ? 'opacity-70 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
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
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: fb.activo ? '#10b98115' : 'var(--color-surface-hover)',
                color: fb.activo ? '#10b981' : 'var(--color-text-muted)'
              }}
            >
              {fb.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {fb.activo ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          {fb.activo && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
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
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
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

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    <Clock size={13} className="text-rose-500" /> Fecha y Hora límite de expiración
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field w-full text-sm font-medium"
                    value={fb.expira_en || ''}
                    onChange={e => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, expira_en: e.target.value } }))}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">El reloj contará hacia atrás horas, minutos y segundos.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Emoji del Ícono
                  </label>
                  <div className="flex gap-2">
                    {['⚡', '🔥', '⏳', '✨', '🎁', '💎'].map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, fomo_banner: { ...fb, badge_emoji: em } }))}
                        className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                          fb.badge_emoji === em ? 'ring-2 ring-rose-500 scale-105 bg-rose-500/10' : 'bg-gray-100 dark:bg-neutral-800'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista previa en vivo del banner */}
              <div className="pt-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vista Previa en Vivo</p>
                <div className="rounded-2xl p-3.5 bg-gradient-to-r from-neutral-900 via-rose-950 to-neutral-900 text-white shadow-lg border border-rose-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl animate-bounce">{fb.badge_emoji || '⚡'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-md">
                          {fb.descuento_tag || 'OFERTA'}
                        </span>
                        <p className="text-xs font-black truncate">{fb.titulo || 'Flash Sale Especial'}</p>
                      </div>
                      <p className="text-[11px] text-white/70 truncate mt-0.5">{fb.subtitulo || 'Por tiempo limitado'}</p>
                    </div>
                  </div>
                  <div className="shrink-0 bg-black/50 border border-white/10 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold text-rose-300">
                    ⏱️ 04:32:19
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <button
          onClick={() => handleSaveConfig()}
          disabled={saving || !canFomoCountdown}
          className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
          style={{ background: 'var(--color-brand)' }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar Flash Sale FOMO
        </button>
      </div>
    );
  };

  // ─── Render: Tab Apariencia ───────────────────────────────────────
  const renderApariencia = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Apariencia de tu Carta</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Personaliza los colores y los datos que aparecen en el header de tu carta.
        </p>
      </div>

      {/* Selector de Estilo de Layout de Cards */}
      <div className="card-glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              ✨ Estilo Visual de Servicios (Cards)
            </p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Elige cómo verán las clientas el catálogo de servicios en sus teléfonos móviles.
            </p>
          </div>
          <span className="text-[10px] uppercase font-black bg-pink-500/15 text-pink-500 px-2 py-0.5 rounded-full">
            Mobile-First
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {[
            {
              id: 'pinterest' as CartaLayoutEstilo,
              nombre: '📌 Pinterest Moodboard',
              badge: 'Recomendado para Nails & Pestañas',
              desc: 'Doble columna visual, fotos de gran tamaño, likes táctiles y tarjetas Hero dinámicas.'
            },
            {
              id: 'editorial' as CartaLayoutEstilo,
              nombre: '📖 Vogue Editorial Luxury',
              badge: 'Ideal para Spas & Balayage',
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
                className={`p-3 rounded-2xl border-2 text-left transition-all relative ${
                  isSelected ? 'scale-[1.01] shadow-md' : 'hover:scale-[1.01] opacity-85 hover:opacity-100'
                }`}
                style={{
                  borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
                  background: isSelected ? 'var(--color-brand)/8' : 'var(--color-surface)'
                }}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center shadow-xs"
                    style={{ background: 'var(--color-brand)' }}>
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <p className="text-xs font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {estilo.nombre}
                </p>
                <span className="inline-block text-[9px] font-semibold text-pink-600 bg-pink-50 dark:bg-pink-950/40 px-1.5 py-0.2 rounded mt-1">
                  {estilo.badge}
                </span>
                <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {estilo.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Paletas de colores */}
      <div className="card-glass rounded-2xl p-4">
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>🎨 Paleta de Colores</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.entries(CARTA_PALETAS) as [CartaPaleta, typeof CARTA_PALETAS[CartaPaleta]][]).map(([key, paleta]) => (
            <button key={key} onClick={() => handlePaleta(key)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${config.paleta === key ? 'scale-[1.02]' : ''}`}
              style={{ borderColor: config.paleta === key ? paleta.primario : 'var(--color-border)', background: paleta.acento }}>
              {config.paleta === key && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: paleta.primario }}>
                  <Check size={10} className="text-white" />
                </div>
              )}
              <div className="flex gap-1 mb-1.5">
                <div className="w-4 h-4 rounded-full" style={{ background: paleta.primario }} />
                <div className="w-4 h-4 rounded-full" style={{ background: paleta.secundario }} />
              </div>
              <p className="text-xs font-bold" style={{ color: paleta.primario }}>{paleta.emoji} {paleta.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: paleta.primario + 'aa' }}>{paleta.descripcion}</p>
            </button>
          ))}
        </div>
        {/* Custom colors */}
        {config.paleta === 'custom' && (
          <div className="flex gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Color Primario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                  value={config.color_primario || '#ec4899'} onChange={e => setConfig(prev => ({ ...prev, color_primario: e.target.value }))} />
                <input className="input-field flex-1 text-sm font-mono" value={config.color_primario || ''} onChange={e => setConfig(prev => ({ ...prev, color_primario: e.target.value }))} />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Color Secundario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                  value={config.color_secundario || '#fbcfe8'} onChange={e => setConfig(prev => ({ ...prev, color_secundario: e.target.value }))} />
                <input className="input-field flex-1 text-sm font-mono" value={config.color_secundario || ''} onChange={e => setConfig(prev => ({ ...prev, color_secundario: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Datos del header */}
      <div className="card-glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>📋 Datos del Salón y Header</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Sincronízalos automáticamente con Ajustes o personalízalos aquí.</p>
          </div>
          <button
            type="button"
            onClick={handleSincronizarInfoAjustes}
            disabled={syncingInfo}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-xs transition-all active:scale-95 whitespace-nowrap"
            style={{ borderColor: 'var(--color-brand)/40', color: 'var(--color-brand)', background: 'var(--color-brand)/8' }}
            title="Importa el nombre, teléfono, horarios, dirección y logo desde Ajustes > Mi Salón"
          >
            <RefreshCw size={12} className={syncingInfo ? 'animate-spin' : ''} />
            {syncingInfo ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Nombre del salón</label>
          <input className="input-field w-full text-sm" placeholder="ej: Salón Divina"
            value={config.nombre_salon || ''} onChange={e => setConfig(prev => ({ ...prev, nombre_salon: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Descripción corta</label>
          <input className="input-field w-full text-sm" placeholder="ej: Tu salón de confianza en Miraflores ✨"
            value={config.descripcion_header || ''} onChange={e => setConfig(prev => ({ ...prev, descripcion_header: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Phone size={11} /> WhatsApp (con código de país)
            </label>
            <input className="input-field w-full text-sm" placeholder="ej: 51987654321"
              value={config.telefono_whatsapp || ''} onChange={e => setConfig(prev => ({ ...prev, telefono_whatsapp: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Instagram size={11} /> Enlace o Usuario de Instagram
            </label>
            <input className="input-field w-full text-sm" placeholder="https://instagram.com/... o @usuario"
              value={config.instagram_url || ''} onChange={e => setConfig(prev => ({ ...prev, instagram_url: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Clock size={11} /> Horario de atención
          </label>
          <input className="input-field w-full text-sm" placeholder="ej: Lun-Vie: 9am - 8pm · Sáb: 9am - 2pm"
            value={config.horario || ''} onChange={e => setConfig(prev => ({ ...prev, horario: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <MapPin size={11} /> Dirección física
          </label>
          <input className="input-field w-full text-sm" placeholder="ej: Av. Larco 123, Miraflores, Lima"
            value={config.direccion || ''} onChange={e => setConfig(prev => ({ ...prev, direccion: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Globe size={11} /> Link de Google Maps
          </label>
          <input className="input-field w-full text-sm" placeholder="https://maps.google.com/..."
            value={config.maps_url || ''} onChange={e => setConfig(prev => ({ ...prev, maps_url: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Image size={11} /> URL del Logo (enlace externo)
          </label>
          <input className="input-field w-full text-sm" placeholder="https://... (jpg, png, webp)"
            value={config.logo_url || ''} onChange={e => setConfig(prev => ({ ...prev, logo_url: e.target.value }))} />
        </div>
      </div>

      <button onClick={() => handleSaveConfig()} disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'var(--color-brand)' }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
        Guardar Apariencia
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
            <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Mi Carta Digital</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Tu menú interactivo · <span className="font-semibold" style={{ color: '#10b981' }}>✓ Incluido en plan Glow</span>
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
  saving: boolean;
}

const ServicioCard: React.FC<ServicioCardProps> = ({ srv, isEditing, editingData, onEdit, onCancelEdit, onSave, onChange, onDelete, saving }) => {
  if (isEditing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-brand)/30', background: 'var(--color-brand)/5' }}>
        <ServicioForm data={editingData} onChange={onChange} onSave={onSave} onCancel={onCancelEdit} saving={saving} isEdit />
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--color-surface)' }}>
      {/* Media thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: 'var(--color-surface-hover)' }}>
        {srv.media_url ? (
          srv.media_tipo === 'video'
            ? <video src={srv.media_url} className="w-full h-full object-cover" muted playsInline />
            : <img src={srv.media_url} alt={srv.nombre} className="w-full h-full object-cover" />
        ) : <Image size={18} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {srv.destacado && <Star size={10} className="text-amber-400 fill-amber-400" />}
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{srv.nombre}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold" style={{ color: 'var(--color-brand)' }}>
            {srv.precio ? `${srv.precio_desde ? 'Desde ' : ''}S/ ${Number(srv.precio).toFixed(2)}` : 'Consultar'}
          </span>
          {srv.duracion_min && <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--color-text-muted)' }}><Clock size={10} />{srv.duracion_min} min</span>}
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }}><Edit3 size={13} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
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
    const file = e.target.files?.[0];
    if (!file) return;

    // Límite de tamaño: 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar los 10MB.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `servicio-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `servicios/${fileName}`;

      // Intentar subir al bucket 'nilah_assets' o 'brand_assets'
      let uploadResult = await supabase.storage.from('nilah_assets').upload(filePath, file, { upsert: true });
      let bucket = 'nilah_assets';
      
      if (uploadResult.error) {
        // Fallback a 'brand_assets'
        uploadResult = await supabase.storage.from('brand_assets').upload(filePath, file, { upsert: true });
        bucket = 'brand_assets';
      }

      if (uploadResult.error) {
        // Si no hay bucket en Supabase, usar Data URL base64 como fallback instantáneo
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange({
            media_url: reader.result as string,
            media_tipo: file.type.startsWith('video/') ? 'video' : 'imagen',
          });
        };
        reader.readAsDataURL(file);
      } else {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          onChange({
            media_url: publicData.publicUrl,
            media_tipo: file.type.startsWith('video/') ? 'video' : 'imagen',
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
    <div className="p-3 space-y-2.5 rounded-xl" style={{ background: isEdit ? 'transparent' : 'var(--color-surface)' }}>
      <p className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{isEdit ? 'Editando servicio' : 'Nuevo servicio'}</p>
      
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>Nombre del servicio *</label>
        <input className="input-field w-full text-sm" placeholder="Nombre del servicio (ej: Tinte de Pestañas)"
          value={data.nombre || ''} onChange={e => onChange({ nombre: e.target.value })} />
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
          Descripción y procedimiento (se muestra en la carta y modal)
        </label>
        <textarea className="input-field w-full text-sm resize-none" rows={2.5} placeholder="Describe el procedimiento, beneficios y qué incluye..."
          value={data.descripcion || ''} onChange={e => onChange({ descripcion: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <DollarSign size={11} /> Precio (S/)
          </label>
          <input type="number" className="input-field w-full text-sm" placeholder="0.00"
            value={data.precio || ''} onChange={e => onChange({ precio: parseFloat(e.target.value) || undefined })} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
            <Clock size={11} /> Duración (min)
          </label>
          <input type="number" className="input-field w-full text-sm" placeholder="60"
            value={data.duracion_min || ''} onChange={e => onChange({ duracion_min: parseInt(e.target.value) || undefined })} />
        </div>
      </div>

      {/* Imagen o Foto Real */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Foto o Video del Look
          </label>
          {data.media_url && (
            <button
              type="button"
              onClick={() => onChange({ media_url: '' })}
              className="text-[11px] text-rose-500 hover:underline font-semibold"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0"
            style={{ borderColor: 'var(--color-brand)/40', color: 'var(--color-brand)', background: 'var(--color-brand)/10' }}
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
          <div className="mt-2 flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-white/5">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/10 shrink-0 border border-white/10">
              {data.media_tipo === 'video' ? (
                <video src={data.media_url} className="w-full h-full object-cover" muted autoPlay playsInline loop />
              ) : (
                <img src={data.media_url} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">Foto asignada con éxito</p>
              <p className="text-[10px] text-gray-500 truncate">{data.media_url.substring(0, 45)}...</p>
            </div>
          </div>
        )}
      </div>

      {/* ✨ MÓDULO PRO: Slider Interactivo Antes y Después */}
      <div className="p-3 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-950/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-600" />
            <span className="text-xs font-bold text-gray-900 dark:text-white">Slider Antes y Después</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.2 rounded-md">
              PRO
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const current = data.antes_despues || { activo: false, foto_antes: '', foto_despues: '', etiqueta: 'Transformación Real' };
              onChange({ antes_despues: { ...current, activo: !current.activo } });
            }}
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition-all"
            style={{
              background: data.antes_despues?.activo ? '#10b98115' : 'var(--color-surface-hover)',
              color: data.antes_despues?.activo ? '#10b981' : 'var(--color-text-muted)'
            }}
          >
            {data.antes_despues?.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {data.antes_despues?.activo ? 'Activado' : 'Desactivado'}
          </button>
        </div>

        {data.antes_despues?.activo && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-gray-500 leading-tight">
              Permite a tus clientas deslizar interactivamente entre la foto del antes y el resultado final.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">URL Foto Antes</label>
                <input
                  type="text"
                  className="input-field w-full text-xs"
                  placeholder="https://... (Foto del cabello/uñas antes)"
                  value={data.antes_despues.foto_antes || ''}
                  onChange={e => onChange({
                    antes_despues: { ...data.antes_despues!, foto_antes: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">URL Foto Después (Resultado)</label>
                <input
                  type="text"
                  className="input-field w-full text-xs"
                  placeholder="https://... (Foto del resultado terminado)"
                  value={data.antes_despues.foto_despues || ''}
                  onChange={e => onChange({
                    antes_despues: { ...data.antes_despues!, foto_despues: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => onChange({ precio_desde: !data.precio_desde })}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border transition-all ${data.precio_desde ? 'border-current' : ''}`}
          style={{ color: data.precio_desde ? 'var(--color-brand)' : 'var(--color-text-muted)', borderColor: data.precio_desde ? 'var(--color-brand)' : 'transparent', background: data.precio_desde ? 'var(--color-brand)/10' : 'var(--color-surface-hover)' }}>
          {data.precio_desde ? <Check size={11} /> : null} "Desde S/"
        </button>
        <button type="button" onClick={() => onChange({ destacado: !data.destacado })}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium border transition-all`}
          style={{ color: data.destacado ? '#f59e0b' : 'var(--color-text-muted)', borderColor: data.destacado ? '#f59e0b' : 'transparent', background: data.destacado ? '#f59e0b15' : 'var(--color-surface-hover)' }}>
          <Star size={11} /> Destacado (TOP)
        </button>
        <button type="button" onClick={() => onChange({ media_tipo: data.media_tipo === 'video' ? 'imagen' : 'video' })}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
          style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-hover)' }}>
          {data.media_tipo === 'video' ? <Video size={11} /> : <Image size={11} />}
          {data.media_tipo === 'video' ? 'Video' : 'Imagen'}
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onSave} disabled={saving || !data.nombre?.trim()}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm"
          style={{ background: 'var(--color-brand)' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {isEdit ? 'Guardar Cambios' : 'Añadir Servicio'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CartaDigital;
