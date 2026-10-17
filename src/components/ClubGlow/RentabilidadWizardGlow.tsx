/**
 * RentabilidadWizardGlow.tsx
 * Versión Light Ultra-Clean, Luminosa y Femenina para Salones de Belleza.
 * 
 * Filosofía UI/UX:
 * - Fondo Blanco Nieve / Perla / Acentos Oro & Violeta Nilah.
 * - 0 fatiga de lectura, 100% Mobile-First.
 * - 1 sola vista vertical fluida.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import {
  resolverMonedaNegocio
} from '@/utils/currencyMultitenant';

export interface ServicioReal {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  duracion?: number;
}

export interface RoadmapPremioItem {
  numero: 4 | 8 | 12;
  tipo: 'mimo' | 'detalle' | 'glow';
  nombre: string;
  desc: string;
  costo: number;
  valorPublicoEstimado?: number;
  imagenIcono?: string;
  imagen_url?: string | null;
}

export interface PropuestaIA {
  id: 'cruzada' | 'alta_frecuencia' | 'vip_premium';
  nombre: string;
  subtitulo: string;
  icono: string;
  ticketSugerido: number;
  roadmap: [RoadmapPremioItem, RoadmapPremioItem, RoadmapPremioItem];
}

interface WizardProps {
  businessId?: string;
  moneda: string;
  pais?: string | null;
  onApplyConfig: (data: {
    valorBase: number;
    roadmap: [RoadmapPremioItem, RoadmapPremioItem, RoadmapPremioItem];
  }) => Promise<void>;
  onClose?: () => void;
}

export const RentabilidadWizardGlow: React.FC<WizardProps> = ({
  businessId,
  moneda,
  pais,
  onApplyConfig,
  onClose
}) => {
  // 1. Resolver moneda según el país
  const paisMonedaInfo = useMemo(() => {
    return resolverMonedaNegocio(pais, moneda);
  }, [pais, moneda]);

  const monedaActiva = paisMonedaInfo.simbolo || paisMonedaInfo.codigoMoneda || 'USD';

  // 2. Cargar servicios reales del salón
  const [serviciosReales, setServiciosReales] = useState<ServicioReal[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchServicios() {
      if (!businessId) {
        setLoadingServicios(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('servicios')
          .select('id, nombre, categoria_servicio, precio, duracion')
          .eq('business_id', businessId)
          .order('precio', { ascending: true });

        if (!error && data && isMounted) {
          const mapped: ServicioReal[] = data.map((d: any) => ({
            id: String(d.id),
            nombre: d.nombre,
            categoria: d.categoria_servicio || 'General',
            precio: parseFloat(d.precio) || 0,
            duracion: d.duracion || 45
          }));
          setServiciosReales(mapped);
        }
      } catch (err) {
        console.error('Error cargando servicios del salón:', err);
      } finally {
        if (isMounted) setLoadingServicios(false);
      }
    }
    fetchServicios();
    return () => {
      isMounted = false;
    };
  }, [businessId]);

  // Propuestas Pre-calculadas
  const propuestasIA = useMemo<Record<string, PropuestaIA>>(() => {
    const conPrecio = serviciosReales.filter(s => s.precio > 0);
    const precios = conPrecio.map(s => s.precio).sort((a, b) => a - b);

    const ticketPromedioEstimado = precios.length > 0
      ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
      : (paisMonedaInfo.codigoMoneda === 'PEN' ? 45 : (paisMonedaInfo.codigoMoneda === 'USD' ? 18 : 35));

    const servicioEntrada = conPrecio.find(s => s.precio >= 10 && !s.nombre.toLowerCase().includes('retiro'))
      || conPrecio[0]
      || { nombre: 'Perfilado de Cejas o Spa de Manos', precio: Math.round(ticketPromedioEstimado * 0.5) };

    const servicioEstelar = conPrecio.slice().reverse().find(s => s.precio <= ticketPromedioEstimado * 1.5)
      || conPrecio[conPrecio.length - 1]
      || { nombre: 'Servicio Glow VIP Completo', precio: ticketPromedioEstimado };

    const costoInsumo = (precioVenta: number) => Math.max(1, Math.round(precioVenta * 0.12));

    // Estilo 1: Salón de Uñas & Lash
    const estiloUnasLash: PropuestaIA = {
      id: 'cruzada',
      nombre: 'Uñas, Pestañas & Cejas',
      subtitulo: 'Regalos rápidos que encantan sin demorar turnos',
      icono: '💅',
      ticketSugerido: ticketPromedioEstimado,
      roadmap: [
        {
          numero: 4,
          tipo: 'mimo',
          nombre: 'Exfoliación & Hidratación de Manos',
          desc: 'Spa express de 5 minutos mientras se seca o finaliza el servicio.',
          costo: Math.max(1.5, costoInsumo(servicioEntrada.precio * 0.4)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.25),
          imagenIcono: '🌸'
        },
        {
          numero: 8,
          tipo: 'detalle',
          nombre: 'Nail Art en 2 Uñas o Cepillito Lash VIP',
          desc: 'Detalle estético visible que presumirá en fotos y redes sociales.',
          costo: Math.max(3, costoInsumo(servicioEntrada.precio * 0.7)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.4),
          imagenIcono: '💎'
        },
        {
          numero: 12,
          tipo: 'glow',
          nombre: `${servicioEstelar.nombre} de Cortesía`,
          desc: 'La graduación de oro: el premio mayor que asegura 12 visitas cumplidas.',
          costo: Math.max(6, costoInsumo(servicioEstelar.precio)),
          valorPublicoEstimado: servicioEstelar.precio,
          imagenIcono: '👑'
        }
      ]
    };

    // Estilo 2: Peluquería & Cabello
    const estiloPeluqueria: PropuestaIA = {
      id: 'alta_frecuencia',
      nombre: 'Peluquería & Cabello',
      subtitulo: 'Tratamientos de brillo y nutrición en lavacabezas',
      icono: '💇‍♀️',
      ticketSugerido: ticketPromedioEstimado,
      roadmap: [
        {
          numero: 4,
          tipo: 'mimo',
          nombre: 'Shot de Sérum / Aceite Reparador de Argán',
          desc: 'Toque de nutrición y brillo instantáneo al terminar su peinado.',
          costo: Math.max(2, Math.round(ticketPromedioEstimado * 0.04)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.25),
          imagenIcono: '💧'
        },
        {
          numero: 8,
          tipo: 'detalle',
          nombre: 'Ampolla Nutritiva Antifrizz en Lavacabezas',
          desc: 'Masaje capilar express con ampolla de sellado y nutrición.',
          costo: Math.max(3.5, Math.round(ticketPromedioEstimado * 0.07)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.45),
          imagenIcono: '✨'
        },
        {
          numero: 12,
          tipo: 'glow',
          nombre: 'Tratamiento Restaurador VIP + Brushing',
          desc: 'El regalo definitivo para clientas fieles del salón.',
          costo: Math.max(7, Math.round(ticketPromedioEstimado * 0.14)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.9),
          imagenIcono: '👑'
        }
      ]
    };

    // Estilo 3: Spa, Facial & Estética
    const estiloSpa: PropuestaIA = {
      id: 'vip_premium',
      nombre: 'Spa, Facial & Estética',
      subtitulo: 'Experiencias sensoriales y mascarillas relajantes',
      icono: '💆‍♀️',
      ticketSugerido: Math.round(ticketPromedioEstimado * 1.1),
      roadmap: [
        {
          numero: 4,
          tipo: 'mimo',
          nombre: 'Parches de Colágeno para Ojeras & Aromaterapia',
          desc: 'Descongestión ocular refrescante mientras reposa en camilla.',
          costo: Math.max(2, Math.round(ticketPromedioEstimado * 0.05)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.3),
          imagenIcono: '🍃'
        },
        {
          numero: 8,
          tipo: 'detalle',
          nombre: 'Mascarilla Hidratante de Velo con Ácido Hialurónico',
          desc: 'Cuidado facial de efecto tensor y luminosidad inmediata.',
          costo: Math.max(4, Math.round(ticketPromedioEstimado * 0.08)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado * 0.5),
          imagenIcono: '💎'
        },
        {
          numero: 12,
          tipo: 'glow',
          nombre: 'Sesión Facial Glow Completa de Regalo',
          desc: 'Recompensa máxima: piel de porcelana por su fidelidad de 12 visitas.',
          costo: Math.max(8, Math.round(ticketPromedioEstimado * 0.15)),
          valorPublicoEstimado: Math.round(ticketPromedioEstimado),
          imagenIcono: '👑'
        }
      ]
    };

    return {
      cruzada: estiloUnasLash,
      alta_frecuencia: estiloPeluqueria,
      vip_premium: estiloSpa
    };
  }, [serviciosReales, paisMonedaInfo]);

  // Selección activa
  const [estiloSeleccionado, setEstiloSeleccionado] = useState<string>('cruzada');
  const [ticketPromedio, setTicketPromedio] = useState<number>(() => {
    return propuestasIA.cruzada?.ticketSugerido || (paisMonedaInfo.codigoMoneda === 'PEN' ? 45 : 20);
  });
  const [premios, setPremios] = useState<[RoadmapPremioItem, RoadmapPremioItem, RoadmapPremioItem]>(() => {
    return [...propuestasIA.cruzada.roadmap];
  });

  // Al cambiar de estilo con 1 solo tap
  const handleCambiarEstilo = (key: string) => {
    setEstiloSeleccionado(key);
    const seleccion = propuestasIA[key];
    if (seleccion) {
      setTicketPromedio(seleccion.ticketSugerido);
      setPremios([...seleccion.roadmap] as [RoadmapPremioItem, RoadmapPremioItem, RoadmapPremioItem]);
    }
  };

  // Edición rápida de un premio en línea
  const [editandoHito, setEditandoHito] = useState<number | null>(null);

  const handleUpdatePremio = (index: number, nuevoNombre: string, nuevoCosto: number, nuevaImagenUrl?: string | null) => {
    setPremios(prev => {
      const copy = [...prev] as [RoadmapPremioItem, RoadmapPremioItem, RoadmapPremioItem];
      copy[index] = {
        ...copy[index],
        nombre: nuevoNombre,
        costo: nuevoCosto,
        imagen_url: nuevaImagenUrl !== undefined ? nuevaImagenUrl : copy[index].imagen_url
      };
      return copy;
    });
  };

  // Cálculo en vivo de Margen Seguro
  const resumenMargen = useMemo(() => {
    const totalGastoClienta = ticketPromedio * 12;
    const totalCostoRegalos = premios.reduce((acc, p) => acc + (p.costo || 0), 0);
    const porcentajeCosto = totalGastoClienta > 0
      ? Math.round((totalCostoRegalos / totalGastoClienta) * 100)
      : 0;
    const porcentajeGanancia = Math.max(0, 100 - porcentajeCosto);

    return {
      totalGastoClienta,
      totalCostoRegalos,
      porcentajeCosto,
      porcentajeGanancia
    };
  }, [ticketPromedio, premios]);

  // Guardado final
  const [saving, setSaving] = useState(false);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await onApplyConfig({
        valorBase: ticketPromedio,
        roadmap: premios
      });
      if (onClose) onClose();
    } catch (e) {
      console.error(e);
      alert('Hubo un error guardando tu Camino de Premios. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 md:p-7 border border-amber-200/90 shadow-2xl text-gray-900 relative max-w-xl w-full mx-auto max-h-[88vh] overflow-y-auto scrollbar-none">
      {/* Acentos de fondo claros */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER ULTRA COMPACTO MOBILE */}
      <div className="relative z-10 flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-600" /> 1 minuto • 0 Pérdidas
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Activa tu Camino de Premios ✨
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configura los 3 regalos consentidos de tus clientas con margen protegido.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative z-10 space-y-5 mt-4">
        {/* PASO 1: SELECCIONAR ESTILO DE SALÓN CON 1 TOQUE */}
        <div>
          <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <span>1. Elige tu especialidad</span>
            <span className="text-[10px] text-gray-500 font-normal lowercase">(rellena todo al instante)</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(propuestasIA).map(([key, p]) => {
              const isActive = estiloSeleccionado === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCambiarEstilo(key)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[72px] cursor-pointer ${
                    isActive
                      ? 'bg-amber-50/80 border-amber-400 text-gray-900 shadow-md shadow-amber-500/10 scale-[1.02] ring-1 ring-amber-400'
                      : 'bg-gray-50/80 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{p.icono}</span>
                  <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-1">{p.nombre}</span>
                  {isActive && (
                    <span className="text-[9px] font-semibold text-amber-700 flex items-center gap-0.5 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Listo
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PASO 2: TUS 3 REGALOS CONSENTIDOS (TARJETAS GRANDES TÁCTILES) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>2. Tus 3 Regalos Consentidos</span>
            </label>
            <span className="text-[10px] text-gray-400">Toca el lápiz para editar</span>
          </div>

          <div className="space-y-2">
            {premios.map((p, idx) => {
              const isHito4 = p.numero === 4;
              const isHito8 = p.numero === 8;

              const badgeBg = isHito4
                ? 'bg-pink-50 border-pink-200 text-pink-700'
                : isHito8
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-800';

              const isEditing = editandoHito === p.numero;

              return (
                <div
                  key={p.numero}
                  className="bg-white border border-gray-200 hover:border-amber-300 rounded-2xl p-3 sm:p-3.5 transition-all space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Medallón del sello con emoji 3D */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${badgeBg}`}>
                        {isHito4 ? (
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Wrapped%20gift/3D/wrapped_gift_3d.png"
                            alt="Hito 4"
                            className="w-5 h-5 object-contain"
                          />
                        ) : isHito8 ? (
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Gem%20stone/3D/gem_stone_3d.png"
                            alt="Hito 8"
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <img
                            src="https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/Crown/3D/crown_3d.png"
                            alt="Hito 12"
                            className="w-5 h-5 object-contain"
                          />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                            Sello #{p.numero}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">
                            Costo insumo: {monedaActiva} {p.costo}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5">
                          {p.nombre}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditandoHito(isEditing ? null : p.numero)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer shrink-0 border border-gray-200/80"
                      title="Editar regalo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Formulario de edición rápida si tocan editar */}
                  {isEditing && (
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-gray-600 block mb-1 font-semibold">Nombre del regalo:</label>
                          <input
                            type="text"
                            value={p.nombre}
                            onChange={e => handleUpdatePremio(idx, e.target.value, p.costo, p.imagen_url)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-600 block mb-1 font-semibold">Costo insumo ({monedaActiva}):</label>
                          <input
                            type="number"
                            value={p.costo}
                            onChange={e => handleUpdatePremio(idx, p.nombre, Math.max(0, parseFloat(e.target.value) || 0), p.imagen_url)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-gray-600 font-semibold">
                            Foto o Imagen del Premio (Opcional):
                          </label>
                          <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            Por defecto: Icono 3D de Regalo ✨
                          </span>
                        </div>
                        <input
                          type="url"
                          placeholder="https://... (deja vacío para usar el icono 3D por defecto)"
                          value={p.imagen_url || ''}
                          onChange={e => handleUpdatePremio(idx, p.nombre, p.costo, e.target.value.trim() || null)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white font-mono"
                        />
                        <p className="text-[9px] text-gray-400 mt-1">
                          Solo se enviará esta foto a la clienta cuando desbloquee este premio. Las visitas normales van con texto limpio sin imagen.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PASO 3: CONSUMO MÍNIMO POR SELLO */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>3. Gasto promedio por sello</span>
            </label>
            <p className="text-[11px] text-gray-600">
              Gasto aproximado que tu clienta realiza en cada visita para sumar 1 sello.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-xl px-3 py-1.5 shrink-0 self-start sm:self-auto shadow-xs">
            <span className="text-xs font-bold text-amber-700 font-mono">{monedaActiva}</span>
            <input
              type="number"
              min={1}
              value={ticketPromedio}
              onChange={e => setTicketPromedio(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 bg-transparent text-sm sm:text-base font-black text-gray-900 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* 🛡️ BANNER TRANQUILIDAD: MARGEN 100% PROTEGIDO (VERDE MENTA LUMINOSO) */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Margen Protegido por Nilah</span>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 font-mono bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
              {resumenMargen.porcentajeGanancia}% Ganancia Limpia
            </span>
          </div>

          <p className="text-[11px] sm:text-xs text-emerald-900/80 leading-relaxed">
            Tu clienta dejará <strong className="text-emerald-950 font-bold font-mono">{monedaActiva} {resumenMargen.totalGastoClienta.toLocaleString()}</strong> en tu caja tras completar las 12 visitas. El costo de los 3 regalos suma solo <strong className="text-emerald-950 font-bold font-mono">{monedaActiva} {resumenMargen.totalCostoRegalos}</strong> ({resumenMargen.porcentajeCosto}%).
          </p>
        </div>

        {/* BOTÓN PRINCIPAL DE ACTIVACIÓN RÁPIDA (DORADO BRILLANTE) */}
        <div className="pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={handleGuardar}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-amber-950" />
            <span>{saving ? 'Guardando en tu Salón...' : 'Activar Mi Club Glow Ahora ✨'}</span>
          </button>
          <p className="text-[10px] text-center text-gray-500 mt-2">
            Puedes cambiar o ajustar tus regalos en cualquier momento desde esta pantalla.
          </p>
        </div>
      </div>
    </div>
  );
};
