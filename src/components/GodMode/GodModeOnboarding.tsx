/**
 * GodMode — Onboarding: gestión global de invitaciones (Clean Light Emerald Edition)
 */
import React, { useState, useEffect } from 'react';
import {
  Link2, Plus, Copy, Check, Loader2, X, AlertTriangle,
  Clock, CheckCircle2, Phone, Mail, Trash2, ArrowRight
} from 'lucide-react';
import { createOnboardingToken, fetchOnboardingTokens, deleteOnboardingData } from '../../services/godmode';
import type { OnboardingTokenAdmin, PlanBase } from '../../types/godmode';

interface Props {
  onReload: () => void;
}

const GodModeOnboarding: React.FC<Props> = ({ onReload }) => {
  const [tokens, setTokens] = useState<OnboardingTokenAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    plan_inicial: 'glow_pro' as PlanBase,
  });
  const [lastToken, setLastToken] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadTokens(); }, []);

  const loadTokens = async () => {
    setLoading(true);
    const data = await fetchOnboardingTokens();
    setTokens(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const token = await createOnboardingToken(form);
      setLastToken(token);
      await loadTokens();
      onReload();
      setShowModal(false);
      setForm({ plan_inicial: 'glow_pro' });
    } catch (e: any) {
      setError(e.message || 'Error al crear el token');
    } finally {
      setCreating(false);
    }
  };

  const getLink = (token: string) =>
    `${window.location.origin}/onboarding?token=${token}`;

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getLink(token));
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const openWA = (token: string, whatsapp?: string) => {
    const url = getLink(token);
    const msg = encodeURIComponent(
      `Hola 👋 Aquí tienes tu link para configurar tu sistema Korat Flow:\n\n${url}\n\n⏰ Expira en 7 días`
    );
    const phone = whatsapp?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleDelete = async (tokenId: string, businessId: string | null) => {
    if (!window.confirm("¿Seguro que quieres borrar este onboarding? Si ya había un negocio creado, también se intentará borrar toda su info (clientes, servicios, etc) de la base de datos.")) return;
    try {
      setLoading(true);
      await deleteOnboardingData(tokenId, businessId);
      await loadTokens();
      onReload();
    } catch (e: any) {
      alert(e.message || 'Hubo un error al borrar los datos.');
      setLoading(false);
    }
  };

  const isExpired = (t: OnboardingTokenAdmin) =>
    new Date(t.expires_at) < new Date();

  return (
    <div className="h-full flex flex-col font-sans text-slate-900">
      <div className="p-4 sm:p-6 pb-4 border-b border-emerald-100 bg-white/70 backdrop-blur-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Onboarding de Salones</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Links de invitación y setup para nuevos clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo link</span>
        </button>
      </div>

      {/* Último token creado */}
      {lastToken && (
        <div className="mx-4 sm:mx-6 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-emerald-800 font-black mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Link de Onboarding Generado
          </p>
          <p className="text-xs text-slate-700 font-mono break-all mb-3 bg-white p-2.5 rounded-xl border border-emerald-100">{getLink(lastToken)}</p>
          <div className="flex gap-2">
            <button
              onClick={() => copyLink(lastToken)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              {copied === lastToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === lastToken ? '¡Copiado!' : 'Copiar link'}
            </button>
            <button
              onClick={() => openWA(lastToken)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all"
            >
              📲 Enviar por WhatsApp
            </button>
            <button onClick={() => setLastToken('')} className="text-slate-400 hover:text-slate-600 px-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-emerald-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2 bg-white rounded-2xl border border-slate-200 p-8">
            <Link2 className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-500">No hay tokens de invitación creados aún</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tokens.map(t => {
              const expired = isExpired(t);
              const parcial = t.datos_parciales as any;
              return (
                <div
                  key={t.id}
                  className={`bg-white border rounded-2xl p-4 flex gap-3 shadow-2xs transition-all ${
                    t.completado ? 'border-emerald-300 bg-emerald-50/20' :
                    expired      ? 'border-slate-200 opacity-60' :
                                   'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {t.completado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : expired ? (
                      <Clock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 mx-1 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-black text-slate-900">
                        {parcial?.nombre_salon || t.email || 'Invitación Pendiente'}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        t.completado ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        expired      ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                       'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {t.completado ? 'Completado' : expired ? 'Expirado' : `Paso ${t.paso_actual}/7`}
                      </span>
                      {parcial?.plan_inicial && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          · {parcial.plan_inicial === 'glow_pro' ? 'Glow Pro' : parcial.plan_inicial === 'glow_elite' ? 'Glow Elite' : parcial.plan_inicial || 'Glow Pro'}
                        </span>
                      )}
                    </div>
                    {t.email && <p className="text-xs text-slate-600 mt-0.5 font-medium">{t.email}</p>}
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Creado: {new Date(t.created_at).toLocaleDateString('es-PE')}
                      {' · '}
                      Expira: {new Date(t.expires_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-auto self-start mt-0.5">
                    <button
                      onClick={() => window.open(getLink(t.token), '_blank')}
                      className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                      title="Editar Onboarding (Superadmin)"
                    >
                      ✏️
                    </button>
                    {!t.completado && !expired && (
                      <>
                        <button
                          onClick={() => copyLink(t.token)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                          title="Copiar link"
                        >
                          {copied === t.token ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openWA(t.token, parcial?.whatsapp)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50"
                          title="Enviar por WhatsApp"
                        >
                          📲
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(t.id, t.business_id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                      title="Borrar token y datos asociados"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal crear token (Light Mode) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Nuevo link de onboarding</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-800 font-bold mb-1.5 block">Plan inicial asignado</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['glow_pro', '⭐', 'Glow Pro', 'S/ 249'], ['glow_elite', '💎', 'Glow Elite', 'S/ 399']] as const).map(([p, e, label, price]) => (
                    <button
                      key={p}
                      onClick={() => setForm(prev => ({ ...prev, plan_inicial: p }))}
                      className={`py-3 px-3 rounded-2xl text-xs border text-center transition-all cursor-pointer ${
                        form.plan_inicial === p
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">{e} {label}</div>
                      <div className="text-slate-500 font-medium mt-0.5">{price}/mes</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {creating ? 'Creando...' : 'Crear link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeOnboarding;
