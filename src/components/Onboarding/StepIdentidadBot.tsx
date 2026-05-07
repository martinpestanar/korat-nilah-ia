import React, { useState, useEffect } from 'react';
import { saveStepIdentidadBot } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: () => void;
  onBack?: () => void;
}

// ── Opciones de personalidad (identidad_base) ──
const PERSONALIDADES = [
  {
    id: 'chica_experta',
    emoji: '💅',
    label: 'La Asesora Chic',
    desc: 'Amigable, tutea, entusiasta. Como tu BFF que sabe todo de belleza.',
  },
  {
    id: 'profesional_elegante',
    emoji: '💎',
    label: 'La Experta Premium',
    desc: 'Sofisticada, formal-cálida. Inspira confianza y exclusividad.',
  },
  {
    id: 'hermano_barbero',
    emoji: '✂️',
    label: 'El Compañero Barbero',
    desc: 'Casual y con actitud cool. Perfecto para barberías.',
  },
  {
    id: 'mama_consejera',
    emoji: '🤍',
    label: 'La Consejera Cálida',
    desc: 'Materna, contenedora, muy paciente. Ideal para spas.',
  },
  {
    id: 'tech_trendy',
    emoji: '🚀',
    label: 'La Techie Trendy',
    desc: 'Moderna, rápida, usa emojis actuales. Para audiencia joven.',
  },
];

// ── Opciones de trato ──
const TRATOS = [
  { id: 'trato_reina', emoji: '👑', label: 'Reinas y Campeones', desc: 'Mujer: mi reina · Hombre: crack' },
  { id: 'trato_amigos', emoji: '🤗', label: 'Amigos de confianza', desc: 'Mujer: amor · Hombre: bro' },
  { id: 'trato_formal_calidez', emoji: '🤝', label: 'Formal pero cercano', desc: 'Señorita / Caballero' },
  { id: 'trato_nombre_siempre', emoji: '📛', label: 'Siempre por nombre', desc: 'Sin importar género' },
];

// ── Opciones de estilo visual (emojis) ──
const ESTILOS = [
  { id: 'visual_fem_vibrante', emoji: '💖', label: 'Femenino Vibrante', desc: 'Muchos emojis, expresivo y vivo' },
  { id: 'visual_elegante', emoji: '✨', label: 'Elegante y Sobrio', desc: 'Muy pocos emojis, sofisticado' },
  { id: 'visual_barberia', emoji: '🔥', label: 'Barbería Urbana', desc: 'Emojis con actitud, moderado' },
  { id: 'visual_spa', emoji: '🌿', label: 'Spa & Zen', desc: 'Solo emojis de calma y naturaleza' },
  { id: 'visual_gen_z', emoji: '💫', label: 'Moderno Gen Z', desc: 'Alta densidad, energía y espontaneidad' },
  { id: 'visual_sin_emojis', emoji: '📋', label: 'Sin emojis', desc: 'Solo texto limpio, máxima formalidad' },
];

import { supabase } from '../../services/supabase';

type SubPaso = 'nombre' | 'personalidad' | 'trato' | 'estilo' | 'guardando';

