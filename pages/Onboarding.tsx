import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getOnboardingToken, fetchOnboardingHydrationData, OnboardingToken, CategoriaServicio } from '../services/onboarding';
import { supabase } from '../services/supabase';
import { NegocioInitialData } from '../components/Onboarding/StepNegocio';
import ProgressBar from '../components/Onboarding/ProgressBar';
import { KoratLogo } from '../components/UI/KoratLogo';
import StepAccount from '../components/Onboarding/StepAccount';
import StepNegocio from '../components/Onboarding/StepNegocio';
import StepCategorias from '../components/Onboarding/StepCategorias';
import StepEquipo from '../components/Onboarding/StepEquipo';
import StepServicios from '../components/Onboarding/StepServicios';
import StepExtras from '../components/Onboarding/StepExtras';
import StepRetoques from '../components/Onboarding/StepRetoques';
import StepFidelizacion from '../components/Onboarding/StepFidelizacion';
import StepRescate from '../components/Onboarding/StepRescate';
import StepIdentidadBot from '../components/Onboarding/StepIdentidadBot';
import StepBrief from '../components/Onboarding/StepBrief';
import StepWhatsApp from '../components/Onboarding/StepWhatsApp';
import StepFinal from '../components/Onboarding/StepFinal';
import '../styles/onboarding.css';

const STEP_LABELS = [
  'Crear cuenta',   // 1
  'Tu negocio',     // 2
  'Categorías',     // 3
  'Tu equipo',      // 4
  'Servicios',      // 5
  'Adicionales',    // 6
  'Retoques',       // 7
  'Fidelización',   // 8
  'Rescate',        // 9
  'Tu bot ✨',      // 10
  'Conocerte',      // 11
  'WhatsApp 📱',   // 12
  '¡Listo!',        // 13
];

const TOTAL_STEPS = 12; // la pantalla final (13) no cuenta como paso

