import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getOnboardingToken, OnboardingToken } from '../services/onboarding';
import ProgressBar from '../components/Onboarding/ProgressBar';
import StepAccount from '../components/Onboarding/StepAccount';
import StepNegocio from '../components/Onboarding/StepNegocio';
import StepEquipo from '../components/Onboarding/StepEquipo';
import StepServicios from '../components/Onboarding/StepServicios';
import StepExtras from '../components/Onboarding/StepExtras';
import StepFidelizacion from '../components/Onboarding/StepFidelizacion';
import StepIdentidadBot from '../components/Onboarding/StepIdentidadBot';
import StepBrief from '../components/Onboarding/StepBrief';
import StepFinal from '../components/Onboarding/StepFinal';
import '../styles/onboarding.css';

const STEP_LABELS = [
  'Crear cuenta',
  'Tu negocio',
  'Tu equipo',
  'Servicios',
  'Adicionales',
  'Fidelización',
  'Tu bot ✨',
  'Conocerte',
  '¡Listo!',
];

const TOTAL_STEPS = 8; // la pantalla final no cuenta como paso

const Onboarding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [tokenData, setTokenData] = useState<OnboardingToken | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState('');
  const [negocioNombre, setNegocioNombre] = useState('');
  const [diasNegocio, setDiasNegocio] = useState<string[]>(['lunes','martes','miércoles','jueves','viernes','sábado']);
  const [categoriasServicio, setCategoriasServicio] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('Link inválido. Por favor contacta al soporte.');
      setLoading(false);
      return;
    }
    getOnboardingToken(token).then((data) => {
      if (!data) {
        setTokenError('Este link ha expirado o ya fue utilizado. Contacta a nuestro equipo.');
      } else {
        setTokenData(data);
        setStep(data.paso_actual);
        if (data.business_id) setBusinessId(data.business_id);
      }
      setLoading(false);
    });
  }, [token]);

  const nextStep = () => setStep((s) => s + 1);

  const handleAccountComplete = (bId: string) => {
    setBusinessId(bId);
    nextStep();
  };

  const handleNegocioComplete = () => nextStep();

  const handleEquipoComplete = () => nextStep();

  const handleServiciosComplete = (categorias: string[]) => {
    setCategoriasServicio(categorias);
    nextStep();
  };

  const handleExtrasComplete = () => nextStep();

  const handleFidelizacionComplete = () => nextStep();

  const handleIdentidadBotComplete = () => nextStep();

  const handleBriefComplete = () => {
    setCompleted(true);
    setStep(9);
  };

  const handleGoToDashboard = () => navigate('/nilah/login');

  if (loading) {
    return (
      <div className="ob-page ob-page--loading">
        <div className="ob-page-spinner" />
        <p>Cargando tu invitación...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="ob-page ob-page--error">
        <div className="ob-error-icon">⚠️</div>
        <h2>Link inválido</h2>
        <p>{tokenError}</p>
        <a href="https://wa.me/51999000000" className="ob-btn-primary" target="_blank" rel="noopener noreferrer">
          Contactar soporte
        </a>
      </div>
    );
  }

  return (
    <div className="ob-page">
      {/* Header */}
      <header className="ob-header">
        <div className="ob-logo">
          <span className="ob-logo-icon">🌿</span>
          <span className="ob-logo-name">Korat Flow</span>
        </div>
        {step < 8 && (
          <ProgressBar
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
          />
        )}
      </header>

      {/* Contenido principal */}
      <main className="ob-main">
        <div className="ob-container">
          {step === 1 && (
            <StepAccount
              tokenId={tokenData?.id || ''}
              onComplete={(bId) => {
                handleAccountComplete(bId);
                setNegocioNombre('');
              }}
            />
          )}
          {step === 2 && (
            <StepNegocio
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              negocioNombre={negocioNombre}
              onComplete={handleNegocioComplete}
            />
          )}
          {step === 3 && (
            <StepEquipo
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              diasNegocio={diasNegocio}
              onComplete={handleEquipoComplete}
            />
          )}
          {step === 4 && (
            <StepServicios
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleServiciosComplete}
            />
          )}
          {step === 5 && (
            <StepExtras
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleExtrasComplete}
            />
          )}
          {step === 6 && (
            <StepFidelizacion
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              categoriasServicio={categoriasServicio}
              onComplete={handleFidelizacionComplete}
            />
          )}
          {step === 7 && (
            <StepIdentidadBot
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleIdentidadBotComplete}
            />
          )}
          {step === 8 && (
            <StepBrief
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              negocioNombre={negocioNombre}
              onComplete={handleBriefComplete}
            />
          )}
          {step === 9 && (
            <StepFinal
              negocioNombre={negocioNombre}
              onGoToDashboard={handleGoToDashboard}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="ob-footer">
        <p>Korat Flow · Powered by Nilah IA · <a href="mailto:soporte@koratflow.agency">soporte@koratflow.agency</a></p>
      </footer>
    </div>
  );
};

export default Onboarding;
