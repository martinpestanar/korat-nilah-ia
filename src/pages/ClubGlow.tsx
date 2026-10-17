import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  Flame,
  Award,
  Layers,
  Settings2,
  HelpCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag,
  Star,
  Users,
  MessageSquare,
  Smartphone,
  Check,
  Plus,
  Lock,
  Bell,
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { RealisticCreditCardGlow } from '@/components/ClubGlow/RealisticCreditCardGlow';
import { RentabilidadWizardGlow } from '@/components/ClubGlow/RentabilidadWizardGlow';
import { ModalSellarManual } from '@/components/ClubGlow/ModalSellarManual';
import { ModalCierreRapido } from '@/components/ClubGlow/ModalCierreRapido';
import { ModalImanRescate } from '@/components/ClubGlow/ModalImanRescate';
import { ModalCumpleanosVIP } from '@/components/ClubGlow/ModalCumpleanosVIP';
import { ModalGuardianCierre } from '@/components/ClubGlow/ModalGuardianCierre';
import { ModalPackPilotoAutomatico } from '@/components/ClubGlow/ModalPackPilotoAutomatico';
import { resolverMonedaNegocio } from '@/utils/currencyMultitenant';
import { optimizeImageClient } from '@/utils/clientImageOptimizer';
import confetti from 'canvas-confetti';

interface SelloConfig {
  id?: string;
  business_id: string;
  valor_sello_base: number;
  moneda: string;
  max_sellos_por_visita: number;
  vencimiento_sellos_meses: number;
  vencimiento_premio_dias?: number;
  bienvenida_activo: boolean;
  total_sellos_roadmap: number;
  addons_activos?: {
    cumpleanos?: boolean;
    referidas?: boolean;
    bienvenida?: boolean;
    reactivacion?: boolean;
  };
}

interface SelloRoadmap {
  id: string;
  hito_sello: number;
  nombre: string;
  descripcion: string;
  costo_interno: number;
  activo: boolean;
  imagen_url?: string | null;
}

interface SelloClienteDashboard {
  cliente_id: string;
  cliente_nombre: string;
  telefono: string;
  sellos_activos: number;
  sellos_roadmap: number;
  premios_pendientes: number;
  total_movimientos: number;
  ultimo_sello_at: string;
  categoria?: string;
  club_glow_nivel?: string;
  club_glow_ciclos_completados?: number;
}

interface PremioGanadoRow {
  id: string;
  cliente_id: string;
  cliente_nombre?: string;
  codigo_canje: string;
  estado: 'pendiente' | 'canjeado' | 'vencido';
  expira_en?: string;
  created_at: string;
  nombre_premio?: string;
  hito_sello?: number;
}