const Onboarding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [tokenData, setTokenData] = useState<OnboardingToken | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState('');
  const [negocioNombre, setNegocioNombre] = useState('');
  const [moneda, setMoneda] = useState('S/.');
  const [diasNegocio, setDiasNegocio] = useState<string[]>(['lunes','martes','miércoles','jueves','viernes','sábado']);
  // Categorías de servicio creadas en paso 3 → se pasan a paso 4 y 5
  const [categoriasServicio, setCategoriasServicio] = useState<CategoriaServicio[]>([]);
  // Datos guardados de pasos anteriores para pre-llenar al volver
  const [negocioData, setNegocioData] = useState<NegocioInitialData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Modal de bienvenida / continuar
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [maxStepUnlocked, setMaxStepUnlocked] = useState(1);

  useEffect(() => {
    if (!token) {
      setTokenError('Link inválido. Por favor contacta al soporte.');
      setLoading(false);
      return;
    }
    getOnboardingToken(token).then(async (data) => {
      if (!data) {
        setTokenError('Este link ha expirado o ya fue utilizado. Contacta a nuestro equipo.');
      } else {
        setTokenData(data);
        setMaxStepUnlocked(data.paso_actual);

        if (data.business_id) {
          setBusinessId(data.business_id);
          // Si ya avanzó del paso 1, preguntamos si continuar o empezar de 0
          if (data.paso_actual > 2) {
            setShowWelcomeBack(true);
          } else {
            setStep(data.paso_actual);
          }

          if (data.paso_actual > 1) {
             const hyData = await fetchOnboardingHydrationData(data.business_id);
             setNegocioNombre(hyData.negocioNombre);
             setMoneda(hyData.moneda);
             setDiasNegocio(hyData.diasTrabajo);
             setCategoriasServicio(hyData.categorias);
          }
        }
      }
      setLoading(false);
    });
  }, [token]);

  const nextStep = () => {
    const newStep = step + 1;
    setStep(newStep);
    if (newStep > maxStepUnlocked) {
      setMaxStepUnlocked(newStep);
    }
  };
  const prevStep = () => setStep((s) => Math.max(1, s - 1));
  const goToStep = (s: number) => {
    if (s <= maxStepUnlocked) {
      setStep(s);
    }
  };

  const handleAccountComplete = (bId: string, name: string) => {
    setBusinessId(bId);
    setNegocioNombre(name);
    nextStep();
  };

  const handleNegocioComplete = (data: NegocioInitialData) => {
    setNegocioData(data);
    if (data.diasTrabajo) setDiasNegocio(data.diasTrabajo);
    if (data.moneda) setMoneda(data.moneda);
    nextStep();
  };

  const handleCategoriasComplete = (categorias: CategoriaServicio[]) => {
    setCategoriasServicio(categorias);
    nextStep();
  };

  const handleEquipoComplete = () => nextStep();
  const handleServiciosComplete = () => nextStep();
  const handleExtrasComplete = () => nextStep();
  const handleRetoquesComplete = () => nextStep();
  const handleFidelizacionComplete = () => nextStep();
  const handleRescateComplete = () => nextStep();
  const handleIdentidadBotComplete = () => nextStep();
  const handleBriefComplete = () => setStep(12);
  const handleWhatsAppComplete = () => setStep(13);
  const handleWhatsAppSkip = () => setStep(13);
  const handleGoToDashboard = async () => {
    // Leer el email de la sesión de Supabase Auth para pre-llenar el login
    let emailParam = '';
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) emailParam = encodeURIComponent(authUser.email);
    } catch {
      // Si falla, igual redirigimos al login
    }
    const url = emailParam
      ? `/nilah/login?welcome=1&email=${emailParam}`
      : '/nilah/login?welcome=1';
    navigate(url);
  };

  if (loading) {
    return (
      <div className="ob-page ob-page--loading">
        <div className="ob-page-spinner" />
        <p>Un segundo, preparando tu espacio en Nilah ✨</p>
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
      <header className="py-6 px-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0A0A0A] sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto mb-4">
          <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-500/20">
                <KoratLogo size={20} color="#0D9488" animated />
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">Korat Flow</span>
            </div>
        </div>
        
        {step < 12 && (
          <ProgressBar
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
            maxStepUnlocked={maxStepUnlocked}
            onStepClick={goToStep}
          />
        )}
      </header>

      {/* Contenido principal */}
      <main className="ob-main relative">
        {showWelcomeBack && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#141414] rounded-3xl p-8 max-w-md w-full border border-gray-100 dark:border-white/5 shadow-2xl animate-fade-in-up text-center">
              <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Bienvenido de vuelta!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Tienes un progreso guardado hasta el paso <strong>{STEP_LABELS[maxStepUnlocked - 1]}</strong>. ¿Deseas continuar desde donde te quedaste o prefieres revisar la información desde el inicio?
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setStep(maxStepUnlocked);
                    setShowWelcomeBack(false);
                  }}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  Continuar en el paso {maxStepUnlocked}
                </button>
                <button
                  onClick={() => {
                    setStep(2);
                    setShowWelcomeBack(false);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl transition-colors"
                >
                  Revisar desde el inicio
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="ob-container">
          {step === 1 && (
            <StepAccount
              tokenId={tokenData?.id || ''}
              onComplete={handleAccountComplete}
            />
          )}
          {step === 2 && (
            <StepNegocio
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              negocioNombre={negocioNombre}
              initialData={negocioData}
              onComplete={handleNegocioComplete}
              onBack={prevStep}
            />
          )}
          {step === 3 && (
            <StepCategorias
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              initialData={categoriasServicio.length > 0 ? categoriasServicio : undefined}
              onComplete={handleCategoriasComplete}
              onBack={prevStep}
            />
          )}
          {step === 4 && (
            <StepEquipo
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              diasNegocio={diasNegocio}
              categoriasServicio={categoriasServicio}
              onComplete={handleEquipoComplete}
              onBack={prevStep}
            />
          )}
          {step === 5 && (
            <StepServicios
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              categoriasServicio={categoriasServicio}
              moneda={moneda}
              onComplete={handleServiciosComplete}
              onBack={prevStep}
            />
          )}
          {step === 6 && (
            <StepExtras
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              moneda={moneda}
              onComplete={handleExtrasComplete}
              onBack={prevStep}
            />
          )}
          {step === 7 && (
            <StepRetoques
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleRetoquesComplete}
              onBack={prevStep}
            />
          )}
          {step === 8 && (
            <StepFidelizacion
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              categoriasServicio={categoriasServicio.map((c) => c.nombre)}
              onComplete={handleFidelizacionComplete}
              onBack={prevStep}
            />
          )}
          {step === 9 && (
            <StepRescate
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              moneda={moneda}
              onComplete={handleRescateComplete}
              onBack={prevStep}
            />
          )}
          {step === 10 && (
            <StepIdentidadBot
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleIdentidadBotComplete}
              onBack={prevStep}
            />
          )}
          {step === 11 && (
            <StepBrief
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              negocioNombre={negocioNombre}
              onComplete={handleBriefComplete}
              onBack={prevStep}
            />
          )}
          {step === 12 && (
            <StepWhatsApp
              businessId={businessId}
              tokenId={tokenData?.id || ''}
              onComplete={handleWhatsAppComplete}
              onSkip={handleWhatsAppSkip}
              onBack={prevStep}
            />
          )}
          {step === 13 && (
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
