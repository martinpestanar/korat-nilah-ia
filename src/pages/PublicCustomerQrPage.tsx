import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, CheckCircle2, QrCode, Sparkles, Store, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabase';
import { getStoredPosData, RubroType, DEMO_DATA_POR_RUBRO } from '../services/posService';

export const PublicCustomerQrPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [businessName, setBusinessName] = useState('Mi Negocio Local');
  const [welcomeReward, setWelcomeReward] = useState('10% de descuento en tu primera visita');
  const [rubro, setRubro] = useState<RubroType>('gastro');
  const [businessId, setBusinessId] = useState<string>('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Intentar buscar negocio por slug en Supabase o en local data
    const fetchBusiness = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('pos_businesses')
          .select('*')
          .eq('slug', slug)
          .single();

        if (data && !error) {
          setBusinessId(data.id);
          setBusinessName(data.name);
          setWelcomeReward(data.welcome_reward || 'Descuento especial de bienvenida');
          setRubro(data.rubro as RubroType);
          return;
        }
      } catch (e) {
        console.warn('Fallback to local state:', e);
      }

      // Fallback a demo data
      const localState = getStoredPosData('gastro');
      if (localState.business.slug === slug || slug.includes('demo') || slug.includes('labamba')) {
        setBusinessId(localState.business.id);
        setBusinessName(localState.business.name);
        setWelcomeReward(localState.business.welcome_reward);
        setRubro(localState.business.rubro);
      } else {
        setBusinessName('Negocio Registrado Korat POS');
      }
    };

    fetchBusiness();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setLoading(true);

    try {
      if (businessId && !businessId.startsWith('b_demo')) {
        await supabase.from('pos_customers').insert({
          business_id: businessId,
          name,
          phone,
          birthday: birthday || null,
          status: 'active',
        });
      } else {
        // Guardar en local storage para demostración
        const local = getStoredPosData(rubro);
        const newCust = {
          id: `cust_${Date.now()}`,
          business_id: local.business.id,
          name,
          phone,
          birthday,
          total_spent: 0,
          visits_count: 1,
          last_visit_at: new Date().toISOString(),
          status: 'active' as const,
        };
        local.customers.unshift(newCust);
        localStorage.setItem(`korat_pos_express_data_v1_${rubro}`, JSON.stringify(local));
      }
    } catch (e) {
      console.warn('Customer insert:', e);
    }

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-500">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* ENCABEZADO MARCA */}
        <div className="w-16 h-16 rounded-3xl bg-amber-500 text-white font-black text-3xl flex items-center justify-center shadow-lg mb-3">
          {rubro === 'gastro' ? '🍔' : rubro === 'belleza' ? '💇‍♀️' : rubro === 'mascotas' ? '🐾' : '🛠️'}
        </div>
        <h1 className="text-lg font-black text-center text-white leading-tight">
          {businessName}
        </h1>
        <p className="text-xs text-amber-400 font-bold mt-0.5 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Club VIP de Clientes
        </p>

        {/* TARJETA DE RECOMPENSA DE BIENVENIDA */}
        <div className="w-full my-4 bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-3xl text-white shadow-xl text-center flex flex-col items-center gap-1 border border-amber-400">
          <Sparkles className="w-6 h-6 fill-white text-white animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">
            Regalo Instantáneo por Auto-Registro
          </span>
          <p className="text-sm font-black leading-snug">{welcomeReward}</p>
        </div>

        {submitted ? (
          /* PANTALLA TICKET VOUCHER CONFIRMACIÓN */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-white text-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-3 border-2 border-emerald-500"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black">¡Registro Confirmado!</h2>
            <p className="text-xs text-slate-600">
              Muestra esta pantalla al personal del local para reclamar tu beneficio hoy mismo:
            </p>
            <div className="w-full p-3 rounded-2xl bg-amber-50 border border-amber-300 font-black text-xs text-amber-950">
              🎁 {welcomeReward}
            </div>
            <p className="text-[10px] text-slate-400">Registrado como: {name} ({phone})</p>
          </motion.div>
        ) : (
          /* FORMULARIO DE REGISTRO */
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="w-full bg-white text-slate-900 rounded-3xl p-5 shadow-2xl flex flex-col gap-3"
          >
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Tu Nombre Completo:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                WhatsApp (para enviarte promociones VIP):
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: 51987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Fecha de Cumpleaños (Opcional):
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>{loading ? 'Registrando...' : 'Obtener Mi Beneficio Ahora'}</span>
            </button>
          </motion.form>
        )}

        <footer className="mt-6 text-center text-[10px] text-slate-500 font-medium">
          Powered by Korat POS Express • Sistema Móvil 100% Gratuito
        </footer>
      </div>
    </div>
  );
};

export default PublicCustomerQrPage;
