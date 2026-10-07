import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, QrCode, Gift, Settings, CheckCircle2, Copy, ExternalLink,
  Printer, Plus, Edit2, Trash2, Search, Check, AlertCircle, Clock,
  Sparkles, Tag, Smartphone, ShieldCheck, Heart, Award, ArrowUpRight,
  RefreshCw, Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import {
  ResenasConfig, ResenaPremio, ResenaCupon, TipoRecompensa
} from '../types/resenas';
import {
  getResenasConfig, saveResenasConfig, getPremios, savePremio,
  deletePremio, getCupones, canjearCupon, CATEGORIAS_PREDEFINIDAS
} from '../services/resenasService';

type ActiveTab = 'flyer' | 'premios' | 'cupones' | 'ajustes';

export const ReviewsManager: React.FC = () => {
  const { user } = useAuth();
  const businessId = String(user?.business_id || user?.id || '');
  const salonNombre = (user as any)?.nombreNegocio || user?.name || 'Mi Salón';
  const salonSlug = String((user as any)?.slug || businessId);

  const [activeTab, setActiveTab] = useState<ActiveTab>('flyer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Config State
  const [config, setConfig] = useState<ResenasConfig | null>(null);
  const [googleUrl, setGoogleUrl] = useState('');
  const [adminPin, setAdminPin] = useState('1234');
  const [diasValidez, setDiasValidez] = useState(30);
  const [flyerTitulo, setFlyerTitulo] = useState('¡Tu opinión vale oro!');
  const [flyerSubtitulo, setFlyerSubtitulo] = useState(
    'Escanea, califícanos en Google y recibe un beneficio exclusivo en tu próxima visita'
  );

  // Flyer Print Customization
  const [flyerFormat, setFlyerFormat] = useState<'a5' | 'a6' | 'sticker'>('a5');
  const [flyerTheme, setFlyerTheme] = useState<'rose' | 'lavender' | 'gold' | 'dark'>('rose');
  const [salonLogo, setSalonLogo] = useState<string>('');
  const [showLogoOnFlyer, setShowLogoOnFlyer] = useState(true);
  const flyerRef = useRef<HTMLDivElement>(null);

  // Premios State
  const [premios, setPremios] = useState<ResenaPremio[]>([]);
  const [editingPremio, setEditingPremio] = useState<Partial<ResenaPremio> | null>(null);
  const [showPremioModal, setShowPremioModal] = useState(false);

  // Cupones State
  const [cupones, setCupones] = useState<ResenaCupon[]>([]);
  const [cuponSearch, setCuponSearch] = useState('');
  const [cuponFilter, setCuponFilter] = useState<'todos' | 'activo' | 'canjeado'>('todos');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // URL pública de la PWA de reseñas
  const publicReviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/resenas/${salonSlug}`
    : `/resenas/${salonSlug}`;

  // Carga inicial
  useEffect(() => {
    if (!businessId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [cfg, prem, cup] = await Promise.all([
          getResenasConfig(businessId),
          getPremios(businessId),
          getCupones(businessId),
        ]);
        setConfig(cfg);
        setGoogleUrl(cfg.google_review_url || '');
        setAdminPin(cfg.admin_pin || '1234');
        setDiasValidez(cfg.dias_validez_default || 30);
        setFlyerTitulo(cfg.flyer_titulo || '¡Tu opinión vale oro!');
        setFlyerSubtitulo(cfg.flyer_subtitulo || 'Escanea, califícanos en Google y recibe un beneficio exclusivo');
        setPremios(prem);
        setCupones(cup);

        // Cargar logo con fallback
        const { supabase } = await import('../services/supabase');
        const { data: bizData } = await supabase
          .from('negocios')
          .select('logo_url')
          .eq('id', businessId)
          .maybeSingle();

        let lUrl = bizData?.logo_url || '';
        if (!lUrl) {
          const { data: infoRow } = await supabase
            .from('negocio_info')
            .select('valor_texto')
            .eq('business_id', businessId)
            .eq('clave', 'logo_url')
            .maybeSingle();
          if (infoRow?.valor_texto) lUrl = infoRow.valor_texto;
        }
        if (lUrl) setSalonLogo(lUrl);
      } catch (err) {
        console.error('Error loading resenas data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessId, salonSlug]);

  // Guardar Ajustes
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessId) return;

    setSaving(true);
    try {
      const updated = await saveResenasConfig(businessId, {
        google_review_url: googleUrl.trim(),
        admin_pin: adminPin.trim(),
        dias_validez_default: diasValidez,
        flyer_titulo: flyerTitulo.trim(),
        flyer_subtitulo: flyerSubtitulo.trim(),
      });
      if (updated) setConfig(updated);
    } catch (err) {
      console.error('Error al guardar ajustes:', err);
    } finally {
      setSaving(false);
    }
  };

  // Copiar link público
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicReviewUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  // Imprimir Flyer
  const handlePrintFlyer = () => {
    window.print();
  };

  // Guardar Premio (Crear o Editar)
  const handleSavePremioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPremio || !editingPremio.titulo_premio || !businessId) return;

    setSaving(true);
    try {
      await savePremio(businessId, editingPremio);
      const updated = await getPremios(businessId);
      setPremios(updated);
      setShowPremioModal(false);
      setEditingPremio(null);
    } catch (err) {
      console.error('Error guardando premio:', err);
    } finally {
      setSaving(false);
    }
  };

  // Borrar Premio
  const handleDeletePremio = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este beneficio de la lista?')) return;
    try {
      await deletePremio(id);
      setPremios((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error borrando premio:', err);
    }
  };

  // Canjear Cupón en Recepción
  const handleCanjear = async (cuponId: string) => {
    setRedeemingId(cuponId);
    try {
      const ok = await canjearCupon(cuponId, user?.name || 'Recepción');
      if (ok) {
        setCupones((prev) =>
          prev.map((c) =>
            c.id === cuponId
              ? { ...c, estado: 'canjeado', canjeado_en: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error canjeando cupon:', err);
    } finally {
      setRedeemingId(null);
    }
  };

  // Cupones filtrados
  const filteredCupones = cupones.filter((c) => {
    if (cuponFilter !== 'todos' && c.estado !== cuponFilter) return false;
    if (cuponSearch.trim()) {
      const s = cuponSearch.toLowerCase().trim();
      return (
        c.codigo.toLowerCase().includes(s) ||
        c.cliente_telefono.includes(s) ||
        c.cliente_nombre.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const totalEmitidos = cupones.length;
  const totalCanjeados = cupones.filter((c) => c.estado === 'canjeado').length;
  const tasaRetorno = totalEmitidos > 0 ? Math.round((totalCanjeados / totalEmitidos) * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* ── Encabezado Principal ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 font-semibold text-xs flex items-center gap-1 border border-amber-500/20">
              <Star size={13} className="fill-amber-500" /> Google Reviews & Fidelización
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-bold">
              Multi-Tenant Nilah
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Sistema de Reseñas 5⭐ & Cupones
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Convierte clientas satisfechas en reseñas de 5 estrellas en Google Maps y premia su próxima visita.
          </p>
        </div>

        {/* Botón Acción Rápida: Copiar Enlace Público */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Link Público'}</span>
          </button>
          <a
            href={publicReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity shadow-md shadow-rose-500/20"
          >
            <Smartphone size={16} />
            <span>Probar PWA Cliente</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>

      {/* ── Métricas Clave de Rendimiento ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cupones Emitidos</span>
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500"><Gift size={16} /></div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{totalEmitidos}</div>
          <span className="text-[11px] text-gray-400">Reseñas incentivadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cupones Canjeados</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 size={16} /></div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCanjeados}</div>
          <span className="text-[11px] text-gray-400">Visitas de retorno efectivas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasa de Retorno</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><Award size={16} /></div>
          </div>
          <div className="text-2xl font-black text-amber-500">{tasaRetorno}%</div>
          <span className="text-[11px] text-gray-400">Fidelización real en salón</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Google Review Link</span>
            <div className={`p-1.5 rounded-lg ${googleUrl ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
              <Star size={16} />
            </div>
          </div>
          <div className="text-sm font-bold truncate text-gray-900 dark:text-white">
            {googleUrl ? 'Conectado a Google' : 'No configurado'}
          </div>
          <span className="text-[11px] text-gray-400">
            {googleUrl ? 'Listo para recibir reseñas' : 'Pega el link en Ajustes'}
          </span>
        </div>
      </div>

      {/* ── Barra de Navegación de Pestañas ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/10 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('flyer')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'flyer'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <QrCode size={16} />
          <span>Flyer & QR Imprimible</span>
        </button>

        <button
          onClick={() => setActiveTab('premios')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'premios'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Gift size={16} />
          <span>Premios por Categoría</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10">
            {premios.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cupones')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'cupones'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Tag size={16} />
          <span>Cupones & Recepción</span>
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400">
            {cupones.filter((c) => c.estado === 'activo').length} activos
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ajustes')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'ajustes'
              ? 'border-rose-500 text-rose-600 dark:text-rose-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Settings size={16} />
          <span>Ajustes & Google Link</span>
        </button>
      </div>

      {/* ── CONTENIDO DE PESTAÑAS ── */}

      {/* 1. FLYER & QR IMPRIMIBLE */}
      {activeTab === 'flyer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controles de Personalización del Flyer */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Personalizar Flyer Físico
              </h3>

              {/* Formato de Impresión */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  Formato y Dimensiones Físicas
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFlyerFormat('a5')}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      flyerFormat === 'a5'
                        ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    📄 A5 Mostrador
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">14.8 × 21.0 cm</span>
                  </button>
                  <button
                    onClick={() => setFlyerFormat('a6' as any)}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      (flyerFormat as any) === 'a6'
                        ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    📋 A6 Portafoto
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">10.5 × 14.8 cm</span>
                  </button>
                  <button
                    onClick={() => setFlyerFormat('sticker')}
                    className={`p-2.5 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      flyerFormat === 'sticker'
                        ? 'border-rose-500 bg-rose-500/5 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    🪞 Sticker Espejo
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">10 × 10 cm</span>
                  </button>
                </div>
              </div>

              {/* Paleta Visual */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Paleta del Flyer</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'rose', name: 'Velvet Rose', bg: 'bg-rose-500' },
                    { id: 'lavender', name: 'Lavender', bg: 'bg-purple-600' },
                    { id: 'gold', name: 'Gold Luxe', bg: 'bg-amber-500' },
                    { id: 'dark', name: 'Obsidian', bg: 'bg-zinc-900' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setFlyerTheme(t.id as any)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-[11px] font-medium transition-all ${
                        flyerTheme === t.id
                          ? 'border-rose-500 ring-2 ring-rose-500/20'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${t.bg}`} />
                      <span className="truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textos del Flyer */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Título Principal</label>
                  <input
                    type="text"
                    value={flyerTitulo}
                    onChange={(e) => setFlyerTitulo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Subtítulo / Instrucción</label>
                  <textarea
                    rows={2}
                    value={flyerSubtitulo}
                    onChange={(e) => setFlyerSubtitulo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {salonLogo && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <img src={salonLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white shadow-xs" />
                    <div>
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">Logo del Salón</div>
                      <div className="text-[10px] text-gray-400">Mostrar en el flyer impreso</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLogoOnFlyer}
                    onChange={(e) => setShowLogoOnFlyer(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 cursor-pointer"
                  />
                </div>
              )}

              {/* Botón Imprimir */}
              <div className="pt-2">
                <button
                  onClick={handlePrintFlyer}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm shadow-lg hover:opacity-95 transition-opacity"
                >
                  <Printer size={18} />
                  <span>Imprimir / Guardar en PDF</span>
                </button>
                <p className="text-[11px] text-center text-gray-400 mt-2">
                  💡 Imprímelo en papel satinado o couché y colócalo en un portarretratos de acrílico en recepción.
                </p>
              </div>
            </div>
          </div>

          {/* Vista Previa del Flyer Físico (Lista para Imprimir) */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div
              ref={flyerRef}
              id="printable-flyer"
              data-format={flyerFormat}
              className={`w-full ${
                flyerFormat === 'a5'
                  ? 'max-w-[380px] min-h-[540px] p-7 rounded-[32px]'
                  : flyerFormat === 'a6'
                  ? 'max-w-[320px] min-h-[460px] p-6 rounded-[28px]'
                  : 'max-w-[340px] aspect-square p-5 rounded-[36px]'
              } shadow-2xl transition-all border text-center flex flex-col items-center justify-between relative overflow-hidden ${
                flyerTheme === 'rose'
                  ? 'bg-gradient-to-b from-rose-50 via-white to-pink-50 border-rose-200 text-rose-950'
                  : flyerTheme === 'lavender'
                  ? 'bg-gradient-to-b from-purple-50 via-white to-indigo-50 border-purple-200 text-purple-950'
                  : flyerTheme === 'gold'
                  ? 'bg-gradient-to-b from-amber-50 via-white to-orange-50 border-amber-200 text-amber-950'
                  : 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-zinc-800 text-white'
              }`}
            >
              {/* VARIANTE 1: STICKER PARA ESPEJOS (DISEÑO CLEAN, EQUILIBRADO Y MODERNO) */}
              {flyerFormat === 'sticker' ? (
                <div className="w-full h-full flex flex-col items-center justify-between">
                  {/* Encabezado Sticker */}
                  <div className="flex flex-col items-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                      {salonLogo && showLogoOnFlyer ? (
                        <div className="w-8 h-8 rounded-xl p-0.5 bg-white shadow-xs border border-black/5 flex items-center justify-center overflow-hidden">
                          <img src={salonLogo} alt={salonNombre} className="w-full h-full object-contain" />
                        </div>
                      ) : null}
                      <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-85 truncate max-w-[190px]">
                        {salonNombre}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-white/10 backdrop-blur-md shadow-xs border border-black/5 text-[10px] font-extrabold uppercase tracking-wider text-amber-500 mb-1">
                      <Star size={11} className="fill-amber-500" /> 5 Estrellas Google
                    </div>

                    <h2 className="text-base font-black tracking-tight leading-snug max-w-[260px]">
                      {flyerTitulo}
                    </h2>
                  </div>

                  {/* QR Container Centrado para Sticker */}
                  <div className="p-3 rounded-2xl bg-white shadow-lg border-2 border-white inline-flex flex-col items-center my-1">
                    <QRCodeSVG
                      value={publicReviewUrl}
                      size={135}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="text-[9px] font-extrabold tracking-widest uppercase text-gray-400 mt-1.5">
                      ESCANEA AQUÍ
                    </div>
                  </div>

                  {/* Footer Sticker */}
                  <div className="w-full">
                    <div className="py-1 px-3 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-black/5 text-[10.5px] font-bold text-center">
                      🎁 ¡Gana un beneficio en tu próxima visita!
                    </div>
                  </div>
                </div>
              ) : (
                /* VARIANTE 2: A5 / A6 MOSTRADOR (FORMATO EXPANDIDO PARA PORTARRETRATOS) */
                <div className="w-full h-full flex flex-col items-center justify-between">
                  {/* Header Flyer */}
                  <div className="space-y-2.5 w-full flex flex-col items-center">
                    {salonLogo && showLogoOnFlyer ? (
                      <div className="w-14 h-14 rounded-2xl p-1 bg-white shadow-md border border-black/5 flex items-center justify-center overflow-hidden mb-1">
                        <img src={salonLogo} alt={salonNombre} className="w-full h-full object-contain" />
                      </div>
                    ) : null}

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-amber-500">
                      <Star size={13} className="fill-amber-500" /> Google 5 Estrellas
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                      {flyerTitulo}
                    </h2>
                    <p className="text-xs font-medium opacity-80 max-w-xs mx-auto">
                      {flyerSubtitulo}
                    </p>
                  </div>

                  {/* QR Container */}
                  <div className="my-5 p-4 rounded-3xl bg-white shadow-xl border-4 border-white inline-block">
                    <QRCodeSVG
                      value={publicReviewUrl}
                      size={flyerFormat === 'a6' ? 150 : 190}
                      level="H"
                      includeMargin={true}
                    />
                    <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mt-2">
                      ESCANEA CON TU CÁMARA
                    </div>
                  </div>

                  {/* Beneficio destacado & Branding */}
                  <div className="space-y-2.5 w-full">
                    <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 text-xs font-semibold">
                      🎁 Elige tu premio en pantalla y desbloquéalo al calificar
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      {salonLogo && !showLogoOnFlyer && (
                        <img src={salonLogo} alt="" className="w-4 h-4 rounded-full object-contain" />
                      )}
                      <div className="text-xs font-extrabold tracking-wide uppercase opacity-85">
                        {salonNombre}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PREMIOS POR CATEGORÍA */}
      {activeTab === 'premios' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Catálogo de Recompensas por Servicio
              </h3>
              <p className="text-sm text-gray-500">
                La clienta verá únicamente los premios que correspondan al tipo de servicio que recibió hoy.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPremio({
                  categoria: 'Uñas',
                  titulo_premio: '',
                  tipo_recompensa: 'porcentaje',
                  valor_recompensa: '20%',
                  dias_validez: 30,
                  activo: true,
                });
                setShowPremioModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors shadow-sm self-start"
            >
              <Plus size={16} />
              <span>Nuevo Beneficio</span>
            </button>
          </div>

          {/* Listado de Premios agrupados por Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premios.map((premio) => {
              const catMeta = CATEGORIAS_PREDEFINIDAS.find((c) => c.id === premio.categoria);
              return (
                <div
                  key={premio.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-white/5 border transition-all shadow-sm flex flex-col justify-between ${
                    premio.activo
                      ? 'border-gray-200 dark:border-white/10'
                      : 'border-dashed border-gray-300 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header del Premio */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                        <span>{catMeta?.emoji || '🎁'}</span>
                        <span>{premio.categoria}</span>
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                        {premio.valor_recompensa || premio.tipo_recompensa}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-2">
                      {premio.titulo_premio}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <Clock size={13} />
                      <span>Vence en {premio.dias_validez || 30} días tras la emisión</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[11px] font-medium text-gray-400">
                      {premio.activo ? '🟢 Activo en QR' : '⚪ Pausado'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPremio(premio);
                          setShowPremioModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeletePremio(premio.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CUPONES & RECEPCIÓN - 100% MOBILE FIRST Y DOPAMÍNICO */}
      {activeTab === 'cupones' && (
        <div className="space-y-4">
          {/* Header Resumen Recepción */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
                <Gift size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  Recepción & Validación Rápida
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide">
                    En Vivo
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Valida el código de la clienta al pagar su cita con 1 solo toque.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-white/70 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-200/50 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300">
              <Sparkles size={14} className="text-amber-500" />
              <span>{filteredCupones.filter(c => c.estado === 'activo').length} Cupones Listos para Canje</span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda Mobile-Optimized */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar código (ej: GLAM-4821) o clienta..."
                value={cuponSearch}
                onChange={(e) => setCuponSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
              />
            </div>

            {/* Selector de Filtros estilo Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10 self-stretch sm:self-auto justify-between sm:justify-start">
              {(['todos', 'activo', 'canjeado'] as const).map((filtro) => {
                const count = filtro === 'todos' 
                  ? cupones.length 
                  : cupones.filter(c => c.estado === filtro).length;
                return (
                  <button
                    key={filtro}
                    onClick={() => setCuponFilter(filtro)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all flex items-center justify-center gap-1.5 ${
                      cuponFilter === filtro
                        ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <span>{filtro}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      cuponFilter === filtro 
                        ? 'bg-rose-500/10 text-rose-600' 
                        : 'bg-black/5 dark:bg-white/10 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Cupones / Tickets Mobile First */}
          {filteredCupones.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-center text-gray-400 space-y-2.5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 mx-auto flex items-center justify-center text-gray-400">
                <Tag size={24} />
              </div>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200">No hay cupones con este criterio</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Los cupones aparecerán aquí inmediatamente cuando las clientas escaneen el código QR en el salón.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCupones.map((c) => {
                const isActivo = c.estado === 'activo';
                const fechaExp = new Date(c.expira_en).toLocaleDateString();

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`relative rounded-3xl p-4 sm:p-5 border transition-all overflow-hidden ${
                      isActivo
                        ? 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10 shadow-md hover:shadow-lg'
                        : 'bg-gray-50/70 dark:bg-white/[0.02] border-dashed border-gray-200 dark:border-white/5 opacity-75'
                    }`}
                  >
                    {/* Línea de ticket perforado decorativo */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      {/* Código Ticket */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-black tracking-widest text-gray-900 dark:text-white px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/10">
                          {c.codigo}
                        </span>
                        <span
                          className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isActivo
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-200/70 dark:bg-white/10 text-gray-500'
                          }`}
                        >
                          {isActivo ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Activo
                            </>
                          ) : (
                            'Canjeado'
                          )}
                        </span>
                      </div>

                      {/* Badge Categoría */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        {c.categoria_servicio}
                      </span>
                    </div>

                    {/* Beneficio Promocional Destacado */}
                    <div className="mb-3.5">
                      <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                        🎁 {c.titulo_beneficio}
                      </h4>
                    </div>

                    {/* Información de la Clienta */}
                    <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs mb-3.5">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                        <span>👤 {c.cliente_nombre || 'Clienta VIP'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <span>📱 {c.cliente_telefono}</span>
                      </div>
                    </div>

                    {/* Footer del Cupón: Fecha y Botón de Acción */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-white/10">
                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} className={isActivo ? 'text-amber-500' : 'text-gray-400'} />
                        {isActivo ? (
                          <span>Vence: <b>{fechaExp}</b></span>
                        ) : (
                          <span>Canjeado el {c.canjeado_en ? new Date(c.canjeado_en).toLocaleDateString() : ''}</span>
                        )}
                      </div>

                      {/* Botón de Canje Rápido */}
                      {isActivo ? (
                        <button
                          onClick={() => handleCanjear(c.id)}
                          disabled={redeemingId === c.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Check size={14} />
                          <span>{redeemingId === c.id ? 'Validando...' : 'Canjear Ahora'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Aplicado en Salón
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. AJUSTES & GOOGLE LINK */}
      {activeTab === 'ajustes' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star size={18} className="text-amber-500" />
              Configuración de Enlace Google Reviews
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                URL Directa para Reseñas en Google Maps
              </label>
              <input
                type="url"
                required
                placeholder="https://g.page/r/.../review o https://maps.app.goo.gl/..."
                value={googleUrl}
                onChange={(e) => setGoogleUrl(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                💡 Este enlace es el que se abrirá automáticamente en el celular de la clienta tras elegir su premio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  PIN de Recepción (4 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono tracking-widest text-center"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Para autorizar canjes rápidos en mostrador</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Validez por Defecto (Días)
                </label>
                <input
                  type="number"
                  min={7}
                  max={120}
                  value={diasValidez}
                  onChange={(e) => setDiasValidez(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Tiempo que tiene la clienta para regresar</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── MODAL CREAR / EDITAR PREMIO ── */}
      <AnimatePresence>
        {showPremioModal && editingPremio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPremio.id ? 'Editar Beneficio' : 'Nuevo Beneficio para Clientas'}
              </h3>

              <form onSubmit={handleSavePremioSubmit} className="space-y-4">
                {/* Categoría */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría del Servicio</label>
                  <select
                    value={editingPremio.categoria || 'Uñas'}
                    onChange={(e) => setEditingPremio({ ...editingPremio, categoria: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {CATEGORIAS_PREDEFINIDAS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título Premio */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Título del Beneficio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 20% OFF en Lacio Brasilero"
                    value={editingPremio.titulo_premio || ''}
                    onChange={(e) => setEditingPremio({ ...editingPremio, titulo_premio: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Tipo de Recompensa y Valor */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Recompensa</label>
                    <select
                      value={editingPremio.tipo_recompensa || 'porcentaje'}
                      onChange={(e) =>
                        setEditingPremio({ ...editingPremio, tipo_recompensa: e.target.value as TipoRecompensa })
                      }
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="monto_fijo">Monto Fijo (S/)</option>
                      <option value="regalo">Regalo / Free</option>
                      <option value="especial">VIP / Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Valor Visible</label>
                    <input
                      type="text"
                      placeholder="Ej: 20%, S/ 30, Gratis"
                      value={editingPremio.valor_recompensa || ''}
                      onChange={(e) => setEditingPremio({ ...editingPremio, valor_recompensa: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Días Validez */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Días de Validez</label>
                  <input
                    type="number"
                    min={7}
                    max={120}
                    value={editingPremio.dias_validez || 30}
                    onChange={(e) => setEditingPremio({ ...editingPremio, dias_validez: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPremioModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar Premio'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewsManager;