export default function ClubGlow() {
  const { user } = useAuth();
  const { currentPalette } = useTheme();
  const businessId = user?.business_id;

  // Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'premios' | 'simulador' | 'ajustes'>('dashboard');

  // Data states
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SelloConfig | null>(null);
  const [roadmap, setRoadmap] = useState<SelloRoadmap[]>([]);
  const [clientes, setClientes] = useState<SelloClienteDashboard[]>([]);
  const [premiosPendientes, setPremiosPendientes] = useState<PremioGanadoRow[]>([]);
  const [modoFidelizacion, setModoFidelizacion] = useState<'puntos' | 'sellos' | 'ambos'>('sellos');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNearMilestone, setFilterNearMilestone] = useState(false);

  // Quick Redemption State
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Margin Simulator State
  const [simuladorResult, setSimuladorResult] = useState<any>(null);
  const [roiMetrics, setRoiMetrics] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Manual Stamp Modal State
  const [modalManualOpen, setModalManualOpen] = useState(false);
  const [clientForManualStamp, setClientForManualStamp] = useState<any | null>(null);

  // Modal Cierre Rápido Guardián
  const [modalCierreRapidoOpen, setModalCierreRapidoOpen] = useState(false);

  // Detectar ?cierre_rapido=true en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cierre_rapido') === 'true') {
      setModalCierreRapidoOpen(true);
    }
  }, []);

  // Preview Card interactive demo
  const [previewStamps, setPreviewStamps] = useState(7);
  const [negocioPais, setNegocioPais] = useState<string | null>(null);

  // WhatsApp Message Template State
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>(
    '✨ *¡Bienvenida al Club {salon}, {nombre}!* 👑🎁\n\nTe regalamos *1 sello de bienvenida* por unirte y hoy sumaste otro: ya llevas *2 de 12 sellos* completados. ✨\n\n🎯 Te faltan solo *2 sellos* para tu primer regalo VIP: *{premio_1}* 🌸💎\n\n📲 *Mira tu tarjeta digital y progreso en vivo aquí:*\n{link_tarjeta}'
  );
  const [aceleradorMartes, setAceleradorMartes] = useState(true);
  const [aceleradorTicketAlto, setAceleradorTicketAlto] = useState(true);

  const [recursosSaas, setRecursosSaas] = useState<any>(null);
  const [negocioInfo, setNegocioInfo] = useState<{ nombre?: string; telefono?: string } | null>(null);
  const [probarGuardianLoading, setProbarGuardianLoading] = useState(false);
  const [modalProAddon, setModalProAddon] = useState<{ isOpen: boolean; titulo: string; desc: string } | null>(null);
  const [modalImanRescateOpen, setModalImanRescateOpen] = useState(false);
  const [modalCumpleanosOpen, setModalCumpleanosOpen] = useState(false);
  const [modalGuardianOpen, setModalGuardianOpen] = useState(false);
  const [modalPackOpen, setModalPackOpen] = useState(false);
  const [uploadingRoadmapId, setUploadingRoadmapId] = useState<string | null>(null);

  // Subir y optimizar foto para el premio del roadmap
  const handleSubirFotoPremio = async (roadmapItem: SelloRoadmap, file: File) => {
    if (!businessId || !roadmapItem) return;
    setUploadingRoadmapId(roadmapItem.id);

    try {
      // 1. Optimizar en el cliente a WebP HD 1:1 (<150KB)
      const optimized = await optimizeImageClient(file, {
        maxWidth: 800,
        quality: 0.85,
        aspectRatio: '1:1',
        format: 'webp'
      });

      const fileExt = 'webp';
      const fileName = `premio-hito${roadmapItem.hito_sello}-${Date.now()}.${fileExt}`;
      const filePath = `club_glow/premios/${businessId}/${fileName}`;

      // 2. Subir a Supabase Storage con fallback
      let uploadResult = await supabase.storage.from('nilah_assets').upload(filePath, optimized.file, { upsert: true });
      let bucket = 'nilah_assets';

      if (uploadResult.error) {
        uploadResult = await supabase.storage.from('brand_assets').upload(filePath, optimized.file, { upsert: true });
        bucket = 'brand_assets';
      }

      let finalUrl = optimized.dataUrl;
      if (!uploadResult.error) {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        if (publicData?.publicUrl) {
          finalUrl = publicData.publicUrl;
        }
      }

      // 3. Persistir en la tabla sellos_roadmap
      const { error: updateErr } = await supabase
        .from('sellos_roadmap')
        .update({ imagen_url: finalUrl })
        .eq('id', roadmapItem.id)
        .eq('business_id', businessId);

      if (updateErr) throw updateErr;

      // 4. Actualizar estado local
      setRoadmap(prev =>
        prev.map(r => (r.id === roadmapItem.id ? { ...r, imagen_url: finalUrl } : r))
      );
    } catch (err: any) {
      console.error('Error subiendo imagen del premio:', err);
      alert('No se pudo subir la foto del premio. Inténtalo de nuevo.');
    } finally {
      setUploadingRoadmapId(null);
    }
  };

  // Eliminar foto personalizada y volver al icono 3D
  const handleEliminarFotoPremio = async (roadmapItem: SelloRoadmap) => {
    if (!businessId || !roadmapItem) return;
    try {
      const { error: updateErr } = await supabase
        .from('sellos_roadmap')
        .update({ imagen_url: null })
        .eq('id', roadmapItem.id)
        .eq('business_id', businessId);

      if (updateErr) throw updateErr;

      setRoadmap(prev =>
        prev.map(r => (r.id === roadmapItem.id ? { ...r, imagen_url: null } : r))
      );
    } catch (err) {
      console.error('Error eliminando foto del premio:', err);
    }
  };

  // Load Initial Data
  const loadClubGlowData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // 1. Obtener estado del negocio y config
      const [negocioRes, configRes, roadmapRes] = await Promise.all([
        supabase.from('negocios').select('modo_fidelizacion, pais, moneda, recursos_saas, nombre, telefono').eq('id', businessId).single(),
        supabase.from('sellos_config').select('*').eq('business_id', businessId).maybeSingle(),
        supabase.from('sellos_roadmap').select('*').eq('business_id', businessId).order('hito_sello', { ascending: true })
      ]);

      if (negocioRes.data) {
        setRecursosSaas(negocioRes.data.recursos_saas || {});
        setNegocioInfo({ nombre: negocioRes.data.nombre, telefono: negocioRes.data.telefono });
        if (negocioRes.data.modo_fidelizacion) {
          setModoFidelizacion(negocioRes.data.modo_fidelizacion);
        }
        if (negocioRes.data.pais) {
          setNegocioPais(negocioRes.data.pais);
        }
      }

      // Resolver moneda multitenant con el país como ancla primaria (ej: Perú -> PEN / S/.)
      const infoMoneda = resolverMonedaNegocio(negocioRes.data?.pais, negocioRes.data?.moneda || configRes.data?.moneda);

      if (configRes.data) {
        setConfig({
          ...configRes.data,
          moneda: infoMoneda.codigoMoneda
        });
      } else {
        const monedaActivacion = infoMoneda.codigoMoneda;
        const valorBaseInicial = monedaActivacion === 'PEN' ? 30 : (monedaActivacion === 'COP' ? 40000 : (monedaActivacion === 'USD' ? 15 : 20));

        const { error: actErr } = await supabase.rpc('fn_activar_sellos_negocio', {
          p_business_id: businessId,
          p_valor_sello_base: valorBaseInicial,
          p_moneda: monedaActivacion
        });
        if (!actErr) {
          const { data: newCfg } = await supabase.from('sellos_config').select('*').eq('business_id', businessId).single();
          if (newCfg) {
            setConfig({
              ...newCfg,
              moneda: infoMoneda.codigoMoneda
            });
          }
        }
      }

      if (roadmapRes.data && roadmapRes.data.length > 0) {
        setRoadmap(roadmapRes.data);
      } else {
        const { data: rm } = await supabase.from('sellos_roadmap').select('*').eq('business_id', businessId).order('hito_sello', { ascending: true });
        if (rm) setRoadmap(rm);
      }

      // 2. Clientes desde la vista v_sellos_dashboard
      const { data: clientsData } = await supabase
        .from('v_sellos_dashboard')
        .select('*')
        .eq('business_id', businessId);

      if (clientsData) {
        setClientes(clientsData);
      }

      // 3. Premios pendientes de canje
      const { data: premiosData } = await supabase
        .from('sellos_premios_ganados')
        .select(`
          id,
          cliente_id,
          codigo_canje,
          estado,
          expira_en,
          created_at,
          roadmap_id,
          sellos_roadmap ( hito_sello, nombre ),
          Clientes ( nombre )
        `)
        .eq('business_id', businessId)
        .eq('estado', 'pendiente')
        .order('created_at', { ascending: false });

      if (premiosData) {
        const mapped = premiosData.map((p: any) => ({
          ...p,
          cliente_nombre: p.Clientes?.nombre || 'Clienta Glow',
          nombre_premio: p.sellos_roadmap?.nombre || 'Premio Glow',
          hito_sello: p.sellos_roadmap?.hito_sello || 4
        }));
        setPremiosPendientes(mapped);
      }

      // 4. Cargar simulación de margen
      const { data: simData } = await supabase.rpc('fn_simular_costo_roadmap', {
        p_business_id: businessId
      });
      if (simData) {
        setSimuladorResult(simData);
      }

      // 5. Cargar métricas de ROI generadas por sellos
      const { data: roiRes } = await supabase.rpc('fn_club_glow_roi_metricas', {
        p_business_id: businessId
      });
      if (roiRes) {
        setRoiMetrics(roiRes);
      }
    } catch (err) {
      console.error('Error cargando Club Glow:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadClubGlowData();
  }, [loadClubGlowData]);

  // Manejar Canje Rápido de Código SL-XXXXXX
  const handleCanjearCodigo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!redeemCode.trim() || !businessId) return;

    setRedeemLoading(true);
    setRedeemResult(null);

    try {
      const codeClean = redeemCode.trim().toUpperCase();
      const { data, error } = await supabase.rpc('fn_canjear_premio_sello', {
        p_codigo: codeClean,
        p_business_id: businessId
      });

      if (error || !data?.success) {
        setRedeemResult({
          success: false,
          message: data?.error || error?.message || 'Código no válido o ya canjeado'
        });
      } else {
        setRedeemResult({
          success: true,
          message: `🎉 ¡Premio entregado con éxito! Premio: ${data.premio} para ${data.cliente}`,
          data
        });
        setRedeemCode('');

        // Disparo de Confeti Dorado Triunfal
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f5d77f', '#d4af37', '#ffd700', '#ffffff', '#10b981']
          });
        } catch {}

        // Recargar premios y clientes
        loadClubGlowData();
      }
    } catch (err: any) {
      setRedeemResult({
        success: false,
        message: err.message || 'Error al validar el código'
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  // Guardar Configuración
  const handleGuardarConfig = async () => {
    if (!businessId || !config) return;
    setSavingConfig(true);
    try {
      await supabase
        .from('sellos_config')
        .update({
          valor_sello_base: config.valor_sello_base,
          moneda: config.moneda,
          max_sellos_por_visita: config.max_sellos_por_visita,
          vencimiento_sellos_meses: config.vencimiento_sellos_meses,
          vencimiento_premio_dias: config.vencimiento_premio_dias ?? 60,
          addons_activos: config.addons_activos
        })
        .eq('business_id', businessId);

      await supabase
        .from('negocios')
        .update({ modo_fidelizacion: 'sellos' })
        .eq('id', businessId);

      // Recalcular simulación
      const { data: simData } = await supabase.rpc('fn_simular_costo_roadmap', {
        p_business_id: businessId
      });
      if (simData) setSimuladorResult(simData);

      alert('Configuración de Club Glow actualizada correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error guardando configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  // Aplicar Configuración desde el Asistente Inteligente de Rentabilidad
  const handleApplyWizardConfig = async (wizardData: {
    valorBase: number;
    roadmap: [
      { numero: 4; tipo: 'mimo'; nombre: string; desc: string; costo: number },
      { numero: 8; tipo: 'detalle'; nombre: string; desc: string; costo: number },
      { numero: 12; tipo: 'glow'; nombre: string; desc: string; costo: number }
    ];
  }) => {
    if (!businessId) return;
    try {
      // 1. Actualizar sellos_config
      await supabase
        .from('sellos_config')
        .update({ valor_sello_base: wizardData.valorBase })
        .eq('business_id', businessId);

      // 2. Actualizar o insertar los 3 hitos en sellos_roadmap
      for (const item of wizardData.roadmap) {
        const payload: any = {
          business_id: businessId,
          hito_sello: item.numero,
          nombre: item.nombre,
          descripcion: item.desc,
          costo_interno: item.costo,
          activo: true
        };
        if ((item as any).imagen_url !== undefined) {
          payload.imagen_url = (item as any).imagen_url;
        }

        await supabase
          .from('sellos_roadmap')
          .upsert(payload, { onConflict: 'business_id,hito_sello' });
      }

      // 3. Recargar estado fresco
      await loadClubGlowData();
      setShowWizard(false);
    } catch (err) {
      console.error('Error aplicando configuración del asistente:', err);
      throw err;
    }
  };

  // Filtrado de clientes
  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const matchesSearch =
        (c.cliente_nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.telefono || '').includes(searchQuery);

      const sellosParaProximo = (c.sellos_roadmap || 12) - (c.sellos_activos || 0);
      if (filterNearMilestone) {
        return matchesSearch && sellosParaProximo === 1;
      }
      return matchesSearch;
    });
  }, [clientes, searchQuery, filterNearMilestone]);

  // Contadores KPI
  const stats = useMemo(() => {
    const totalClientas = clientes.length;
    const clientasCerca = clientes.filter(c => ((c.sellos_roadmap || 12) - (c.sellos_activos || 0)) === 1).length;
    const premiosPendientesCount = premiosPendientes.length;
    const totalSellos = clientes.reduce((acc, curr) => acc + (curr.sellos_activos || 0), 0);
    return {
      totalClientas,
      clientasCerca,
      premiosPendientesCount,
      totalSellos
    };
  }, [clientes, premiosPendientes]);

  return (
    <div className="w-full min-h-full text-gray-900 dark:text-white p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-8 animate-page-enter pb-32 sm:pb-8">
      {/* ── HEADER ULTRA-PREMIUM CON AURA DORADA & VIOLETA NILAH ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glow-card-mesh-light dark:glow-card-mesh p-4 sm:p-6 lg:p-8 border border-amber-200/60 dark:border-[#e5b855]/30 shadow-xl shadow-amber-500/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-400/20 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4">
          {/* Título */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-purple-950/60 border border-violet-200 dark:border-purple-500/30 text-violet-700 dark:text-purple-300 text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-[#F5D77F]" />
              Módulo Estrella Nilah
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              <span className="gold-gradient-text-light dark:gold-gradient-text">Club Glow</span>{' '}
              <span className="text-gray-700 dark:text-white/80 font-light text-xl sm:text-3xl">by Nilah</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Fidelización de élite por sellos de oro digitales. Reemplaza el cartón físico por una experiencia de lujo en WhatsApp que tus clientas amarán.
            </p>
          </div>

          {/* Quick Canje Input */}
          <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col gap-2">
            <span className="text-xs text-amber-700 dark:text-[#F5D77F] font-semibold flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5" /> Canje Rápido en Recepción
            </span>
            <form onSubmit={handleCanjearCodigo} className="flex gap-2">
              <input
                type="text"
                placeholder="Código SL-XXXXXX"
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value.toUpperCase())}
                className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono uppercase text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 flex-1 min-w-0"
              />
              <button
                type="submit"
                disabled={redeemLoading || !redeemCode.trim()}
                className="gold-pill-btn px-4 py-2 rounded-xl text-xs font-bold shrink-0 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {redeemLoading ? '...' : 'Canjear'}
              </button>
            </form>
            {redeemResult && (
              <div
                className={`text-xs p-2 rounded-lg ${
                  redeemResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-500/40 text-red-800 dark:text-red-300'
                }`}
              >
                {redeemResult.message}
              </div>
            )}
          </div>
        </div>

        {/* SUB-TABS & ACCIONES RÁPIDAS (Responsive Mobile & Desktop) */}
        <div className="mt-3 sm:mt-6 space-y-3">
          {/* Fila 1: Pestañas de Navegación principales (Scroll horizontal suave) */}
          <div className="flex items-center border-b border-gray-200/80 dark:border-white/10 pb-2 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 sm:gap-2 min-w-max">
              {[
                { id: 'dashboard', label: 'Clientas', icon: Users },
                { id: 'premios', label: `Premios (${stats.premiosPendientesCount})`, icon: Gift },
                { id: 'simulador', label: 'Camino de Premios', icon: Award },
                { id: 'ajustes', label: 'Ajustes', icon: Settings2 }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-amber-500/15 dark:bg-[#d4af37]/20 border border-amber-500/40 dark:border-[#f5d77f]/40 text-amber-900 dark:text-[#f5d77f] shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-600 dark:text-[#f5d77f]' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 2: Botones de Acción Operativa Rápida (Cierre del Día y + Sellar Clienta) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalCierreRapidoOpen(true)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer shadow-xs"
              title="Cierre rápido de citas pendientes de hoy"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cierre del Día</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClientForManualStamp(null);
                setModalManualOpen(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Sellar Clienta</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CIERRE RÁPIDO GUARDIÁN */}
      {businessId && (
        <ModalCierreRapido
          isOpen={modalCierreRapidoOpen}
          onClose={() => setModalCierreRapidoOpen(false)}
          businessId={businessId}
          onSuccess={() => {
            loadClubGlowData();
          }}
        />
      )}

      {/* MODAL DE SELLADO MANUAL LIBRE */}
      {businessId && (
        <ModalSellarManual
          isOpen={modalManualOpen}
          onClose={() => {
            setModalManualOpen(false);
            setClientForManualStamp(null);
          }}
          businessId={businessId}
          clientes={clientes}
          roadmap={roadmap}
          initialClient={clientForManualStamp}
          onSuccess={() => {
            loadClubGlowData();
          }}
        />
      )}

      {/* MODAL / ASISTENTE INTELIGENTE DE PREMIOS SEGUROS */}
      <AnimatePresence>
        {showWizard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-xl my-auto"
            >
              <RentabilidadWizardGlow
                businessId={businessId}
                moneda={config?.moneda || 'USD'}
                pais={negocioPais}
                onApplyConfig={handleApplyWizardConfig}
                onClose={() => setShowWizard(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BANNER DE ALERTA: CAMINO DE PREMIOS NO CONFIGURADO ── */}
      {!loading && roadmap.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-amber-500/15 via-purple-600/10 to-amber-500/15 border-2 border-amber-400/60 dark:border-[#d4af37]/50 shadow-lg shadow-amber-500/5"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                🎁
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#f5d77f] border border-amber-400/30">
                    Paso Obligatorio
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    ¡Tu Camino de Premios aún no está configurado!
                  </h3>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                  Tus clientas todavía no pueden empezar a ganar premios al completar citas porque falta definir los 3 regalos consentidos de tu salón. Usa el configurador guiado para elegirlos en 1 minuto asegurando que tu salón nunca regale dinero ni pierda margen.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWizard(true)}
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-950" />
              <span>Configurar Premios Seguros en 1 Minuto ✨</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── CONTENIDO PRINCIPAL POR TAB ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* STATS CARDS COMPACTAS & MOBILE-FIRST */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-[#110e1f] p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Clientas en Club</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-0.5">{stats.totalClientas}</div>
              <div className="text-[11px] sm:text-xs text-violet-600 dark:text-purple-400 mt-1 flex items-center gap-1 font-medium">
                <Crown className="w-3.5 h-3.5 shrink-0" /> Acumulando sellos
              </div>
            </div>

            <div className="bg-white dark:bg-[#110e1f] p-3.5 sm:p-4 rounded-2xl border border-amber-300/60 dark:border-[#d4af37]/30 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">A 1 Sello de Premio</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-[#f5d77f] mt-0.5">{stats.clientasCerca}</div>
              <div className="text-[11px] sm:text-xs text-amber-700 dark:text-[#f5d77f] mt-1 flex items-center gap-1 font-semibold">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Próximas a desbloquear
              </div>
            </div>

            <div className="bg-white dark:bg-[#110e1f] p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Premios Pendientes</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.premiosPendientesCount}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Códigos activos listos
              </div>
            </div>

            <div className="bg-white dark:bg-[#110e1f] p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Sellos Acuñados</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-violet-600 dark:text-purple-300 mt-0.5">{stats.totalSellos}</div>
              <div className="text-[11px] sm:text-xs text-violet-500 dark:text-purple-400/80 mt-1 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> Total emitidos
              </div>
            </div>
          </div>

          {/* PREVIEW EN VIVO DE LA TARJETA DORADA INTERACTIVA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
            {/* VISTA PREVIA INTERACTIVA */}
            <div className="lg:col-span-5 bg-gradient-to-b from-white to-gray-50/80 dark:from-[#141124] dark:to-[#0c0a15] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-[#f5d77f] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">Tarjeta Club Glow</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Vista clienta desde WhatsApp</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-black/40 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs shrink-0">
                  <button
                    onClick={() => setPreviewStamps(prev => Math.max(0, prev - 1))}
                    className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-800 dark:text-white font-bold cursor-pointer flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-mono text-amber-600 dark:text-[#f5d77f] font-bold px-1.5 text-sm">{previewStamps}</span>
                  <button
                    onClick={() => setPreviewStamps(prev => Math.min(12, prev + 1))}
                    className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-800 dark:text-white font-bold cursor-pointer flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* TARJETA DE CRÉDITO 3D REALISTA INTERACTIVA (BLACK & GOLD VIP) */}
              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <RealisticCreditCardGlow
                  salonName={user?.nombreNegocio || 'TU SALÓN'}
                  clientName="CAMILA VALENCIA"
                  stampsCount={previewStamps}
                  totalRoadmap={config?.total_sellos_roadmap || 12}
                  hitos={roadmap.map(r => ({ hito: r.hito_sello, nombre: r.nombre }))}
                  cardNumber="•••• 9842 •••• 2026"
                  validThru="12/28"
                />
              </div>

              {/* Hitos Resumen */}
              <div className="grid grid-cols-3 gap-2 pt-2 sm:pt-3">
                <div className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center gap-1 min-h-[64px] justify-center ${
                  previewStamps >= 4
                    ? 'bg-amber-500/15 text-amber-800 dark:text-[#f5d77f] border-amber-300 dark:border-[#d4af37]/40 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-white/5'
                }`}>
                  <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                    {previewStamps >= 4 ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : null}
                    4 Sellos
                  </div>
                  <div className="text-[10px] font-medium leading-tight text-center">Mimo<br/>Sorpresa</div>
                </div>

                <div className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center gap-1 min-h-[64px] justify-center ${
                  previewStamps >= 8
                    ? 'bg-amber-500/15 text-amber-800 dark:text-[#f5d77f] border-amber-300 dark:border-[#d4af37]/40 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-white/5'
                }`}>
                  <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                    {previewStamps >= 8 ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : null}
                    8 Sellos
                  </div>
                  <div className="text-[10px] font-medium leading-tight text-center">Detalle<br/>Premium</div>
                </div>

                <div className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center gap-1 min-h-[64px] justify-center ${
                  previewStamps >= 12
                    ? 'bg-amber-500/15 text-amber-800 dark:text-[#f5d77f] border-amber-300 dark:border-[#d4af37]/40 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200/60 dark:border-white/5'
                }`}>
                  <div className="font-bold text-[11px] flex items-center justify-center gap-1">
                    {previewStamps >= 12 ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> : null}
                    12 Sellos 👑
                  </div>
                  <div className="text-[10px] font-medium leading-tight text-center">Premio<br/>Glow</div>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 bg-amber-50/50 dark:bg-white/5 p-4 rounded-2xl border border-amber-200/40 dark:border-white/5">
                <p className="flex items-center gap-1.5 text-gray-900 dark:text-gray-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> WhatsApp Directo
                </p>
                <p>Cada vez que completas una cita en el sistema, el sello se añade y la clienta recibe su tarjeta actualizada al instante con botón interactivo.</p>
              </div>

              {/* LINK DE PRESENTACIÓN DE LA TARJETA */}
              {businessId && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-[#1a1530] dark:to-[#1c1435] border border-amber-300/60 dark:border-[#d4af37]/30 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#f5d77f] flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Vista Previa para ti (Demo)
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-[#f5d77f] font-semibold border border-amber-400/30">
                      Muestra
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Así ve tu clienta su tarjeta cuando recibe su link por WhatsApp. Úsalo para probar la experiencia y ver los premios configurados.
                  </p>
                  <div className="flex items-center gap-2 bg-white dark:bg-black/30 border border-amber-200/80 dark:border-white/10 rounded-xl px-3 py-2">
                    <span className="flex-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate">
                      {`${window.location.origin}/club/${businessId}`}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/club/${businessId}`);
                      }}
                      title="Copiar link de vista previa"
                      className="text-amber-600 dark:text-[#f5d77f] hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`/club/${businessId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir vista previa"
                      className="text-amber-600 dark:text-[#f5d77f] hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <a
                    href={`/club/${businessId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold shadow-md shadow-amber-300/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir demostración de la tarjeta →
                  </a>
                </div>
              )}
            </div>

            {/* TABLA DE CLIENTAS Y ESTADO DE SELLOS */}
            <div className="lg:col-span-7 bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar clienta por nombre o teléfono..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={() => setFilterNearMilestone(prev => !prev)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    filterNearMilestone
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-[#f5d77f]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" /> Solo a 1 sello de premio
                </button>
              </div>

              {/* Lista */}
              <div className="divide-y divide-gray-100 dark:divide-white/5 overflow-y-auto max-h-[520px] pb-8 sm:pb-2">
                {filteredClientes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-xs">
                    {loading ? 'Cargando clientas de Club Glow...' : 'No se encontraron clientas con sellos activos.'}
                  </div>
                ) : (
                  filteredClientes.map(c => {
                    const isNear = c.sellos_para_proximo === 1;
                    return (
                      <div key={c.cliente_id} className="py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] px-2 rounded-xl transition-colors">
                        {/* Avatar */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-violet-100 dark:bg-purple-950/80 border border-violet-200 dark:border-purple-500/30 flex items-center justify-center font-bold text-xs text-violet-700 dark:text-purple-200 shrink-0">
                          {(c.cliente_nombre || 'C').charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {c.cliente_nombre}
                            </span>
                            {c.categoria === 'VIP 👑' ? (
                              <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-0.5 shrink-0 shadow-xs">
                                👑 VIP ({c.club_glow_ciclos_completados || 1}x)
                              </span>
                            ) : null}
                            {isNear && (
                              <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-[#f5d77f] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30 flex items-center gap-0.5 shrink-0">
                                <Flame className="w-2 h-2" /> ¡A 1!
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                            {c.telefono || 'Sin WhatsApp'}
                          </div>
                        </div>

                        {/* Sellos y Acciones */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-[#f5d77f] flex items-center justify-end gap-1">
                              <Sparkles className="w-3 h-3" /> {c.sellos_activos || 0}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 max-w-[80px] sm:max-w-none truncate text-right">
                              {c.premios_pendientes > 0 ? `${c.premios_pendientes} por canjear` : 'Acumulando sellos'}
                            </div>
                          </div>

                          {/* Botón copiar link directo de la clienta y botón sellar rápido */}
                          <div className="flex items-center gap-1 border-l border-gray-100 dark:border-white/10 pl-2">
                            <button
                              onClick={() => {
                                setClientForManualStamp(c);
                                setModalManualOpen(true);
                              }}
                              title={`Sellar a ${c.cliente_nombre}`}
                              className="px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-[#f5d77f] text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sello</span>
                            </button>
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/club/${businessId}?c=${c.cliente_id}`;
                                navigator.clipboard.writeText(url);
                                alert(`Link de ${c.cliente_nombre} copiado al portapapeles`);
                              }}
                              title={`Copiar link de la tarjeta de ${c.cliente_nombre}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-[#f5d77f] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/club/${businessId}?c=${c.cliente_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Ver tarjeta en vivo de ${c.cliente_nombre}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 dark:hover:text-[#f5d77f] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB PREMIOS PENDIENTES ── */}
      {activeTab === 'premios' && (
        <div className="bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500 dark:text-[#f5d77f]" /> Premios Desbloqueados Pendientes de Entrega
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cuando una clienta llegue a tu salón y te muestre su código de WhatsApp, ingrésalo arriba o haz clic en "Validar".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiosPendientes.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 text-sm">
                No hay premios pendientes de canjear en este momento. ¡Tus clientas están acumulando sellos!
              </div>
            ) : (
              premiosPendientes.map(p => (
                <div key={p.id} className="bg-amber-50/40 dark:bg-black/40 border border-amber-200/80 dark:border-[#d4af37]/30 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-[#f5d77f] border border-amber-300 dark:border-amber-500/30">
                      Sello #{p.hito_sello || 4}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{p.nombre_premio}</h4>
                    <p className="text-xs text-violet-600 dark:text-purple-300 font-medium mt-0.5">Para: {p.cliente_nombre}</p>
                  </div>

                  <div className="bg-white dark:bg-white/5 p-2.5 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <span className="font-mono text-sm font-bold tracking-widest text-amber-700 dark:text-[#f5d77f]">
                      {p.codigo_canje}
                    </span>
                    <button
                      onClick={() => {
                        setRedeemCode(p.codigo_canje);
                        handleCanjearCodigo();
                      }}
                      className="gold-pill-btn px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Validar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB SIMULADOR & ROADMAP ── */}
      {activeTab === 'simulador' && (
        <div className="space-y-6 sm:space-y-8">
          {/* ── CARD DE IMPACTO EN VENTAS & RETORNO DE INVERSIÓN (ROI DASHBOARD) ── */}
          {roiMetrics && (
            <div className="bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-purple-500/10 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/60 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                      Impacto en Ventas & Fidelización Club Glow
                      <span className="text-[9px] sm:text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        VENTAS REALES
                      </span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                      Ingresos tangibles generados por la acumulación de sellos, referidas y recordatorios
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                  <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">Total Facturado en Sellos</div>
                  <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {config?.moneda || 'S/.'} {Number(roiMetrics.ingresos_totales_fidelizados || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-4">
                <div className="bg-white/80 dark:bg-black/30 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">Citas con Sellos</span>
                  <div className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    {roiMetrics.citas_fidelizadas || 0}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400">visitas registradas</span>
                </div>

                <div className="bg-white/80 dark:bg-black/30 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-600 dark:text-purple-400">Clientas Referidas</span>
                  <div className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300 mt-0.5">
                    {roiMetrics.citas_por_referidas || 0}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-purple-500 dark:text-purple-400">
                    +{config?.moneda || 'S/.'} {Number(roiMetrics.ingresos_por_referidas || 0).toLocaleString()} ganados
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-black/30 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-[#f5d77f]">Clientas Reactivadas</span>
                  <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-[#f5d77f] mt-0.5">
                    {roiMetrics.clientas_reactivadas || 0}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400">por aviso de sellos</span>
                </div>

                <div className="bg-white/80 dark:bg-black/30 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Premios Canjeados</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {roiMetrics.premios_canjeados || 0}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400">{roiMetrics.premios_pendientes || 0} por canjear</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
          {/* CAMINO DE PREMIOS EDITABLE */}
          <div className="lg:col-span-7 bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500 dark:text-[#f5d77f]" /> Camino de Premios (Tus 3 Regalos Consentidos)
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Estructurado para enamorar a tu clienta y asegurar que siempre regrese a tu salón.
                </p>
              </div>
              <button
                onClick={() => setShowWizard(true)}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 shadow-lg shadow-amber-500/25 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 transition-all hover:scale-[1.03] active:scale-[0.98] ring-2 ring-amber-300/60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-950 animate-pulse" />
                <span>Configurar Mis 3 Premios ✨</span>
              </button>
            </div>

            <div className="space-y-3">
              {roadmap.map(item => {
                const isHito4 = item.hito_sello === 4;
                const isHito8 = item.hito_sello === 8;
                const default3dIcon = isHito4
                  ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png'
                  : isHito8
                  ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png'
                  : 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png';

                const isUploading = uploadingRoadmapId === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-amber-50/20 dark:bg-black/30 border border-gray-200/70 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 flex items-start gap-3.5 sm:gap-4 relative transition-all hover:border-amber-300 dark:hover:border-amber-500/30"
                  >
                    {/* FOTO / ICONO CLICKEABLE DIRECTO CON 1 CLIC PARA SUBIR */}
                    <div className="relative shrink-0">
                      <label
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-yellow-500/20 border-2 border-amber-300 dark:border-amber-500/30 flex items-center justify-center p-1.5 overflow-hidden shadow-xs relative group cursor-pointer block transition-transform hover:scale-105 active:scale-95 ${
                          isUploading ? 'opacity-60 pointer-events-none' : ''
                        }`}
                        title="Toca para subir o cambiar foto de este premio"
                      >
                        <img
                          src={item.imagen_url || default3dIcon}
                          alt={item.nombre}
                          className="w-full h-full object-cover rounded-xl"
                        />

                        {/* Overlay visual para subir en 1 clic */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center text-white text-[9px] font-bold gap-0.5">
                          <Camera className="w-4 h-4 text-white" />
                          <span>Subir</span>
                        </div>

                        {/* Spinner durante subida */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleSubirFotoPremio(item, file);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>

                      {/* Badge con el número de hito */}
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white dark:border-slate-900 pointer-events-none">
                        {item.hito_sello}
                      </span>
                    </div>

                    {/* DATOS DEL PREMIO CON FORMATO LIMPIO IGUAL A LA CAPTURA */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700 dark:text-[#f5d77f]">
                          HITO #{item.hito_sello}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono">
                          ~{config?.moneda || 'PEN'} {item.costo_interno}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                          {item.nombre}
                        </h4>

                        {/* Badge interactivo de foto propia o botón para subir en 1 clic */}
                        {item.imagen_url ? (
                          <span
                            className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded font-normal cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
                            title="Foto real activa. Esta imagen se enviará por WhatsApp a la clienta cuando gane su premio. Haz clic en la imagen si deseas cambiarla o aquí para restaurar el icono 3D."
                            onClick={() => {
                              if (confirm('¿Deseas quitar tu foto propia y volver al icono 3D?')) {
                                handleEliminarFotoPremio(item);
                              }
                            }}
                          >
                            <span>Foto propia (WhatsApp)</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-0.5 hover:text-red-500">×</span>
                          </span>
                        ) : (
                          <label className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#f5d77f] border border-amber-200/60 dark:border-amber-500/20 px-2 py-0.5 rounded font-normal hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer inline-flex items-center gap-1">
                            <span>+ Subir foto WhatsApp</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleSubirFotoPremio(item, file);
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-snug">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIMULADOR DE COSTOS / MARGEN */}
          <div className="lg:col-span-5 bg-gradient-to-b from-white to-gray-50 dark:from-[#161226] dark:to-[#0c0a15] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-amber-300/60 dark:border-[#d4af37]/30 shadow-sm space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base font-bold text-amber-700 dark:text-[#f5d77f] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Simulador de Rentabilidad
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calcula que el costo de tus premios nunca supere el 15% del gasto que la clienta deja en tu salón.
              </p>
            </div>

            {simuladorResult && (
              <div className="space-y-4">
                <div className="bg-amber-50/50 dark:bg-black/40 p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Gasto proyectado x 12 citas:</span>
                    <span className="font-bold text-gray-900 dark:text-white font-mono">
                      {simuladorResult.moneda} {simuladorResult.gasto_proyectado_12_sellos}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Costo total de los 3 premios:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {simuladorResult.moneda} {simuladorResult.costo_total_premios}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">% Inversión en Fidelización:</span>
                    <span
                      className={`text-lg font-extrabold ${
                        simuladorResult.porcentaje_costo_sobre_gasto <= 15
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {simuladorResult.porcentaje_costo_sobre_gasto}%
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
                    simuladorResult.alerta_margen
                      ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className="font-bold">{simuladorResult.alerta_margen ? 'Aviso de Margen:' : 'Margen Saludable:'}</span>{' '}
                    {simuladorResult.recomendacion}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}



      {/* ── TAB AJUSTES DE CLUB GLOW ── */}
      {activeTab === 'ajustes' && config && (
        <div className="space-y-6 sm:space-y-8 animate-page-enter">
          {/* Header de la pestaña */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-500 dark:text-[#f5d77f]" />
                Configuración y Reglas de Fidelización
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Personaliza cómo tus clientas ganan sellos, los límites de seguridad y la comunicación de WhatsApp.
              </p>
            </div>

            <button
              onClick={handleGuardarConfig}
              disabled={savingConfig}
              className="gold-pill-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 w-full sm:w-auto"
            >
              {savingConfig ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Guardar Ajustes
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Columna Izquierda: Reglas de Sellos (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* ─────────────────────────────────────────────────────────── */}
              {/* BLOQUE 1: 🟢 REGLAS BÁSICAS DEL PROGRAMA (INCLUIDO EN TU PLAN) */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div className="bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                      Reglas Básicas del Programa
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    ✓ Incluido en tu Plan
                  </span>
                </div>

                {/* Modo de fidelización - Exclusivo Club Glow Sellos */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-xs shadow-xs">
                      ✨
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-950 dark:text-amber-200">
                        Programa Club Glow (100% Sellos Digitales)
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        Tarjeta digital VIP por sellos para fidelizar y premiar clientas.
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Activo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Valor Base por Sello */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Monto por 1 Sello ({config.moneda})</span>
                      <span className="text-[10px] text-amber-600 dark:text-[#f5d77f] font-mono">Ticket Mínimo</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        {config.moneda === 'PEN' ? 'S/.' : config.moneda === 'COP' ? '$' : '$'}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={config.valor_sello_base}
                        onChange={(e) =>
                          setConfig({ ...config, valor_sello_base: Math.max(1, Number(e.target.value)) })
                        }
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Si el servicio es menor a este monto, no otorga sello y se acumula en su alcancía para su próxima visita.</p>
                  </div>

                  {/* Límite de sellos por visita */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Límite Sellos por Cita</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Anti-Fraude</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={config.max_sellos_por_visita}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          max_sellos_por_visita: Math.min(12, Math.max(1, Number(e.target.value))),
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[10px] text-gray-400">Máximo número de sellos que se acuñan en una sola visita.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Vigencia */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Vigencia de la Tarjeta</span>
                      <span className="text-[10px] text-gray-400 font-mono">Meses</span>
                    </label>
                    <select
                      value={config.vencimiento_sellos_meses}
                      onChange={(e) =>
                        setConfig({ ...config, vencimiento_sellos_meses: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value={3} className="bg-white dark:bg-[#110e1f]">3 meses (Alta rotación)</option>
                      <option value={6} className="bg-white dark:bg-[#110e1f]">6 meses (Recomendado)</option>
                      <option value={12} className="bg-white dark:bg-[#110e1f]">12 meses (Anual)</option>
                      <option value={0} className="bg-white dark:bg-[#110e1f]">Sin vencimiento (Infinito)</option>
                    </select>
                    <p className="text-[10px] text-gray-400">Tiempo para completar los 12 sellos antes de reiniciar.</p>
                  </div>

                  {/* Validez del Premio Ganado */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>Validez del Premio Ganado</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Días</span>
                    </label>
                    <select
                      value={config.vencimiento_premio_dias ?? 60}
                      onChange={(e) =>
                        setConfig({ ...config, vencimiento_premio_dias: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value={30} className="bg-white dark:bg-[#110e1f]">30 días (Retorno express)</option>
                      <option value={45} className="bg-white dark:bg-[#110e1f]">45 días (1 ciclo y medio)</option>
                      <option value={60} className="bg-white dark:bg-[#110e1f]">60 días (Recomendado 2 meses)</option>
                      <option value={90} className="bg-white dark:bg-[#110e1f]">90 días (3 meses)</option>
                    </select>
                    <p className="text-[10px] text-gray-400">Plazo para reclamar el regalo en salón antes de que expire.</p>
                  </div>

                  {/* Sello de Bienvenida (100% Incluido) */}
                  <div
                    onClick={() => setConfig({ ...config, bienvenida_activo: !config.bienvenida_activo })}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      config.bienvenida_activo
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        config.bienvenida_activo ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                      }`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                          Sello de Bienvenida
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                          1er sello de regalo al registrarse.
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      config.bienvenida_activo
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                    }`}>
                      {config.bienvenida_activo ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* ── CARD ESTRATÉGICA: RENOVACIÓN DE PREMIOS POR TEMPORADA (OPCIONAL) ── */}
                <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-amber-500/10 border border-purple-200 dark:border-purple-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-100 dark:border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                        🌸
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">
                            Ciclo de Temporadas de Premios
                          </h4>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                          Renueva tus 3 regalos cada 6 meses (Primavera/Verano y Otoño/Invierno) para evitar la fatiga y reactivar clientas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Selector de frecuencia */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Frecuencia Sugerida de Cambio:
                      </label>
                      <select
                        value={config.addons_activos?.temporadas_premios?.frecuencia_meses ?? 6}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            addons_activos: {
                              ...config.addons_activos,
                              temporadas_premios: {
                                ...(config.addons_activos?.temporadas_premios || { activo: false }),
                                frecuencia_meses: Number(e.target.value)
                              }
                            }
                          })
                        }
                        className="w-full bg-white dark:bg-[#110e1f] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                      >
                        <option value={6}>Cada 6 meses (Semestral por Estación)</option>
                        <option value={12}>Cada 12 meses (Anual)</option>
                        <option value={0}>Manual (Sin sugerencia automática)</option>
                      </select>
                    </div>

                    {/* Switch de Alerta Opcional */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Recordatorio Opcional a tu WhatsApp:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentActivo = Boolean(config.addons_activos?.temporadas_premios?.alerta_activa);
                          setConfig({
                            ...config,
                            addons_activos: {
                              ...config.addons_activos,
                              temporadas_premios: {
                                ...(config.addons_activos?.temporadas_premios || { frecuencia_meses: 6 }),
                                alerta_activa: !currentActivo
                              }
                            }
                          });
                        }}
                        className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          config.addons_activos?.temporadas_premios?.alerta_activa
                            ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 text-purple-800 dark:text-purple-300 shadow-xs'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🔔</span>
                          <span>{config.addons_activos?.temporadas_premios?.alerta_activa ? 'Alerta Activada' : 'Aviso Silenciado'}</span>
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          config.addons_activos?.temporadas_premios?.alerta_activa
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                        }`}>
                          {config.addons_activos?.temporadas_premios?.alerta_activa ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-purple-200/50 dark:border-white/5 text-[10px] text-gray-600 dark:text-gray-300 flex items-center justify-between">
                    <span>💡 <strong>Consejo de la Agencia:</strong> Cambiar los premios cada temporada aumenta hasta un <strong>+28% la tasa de retorno</strong> de clientas que ya completaron su primera tarjeta.</span>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* BLOQUE 2: 🚀 ACELERADORES PRO DE FACTURACIÓN (SUPER PACK)   */}
              {/* ─────────────────────────────────────────────────────────── */}
              {(() => {
                const infoMoneda = resolverMonedaNegocio(negocioPais, config.moneda);
                const esSoles = infoMoneda.codigoMoneda === 'PEN';
                const esUsd = infoMoneda.codigoMoneda === 'USD';

                // Precios multitenant calibrados:
                // Individual: S/ 20 o $5 USD
                // Pack Completo: S/ 39 o $10 USD
                const tasa = infoMoneda.tasaCambioAproxUsd || 3.75;
                const precioIndivTexto = esSoles
                  ? 'S/ 20/mes'
                  : esUsd
                  ? '$5/mes'
                  : `${infoMoneda.simbolo} ${Math.round(5 * tasa)}`;

                const precioPackTexto = esSoles
                  ? 'S/ 39/mes'
                  : esUsd
                  ? '$10/mes'
                  : `${infoMoneda.simbolo} ${Math.round(10 * tasa)}/mes`;

                const precioIndivTotal = esSoles
                  ? 'S/ 80'
                  : esUsd
                  ? '$20'
                  : `${infoMoneda.simbolo} ${Math.round(20 * tasa)}`;

                const ahorroTexto = esSoles
                  ? 'Ahorras S/ 41 al mes'
                  : 'Ahorras 50%';

                const packAllowed = Boolean(
                  (recursosSaas?.sellos_addons?.rescate_ausentes || config.addons_activos?.reactivacion) &&
                  (recursosSaas?.sellos_addons?.cumpleanos_vip || config.addons_activos?.cumpleanos) &&
                  (recursosSaas?.sellos_addons?.cierre_diario_alerta || config.addons_activos?.guardian_cierre?.activo)
                );

                return (
                  <div className="bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
                    {/* Header de la Sección Pro */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 dark:text-[#f5d77f]" />
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                            Aceleradores Pro de Facturación & Retención
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Robots inteligentes para recuperar clientas ausentes y llenar tu agenda en piloto automático
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-[#f5d77f] bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded-full shrink-0">
                        {precioIndivTexto} c/u
                      </span>
                    </div>

                    {/* BANNER OFERTA PSICOLÓGICA: SUPER PACK TODO INCLUIDO */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                            👑 Recomendado
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/80 text-slate-950">
                            {ahorroTexto}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black leading-tight">
                          Super Pack Piloto Automático (Los 4 Aceleradores)
                        </h4>
                        <p className="text-xs font-semibold text-slate-900/85">
                          Desbloquea los 4 módulos juntos por solo <strong>{precioPackTexto}</strong> (en vez de {precioIndivTotal}).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setModalPackOpen(true)}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0 min-h-[42px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver Oferta del Pack ✨</span>
                      </button>
                    </div>

                    {/* LAS 4 CARDS PRO COMPACTAS E INDIVIDUALES */}
                    <div className="space-y-3 pt-1">
                      
                      {/* CARD 1: 🧲 IMÁN DE CLIENTAS AUSENTES */}
                      {(() => {
                        const rescateAllowed = Boolean(
                          recursosSaas?.automatizaciones?.permitir_rescate ?? 
                          recursosSaas?.sellos_addons?.rescate_ausentes ?? 
                          config.addons_activos?.reactivacion
                        );

                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-300 dark:border-amber-500/30 space-y-2.5 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shrink-0 mt-0.5 sm:mt-0">
                                  🧲
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                      Imán de Clientas Ausentes
                                    </h4>
                                    {!rescateAllowed ? (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                        Pro
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                                        ✓ Activo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                    Rescata en automático a quienes olvidaron volver con incentivos inteligentes.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => setModalImanRescateOpen(true)}
                                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-white dark:bg-white/10 hover:bg-amber-50 dark:hover:bg-white/15 border border-amber-200 dark:border-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center"
                                >
                                  Cómo funciona
                                </button>
                                {!rescateAllowed ? (
                                  <button
                                    type="button"
                                    onClick={() => setModalImanRescateOpen(true)}
                                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-xs text-center min-h-[38px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                                  >
                                    Activar ({precioIndivTexto})
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-600 px-2 py-1 text-right sm:text-left">En piloto automático</span>
                                )}
                              </div>
                            </div>

                            {/* Pastillas de los 2 tiempos - adaptadas para móvil */}
                            <div 
                              onClick={() => setModalImanRescateOpen(true)}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 cursor-pointer text-[11px]"
                            >
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200/60 dark:border-white/5">
                                <span className="font-bold text-amber-900 dark:text-amber-300">Día 25:</span> Bono 2x Sellos al vencer retoque biológico.
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-200/60 dark:border-white/5">
                                <span className="font-bold text-emerald-900 dark:text-emerald-300">Día 45:</span> Rescate "a 1 sello del premio".
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CARD 2: 🎂 ESPECIAL CUMPLEAÑERA VIP */}
                      {(() => {
                        const cumpleanosAllowed = Boolean(
                          recursosSaas?.sellos_addons?.cumpleanos_vip ?? config.addons_activos?.cumpleanos
                        );

                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent border border-pink-300 dark:border-pink-500/30 space-y-2.5 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-pink-500 text-white font-black flex items-center justify-center text-sm shrink-0 mt-0.5 sm:mt-0">
                                  🎂
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                      Especial Cumpleañera VIP
                                    </h4>
                                    {!cumpleanosAllowed ? (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                        Pro
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                                        ✓ Activo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                    Asegura su cita de festejo en tu salón ofreciendo detalle anticipado y felicitación.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => setModalCumpleanosOpen(true)}
                                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-white dark:bg-white/10 hover:bg-pink-50 dark:hover:bg-white/15 border border-pink-200 dark:border-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center"
                                >
                                  Ver Mensajes
                                </button>
                                {!cumpleanosAllowed ? (
                                  <button
                                    type="button"
                                    onClick={() => setModalCumpleanosOpen(true)}
                                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-black text-xs cursor-pointer shadow-xs text-center min-h-[38px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                                  >
                                    Activar ({precioIndivTexto})
                                  </button>
                                ) : (
                                  <span className="text-xs font-bold text-emerald-600 px-2 py-1 text-right sm:text-left">En piloto automático</span>
                                )}
                              </div>
                            </div>

                            <div 
                              onClick={() => setModalCumpleanosOpen(true)}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 cursor-pointer text-[11px]"
                            >
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-pink-200/60 dark:border-white/5">
                                <span className="font-bold text-pink-900 dark:text-pink-300">7 Días Antes:</span> Sellos de regalo para amarrar la cita.
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-rose-200/60 dark:border-white/5">
                                <span className="font-bold text-rose-900 dark:text-rose-300">El Mismo Día:</span> Felicitación afectuosa y calidez.
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CARD 3: 🔔 GUARDIÁN DE CIERRE DIARIO POR WHATSAPP */}
                      {(() => {
                        const guardianAllowed = Boolean(
                          recursosSaas?.sellos_addons?.cierre_diario_alerta ?? config.addons_activos?.guardian_cierre?.activo
                        );
                        const guardianConfig = config.addons_activos?.guardian_cierre || {
                          activo: guardianAllowed,
                          whatsapp_dueña: negocioInfo?.telefono || '',
                          hora_corte_noche: '20:30',
                          proteger_sueno: true
                        };

                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-300 dark:border-emerald-500/30 space-y-2.5 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shrink-0 mt-0.5 sm:mt-0">
                                  🔔
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                      Guardián de Cierre Diario por WhatsApp
                                    </h4>
                                    {!guardianAllowed ? (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                        Pro
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                                        ✓ Activo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                    Alerta nocturna a tu celular con link express para cerrar citas olvidadas y sellos.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                                <button
                                  type="button"
                                  onClick={() => setModalGuardianOpen(true)}
                                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-white dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-white/15 border border-emerald-200 dark:border-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center"
                                >
                                  Cómo funciona
                                </button>
                                {!guardianAllowed ? (
                                  <button
                                    type="button"
                                    onClick={() => setModalGuardianOpen(true)}
                                    className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs text-center min-h-[38px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                                  >
                                    Activar ({precioIndivTexto})
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newActivo = !guardianConfig.activo;
                                      setConfig({
                                        ...config,
                                        addons_activos: {
                                          ...config.addons_activos,
                                          guardian_cierre: {
                                            ...guardianConfig,
                                            activo: newActivo
                                          }
                                        }
                                      });
                                    }}
                                    className={`w-10 h-6 sm:h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                                      guardianConfig.activo ? 'bg-emerald-600' : 'bg-slate-300'
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-full bg-white absolute top-1 sm:top-0.5 transition-transform ${
                                        guardianConfig.activo ? 'right-1 sm:right-0.5' : 'left-1 sm:left-0.5'
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div 
                              onClick={() => setModalGuardianOpen(true)}
                              className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 cursor-pointer text-[11px]"
                            >
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-emerald-200/60 dark:border-white/5">
                                <span className="font-bold text-emerald-900 dark:text-emerald-300">8:30 PM:</span> Resumen a tu WhatsApp con botón de 1 clic.
                              </div>
                              <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-teal-200/60 dark:border-white/5">
                                <span className="font-bold text-teal-900 dark:text-teal-300">Modo Sueño:</span> Si todo se cerró, no te molesta.
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* CARD 4: ⚡ MARTES & MIÉRCOLES GLOW (2X SELLOS) */}
                      {(() => {
                        const diasMuertosAllowed = Boolean(
                          recursosSaas?.sellos_addons?.dias_muertos_doble ?? config.addons_activos?.dias_muertos
                        );

                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-300 dark:border-orange-500/30 space-y-2.5 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-sm shrink-0 mt-0.5 sm:mt-0">
                                  ⚡
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                      Martes & Miércoles Glow (2X Sellos)
                                    </h4>
                                    {!diasMuertosAllowed ? (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                        Pro
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                                        ✓ Activo
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                    Duplica los sellos en los días más flojos de la semana para llenar tu agenda sin regalar descuentos.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                                {!diasMuertosAllowed ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setModalProAddon({
                                        isOpen: true,
                                        titulo: 'Días Flojos Glow (2x Sellos en Mar/Mié) ⚡',
                                        desc: `Estrategia de choque: llena los días más lentos de la semana sin regalar descuentos en efectivo. ¡Solo ${precioIndivTexto} o incluido en el Super Pack!`
                                      });
                                    }}
                                    className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-xs cursor-pointer shadow-xs text-center min-h-[38px] sm:min-h-0 flex items-center justify-center whitespace-nowrap"
                                  >
                                    Activar ({precioIndivTexto})
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfig({
                                        ...config,
                                        addons_activos: { ...config.addons_activos, dias_muertos: !config.addons_activos?.dias_muertos }
                                      });
                                    }}
                                    className={`w-full sm:w-auto text-xs font-bold px-3 py-2 sm:py-1 rounded-xl sm:rounded-lg border cursor-pointer text-center min-h-[38px] sm:min-h-0 flex items-center justify-center ${
                                      config.addons_activos?.dias_muertos
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}
                                  >
                                    {config.addons_activos?.dias_muertos ? 'ON' : 'OFF'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Columna Derecha: Plantilla WhatsApp & Vista Previa (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 3: Mensaje Automático de WhatsApp */}
              <div className="bg-white dark:bg-[#110e1f] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                    Notificación WhatsApp a la Clienta
                  </h3>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Mensaje al Acuñar Sello
                  </label>
                  <textarea
                    rows={7}
                    value={whatsappTemplate}
                    onChange={(e) => setWhatsappTemplate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  />
                  <div className="flex flex-wrap gap-1 text-[9px] text-gray-400">
                    <span>Variables:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {'{nombre}'}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {'{sello_actual}'}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {'{salon}'}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {'{premio_1}'}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                      {'{link_tarjeta}'}
                    </span>
                  </div>
                </div>

                {/* Vista previa simulador chat */}
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-500" /> Simulación WhatsApp en Vivo
                  </div>
                  <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-2xl shadow-inner text-xs space-y-1">
                    <div className="bg-white dark:bg-[#202c33] text-gray-800 dark:text-[#e9edef] p-2.5 rounded-xl rounded-tl-none shadow-xs border border-black/5 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                      {whatsappTemplate
                        .replace('{nombre}', 'Camila')
                        .replace('{sello_actual}', '2')
                        .replace('{salon}', user?.nombreNegocio || 'Brilla Studio')
                        .replace('{premio_1}', 'Spa Cutículas & Hidratación Express')
                        .replace('{link_tarjeta}', 'https://koratflow.agency/club/brilla-studio?c=902')}
                    </div>
                    <div className="text-right text-[9px] text-gray-400 pr-1">14:30 ✓✓</div>
                  </div>
                </div>
              </div>

              {/* Botón flotante móvil para guardar */}
              <div className="sm:hidden pt-2">
                <button
                  onClick={handleGuardarConfig}
                  disabled={savingConfig}
                  className="gold-pill-btn w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  {savingConfig ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Guardar Todos los Ajustes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PRO UPGRADE / SOLICITAR DESBLOQUEO DE ADD-ON AL SUPERADMIN ── */}
      <AnimatePresence>
        {modalProAddon && modalProAddon.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white dark:bg-[#151226] border border-amber-300 dark:border-[#d4af37]/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4 relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-amber-500/20">
                🔒
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-[#f5d77f]">
                  Módulo Adicional Pro
                </span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {modalProAddon.titulo}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {modalProAddon.desc}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-white/5 border border-amber-200 dark:border-white/10 text-left text-xs space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-300">¿Cómo activarlo en tu salón?</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  Este acelerador es activado por el equipo de Korat Flow para tu salón con soporte y configuración personalizada.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalProAddon(null)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cerrar
                </button>
                <a
                  href={`https://wa.me/51924045869?text=${encodeURIComponent(
                    `Hola Korat Flow 👋 Quisiera activar el Add-on "${modalProAddon.titulo}" para mi salón "${user?.nombreNegocio || 'mi negocio'}".`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Pedir Activación</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── MODAL IMÁN DE RESCATE AUTOMÁTICO (EXPLICACIÓN + ROI + DIAS) ── */}
        <ModalImanRescate
          isOpen={modalImanRescateOpen}
          onClose={() => setModalImanRescateOpen(false)}
          monedaInfo={resolverMonedaNegocio(negocioPais, config?.moneda)}
          nombreNegocio={negocioInfo?.nombre || user?.nombreNegocio || 'mi negocio'}
        />

        {/* ── MODAL ESPECIAL CUMPLEAÑERA VIP (2 TIEMPOS & MENSAJES) ── */}
        <ModalCumpleanosVIP
          isOpen={modalCumpleanosOpen}
          onClose={() => setModalCumpleanosOpen(false)}
          monedaInfo={resolverMonedaNegocio(negocioPais, config?.moneda)}
          nombreNegocio={negocioInfo?.nombre || user?.nombreNegocio || 'mi negocio'}
        />

        {/* ── MODAL GUARDIÁN DE CIERRE DIARIO POR WHATSAPP ── */}
        <ModalGuardianCierre
          isOpen={modalGuardianOpen}
          onClose={() => setModalGuardianOpen(false)}
          monedaInfo={resolverMonedaNegocio(negocioPais, config?.moneda)}
          nombreNegocio={negocioInfo?.nombre || user?.nombreNegocio || 'mi negocio'}
        />

        {/* ── MODAL SUPER PACK PILOTO AUTOMÁTICO (4 MÓDULOS) ── */}
        {(() => {
          const infoMoneda = resolverMonedaNegocio(negocioPais, config?.moneda);
          const esSoles = infoMoneda.codigoMoneda === 'PEN';
          const esUsd = infoMoneda.codigoMoneda === 'USD';
          const tasa = infoMoneda.tasaCambioAproxUsd || 3.75;

          const pPack = esSoles ? 'S/ 39' : esUsd ? '$10' : `${infoMoneda.simbolo} ${Math.round(10 * tasa)}`;
          const pIndivTotal = esSoles ? 'S/ 80' : esUsd ? '$20' : `${infoMoneda.simbolo} ${Math.round(20 * tasa)}`;
          const ahorro = esSoles ? 'Ahorras S/ 41/mes' : 'Ahorras 50%';

          return (
            <ModalPackPilotoAutomatico
              isOpen={modalPackOpen}
              onClose={() => setModalPackOpen(false)}
              monedaInfo={infoMoneda}
              nombreNegocio={negocioInfo?.nombre || user?.nombreNegocio || 'mi negocio'}
              precioPack={pPack}
              precioIndividualTotal={pIndivTotal}
              ahorroTexto={ahorro}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
