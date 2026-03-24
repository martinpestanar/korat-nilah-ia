import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import { saveStepBrief } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  negocioNombre: string;
  onComplete: () => void;
}

const PREGUNTAS = [
  {
    key: 'years_operating',
    pregunta: '¿Cuánto tiempo lleva tu salón operando?',
    opciones: [
      { label: 'Menos de 1 año', value: 0.5 },
      { label: '1 - 3 años', value: 2 },
      { label: '3 - 5 años', value: 4 },
      { label: 'Más de 5 años', value: 6 },
    ],
  },
  {
    key: 'active_clients',
    pregunta: '¿Cuántas clientas activas tienes aproximadamente?',
    opciones: [
      { label: 'Menos de 30', value: 15 },
      { label: '30 - 80', value: 55 },
      { label: '80 - 150', value: 115 },
      { label: 'Más de 150', value: 200 },
    ],
  },
  {
    key: 'avg_ticket',
    pregunta: '¿Cuál es tu ticket promedio por visita?',
    opciones: [
      { label: 'Menos de S/. 30', value: 25 },
      { label: 'S/. 30 - 70', value: 50 },
      { label: 'S/. 70 - 120', value: 95 },
      { label: 'Más de S/. 120', value: 150 },
    ],
  },
  {
    key: 'target_gender',
    pregunta: '¿A quién van dirigidos tus servicios principalmente?',
    opciones: [
      { label: '👩 Mujeres', value: 'female' },
      { label: '👨 Hombres', value: 'male' },
      { label: '👫 Mixto', value: 'mixed' },
    ],
  },
  {
    key: 'target_age',
    pregunta: '¿Qué edad tienen tus clientes en general?',
    opciones: [
      { label: '15 - 25 años', value: '15-25' },
      { label: '25 - 35 años', value: '25-35' },
      { label: '35 - 50 años', value: '35-50' },
      { label: 'Más de 50', value: '50+' },
    ],
  },
  {
    key: 'preferred_channel',
    pregunta: '¿Por dónde te contactan más tus clientes?',
    opciones: [
      { label: '📱 WhatsApp', value: 'whatsapp' },
      { label: '📸 Instagram', value: 'instagram' },
      { label: '👥 Referidos', value: 'referidos' },
      { label: '🗺️ Google Maps', value: 'google' },
    ],
  },
  {
    key: 'main_challenge',
    pregunta: '¿Cuál es tu mayor reto hoy?',
    opciones: [
      { label: '📅 Llenar mi agenda', value: 'llenar_agenda' },
      { label: '💛 Fidelizar clientas', value: 'fidelizar' },
      { label: '📱 Automatizar WhatsApp', value: 'automatizar_wa' },
      { label: '💰 Aumentar el ticket promedio', value: 'aumentar_ticket' },
    ],
  },
];

const StepBrief: React.FC<Props> = ({ businessId, tokenId, negocioNombre, onComplete }) => {
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, unknown>>({});
  const [top1, setTop1] = useState('');
  const [top2, setTop2] = useState('');
  const [premium, setPremium] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalPreguntas = PREGUNTAS.length + 2; // +2 para los text inputs de servicios
  const enTextos = preguntaActual >= PREGUNTAS.length;

  const seleccionarOpcion = (value: unknown) => {
    const key = PREGUNTAS[preguntaActual].key;
    setRespuestas((r) => ({ ...r, [key]: value }));
    setTimeout(() => setPreguntaActual((p) => p + 1), 300);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const brief = {
        ...respuestas,
        business_name: negocioNombre,
        top_service_1: top1,
        top_service_2: top2,
        premium_service: premium,
        business_type: 'salon',
      };
      await saveStepBrief(businessId, brief, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando.');
    } finally {
      setLoading(false);
    }
  };

  const progreso = Math.round((preguntaActual / totalPreguntas) * 100);

  return (
    <div className="ob-step">
      <div className="ob-step-icon">📊</div>
      <h2 className="ob-step-title">Cuéntanos más sobre {negocioNombre}</h2>
      <p className="ob-step-subtitle">Solo unas preguntas rápidas para que Nilah te conozca mejor.</p>

      {/* Mini progreso interno */}
      <div className="ob-brief-progress">
        <div className="ob-brief-bar" style={{ width: `${progreso}%` }} />
      </div>
      <p className="ob-brief-counter">{Math.min(preguntaActual + 1, totalPreguntas)} de {totalPreguntas}</p>

      {/* Preguntas de selección */}
      {!enTextos && (
        <div className="ob-brief-question" key={preguntaActual}>
          <h3 className="ob-brief-q">{PREGUNTAS[preguntaActual].pregunta}</h3>
          <div className="ob-brief-options">
            {PREGUNTAS[preguntaActual].opciones.map((op) => (
              <button
                key={String(op.value)}
                type="button"
                className={`ob-brief-btn ${respuestas[PREGUNTAS[preguntaActual].key] === op.value ? 'ob-brief-btn--selected' : ''}`}
                onClick={() => seleccionarOpcion(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
          {preguntaActual > 0 && (
            <button type="button" className="ob-back-link" onClick={() => setPreguntaActual((p) => p - 1)}>
              ← Volver
            </button>
          )}
        </div>
      )}

      {/* Preguntas de texto */}
      {enTextos && (
        <div className="ob-brief-text-section">
          <div className="ob-field">
            <label className="ob-label">¿Cuál es tu servicio más pedido?</label>
            <input
              className="ob-input"
              type="text"
              placeholder="Ej: Esmaltado en gel"
              value={top1}
              onChange={(e) => setTop1(e.target.value)}
            />
          </div>
          <div className="ob-field">
            <label className="ob-label">¿Y el segundo más pedido? <span className="ob-label-optional">(opcional)</span></label>
            <input
              className="ob-input"
              type="text"
              placeholder="Ej: Manicure tradicional"
              value={top2}
              onChange={(e) => setTop2(e.target.value)}
            />
          </div>
          <div className="ob-field">
            <label className="ob-label">¿Y tu servicio más premium o de mayor precio?</label>
            <input
              className="ob-input"
              type="text"
              placeholder="Ej: Uñas acrílicas con diseño, Facial lifting"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
            />
          </div>

          {error && <p className="ob-error">{error}</p>}

          <button
            type="button"
            className="ob-btn-primary ob-btn-primary--large"
            onClick={handleSubmit}
            disabled={loading || !top1 || !premium}
          >
            {loading ? <span className="ob-spinner" /> : '🚀 Generar mi Salón'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StepBrief;
