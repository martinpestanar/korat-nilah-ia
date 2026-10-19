/**
 * TarjetaClubGlowPublica.tsx
 * Ruta: /club-glow/:businessId
 * Tarjeta Digital Móvil para la clienta que abre su link de WhatsApp.
 * Sin login. Estética Joyería de Lujo (Fondo Amatista / Oro Pulido / Micro-animaciones).
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Crown,
  Gift,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  ShieldCheck,
  Star,
  Flame,
  Share2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { RealisticCreditCardGlow } from '../components/ClubGlow/RealisticCreditCardGlow';
import { formatearNombreClienta } from '../services/clubGlowTarjetasService';

interface TarjetaData {
  negocio: {
    nombre: string;
    slug?: string;
    telefono?: string;
    direccion?: string;
    color_primario?: string;
  };
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
  };
  bookingUrl: string;
  referidosHabilitado: boolean;
  sellosActivos: number;
  totalRoadmap: number;
  vigenciaMeses?: number;
  hitos: {
    hito: number;
    nombre: string;
    descripcion: string;
    tipo: string;
  }[];
  premiosGanados: {
    codigo_canje: string;
    nombre_premio: string;
    estado: string;
    expira_en: string;
  }[];
  proximoHito?: {
    sello: number;
    nombre: string;
    faltan: number;
  };
}

export default function TarjetaClubGlowPublica() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('c');
  const sellosParam = searchParams.get('sellos');
  const demoStampsCustom = sellosParam !== null ? parseInt(sellosParam, 10) : null;

  // Clave de caché única por negocio, cliente y sellos de demo
  const cacheKey = `glow_card_${businessId || 'def'}_${clienteId || 'anon'}_s${sellosParam ?? 'def'}`;

  // Intenta recuperar de caché instantánea (0ms de espera si ya la abrió antes)
  const [data, setData] = useState<TarjetaData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      /* ignore */
    }
    return null;
  });

  // Si ya tenemos datos en caché, no mostramos pantalla de carga completa
  const [loading, setLoading] = useState<boolean>(() => !data);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const primerNombre = useMemo(() => {
    return formatearNombreClienta(data?.cliente?.nombre);
  }, [data?.cliente?.nombre]);

  useEffect(() => {
    async function loadTarjeta() {
      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const cleanClientId = clienteId ? parseInt(clienteId, 10) : NaN;

        // Si tenemos un clienteId válido, cargamos los datos reales vía RPC
        if (!isNaN(cleanClientId)) {
          const { data: res, error: rpcErr } = await supabase.rpc('get_tarjeta_club_glow_publica', {
            p_identifier: businessId,
            p_cliente_id: cleanClientId
          });

          if (!rpcErr && res?.ok) {
            const neg = res.negocio;
            const cli = res.cliente;
            const totalSellos = Number(res.sellos_activos || 0);
            const hitos = (res.roadmap || []).map((r: any) => ({
              hito: r.hito,
              nombre: r.nombre,
              descripcion: r.descripcion,
              tipo: r.tipo || 'premio'
            }));

            const proximo = hitos.find((h: any) => h.hito > totalSellos);
            const proximoHito = proximo
              ? {
                  sello: proximo.hito,
                  nombre: proximo.nombre,
                  faltan: proximo.hito - totalSellos
                }
              : undefined;

            const bookingTarget = neg?.slug ? `https://nilah.app/${neg.slug}` : `https://nilah.app/${businessId}`;
            const refActivo = Boolean(neg?.recursos_saas?.sellos_addons?.referidos_sellos);

            const tarjetaPayload: TarjetaData = {
              negocio: {
                nombre: neg?.nombre || 'Salón VIP',
                slug: neg?.slug,
                telefono: neg?.telefono,
                direccion: neg?.direccion,
                color_primario: neg?.color_primario
              },
              cliente: {
                id: String(cli?.id || clienteId),
                nombre: cli?.nombre || 'Clienta Glow',
                telefono: cli?.telefono
              },
              bookingUrl: bookingTarget,
              referidosHabilitado: refActivo,
              sellosActivos: totalSellos,
              totalRoadmap: res.total_roadmap || 12,
              vigenciaMeses: res.vencimiento_sellos_meses ?? 6,
              hitos,
              premiosGanados: res.premios || [],
              proximoHito
            };

            setData(tarjetaPayload);
            try {
              sessionStorage.setItem(cacheKey, JSON.stringify(tarjetaPayload));
            } catch (e) {
              /* ignore */
            }
            setLoading(false);
            return;
          }
        }

        // ── MODO VISTA PREVIA / DEMO (Para la dueña del salón o enlaces sin cliente) ──
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);
        let negQuery = supabase.from('negocios').select('id, nombre, slug, telefono_recepcionista, ubicacion, color_primario, recursos_saas');
        negQuery = isUuid ? negQuery.eq('id', businessId) : negQuery.eq('slug', businessId);
        const { data: negData } = await negQuery.maybeSingle();

        if (negData) {
          const [cfgRes, roadmapRes] = await Promise.all([
            supabase.from('sellos_config').select('total_sellos_roadmap, vencimiento_sellos_meses').eq('business_id', negData.id).maybeSingle(),
            supabase.from('sellos_roadmap').select('*').eq('business_id', negData.id).eq('activo', true).order('hito_sello', { ascending: true })
          ]);

          const totalRoadmap = cfgRes.data?.total_sellos_roadmap || 12;
          const vigenciaMeses = cfgRes.data?.vencimiento_sellos_meses ?? 6;
          const hitos = (roadmapRes.data || []).map((r: any) => ({
            hito: r.hito_sello,
            nombre: r.nombre,
            descripcion: r.descripcion,
            tipo: 'premio'
          }));

          const sellosDemo = demoStampsCustom !== null && !isNaN(demoStampsCustom) ? Math.max(0, demoStampsCustom) : 6;
          const proximo = hitos.find((h: any) => h.hito > sellosDemo);
          const proximoHito = proximo
            ? {
                sello: proximo.hito,
                nombre: proximo.nombre,
                faltan: proximo.hito - sellosDemo
              }
            : undefined;

          const bookingTarget = negData.slug ? `https://nilah.app/${negData.slug}` : `https://nilah.app/${negData.id}`;
          const refActivo = Boolean(negData.recursos_saas?.sellos_addons?.referidos_sellos);

          // Premios desbloqueados según la cantidad de sellos configurada en la demo
          const hitosDesbloqueados = hitos.filter((h: any) => sellosDemo >= h.hito);
          const premiosDemo = hitosDesbloqueados.length > 0
            ? hitosDesbloqueados.map((h: any, idx: number) => ({
                codigo_canje: `DEMO-GLOW-${h.hito}`,
                nombre_premio: h.nombre || `Premio ${h.hito} sellos`,
                estado: 'pendiente',
                expira_en: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }))
            : [];

          setData({
            negocio: {
              nombre: negData.nombre || 'Salón VIP',
              slug: negData.slug,
              telefono: negData.telefono_recepcionista,
              direccion: negData.ubicacion,
              color_primario: negData.color_primario
            },
            cliente: {
              id: 'demo-preview',
              nombre: 'Camila Valencia (Vista Previa)',
              telefono: '+52 55 0000 0000'
            },
            bookingUrl: bookingTarget,
            referidosHabilitado: refActivo,
            sellosActivos: sellosDemo,
            totalRoadmap,
            vigenciaMeses,
            hitos,
            premiosGanados: premiosDemo,
            proximoHito
          });
        }
      } catch (err) {
        console.error('Error cargando tarjeta:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTarjeta();
  }, [businessId, clienteId, sellosParam]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si es iOS (iPhone/iPad) para mostrar instrucción nativa de Safari
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIos(/iphone|ipad|ipod/.test(userAgent));

      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallCard = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallHelp(true);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#07050e] text-white p-4 sm:p-6 flex flex-col items-center justify-start max-w-md mx-auto animate-pulse">
        {/* Header Skeleton */}
        <div className="w-full flex items-center justify-between pt-4 pb-6">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-white/10 rounded-full" />
            <div className="h-5 w-40 bg-white/20 rounded-lg" />
          </div>
          <div className="h-8 w-8 rounded-full bg-amber-400/20" />
        </div>

        {/* Tarjeta Dorada Skeleton */}
        <div className="w-full h-56 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-yellow-300/20 border border-amber-400/30 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-amber-200/20 rounded" />
              <div className="h-5 w-32 bg-amber-200/30 rounded" />
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-400/30 flex items-center justify-center font-black text-amber-200 text-sm">
              👑
            </div>
          </div>

          {/* Grid de Sellos Placeholder */}
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-7 rounded-full bg-amber-300/20" />
            ))}
          </div>

          <div className="h-3 w-48 bg-amber-200/20 rounded" />
        </div>

        {/* Mensaje de Carga Rápida */}
        <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#f5d77f]/80 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          Abriendo tu Tarjeta Club Glow...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#07050e] flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-xl font-bold text-red-400">Tarjeta no encontrada</h2>
        <p className="text-xs text-gray-400 mt-2 max-w-xs">
          Verifica el enlace que recibiste por WhatsApp o solicita uno nuevo en recepción.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050e] text-white flex flex-col items-center justify-between px-3 py-3 sm:py-6 selection:bg-[#d4af37] selection:text-black overflow-x-hidden">
      {/* Glow ambiental de joyería animado */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[460px] h-[350px] bg-gradient-to-b from-purple-700/25 via-[#d4af37]/20 to-transparent blur-3xl pointer-events-none animate-pulse" />

      <div className="w-full max-w-md relative z-10 flex flex-col gap-2.5 sm:gap-3.5 my-auto">
        {/* ── HEADER BOUTIQUE COMPACTO (Cero scroll arriba) ── */}
        <div className="flex items-center justify-between px-2 pt-0.5 pb-1 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 text-xs font-black shadow-xs shrink-0">
              👑
            </span>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-white truncate drop-shadow-xs">
                {data.negocio.nombre}
              </h1>
              <span className="text-[9px] text-[#f5d77f]/80 font-medium block -mt-0.5">
                Club Glow VIP
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/15 to-purple-900/30 border border-amber-400/30 text-[11px] font-bold text-amber-200 shrink-0 shadow-xs">
            <span>¡Hola, <strong className="text-[#f5d77f] font-black">{primerNombre}</strong>!</span>
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
        </div>

        {/* ── TARJETA DE CRÉDITO 3D REALISTA VIP (HERO CENTRAL INTACTO) ── */}
        <div className="flex flex-col items-center relative py-0.5">
          {/* Aura dopamínica pulsante detrás de la tarjeta */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-400/20 to-amber-500/15 blur-xl rounded-3xl -z-10 animate-pulse pointer-events-none" />
          
          <RealisticCreditCardGlow
            salonName={data.negocio.nombre}
            clientName={primerNombre}
            stampsCount={data.sellosActivos}
            totalRoadmap={data.totalRoadmap}
            hitos={data.hitos}
            cardNumber={`•••• ${data.cliente.id.toString().slice(-4).padStart(4, '0')} •••• 2026`}
            validThru="12/28"
          />
          <div className="flex items-center gap-1.5 text-[9px] text-gray-400/90 mt-1.5 font-medium tracking-wide">
            <span className="animate-bounce">👆</span>
            <span>Gira tu tarjeta en 3D para ver tus sellos acuñados</span>
          </div>
        </div>

        {/* ── STATUS TRACKER SLIM (Barra de progreso de alta dopamina) ── */}
        <div className="bg-[#120f21]/90 backdrop-blur-md border border-amber-500/25 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-black/40 space-y-1.5 transition-all hover:border-amber-400/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Progreso:</span>
              <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-mono">
                {data.sellosActivos} de {data.totalRoadmap}
              </span>
              <span className="text-[10px] text-amber-300/80 font-bold">sellos</span>
            </div>

            {data.proximoHito && (
              <span className="text-[10px] font-black text-[#f5d77f] bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" />
                Faltan {data.proximoHito.faltan} {data.proximoHito.faltan === 1 ? 'sello' : 'sellos'}
              </span>
            )}
          </div>

          {/* Barra Fluida Dorada con Brillo Neón */}
          <div className="w-full bg-white/5 rounded-full h-2 p-0.5 border border-white/10 overflow-hidden relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-200 shadow-[0_0_12px_rgba(245,215,127,0.9)] transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min(100, Math.max(8, (data.sellosActivos / data.totalRoadmap) * 100))}%`
              }}
            />
          </div>
        </div>

        {/* ── 3 REGALOS EN FORMATO HORIZONTAL (3 Columnas de Impacto Visual) ── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1">
              <Gift className="w-3 h-3 text-amber-400" /> Tus 3 Regalos Consentidos
            </span>
            <span className="text-[9px] text-gray-400">Toca para ver</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {data.hitos.map(h => {
              const isUnlocked = data.sellosActivos >= h.hito;
              const sellosFaltan = Math.max(0, h.hito - data.sellosActivos);
              const isNext = !isUnlocked && sellosFaltan > 0 && (h.hito === 4 || data.sellosActivos >= (h.hito - 4));

              const isHito4 = h.hito === 4;
              const isHito8 = h.hito === 8;
              const defaultIcon = isHito4
                ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png'
                : isHito8
                ? 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png'
                : 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png';

              return (
                <div
                  key={h.hito}
                  className={`p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center text-center transition-all duration-300 relative overflow-hidden group select-none ${
                    isUnlocked
                      ? 'bg-gradient-to-b from-amber-500/25 via-[#1a1429] to-amber-500/10 border-amber-400/60 shadow-md shadow-amber-500/20 scale-[1.02]'
                      : isNext
                      ? 'bg-[#151128] border-amber-500/40 ring-1 ring-amber-400/30'
                      : 'bg-white/5 border-white/5 opacity-65'
                  }`}
                >
                  {/* Badge de Sello */}
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full border mb-1 ${
                    isUnlocked
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                      : isNext
                      ? 'bg-amber-500/25 text-[#f5d77f] border-amber-400/40 animate-pulse'
                      : 'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {isUnlocked ? '✓ Ganado' : `Sello ${h.hito}`}
                  </span>

                  {/* Icono 3D Oficial Flotante */}
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center my-0.5 transition-transform group-hover:scale-110">
                    <img
                      src={defaultIcon}
                      alt={h.nombre}
                      className={`w-full h-full object-contain drop-shadow-md ${isUnlocked ? 'animate-bounce' : ''}`}
                      style={{ animationDuration: '3s' }}
                    />
                  </div>

                  {/* Nombre del Premio Compacto */}
                  <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight mt-0.5 h-6 flex items-center">
                    {h.nombre}
                  </span>

                  {/* Estado al pie */}
                  <div className="mt-1">
                    {isUnlocked ? (
                      <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> ¡Listo!
                      </span>
                    ) : isNext ? (
                      <span className="text-[9px] font-black text-amber-300 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-400" /> Falta {sellosFaltan}
                      </span>
                    ) : (
                      <span className="text-[8px] text-gray-500 font-medium">
                        Faltan {sellosFaltan}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── PREMIO PENDIENTE DESTACADO (Canje Inmediato en Recepción) ── */}
        {data.premiosGanados.filter(p => p.estado === 'pendiente').length > 0 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-[#1b152d] to-amber-500/15 border-2 border-amber-400/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 shadow-lg shadow-amber-500/15 animate-pulse">
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-400" /> ¡Tienes un Premio Listo!
              </span>
              <div className="text-xs font-black text-white truncate">
                {data.premiosGanados.find(p => p.estado === 'pendiente')?.nombre_premio}
              </div>
            </div>

            {(() => {
              const code = data.premiosGanados.find(p => p.estado === 'pendiente')!.codigo_canje;
              return (
                <button
                  type="button"
                  onClick={() => handleCopy(code)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-amber-950 text-xs font-mono font-black flex items-center gap-1.5 shrink-0 shadow-md active:scale-95 transition-all cursor-pointer ring-1 ring-white/50"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCode === code ? '¡Copiado!' : code}</span>
                </button>
              );
            })()}
          </div>
        )}

        {/* ── BARRA INFERIOR DE ACCIÓN (Guardar Tarjeta PWA & Referidas) ── */}
        <div className="flex items-center gap-2 pt-0.5">
          {data.referidosHabilitado && (
            <button
              type="button"
              onClick={() => {
                const refUrl = `${data.bookingUrl}?ref=${data.cliente.id}`;
                const whatsappMsg = `¡Hola! Te recomiendo ${data.negocio.nombre} 💕 Reserva tu cita desde aquí y ambas ganamos 1 sello de regalo en el Club Glow: ${refUrl}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
              }}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              title="Invitar amiga y ganar +1 sello"
            >
              <span>👯 +1 Sello Amiga</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleInstallCard}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer text-center ring-1 ring-white/40"
          >
            <span>📲 Guardar Tarjeta en mi Celular</span>
          </button>
        </div>

        {/* Modal / Sheet Explicativo para Guardar en Pantalla de Inicio */}
        {showInstallHelp && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fade-in">
            <div className="bg-[#151128] border border-amber-400/40 rounded-3xl p-5 max-w-sm w-full text-white space-y-3.5 shadow-2xl relative">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📲</span>
                  <h4 className="text-sm font-black text-white">Guarda tu Tarjeta VIP</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallHelp(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold text-gray-300 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                Ten tu tarjeta siempre a mano en recepción sin tener que buscarla en WhatsApp:
              </p>

              {isIos ? (
                <div className="space-y-2 text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">1.</span>
                    <span>Toca el botón <strong>Compartir</strong> (ícono con flecha hacia arriba <span className="inline-block px-1 bg-white/10 rounded">⎋</span>) en la barra inferior de Safari.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">2.</span>
                    <span>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong> (+).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">3.</span>
                    <span>¡Listo! Se guardará como un acceso directo de lujo con su ícono dorado 👑.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">1.</span>
                    <span>Toca los <strong>3 puntos</strong> ⋮ en la esquina superior de tu navegador (Chrome).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">2.</span>
                    <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-black text-amber-300">3.</span>
                    <span>¡Listo! Ya tienes tu tarjeta en el escritorio de tu celular ✨.</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowInstallHelp(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 font-black text-xs cursor-pointer shadow-md"
              >
                ¡Entendido, gracias! 💕
              </button>
            </div>
          </div>
        )}

        {/* Footer limpio */}
        <div className="text-center pt-1 pb-2 text-[9px] text-gray-500">
          Club Glow • <span className="text-purple-400 font-semibold">{data.negocio.nombre}</span>
        </div>
      </div>
    </div>
  );
}