const StepIdentidadBot: React.FC<Props> = ({ businessId, tokenId, onComplete, onBack }) => {
  const [subPaso, setSubPaso] = useState<SubPaso>('nombre');
  const [nombreBot, setNombreBot] = useState('');
  const [personalidad, setPersonalidad] = useState('');
  const [trato, setTrato] = useState('');
  const [estilo, setEstilo] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (businessId) {
      setFetching(true);
      supabase.from('negocios').select('marca_identidad').eq('id', businessId).single()
        .then(({ data }) => {
          if (data && data.marca_identidad) {
            const mi = data.marca_identidad as any;
            if (mi.respuestas_onboarding) {
              setNombreBot(mi.respuestas_onboarding.nombre_bot || '');
              setPersonalidad(mi.respuestas_onboarding.identidad_base || '');
              setTrato(mi.respuestas_onboarding.trato_personalizado || '');
              setEstilo(mi.respuestas_onboarding.estilo_visual || '');
            } else if (mi.adn_json) {
              setNombreBot(mi.adn_json.nombre_bot || '');
            }
          }
          setFetching(false);
        });
    }
  }, [businessId]);

  // Progreso visual dentro del paso
  const SUB_PASOS: SubPaso[] = ['nombre', 'personalidad', 'trato', 'estilo'];
  const subIndex = SUB_PASOS.indexOf(subPaso as SubPaso);
  const progreso = subPaso === 'guardando' ? 100 : Math.round(((subIndex + 1) / 4) * 100);

  // ── Guardar en Supabase ──
  const handleGuardar = async () => {
    setSubPaso('guardando');
    setLoading(true);
    setError('');
    try {
      // Mapeo detallado de trato
      let mujer = '[nombre]', hombre = '[nombre]';
      if (trato === 'trato_reina') { mujer = 'mi reina'; hombre = 'crack'; }
      else if (trato === 'trato_amigos') { mujer = 'amor'; hombre = 'bro'; }
      else if (trato === 'trato_formal_calidez') { mujer = 'señorita'; hombre = 'caballero'; }

      // Mapeo de emojis
      let firma = '', densidad = 'media', instruccion = 'Usar 1-2 emojis por mensaje.';
      if (estilo === 'visual_fem_vibrante') {
        firma = '💖✨💅🌸😏👀😌🥹😉'; densidad = 'alta'; instruccion = 'Usar 2-4 emojis por mensaje, preferir en saludos y cierres.';
      } else if (estilo === 'visual_elegante') {
        firma = '✨💎🤍'; densidad = 'baja'; instruccion = 'Usar 1 emoji ocasional, estilo muy sobrio.';
      } else if (estilo === 'visual_barberia') {
        firma = '🔥✂️💪😎'; densidad = 'media'; instruccion = 'Usar emojis con actitud (fuego, fuerza, tijeras).';
      } else if (estilo === 'visual_spa') {
        firma = '🌿💆‍♀️🌸🫧'; densidad = 'media'; instruccion = 'Usar emojis de relajación y naturaleza.';
      } else if (estilo === 'visual_gen_z') {
        firma = '💫✨💅🔥😭💀'; densidad = 'alta'; instruccion = 'Alta energía, emojis trendy de Gen Z.';
      } else if (estilo === 'visual_sin_emojis') {
        firma = ''; densidad = 'nula'; instruccion = 'Bajo ninguna circunstancia utilizar emojis.';
      }

      const respuestas = {
        adn_json: {
          nombre_bot: nombreBot.trim() || 'Nilah',
          trato: { mujer, hombre, neutro: '[nombre]' },
          emojis: { firma, densidad, instruccion },
          vocabulario: {
            nunca_usar: ["bot", "IA", "sistema", "automático", "menú", "opción 1", "estimado/a", "usuario/a"],
            siempre_usar: personalidad === 'chica_experta' ? ["súper", "linda"] : personalidad === 'hermano_barbero' ? ["pana", "listo"] : []
          }
        },
        respuestas_onboarding: {
          nombre_bot: nombreBot.trim() || 'Nilah',
          identidad_base: personalidad,
          trato_personalizado: trato,
          estilo_visual: estilo,
        }
      };

      await saveStepIdentidadBot(businessId, respuestas as any, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando la identidad.');
      setSubPaso('estilo');
    } finally {
      setLoading(false);
    }
  };

  const OptionCard: React.FC<{
    emoji: string;
    label: string;
    desc: string;
    selected: boolean;
    onClick: () => void;
  }> = ({ emoji, label, desc, selected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`ob-identity-card ${selected ? 'ob-identity-card--selected' : ''}`}
    >
      <span className="ob-identity-card-emoji">{emoji}</span>
      <div className="ob-identity-card-text">
        <p className="ob-identity-card-label">{label}</p>
        <p className="ob-identity-card-desc">{desc}</p>
      </div>
      {selected && <span className="ob-identity-card-check">✓</span>}
    </button>
  );

  if (fetching) {
    return (
      <div className="ob-step flex flex-col items-center justify-center min-h-[50vh]">
        <div className="ob-page-spinner" />
        <p className="text-zinc-500 mt-4 text-sm font-medium">Recuperando personalidad del bot...</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      {/* Ícono y título */}
      <div className="ob-step-icon">🤖</div>
      <h2 className="ob-step-title">Dale personalidad a tu asistente</h2>
      <p className="ob-step-subtitle">
        4 preguntas rápidas para que tu bot tenga la voz perfecta de tu marca.
        <br />
        <span className="ob-step-note">Podrás personalizarlo más a fondo en Configuración → Nilah IA ✨</span>
      </p>

      {/* Mini barra de progreso interna */}
      <div className="ob-brief-progress">
        <div className="ob-brief-bar" style={{ width: `${progreso}%` }} />
      </div>

      {/* ── SUB-PASO 1: Nombre del bot ── */}
      {subPaso === 'nombre' && (
        <div className="ob-identity-subpaso" key="nombre">
          <h3 className="ob-brief-q">¿Cómo se llamará tu asistente de WhatsApp?</h3>
          <p className="ob-identity-hint">💡 Elige un nombre cercano a tu marca. Ej: Luna, Sofia, Max...</p>
          <input
            className="ob-input ob-input--lg"
            type="text"
            placeholder="Ej: Luna, Aria, Nova..."
            maxLength={30}
            value={nombreBot}
            onChange={(e) => setNombreBot(e.target.value)}
            autoFocus
          />
          <div className="ob-nav-buttons" style={{flexDirection:'column', alignItems:'stretch'}}>
            <button
              type="button"
              className="ob-btn-primary ob-btn-primary--large"
              onClick={() => setSubPaso('personalidad')}
              disabled={!nombreBot.trim()}
            >
              Continuar →
            </button>
            {onBack && (
              <button type="button" className="ob-btn-back" style={{marginTop:8}} onClick={onBack}>
                ← Atrás
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SUB-PASO 2: Personalidad ── */}
      {subPaso === 'personalidad' && (
        <div className="ob-identity-subpaso" key="personalidad">
          <h3 className="ob-brief-q">¿Cuál es el estilo de {nombreBot || 'tu bot'}?</h3>
          <div className="ob-identity-cards">
            {PERSONALIDADES.map((p) => (
              <OptionCard
                key={p.id}
                emoji={p.emoji}
                label={p.label}
                desc={p.desc}
                selected={personalidad === p.id}
                onClick={() => {
                  setPersonalidad(p.id);
                  setTimeout(() => setSubPaso('trato'), 300);
                }}
              />
            ))}
          </div>
          <button type="button" className="ob-back-link" onClick={() => setSubPaso('nombre')}>
            ← Volver
          </button>
        </div>
      )}

      {/* ── SUB-PASO 3: Trato con clientes ── */}
      {subPaso === 'trato' && (
        <div className="ob-identity-subpaso" key="trato">
          <h3 className="ob-brief-q">¿Cómo llama {nombreBot || 'tu bot'} a tus clientes?</h3>
          <div className="ob-identity-cards">
            {TRATOS.map((t) => (
              <OptionCard
                key={t.id}
                emoji={t.emoji}
                label={t.label}
                desc={t.desc}
                selected={trato === t.id}
                onClick={() => {
                  setTrato(t.id);
                  setTimeout(() => setSubPaso('estilo'), 300);
                }}
              />
            ))}
          </div>
          <button type="button" className="ob-back-link" onClick={() => setSubPaso('personalidad')}>
            ← Volver
          </button>
        </div>
      )}

      {/* ── SUB-PASO 4: Estilo de emojis ── */}
      {subPaso === 'estilo' && (
        <div className="ob-identity-subpaso" key="estilo">
          <h3 className="ob-brief-q">¿Qué estilo visual tendrán sus mensajes?</h3>
          <div className="ob-identity-cards ob-identity-cards--3col">
            {ESTILOS.map((e) => (
              <OptionCard
                key={e.id}
                emoji={e.emoji}
                label={e.label}
                desc={e.desc}
                selected={estilo === e.id}
                onClick={() => setEstilo(e.id)}
              />
            ))}
          </div>
          {error && <p className="ob-error">{error}</p>}
          <button
            type="button"
            className="ob-btn-primary ob-btn-primary--large"
            onClick={handleGuardar}
            disabled={!estilo || loading}
          >
            {loading ? <span className="ob-spinner" /> : '✨ Guardar personalidad'}
          </button>
          <button type="button" className="ob-back-link" onClick={() => setSubPaso('trato')}>
            ← Volver
          </button>
        </div>
      )}

      {/* ── GUARDANDO ── */}
      {subPaso === 'guardando' && (
        <div className="ob-identity-saving">
          <div className="ob-identity-saving-icon">🤖</div>
          <p className="ob-identity-saving-text">Configurando a {nombreBot || 'tu asistente'}...</p>
          <div className="ob-page-spinner" />
        </div>
      )}
    </div>
  );
};

export default StepIdentidadBot;
