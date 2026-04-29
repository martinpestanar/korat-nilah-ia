/**
 * GodMode — Onboarding: gestión global de invitaciones
 */
import React, { useState, useEffect } from 'react';
import {
  Link2, Plus, Copy, Check, Loader2, X, AlertTriangle,
  Clock, CheckCircle2, Phone, Mail, Trash2
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
    email: '',
    nombre_salon: '',
    whatsapp: '',
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
    if (!form.email.trim()) { setError('El email es obligatorio'); return; }
    setCreating(true);
    setError('');
    try {
      const token = await createOnboardingToken(form);
      setLastToken(token);
      await loadTokens();
      onReload();
      setShowModal(false);
      setForm({ email: '', nombre_salon: '', whatsapp: '', plan_inicial: 'glow_pro' });
    } catch (e: any) {
      setError(e.message || 'Error al crear el token');
    } finally {
      setCreating(false);
    }
  };

  const getLink = (token: string) =>
    `${window.location.origin}/#/onboarding?token=${token}`;

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
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Onboarding</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Links de invitación para nuevos clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo link
        </button>
      </div>

      {/* Último token creado */}
      {lastToken && (
        <div className="mx-6 mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-emerald-400 font-semibold mb-2">✅ Link creado</p>
          <p className="text-[11px] text-zinc-400 font-mono break-all mb-3">{getLink(lastToken)}</p>
          <div className="flex gap-2">
            <button
              onClick={() => copyLink(lastToken)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium"
            >
              {copied === lastToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              Copiar link
            </button>
            <button
              onClick={() => openWA(lastToken)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold"
            >
              📲 Enviar por WhatsApp
            </button>
            <button onClick={() => setLastToken('')} className="text-zinc-600 hover:text-zinc-400 px-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-zinc-600">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600 gap-2">
            <Link2 className="w-7 h-7" />
            <p className="text-sm">No hay tokens creados aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokens.map(t => {
              const expired = isExpired(t);
              const parcial = t.datos_parciales as any;
              return (
                <div
                  key={t.id}
                  className={`bg-zinc-900 border rounded-xl p-4 flex gap-3 ${
                    t.completado ? 'border-emerald-800/30' :
                    expired      ? 'border-zinc-800 opacity-50' :
                                   'border-zinc-800'
                  }`}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {t.completado ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : expired ? (
                      <Clock className="w-4 h-4 text-zinc-600" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 mx-1 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-zinc-200">
                        {parcial?.nombre_salon || t.email}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.completado ? 'bg-emerald-500/15 text-emerald-400' :
                        expired      ? 'bg-zinc-700 text-zinc-500' :
                                       'bg-amber-500/15 text-amber-400'
                      }`}>
                        {t.completado ? 'Completado' : expired ? 'Expirado' : `Paso ${t.paso_actual}/7`}
                      </span>
                      {parcial?.plan_inicial && (
                        <span className="text-[10px] text-zinc-500">
                          · {parcial.plan_inicial === 'glow_pro' ? 'Glow Pro' : parcial.plan_inicial === 'glow_elite' ? 'Glow Elite' : parcial.plan_inicial || 'Glow Pro'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.email}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      Creado: {new Date(t.created_at).toLocaleDateString('es-PE')}
                      {' · '}
                      Expira: {new Date(t.expires_at).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0 ml-auto self-start mt-0.5">
                    <button
                      onClick={() => window.open(getLink(t.token), '_blank')}
                      className="p-1.5 text-blue-500 hover:text-blue-400 rounded-lg hover:bg-zinc-800"
                      title="Editar Onboarding (Superadmin)"
                    >
                      ✏️
                    </button>
                    {!t.completado && !expired && (
                      <>
                        <button
                          onClick={() => copyLink(t.token)}
                          className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800"
                          title="Copiar link"
                        >
                          {copied === t.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openWA(t.token, parcial?.whatsapp)}
                          className="p-1.5 text-green-500 hover:text-green-400 rounded-lg hover:bg-zinc-800"
                          title="Enviar por WhatsApp"
                        >
                          📲
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(t.id, t.business_id)}
                      className="p-1.5 text-red-500/70 hover:text-red-400 rounded-lg hover:bg-zinc-800"
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

      {/* Modal crear token */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Nuevo link de onboarding</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Email del dueño *', key: 'email', type: 'email', placeholder: 'dueña@salon.com' },
                { label: 'Nombre del salón (opcional)', key: 'nombre_salon', type: 'text', placeholder: 'Nail Studio Lima' },
                { label: 'WhatsApp (con código de país)', key: 'whatsapp', type: 'tel', placeholder: '+51999000000' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-zinc-400 font-medium mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Plan inicial</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['glow_pro', '⭐', 'Glow Pro', 'S/ 249'], ['glow_elite', '🧠', 'Glow Elite', 'S/ 399']] as const).map(([p, e, label, price]) => (
                    <button
                      key={p}
                      onClick={() => setForm(prev => ({ ...prev, plan_inicial: p }))}
                      className={`py-3 rounded-xl text-xs border text-center transition-all ${
                        form.plan_inicial === p
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-base">{e} {label}</div>
                      <div className="text-zinc-500 mt-0.5">{price}/mes</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
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
