/**
 * ================================================================
 * SUB-MÓDULO SUPER ADMIN: TARJETAS CLUB GLOW (12 SELLOS WHATSAPP)
 * Carga de las 12 imágenes de tarjeta en Supabase Storage,
 * edición de plantillas globales de mensaje por hito y
 * simulador interactivo para pruebas de envío en producción.
 * ================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown, Image as ImageIcon, Upload, Save, Play, CheckCircle2,
  AlertTriangle, RefreshCw, Smartphone, Eye, Sparkles, Send,
  Sliders, MessageSquare, ChevronRight, Check, ExternalLink, HelpCircle,
  Clock, Zap, User, Calendar
} from 'lucide-react';
import {
  fetchTarjetasClubGlowGlobales,
  saveTarjetasClubGlowGlobales,
  uploadTarjetaSelloImage,
  resolverImagenYTextoParaSello,
  formatearNombreClienta,
  type TarjetaSelloConfig,
  CONFIG_SELLOS_DEFAULT,
} from '../../services/clubGlowTarjetasService';
import { dispararPruebaProduccion } from '../../services/autopilot';
import { supabase } from '@/services/supabase';

interface Props {
  negocios?: { id: string; nombre: string; slug?: string }[];
}

export const GodModeTarjetasClubGlow: React.FC<Props> = ({ negocios = [] }) => {
  const [tarjetas, setTarjetas] = useState<TarjetaSelloConfig[]>(CONFIG_SELLOS_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSello, setUploadingSello] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sello actualmente seleccionado para editar (0 = Bienvenida, 1..12 = Sellos)
  const [selectedSello, setSelectedSello] = useState<number>(0);
  const [tarjetaZero, setTarjetaZero] = useState<TarjetaSelloConfig>({
    sello: 0,
    nombre_hito: 'Sello 0 • ¡Bienvenida al Club Glow! (1 Regalo + 1 Visita = 2 de 12)',
    imagen_url: '',
    titulo_notificacion: '✨ ¡Bienvenida al Club!',
    copy_sugerido: '¡Bienvenida al Club {salon}, {nombre}! 🎁\n\nTe regalamos 1 sello por unirte y hoy sumaste otro: ya llevas *2 de 12*.\n\nTe faltan *2 sellos* para tu primer regalo: *Spa Cutículas & Hidratación Express*.\n\n📲 *Mira tu tarjeta:* {link_tarjeta}',
    es_premio: false,
  });

  // Parámetros de simulación en vivo
  const [testSalonId, setTestSalonId] = useState<string>(negocios[0]?.id || '');
  const [testTipoFlujo, setTestTipoFlujo] = useState<'sellos' | 'rescate_etapa1' | 'rescate_etapa2' | 'cumpleanos'>('sellos');
  const [testCumpleSubEtapa, setTestCumpleSubEtapa] = useState<'anticipado' | 'dia_d_vino' | 'dia_d_no_vino'>('anticipado');
  const [testClientName, setTestClientName] = useState<string>('Camila');
  const [testPhone, setTestPhone] = useState<string>('51999999999');
  const [testStamps, setTestStamps] = useState<number>(0);
  const [testHitoPremio, setTestHitoPremio] = useState<number>(4);
  const [testPremioNombre, setTestPremioNombre] = useState<string>('Exfoliación & Hidratación de Manos');
  const [testMode, setTestMode] = useState<'instant' | 'organic_delay'>('instant');
  const [realClients, setRealClients] = useState<{ id: string; nombre: string; telefono: string }[]>([]);
  const [loadingRealClients, setLoadingRealClients] = useState<boolean>(false);
  const [selectedRealClientId, setSelectedRealClientId] = useState<string>('');
  const [testingDispatch, setTestingDispatch] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Cargar tarjetas al montar
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTarjetasClubGlowGlobales();
        setTarjetas(data);
      } catch (err: any) {
        console.error('Error cargando tarjetas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Cargar clientas reales cuando cambia el salón seleccionado
  useEffect(() => {
    async function fetchRealClients() {
      if (!testSalonId) return;
      setLoadingRealClients(true);
      try {
        const { data: clients } = await supabase
          .from('Clientes')
          .select('id, nombre, telefono')
          .eq('business_id', testSalonId)
          .not('telefono', 'is', null)
          .order('id', { ascending: false })
          .limit(15);

        if (clients && clients.length > 0) {
          setRealClients(clients);
          setSelectedRealClientId(clients[0].id);
          const rawName = formatearNombreClienta(clients[0].nombre);
          setTestClientName(rawName);
          setTestPhone(clients[0].telefono?.replace(/[^0-9]/g, '') || '');
        } else {
          setRealClients([]);
        }
      } catch (e) {
        console.error('Error fetching real clients for test simulator:', e);
      } finally {
        setLoadingRealClients(false);
      }
    }
    fetchRealClients();
  }, [testSalonId]);

  const currentTarjeta = selectedSello === 0
    ? tarjetaZero
    : (tarjetas.find((t) => t.sello === selectedSello) || tarjetas[0]);

  const handleUpdateCurrentField = (field: keyof TarjetaSelloConfig, value: any) => {
    if (selectedSello === 0) {
      setTarjetaZero((prev) => ({ ...prev, [field]: value }));
    } else {
      setTarjetas((prev) =>
        prev.map((t) => (t.sello === selectedSello ? { ...t, [field]: value } : t))
      );
    }
  };

  const handleFileUpload = async (selloNum: number, file: File) => {
    setUploadingSello(selloNum);
    setErrorMsg(null);
    try {
      const res = await uploadTarjetaSelloImage(selloNum, file);
      if (res.success && res.publicUrl) {
        const updatedTarjetas = tarjetas.map((t) =>
          t.sello === selloNum ? { ...t, imagen_url: res.publicUrl! } : t
        );
        setTarjetas(updatedTarjetas);

        // Guardar automáticamente en Supabase nilah_config y localStorage de inmediato
        await saveTarjetasClubGlowGlobales(updatedTarjetas);

        const sizeInfo = res.sizeKb ? ` (~${res.sizeKb} KB, ultra-ligera)` : '';
        setSuccessMsg(`✅ Sello ${selloNum}: Imagen optimizada a formato 4:3${sizeInfo} y guardada en Supabase.`);
        setTimeout(() => setSuccessMsg(null), 4500);
      } else {
        setErrorMsg(res.error || 'Error al subir imagen a Supabase');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error inesperado al subir imagen');
    } finally {
      setUploadingSello(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveTarjetasClubGlowGlobales(tarjetas);
      if (res.success) {
        setSuccessMsg('✅ ¡Las 12 tarjetas y plantillas globales fueron guardadas correctamente!');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.error || 'Error al guardar configuración');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // Simulación del mensaje resuelto con URL de autoridad de koratflow.agency
  const targetSalon = negocios.find((n) => n.id === testSalonId);
  const salonSlug = targetSalon?.slug || targetSalon?.nombre?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || testSalonId;
  const baseUrl = typeof window !== 'undefined' && window.location.origin.includes('localhost')
    ? 'https://koratflow.agency'
    : (typeof window !== 'undefined' ? window.location.origin : 'https://koratflow.agency');
  const prettyCardUrl = `${baseUrl}/club/${salonSlug}?c=${selectedRealClientId || 'demo'}`;

  // Resuelve preview según el tipo de flujo (Textos directos, persuasivos y con branding de agencia)
  const previewData = useMemo(() => {
    const rawName = formatearNombreClienta(testClientName);
    const salonNombre = targetSalon?.nombre || 'Salón de Belleza VIP';

    const isPrize = [4, 8, 12].includes(testStamps);
    const defaultPrizeMap: Record<number, string> = {
      4: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg',
      8: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_8.jpg',
      12: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_12.jpg'
    };

    if (testTipoFlujo === 'rescate_etapa1') {
      const copy = `🌸 *¡Hola ${rawName}!*

Tienes *${testStamps} sellos* acumulados en tu tarjeta Club Glow de ${salonNombre} ✨.

Notamos tu tarjeta en pausa y queremos que disfrutes tu *${testPremioNombre}* 🎁.

🔥 *Beneficio exclusivo:* Si nos visitas esta semana, tu cita suma *DOBLE SELLO (2X)* para avanzar directo a tu premio.

📲 *Mira tus sellos aquí:* ${prettyCardUrl}`;

      return {
        imagen_url: null,
        copy_final: copy,
        hito: 'Doble Sello (2X)',
        es_rescate: true,
        es_premio: false
      };
    }

    if (testTipoFlujo === 'rescate_etapa2') {
      const sellosRegalo = Math.max(1, (testHitoPremio - testStamps) - 1);
      const sellosPost = testStamps + sellosRegalo;
      const copy = `✨ *¡Sorpresa para ti, ${rawName}!* 💖

Te extrañamos en ${salonNombre} y te acabamos de regalar *+${sellosRegalo} sellos* en tu tarjeta Club Glow 🎁.

👑 Ya tienes *${sellosPost} de ${testHitoPremio} sellos*: ¡Estás a solo 1 visita de llevarte tu *${testPremioNombre}*!

Ven por tu servicio favorito y reclama tu regalo en caja 💕.

📲 *Revisa tu tarjeta actualizada:* ${prettyCardUrl}`;

      // En Etapa 2 la dejamos a 1 paso del premio: adjuntamos la imagen 3D del premio que está por ganar
      const imagenPremio = defaultPrizeMap[testHitoPremio] || defaultPrizeMap[12];

      return {
        imagen_url: imagenPremio,
        copy_final: copy,
        hito: `Premio a 1 paso (${sellosPost}/${testHitoPremio})`,
        es_rescate: true,
        es_premio: true
      };
    }

    if (testTipoFlujo === 'cumpleanos') {
      if (testCumpleSubEtapa === 'anticipado') {
        const sellosRegalo = Math.max(1, (testHitoPremio - testStamps) - 1);
        const sellosPost = testStamps + sellosRegalo;
        const copy = `🎂 *¡Se acerca tu semana especial, ${rawName}!* ✨🎉

En *${salonNombre}* queremos que brilles como la reina que eres 👑.

🎁 *Tu Acelerador de Cumpleaños VIP:*
Te acabamos de adelantar *+${sellosRegalo} sellos dorados* de regalo en tu tarjeta Club Glow ✨.

🔥 Ya tienes *${sellosPost} de ${testHitoPremio} sellos*: ¡Estás a solo *1 visita* de llevarte tu *${testPremioNombre}*! 🎁

Reserva tu cita para lucir radiante en tu fiesta y reclamar tu regalo en tu visita 💕.

📲 *Mira tu tarjeta casi lista aquí:*
${prettyCardUrl}`;

        const imagenPremio = defaultPrizeMap[testHitoPremio] || defaultPrizeMap[12];

        return {
          imagen_url: imagenPremio,
          copy_final: copy,
          hito: `Cumpleaños Anticipado (A 1 paso de premio)`,
          es_rescate: true,
          es_premio: true
        };
      }

      if (testCumpleSubEtapa === 'dia_d_vino') {
        const copy = `👑 *¡FELIZ CUMPLEAÑOS, ${rawName.toUpperCase()}!* 🎂🎉✨

Hoy todo el equipo de *${salonNombre}* celebra tu vida con una gran sonrisa en el corazón 💕.

Nos llenó de felicidad haberte consentido para que llegues a tu día brillando como la reina que eres ✨. Deseamos que pases un día extraordinario rodeada de amor y momentos mágicos.

¡Gracias por elegirnos para ser parte de tu luz y belleza! 🥂💖`;

        return {
          imagen_url: null,
          copy_final: copy,
          hito: `Cumpleaños Día D (Clienta ya visitó / Agendada)`,
          es_rescate: false,
          es_premio: false
        };
      }

      // testCumpleSubEtapa === 'dia_d_no_vino'
      const copy = `👑 *¡FELIZ CUMPLEAÑOS, ${rawName.toUpperCase()}!* 🎂🎉✨

De parte de todo el equipo de *${salonNombre}*, te deseamos un día absolutamente maravilloso, lleno de alegría, salud y mucho amor 💖.

¡Que este nuevo año de vida venga repleto de bendiciones y éxitos!

*(Pd: Recuerda que tu regalo VIP y tus sellos acelerados están activos durante todo tu mes de cumpleaños para cuando quieras consentirte como te mereces ✨)*

📲 *Ver tu tarjeta Club Glow:* ${prettyCardUrl}`;

      return {
        imagen_url: null,
        copy_final: copy,
        hito: `Cumpleaños Día D (Clienta pendiente de visita)`,
        es_rescate: false,
        es_premio: false
      };
    }

    // Por defecto: Flujo regular de Sellos Acumulados
    // Regla de Experto: Imagen ÚNICAMENTE si desbloqueó premio (hitos 4, 8, 12).
    const regularResult = resolverImagenYTextoParaSello(testStamps, tarjetas, {
      nombre: rawName,
      salon: salonNombre,
      link_tarjeta: prettyCardUrl,
    });

    return {
      ...regularResult,
      imagen_url: isPrize ? (regularResult.imagen_url || defaultPrizeMap[testStamps]) : null,
      es_rescate: false,
      es_premio: isPrize
    };
  }, [testTipoFlujo, testCumpleSubEtapa, testStamps, testHitoPremio, testPremioNombre, tarjetas, testClientName, targetSalon, prettyCardUrl]);

  const handleRunTestDispatch = async () => {
    setTestingDispatch(true);
    setTestResult(null);
    try {
      const cleanPhone = testPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        throw new Error('Ingresa un número de WhatsApp válido (ej: 51981482289).');
      }

      const nombreFlujo = testTipoFlujo === 'sellos' 
        ? 'club_glow_sellos' 
        : testTipoFlujo === 'rescate_etapa1' 
        ? 'club_glow_rescate_etapa1' 
        : testTipoFlujo === 'rescate_etapa2'
        ? 'club_glow_rescate_etapa2'
        : testCumpleSubEtapa === 'anticipado'
        ? 'cumpleanos_anticipado'
        : 'cumpleanos_dia_d';

      // Disparo seguro a través de RPC (SECURITY DEFINER bypasses RLS)
      const { data: resRpc, error: rpcErr } = await supabase.rpc('superadmin_probar_disparo_club_glow', {
        p_business_id: testSalonId,
        p_telefono: cleanPhone,
        p_flujo: nombreFlujo,
        p_mensaje: previewData.copy_final,
        p_media_url: previewData.imagen_url || null,
        p_media_type: 'image',
        p_metadata: {
          cliente_nombre: testClientName,
          sello: testStamps,
          tipo_flujo: testTipoFlujo,
          sub_etapa: testCumpleSubEtapa,
          modo: testMode
        },
        p_es_organico: testMode === 'organic_delay'
      });

      if (rpcErr) throw rpcErr;
      if (!resRpc?.ok) throw new Error(resRpc?.error || 'Error al ejecutar prueba de producción');

      const tagEtapa = testTipoFlujo === 'sellos' 
        ? `Sello ${testStamps}` 
        : testTipoFlujo === 'rescate_etapa1' 
        ? 'Rescate 2X (Etapa 1)' 
        : testTipoFlujo === 'rescate_etapa2'
        ? 'Rescate 1-Paso (Etapa 2)'
        : testCumpleSubEtapa === 'anticipado'
        ? 'Cumpleaños Anticipado (7 días)'
        : testCumpleSubEtapa === 'dia_d_vino'
        ? 'Cumpleaños Día D (Ya visitó)'
        : 'Cumpleaños Día D (No visitó)';

      if (testMode === 'organic_delay') {
        setTestResult({
          ok: true,
          mensaje: `⏳ ¡Simulación orgánica registrada! Mensaje encolado para salir en 30 minutos (${new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}). [${tagEtapa}]`,
          detail: resRpc
        });
      } else {
        setTestResult({
          ok: true,
          mensaje: `⚡ ¡Disparo instantáneo enviado con éxito a WhatsApp (+${cleanPhone})! [${tagEtapa}]`,
          detail: resRpc?.dispatch,
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err.message || 'Error al procesar simulación',
      });
    } finally {
      setTestingDispatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Banner Superior ── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-black font-black shadow-xs">
              <Crown className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Gestor de Tarjetas Club Glow (12 Sellos WhatsApp)
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Sube a <strong>Supabase Storage</strong> las 12 imágenes progresivas (1 por sello). Cuando una clienta acumula visitas, el bot de WhatsApp envía automáticamente la tarjeta gráfica correspondiente con su copy personalizado y link a su tarjeta 3D.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar Todo (Global)'}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Tira de los 12 Sellos (Selector Rápido) ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>Configuración de Mensajes y Premios por Sello:</span>
          <span className="text-[11px] text-amber-600 font-extrabold">🎁 Con Imagen 3D: Sellos 4, 8 y 12 • 💬 Texto Puro: Sellos regulares</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-2">
          {/* Sello 0: Bienvenida (0 Sellos) */}
          <button
            type="button"
            onClick={() => setSelectedSello(0)}
            className={`relative p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedSello === 0
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 text-amber-950 font-black shadow-xs scale-102'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
            }`}
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-amber-100/70 border border-amber-200 relative flex items-center justify-center">
              <span className="text-base select-none">👑</span>
            </div>
            <span className="text-[11px] font-black">Sello 0</span>
          </button>

          {tarjetas.map((t) => {
            const isSelected = t.sello === selectedSello;
            const isMilestone = t.es_premio;
            return (
              <button
                key={t.sello}
                onClick={() => setSelectedSello(t.sello)}
                className={`relative p-2 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 text-amber-950 font-black shadow-xs scale-102'
                    : isMilestone
                    ? 'bg-amber-500/10 border-amber-300 text-amber-800 hover:border-amber-400 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {isMilestone && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] flex items-center justify-center font-black shadow-xs">
                    ★
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative flex items-center justify-center">
                  {t.imagen_url ? (
                    <img src={t.imagen_url} alt={`Sello ${t.sello}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base select-none">💬</span>
                  )}
                </div>
                <span className="text-[11px] font-black">Sello {t.sello}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Editor Central + Celular Simulador en Producción ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CONFIGURADOR DEL SELLO ACTUAL (7 COLS) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shadow-xs">
                {currentTarjeta.sello}
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900">{currentTarjeta.nombre_hito}</h3>
                <p className="text-[11px] text-slate-500">
                  {currentTarjeta.es_premio ? 'Premio desbloqueado con Imagen 3D + Copy' : 'Visita regular: Solo Texto Plano Anti-Baneo'}
                </p>
              </div>
            </div>

            {currentTarjeta.es_premio ? (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                🎁 Hito de Premio (Con Imagen 3D)
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                💬 Texto Limpio (Sin Imagen)
              </span>
            )}
          </div>

          {/* Subida de Imagen Supabase (Solo relevante para Premios) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500" /> Imagen del Premio (Hitos 4, 8 y 12):
              </span>
              {!currentTarjeta.es_premio && (
                <span className="text-[10px] text-slate-400 font-normal">
                  (Los sellos regulares no envían imagen para evitar baneos)
                </span>
              )}
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-36 aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border-2 border-amber-500/40 shadow-sm relative flex-shrink-0 flex items-center justify-center">
                {currentTarjeta.imagen_url ? (
                  <>
                    <img
                      src={currentTarjeta.imagen_url}
                      alt={`Preview ${currentTarjeta.sello}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 bg-black/70 text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      4:3
                    </span>
                  </>
                ) : (
                  <div className="text-center p-2 text-slate-400 text-[10px]">
                    <div className="text-xl mb-1">💬</div>
                    <span>Sin imagen</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingSello === currentTarjeta.sello ? 'Optimizando y Subiendo...' : 'Subir Foto 3D a Supabase'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(currentTarjeta.sello, file);
                      }}
                    />
                  </label>
                  {currentTarjeta.imagen_url && (
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrentField('imagen_url', '')}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={currentTarjeta.imagen_url}
                  onChange={(e) => handleUpdateCurrentField('imagen_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Nombre del Hito */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Título / Nombre del Hito:</label>
            <input
              type="text"
              value={currentTarjeta.nombre_hito}
              onChange={(e) => handleUpdateCurrentField('nombre_hito', e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-bold focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Plantilla de Mensaje WhatsApp */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-500" /> Plantilla de Mensaje para WhatsApp:
              </label>
              <div className="flex gap-1">
                {['{nombre}', '{salon}', '{sello_actual}', '{link_tarjeta}'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      handleUpdateCurrentField('copy_sugerido', currentTarjeta.copy_sugerido + ' ' + tag)
                    }
                    className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-900 px-1.5 py-0.5 rounded-md font-mono cursor-pointer transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={4}
              value={currentTarjeta.copy_sugerido}
              onChange={(e) => handleUpdateCurrentField('copy_sugerido', e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed focus:border-amber-500 focus:outline-none resize-none font-sans"
            />
          </div>

          {/* Selector de Premio */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-black text-amber-900">¿Este sello entrega un premio/regalo?</p>
              <p className="text-[11px] text-amber-700">
                Al activarlo, WhatsApp destacará el cupón y el salón recibirá alerta de canje.
              </p>
            </div>
            <button
              onClick={() => handleUpdateCurrentField('es_premio', !currentTarjeta.es_premio)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                currentTarjeta.es_premio ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  currentTarjeta.es_premio ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR DE PRODUCCIÓN EN VIVO (5 COLS) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" /> Simulador de Celular en Vivo
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Live Preview
            </span>
          </div>

          {/* Selector de Automatización de Club Glow a Probar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Tipo de Automatización Club Glow:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTestTipoFlujo('sellos')}
                className={`py-2 px-2 rounded-xl font-black text-[11px] flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  testTipoFlujo === 'sellos'
                    ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>⭐ Sellos</span>
                <span className="text-[9px] font-normal opacity-80">Por Visita</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestTipoFlujo('rescate_etapa1');
                  setTestMode('instant');
                }}
                className={`py-2 px-2 rounded-xl font-black text-[11px] flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  testTipoFlujo === 'rescate_etapa1'
                    ? 'bg-white text-orange-900 shadow-xs border border-orange-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🔥 Etapa 1</span>
                <span className="text-[9px] font-normal opacity-80">Doble Sello 2X</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestTipoFlujo('rescate_etapa2');
                  setTestMode('instant');
                }}
                className={`py-2 px-2 rounded-xl font-black text-[11px] flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  testTipoFlujo === 'rescate_etapa2'
                    ? 'bg-white text-rose-900 shadow-xs border border-rose-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🎁 Etapa 2</span>
                <span className="text-[9px] font-normal opacity-80">A 1 Visita</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTestTipoFlujo('cumpleanos');
                  setTestMode('instant');
                }}
                className={`py-2 px-2 rounded-xl font-black text-[11px] flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  testTipoFlujo === 'cumpleanos'
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🎂 Cumpleaños</span>
                <span className="text-[9px] font-normal opacity-80">2 Tiempos VIP</span>
              </button>
            </div>

            {/* Sub-selector de Tiempos de Cumpleaños */}
            {testTipoFlujo === 'cumpleanos' && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider block mb-1.5">
                  Selecciona la Etapa de Cumpleaños a Probar:
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-purple-50 rounded-xl border border-purple-200/80">
                  <button
                    type="button"
                    onClick={() => setTestCumpleSubEtapa('anticipado')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center leading-tight ${
                      testCumpleSubEtapa === 'anticipado'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    1. Anticipado (7 días)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestCumpleSubEtapa('dia_d_vino')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center leading-tight ${
                      testCumpleSubEtapa === 'dia_d_vino'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    2. Día D (Ya visitó)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestCumpleSubEtapa('dia_d_no_vino')}
                    className={`py-1.5 px-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center leading-tight ${
                      testCumpleSubEtapa === 'dia_d_no_vino'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    2. Día D (Aún no vino)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Selector de Modo de Simulación (Solo para sellos regulares aplica el retardo de 30m) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTestMode('instant')}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                testMode === 'instant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Envío Inmediato</span>
            </button>
            <button
              type="button"
              onClick={() => setTestMode('organic_delay')}
              disabled={testTipoFlujo !== 'sellos'}
              className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                testTipoFlujo !== 'sellos'
                  ? 'opacity-40 cursor-not-allowed text-slate-400'
                  : testMode === 'organic_delay'
                  ? 'bg-indigo-600 text-white shadow-xs cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 cursor-pointer'
              }`}
              title={testTipoFlujo !== 'sellos' ? 'El rescate se envía inmediatamente según cron' : undefined}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ Retardo Orgánico (30m)</span>
            </button>
          </div>

          {/* Controles del Simulador */}
          <div className="space-y-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs shadow-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  1. Salón a Simular:
                </label>
                <select
                  value={testSalonId}
                  onChange={(e) => setTestSalonId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-800 focus:border-amber-500 focus:outline-none"
                >
                  {negocios.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  {testTipoFlujo === 'sellos' ? '2. Sellos Acumulados:' : '2. Sellos Previos Clienta:'}
                </label>
                <select
                  value={testStamps}
                  onChange={(e) => setTestStamps(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-black text-amber-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value={0}>0 Sellos Iniciales • Bienvenida (1 Regalo + 1 Visita = 2 de 12)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                    <option key={s} value={s}>
                      {s} Sellos {s === 4 || s === 8 || s === 12 ? '⭐ (Premio)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configuración adicional si es Rescate Etapa 1 o Etapa 2 */}
            {testTipoFlujo !== 'sellos' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-[10px] font-bold text-amber-700 block mb-0.5">Hito Premio Objetivo:</label>
                  <select
                    value={testHitoPremio}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setTestHitoPremio(h);
                      if (h === 4) setTestPremioNombre('Exfoliación & Hidratación de Manos');
                      else if (h === 8) setTestPremioNombre('Nail Art o Cepillito Lash VIP');
                      else setTestPremioNombre('Servicio Glow Completo de Cortesía');
                    }}
                    className="w-full p-1.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs font-bold text-amber-900 focus:outline-none"
                  >
                    <option value={4}>Meta 4 Sellos (Nivel 1)</option>
                    <option value={8}>Meta 8 Sellos (Nivel 2)</option>
                    <option value={12}>Meta 12 Sellos (Graduación)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nombre del Premio:</label>
                  <input
                    type="text"
                    value={testPremioNombre}
                    onChange={(e) => setTestPremioNombre(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: Exfoliación VIP"
                  />
                </div>
              </div>
            )}

            {/* Selector de Clienta Real del Salón */}
            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> 3. Clienta Real del Salón:
                </label>
                {loadingRealClients && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Buscando...
                  </span>
                )}
              </div>
              <select
                value={selectedRealClientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedRealClientId(val);
                  if (val === 'manual') return;
                  const c = realClients.find((item) => item.id === val);
                  if (c) {
                    const rawName = (c.nombre || '').trim().split(/\s+/)[0].replace(/[^\p{L}\p{N}]/gu, '') || c.nombre;
                    setTestClientName(rawName);
                    setTestPhone(c.telefono?.replace(/[^0-9]/g, '') || '');
                  }
                }}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                {realClients.length > 0 ? (
                  <>
                    <optgroup label="Clientas Reales Registradas">
                      {realClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.nombre} ({c.telefono})
                        </option>
                      ))}
                    </optgroup>
                    <option value="manual">✍️ Escribir Manualmente / Mi Propio WhatsApp</option>
                  </>
                ) : (
                  <option value="manual">✍️ Modo Manual (Sin clientas previas)</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nombre Clienta:</label>
                <input
                  type="text"
                  value={testClientName}
                  onChange={(e) => setTestClientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="Ej: Camila"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">WhatsApp Destino:</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 bg-white focus:border-amber-500 focus:outline-none"
                  placeholder="51999999999"
                />
              </div>
            </div>

            {/* Aviso informativo de retardo psicológico */}
            {testMode === 'organic_delay' ? (
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 leading-relaxed flex items-start gap-2">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Efecto Psicológico (30 min):</span> En producción, la clienta recibe su tarjeta digital cuando ya salió del salón y está en su auto o casa admirando sus uñas/cabello. El mensaje se encola para salir a las{' '}
                  <strong className="underline">
                    {new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>.
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Modo Rápido Directo:</span> El mensaje y la imagen de tarjeta se enviarán inmediatamente a WhatsApp para que verifiques en tu celular el diseño y el texto.
                </div>
              </div>
            )}
          </div>

          {/* Marco de Celular WhatsApp */}
          <div className="w-full max-w-sm mx-auto bg-[#0b141a] rounded-3xl p-3 border-4 border-slate-800 shadow-2xl space-y-3 font-sans">
            {/* Header Chat WhatsApp */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-black font-black text-xs shadow-xs">
                👑
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="text-xs font-bold text-white truncate">
                  {negocios.find((n) => n.id === testSalonId)?.nombre || 'Salón VIP'}
                </h5>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> en línea
                </span>
              </div>
            </div>

            {/* Banner de estado de envío en simulación */}
            {testMode === 'organic_delay' && (
              <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-xl px-2.5 py-1.5 text-[10px] text-indigo-200 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400 animate-pulse" /> Entrega post-cita:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  +{30} min ({new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            )}

            {/* Globo de Mensaje WhatsApp */}
            <div className="bg-[#1f2c34] rounded-2xl p-2.5 text-white shadow-md space-y-2 border border-white/5">
              {/* Tarjeta enviada directamente en el chat (SOLO si es Premio Desbloqueado) */}
              {previewData.imagen_url ? (
                <div className="rounded-xl overflow-hidden border border-amber-500/40 relative shadow-sm aspect-[4/3] bg-black/40">
                  <img
                    src={previewData.imagen_url}
                    alt={`Premio Hito ${testStamps}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2 flex items-center justify-between text-[10px]">
                    <span className="font-black text-amber-300">🎁 {previewData.hito}</span>
                    <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded-md font-black">
                      ¡PREMIO DESBLOQUEADO!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl px-2.5 py-1.5 border border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-emerald-400">
                    🛡️ Mensaje Seguro Anti-Baneo (Texto Puro)
                  </span>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                    Sin imagen para maximizar clics
                  </span>
                </div>
              )}

              {/* Texto de Mensaje */}
              <div className="text-[11px] text-slate-100 leading-relaxed whitespace-pre-line px-1">
                {previewData.copy_final}
              </div>

              <div className="text-right text-[9px] text-slate-400 flex items-center justify-end gap-1 pt-1">
                <span>
                  {testMode === 'organic_delay'
                    ? new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-sky-400">✓✓</span>
              </div>
            </div>
          </div>

          {/* Botón Disparar Prueba Real en Producción */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleRunTestDispatch}
              disabled={testingDispatch}
              className={`w-full py-3 px-4 rounded-2xl active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                testTipoFlujo === 'rescate_etapa1'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-orange-600/25'
                  : testTipoFlujo === 'rescate_etapa2'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-600/25'
                  : testTipoFlujo === 'cumpleanos'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-600/25'
                  : testMode === 'organic_delay'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
              }`}
            >
              {testingDispatch ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : testMode === 'organic_delay' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {testingDispatch
                ? 'Procesando en Supabase...'
                : testMode === 'organic_delay'
                ? `Simular Salida Post-Cita (+30 min) para ${testClientName}`
                : testTipoFlujo === 'rescate_etapa1'
                ? `🔥 Disparar Rescate Etapa 1 (2X) a WhatsApp (${testPhone})`
                : testTipoFlujo === 'rescate_etapa2'
                ? `🎁 Disparar Rescate Etapa 2 (A 1 Paso) a WhatsApp (${testPhone})`
                : testTipoFlujo === 'cumpleanos'
                ? `🎂 Disparar Acelerador Cumpleaños VIP a WhatsApp (${testPhone})`
                : `⚡ Disparar Inmediatamente Sello ${testStamps} a WhatsApp (${testPhone})`}
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold leading-relaxed ${
                  testResult.ok
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testResult.ok ? '✓ ' : '✕ '} {testResult.mensaje || testResult.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GodModeTarjetasClubGlow;
