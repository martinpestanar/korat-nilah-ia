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
          <span>Equipo configurado</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--done">✓</span>
          <span>Servicios registrados</span>
        </div>
        <div className="ob-final-step-item">
          <span className="ob-final-step-dot ob-final-step-dot--pending">⏳</span>
          <span>Activación de Nilah — en menos de 24h</span>
        </div>
      </div>

      <div className="ob-final-notice">
        <p>
          Nuestro equipo te contactará en las próximas <strong>24 horas</strong> para activar tu chatbot y hacer
          la sesión de configuración inicial contigo. 😊
        </p>
      </div>

      <button
        type="button"
        className="ob-btn-primary ob-btn-primary--large ob-btn-primary--glow"
        onClick={onGoToDashboard}
      >
        Ir a mi Dashboard →
      </button>
    </div>
  );
};

export default StepFinal;
