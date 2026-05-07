import React from 'react';

interface Props {
  negocioNombre: string;
  onGoToDashboard: () => void;
}

const StepFinal: React.FC<Props> = ({ negocioNombre, onGoToDashboard }) => {
  return (
    <div className="ob-step ob-step--final">
      <div className="ob-final-confetti">🎊</div>
      <div className="ob-final-icon">🚀</div>
      <h2 className="ob-final-title">¡{negocioNombre} ya está listo!</h2>
      <p className="ob-final-subtitle">
        Tu sistema de gestión inteligente está configurado. Nilah ya conoce tu negocio.
      </p>

      <div className="ob-final-next">
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>Cuenta creada</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>Información del negocio</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>Equipo y servicios configurados</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>Personalidad de Nilah definida</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>WhatsApp vinculado — Nilah ya está activa 🚀</span>
        </div>
      </div>

      <div className="ob-final-notice">
        <p>
          Tu asistente <strong>Nilah</strong> ya está respondiendo en tu WhatsApp.
          Visita tu Dashboard para ver los mensajes entrantes, citas y más.
        </p>
      </div>

      <button
        type="button"
        className="ob-btn-primary ob-btn-primary--large ob-btn-primary--glow"
        onClick={onGoToDashboard}
      >
        Iniciar sesión en mi Dashboard →
      </button>
    </div>
  );
};

export default StepFinal;
