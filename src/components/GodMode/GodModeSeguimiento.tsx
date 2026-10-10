import React, { useState } from 'react';
import {
  MessageCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Scissors,
  Users,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
import type { NegocioAdmin } from '../../types/godmode';

interface Props {
  negocios: NegocioAdmin[];
  onReload: () => void;
}

type TabFiltro = 'todos' | 'paso1_servicios' | 'paso2_clientes' | 'paso3_citas' | 'activados' | 'sospechosos';

export const GodModeSeguimiento: React.FC<Props> = ({ negocios }) => {
  const [filtro, setFiltro] = useState<TabFiltro>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Enriquecer cada salón con su estado del tutorial
  const negociosAnalizados = negocios.map((n) => {
    const servicios = n.tutorial_servicios_count ?? 0;
    const clientes = n.tutorial_clientes_count ?? 0;
    const citas = n.tutorial_citas_count ?? 0;

    let pasoActual = 1;
    let pasoNombre = 'Paso 1: Sin Servicios';
    let detalle = 'No ha agregado ningún servicio o precio.';
    let estadoColor = 'rose';

    if (servicios > 0 && clientes === 0) {
      pasoActual = 2;
      pasoNombre = 'Paso 2: Sin Clientas';
      detalle = `Creó ${servicios} servicios pero 0 clientas registradas.`;
      estadoColor = 'amber';
    } else if (servicios > 0 && clientes > 0 && citas === 0) {
      pasoActual = 3;
      pasoNombre = 'Paso 3: Sin Citas';
      detalle = `Tiene servicios y clientas pero la agenda sigue vacía.`;
      estadoColor = 'sky';
    } else if (servicios > 0 && clientes > 0 && citas > 0) {
      pasoActual = 4;
      pasoNombre = '🎉 Listo / Activado';
      detalle = 'Completó los 3 pasos iniciales y agendó al menos una cita.';
      estadoColor = 'emerald';
    }

    // Detección de número sospechoso o vacío
    const rawTel = (n.telefono_recepcionista || '').replace(/\D/g, '');
    const esSospechoso =
      rawTel.length > 0 &&
      (rawTel.length < 8 ||
        /^(\d)\1+$/.test(rawTel) ||
        rawTel === '12345678' ||
        rawTel === '123456789' ||
        rawTel === '987654321');

    // Horas desde el registro
    const horasDesdeRegistro = Math.max(
      0,
      Math.floor((Date.now() - new Date(n.fecha_registro).getTime()) / (1000 * 60 * 60))
    );

    return {
      ...n,
      servicios,
      clientes,
      citas,
      pasoActual,
      pasoNombre,
      detalle,
      estadoColor,
      esSospechoso,
      horasDesdeRegistro,
    };
  });

  // Contadores
  const countPaso1 = negociosAnalizados.filter((n) => n.pasoActual === 1).length;
  const countPaso2 = negociosAnalizados.filter((n) => n.pasoActual === 2).length;
  const countPaso3 = negociosAnalizados.filter((n) => n.pasoActual === 3).length;
  const countActivados = negociosAnalizados.filter((n) => n.pasoActual === 4).length;
  const countSospechosos = negociosAnalizados.filter((n) => n.esSospechoso).length;

  // Filtrado
  const salonesFiltrados = negociosAnalizados.filter((n) => {
    // Filtro por tab
    if (filtro === 'paso1_servicios' && n.pasoActual !== 1) return false;
    if (filtro === 'paso2_clientes' && n.pasoActual !== 2) return false;
    if (filtro === 'paso3_citas' && n.pasoActual !== 3) return false;
    if (filtro === 'activados' && n.pasoActual !== 4) return false;
    if (filtro === 'sospechosos' && !n.esSospechoso) return false;

    // Filtro de búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchNombre = n.nombre.toLowerCase().includes(q);
      const matchAdmin = (n.nombre_admin || n.owner?.nombre_persona || '').toLowerCase().includes(q);
      const matchTel = (n.telefono_recepcionista || '').includes(q);
      return matchNombre || matchAdmin || matchTel;
    }
    return true;
  });

  // Generador de enlace de WhatsApp con mensaje empático
  const generarWhatsAppLink = (salon: typeof negociosAnalizados[0]) => {
    let telefono = salon.telefono_recepcionista || '';
    if (!telefono) return null;
    const cleanDigits = telefono.replace(/\D/g, '');
    if (!cleanDigits) return null;

    const admin = salon.nombre_admin || salon.owner?.nombre_persona?.split(' ')[0] || 'hola';
    let mensaje = '';

    if (salon.pasoActual === 1) {
      mensaje = `¡Hola ${admin}! Te saluda Martín de Korat Flow. Vi que registraste *${salon.nombre}*, ¡bienvenida! Noté que aún no has podido cargar tu lista de servicios. ¿Se te complicó algún paso o quieres que te dé una mano rápida para dejarlos listos?`;
    } else if (salon.pasoActual === 2) {
      mensaje = `¡Hola ${admin}! Vi que ya configuraste los servicios de *${salon.nombre}*, ¡te quedaron súper bien! Te escribía porque vi que aún no has registrado a tus primeras clientas. ¿Te ayudo a importar tu lista o añadir la primera?`;
    } else if (salon.pasoActual === 3) {
      mensaje = `¡Hola ${admin}! Ya tienes casi todo configurado en *${salon.nombre}*. Solo te falta probar agendando tu primera cita de prueba para ver el calendario en acción. ¿Te dio algún error o tienes dudas con los horarios?`;
    } else {
      mensaje = `¡Hola ${admin}! Te saluda Martín de Korat Flow. Veo que *${salon.nombre}* ya está activo y con citas en agenda. Paso a dejarte mi contacto por si necesitas cualquier consulta técnica o soporte. ¡Éxitos con tu salón!`;
    }

    return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold mb-3">
            <Sparkles size={14} className="text-emerald-200" />
            <span>Monitoreo de Activación & Rescate en Tiempo Real</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Seguimiento de Salones & Abandonos
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
            Identifica exactamente en qué paso del tutorial se quedó cada salón y contáctalos por WhatsApp en 1 clic antes de que abandonen.
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Paso 1 */}
        <button
          onClick={() => setFiltro('paso1_servicios')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filtro === 'paso1_servicios'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Scissors size={18} />
            </div>
            <span className="text-2xl font-black text-rose-700">{countPaso1}</span>
          </div>
          <p className="text-xs font-black text-slate-800">Paso 1: Sin Servicios</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Se quedaron al inicio</p>
        </button>

        {/* Paso 2 */}
        <button
          onClick={() => setFiltro('paso2_clientes')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filtro === 'paso2_clientes'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <span className="text-2xl font-black text-amber-700">{countPaso2}</span>
          </div>
          <p className="text-xs font-black text-slate-800">Paso 2: Sin Clientas</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tienen servicios</p>
        </button>

        {/* Paso 3 */}
        <button
          onClick={() => setFiltro('paso3_citas')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filtro === 'paso3_citas'
              ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/30'
              : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Calendar size={18} />
            </div>
            <span className="text-2xl font-black text-sky-700">{countPaso3}</span>
          </div>
          <p className="text-xs font-black text-slate-800">Paso 3: Sin Citas</p>
          <p className="text-[11px] text-slate-500 mt-0.5">A 1 paso de la gloria</p>
        </button>

        {/* Activados */}
        <button
          onClick={() => setFiltro('activados')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filtro === 'activados'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-2xl font-black text-emerald-700">{countActivados}</span>
          </div>
          <p className="text-xs font-black text-slate-800">🎉 Activados</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Completaron todo</p>
        </button>

        {/* Sospechosos */}
        <button
          onClick={() => setFiltro('sospechosos')}
          className={`col-span-2 lg:col-span-1 p-4 rounded-2xl border text-left transition-all ${
            filtro === 'sospechosos'
              ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/30'
              : 'bg-white border-slate-200 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
            <span className="text-2xl font-black text-purple-700">{countSospechosos}</span>
          </div>
          <p className="text-xs font-black text-slate-800">Números Raros</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Revisión manual</p>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtro === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({negociosAnalizados.length})
          </button>
          <button
            onClick={() => setFiltro('paso1_servicios')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtro === 'paso1_servicios'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Paso 1 ({countPaso1})
          </button>
          <button
            onClick={() => setFiltro('paso2_clientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtro === 'paso2_clientes'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Paso 2 ({countPaso2})
          </button>
          <button
            onClick={() => setFiltro('paso3_citas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtro === 'paso3_citas'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            Paso 3 ({countPaso3})
          </button>
          <button
            onClick={() => setFiltro('activados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtro === 'activados'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Activados ({countActivados})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por salón, dueña o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Lista de Salones */}
      <div className="space-y-3">
        {salonesFiltrados.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">No se encontraron salones con este filtro.</p>
          </div>
        ) : (
          salonesFiltrados.map((salon) => {
            const waLink = generarWhatsAppLink(salon);
            const admin = salon.nombre_admin || salon.owner?.nombre_persona || 'No registrado';

            return (
              <div
                key={salon.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-900/5 transition-all"
              >
                {/* Info del Salón */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">{salon.nombre}</h3>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                        salon.pasoActual === 1
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : salon.pasoActual === 2
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : salon.pasoActual === 3
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {salon.pasoNombre}
                    </span>

                    {salon.esSospechoso && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <AlertTriangle size={12} /> Número sospechoso
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                      <Clock size={12} /> Hace {salon.horasDesdeRegistro}h
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    👤 Encargada: <strong className="text-slate-800">{admin}</strong> • 📱 WhatsApp:{' '}
                    <strong className="text-slate-800">{salon.telefono_recepcionista || 'Sin número'}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      ✂️ Servicios: <strong className="text-slate-700">{salon.servicios}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      👥 Clientas: <strong className="text-slate-700">{salon.clientes}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      📅 Citas: <strong className="text-slate-700">{salon.citas}</strong>
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MessageCircle size={16} />
                      <span>Contactar por WhatsApp</span>
                    </a>
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> Sin WhatsApp
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default GodModeSeguimiento;
