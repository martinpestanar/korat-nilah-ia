import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { DashboardDataProvider } from './context/DashboardDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CopilotProvider } from './context/CopilotContext';
import Layout from './components/Layout/Layout';
import KoratLayout from './components/Layout/KoratLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeSync } from './components/ThemeSync';
import { DynamicFavicon } from './components/DynamicFavicon';
import { InstallPWAProvider } from './context/InstallPWAContext';
import { ConfirmProvider } from './components/Common/ConfirmSheet';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { initEmergencyPurgeListener } from './services/emergencyPurgeService';

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'), 'Dashboard');
const CalendarPage = lazyWithRetry(() => import('./pages/Calendar'), 'CalendarPage');
const CRMPage = lazyWithRetry(() => import('./pages/CRM'), 'CRMPage');
const InboxPage = lazyWithRetry(() => import('./pages/Inbox'), 'InboxPage');
const MarketingPage = lazyWithRetry(() => import('./pages/Marketing'), 'MarketingPage');
const SettingsPage = lazyWithRetry(() => import('./pages/Settings'), 'SettingsPage');
const AutomatizacionesPage = lazyWithRetry(() => import('./pages/Automatizaciones'), 'AutomatizacionesPage');
const LoyaltyPage = lazyWithRetry(() => import('./pages/Loyalty'), 'LoyaltyPage');
const EngagementPage = lazyWithRetry(() => import('./pages/Engagement'), 'EngagementPage');
const GrowthPage = lazyWithRetry(() => import('./pages/Growth'), 'GrowthPage');
const FinancesPage = lazyWithRetry(() => import('./pages/Finances'), 'FinancesPage');
const StorePage = lazyWithRetry(() => import('./pages/Store'), 'StorePage');
const LoginPage = lazyWithRetry(() => import('./pages/Login'), 'LoginPage');
const LandingPage = lazyWithRetry(() => import('./pages/Landing'), 'LandingPage');
const KoratHome = lazyWithRetry(() => import('./pages/KoratHome'), 'KoratHome');
const MiNegocio = lazyWithRetry(() => import('./pages/MiNegocio'), 'MiNegocio');
const KoratNosotros = lazyWithRetry(() => import('./pages/KoratNosotros'), 'KoratNosotros');
const KoratContacto = lazyWithRetry(() => import('./pages/KoratContacto'), 'KoratContacto');
const NilahPrecios = lazyWithRetry(() => import('./pages/NilahPrecios'), 'NilahPrecios');
const NilahDemo = lazyWithRetry(() => import('./pages/NilahDemo'), 'NilahDemo');
const SuperAdminLogin = lazyWithRetry(() => import('./pages/SuperAdminLogin'), 'SuperAdminLogin');
const SuperAdminDashboard = lazyWithRetry(() => import('./pages/SuperAdminDashboard'), 'SuperAdminDashboard');
const BrandWizard = lazyWithRetry(() => import('./pages/BrandWizard'), 'BrandWizard');
const NilahCreative = lazyWithRetry(() => import('./pages/NilahCreative'), 'NilahCreative');
const OnboardingPage = lazyWithRetry(() => import('./pages/Onboarding'), 'OnboardingPage');
const FreeOnboarding = lazyWithRetry(() => import('./pages/FreeOnboarding'), 'FreeOnboarding');
const BookingPortal = lazyWithRetry(() => import('./pages/PublicBooking/BookingPortal'), 'BookingPortal');
const BroadcastsPage = lazyWithRetry(() => import('./pages/Broadcasts'), 'BroadcastsPage');
const SolucionesPage = lazyWithRetry(() => import('./pages/Soluciones'), 'SolucionesPage');
const KoratPosExpress = lazyWithRetry(() => import('./pages/KoratPosExpress'), 'KoratPosExpress');
const PublicCustomerQrPage = lazyWithRetry(() => import('./pages/PublicCustomerQrPage'), 'PublicCustomerQrPage');
const PlaybookLanding = lazyWithRetry(() => import('./pages/PlaybookLanding'), 'PlaybookLanding');
const PlaybookRestaurantesLanding = lazyWithRetry(() => import('./pages/PlaybookRestaurantesLanding'), 'PlaybookRestaurantesLanding');
const EbookAprendizADuena = lazyWithRetry(() => import('./pages/EbookAprendizADuena'), 'EbookAprendizADuena');
const EbookAnuncio4Dolares = lazyWithRetry(() => import('./pages/EbookAnuncio4Dolares'), 'EbookAnuncio4Dolares');
const EbookClientasRegresen = lazyWithRetry(() => import('./pages/EbookClientasRegresen'), 'EbookClientasRegresen');
const EbookAntiNoShow = lazyWithRetry(() => import('./pages/EbookAntiNoShow'), 'EbookAntiNoShow');
const EbookCuandoDarElSalto = lazyWithRetry(() => import('./pages/EbookCuandoDarElSalto'), 'EbookCuandoDarElSalto');
const MetodoNilahEbook = lazyWithRetry(() => import('./pages/MetodoNilahEbook'), 'MetodoNilahEbook');
const EbookHalloweenMachine = lazyWithRetry(() => import('./pages/EbookHalloweenMachine'), 'EbookHalloweenMachine');
const CartaDigital = lazyWithRetry(() => import('./pages/CartaDigital'), 'CartaDigital');
const CartaPublica = lazyWithRetry(() => import('./pages/CartaPublica'), 'CartaPublica');
const VincularWhatsAppPublico = lazyWithRetry(() => import('./pages/VincularWhatsAppPublico'), 'VincularWhatsAppPublico');
const ReviewsManager = lazyWithRetry(() => import('./pages/ReviewsManager'), 'ReviewsManager');
const PublicReviewFlow = lazyWithRetry(() => import('./pages/PublicReviewFlow'), 'PublicReviewFlow');
const PublicConsentimiento = lazyWithRetry(() => import('./pages/PublicConsentimiento'), 'PublicConsentimiento');
const ClubGlowPage = lazyWithRetry(() => import('./pages/ClubGlow'), 'ClubGlowPage');
const TarjetaClubGlowPublica = lazyWithRetry(() => import('./pages/TarjetaClubGlowPublica'), 'TarjetaClubGlowPublica');

const FullscreenLoader: React.FC = () => (
  <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
    {/* Sidebar skeleton */}
    <div className="hidden md:flex w-16 lg:w-60 flex-col gap-3 p-3 border-r border-gray-100 dark:border-white/5 shrink-0">
      <div className="h-10 w-10 lg:w-36 rounded-xl bg-gray-200 dark:bg-white/8 animate-pulse mb-4" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
    {/* Content skeleton */}
    <div className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-white/8 animate-pulse" />
        <div className="h-9 w-28 rounded-full bg-gray-100 dark:bg-white/5 animate-pulse" />
      </div>
      {/* Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      {/* Main card */}
      <div className="flex-1 rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse min-h-[200px]" />
      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="h-32 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>
    </div>
  </div>
);

const AppShellProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CopilotProvider>
    <DataProvider>
      <DashboardDataProvider>{children}</DashboardDataProvider>
    </DataProvider>
  </CopilotProvider>
);

import { prefetchCoreModules } from './utils/prefetch';

const ProtectedAppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      prefetchCoreModules();
    }
  }, [isAuthenticated]);

  if (isLoading) return <FullscreenLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/nilah/login" replace state={{ from: location }} />;

  return (
    <AppShellProviders>
      <ThemeSync />
      <Layout>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
          className="w-full min-h-full flex flex-col will-change-transform"
        >
          <Outlet />
        </motion.div>
      </Layout>
    </AppShellProviders>
  );
};

const AdminGuard: React.FC = () => {
  const { isAdmin, user } = useAuth();
  if (!user) return <FullscreenLoader />;
  if (!isAdmin) return <Navigate to="/nilah/app" replace />;
  return <Outlet />;
};

/**
 * Protege el dashboard de SuperAdmin.
 * Verifica que haya una sesión super-admin en sessionStorage
 * (establecido por la pantalla de SuperAdminLogin tras el RPC verify_super_admin).
 */
const SuperAdminGuard: React.FC = () => {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const session = sessionStorage.getItem('korat_super_admin');
    if (!session) {
      setVerified(false);
      return;
    }
    try {
      const parsed = JSON.parse(session);
      setVerified(!!(parsed?.email && parsed?.loginAt));
    } catch {
      setVerified(false);
    }
  }, []);

  if (verified === null) return <FullscreenLoader />; // verificando
  if (!verified) return <Navigate to="/god-mode" replace />;
  return <Outlet />;
};

const SaaSModuleGuard: React.FC<{ moduleName: Parameters<ReturnType<typeof useAuth>['hasSaaSModule']>[0] }> = ({ moduleName }) => {
  const { hasSaaSModule, user } = useAuth();
  if (!user) return <FullscreenLoader />;
  if (!hasSaaSModule(moduleName)) return <Navigate to="/nilah/app" replace />;
  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<FullscreenLoader />}>
      <Routes>
        {/* === KORAT FLOW CORPORATE (Public) === */}
        <Route path="/" element={<KoratLayout><KoratHome /></KoratLayout>} />
        <Route path="/soluciones" element={<SolucionesPage />} />
        <Route path="/mi-negocio" element={<KoratLayout><MiNegocio /></KoratLayout>} />
        <Route path="/custom" element={<Navigate to="/mi-negocio" replace />} />
        <Route path="/nosotros" element={<KoratLayout><KoratNosotros /></KoratLayout>} />
        <Route path="/contacto" element={<KoratLayout><KoratContacto /></KoratLayout>} />

        {/* === RECURSOS, PLAYBOOKS & EBOOKS GRATUITOS (/ebooks/...) === */}
        <Route path="/ebooks/la-maquina-de-halloween" element={<EbookHalloweenMachine />} />
        <Route path="/ebooks/de-aprendiz-a-duena" element={<EbookAprendizADuena />} />
        <Route path="/ebooks/el-metodo-nilah" element={<MetodoNilahEbook />} />
        <Route path="/ebooks/el-anuncio-de-4-dolares" element={<EbookAnuncio4Dolares />} />
        <Route path="/ebooks/como-hacer-que-tus-clientas-regresen" element={<EbookClientasRegresen />} />
        <Route path="/ebooks/guia-anti-no-show" element={<EbookAntiNoShow />} />
        <Route path="/ebooks/ya-es-tu-momento" element={<EbookCuandoDarElSalto />} />
        <Route path="/ebooks/playbook-whatsapp" element={<PlaybookLanding />} />
        <Route path="/ebooks/playbook-restaurantes" element={<PlaybookRestaurantesLanding />} />

        {/* Alias y redirecciones legadas */}
        <Route path="/halloween" element={<Navigate to="/ebooks/la-maquina-de-halloween" replace />} />
        <Route path="/la-maquina-de-halloween" element={<Navigate to="/ebooks/la-maquina-de-halloween" replace />} />
        <Route path="/ebooks/halloween" element={<Navigate to="/ebooks/la-maquina-de-halloween" replace />} />
        <Route path="/el-metodo-nilah" element={<Navigate to="/ebooks/el-metodo-nilah" replace />} />
        <Route path="/metodo-nilah" element={<Navigate to="/ebooks/el-metodo-nilah" replace />} />
        <Route path="/ebook-aprendiz-a-duena" element={<Navigate to="/ebooks/de-aprendiz-a-duena" replace />} />
        <Route path="/de-aprendiz-a-duena" element={<Navigate to="/ebooks/de-aprendiz-a-duena" replace />} />
        <Route path="/ebook-salon" element={<Navigate to="/ebooks/de-aprendiz-a-duena" replace />} />
        <Route path="/ebooks/anuncio-4-dolares" element={<Navigate to="/ebooks/el-anuncio-de-4-dolares" replace />} />
        <Route path="/el-anuncio-de-4-dolares" element={<Navigate to="/ebooks/el-anuncio-de-4-dolares" replace />} />
        <Route path="/anuncio-4-dolares" element={<Navigate to="/ebooks/el-anuncio-de-4-dolares" replace />} />
        <Route path="/ebooks/clientas-regresen" element={<Navigate to="/ebooks/como-hacer-que-tus-clientas-regresen" replace />} />
        <Route path="/como-hacer-que-tus-clientas-regresen" element={<Navigate to="/ebooks/como-hacer-que-tus-clientas-regresen" replace />} />
        <Route path="/ebooks/anti-no-show" element={<Navigate to="/ebooks/guia-anti-no-show" replace />} />
        <Route path="/guia-anti-no-show" element={<Navigate to="/ebooks/guia-anti-no-show" replace />} />
        <Route path="/anti-no-show" element={<Navigate to="/ebooks/guia-anti-no-show" replace />} />
        <Route path="/ebooks/cuando-dar-el-salto" element={<Navigate to="/ebooks/ya-es-tu-momento" replace />} />
        <Route path="/ya-es-tu-momento" element={<Navigate to="/ebooks/ya-es-tu-momento" replace />} />
        <Route path="/cuando-dar-el-salto" element={<Navigate to="/ebooks/ya-es-tu-momento" replace />} />
        <Route path="/playbook-whatsapp" element={<Navigate to="/ebooks/playbook-whatsapp" replace />} />
        <Route path="/playbook-restaurantes" element={<Navigate to="/ebooks/playbook-restaurantes" replace />} />

        {/* === KORAT POS EXPRESS (Public PWA) === */}
        <Route path="/pos/*" element={<KoratPosExpress />} />
        <Route path="/r/:slug" element={<PublicCustomerQrPage />} />

        {/* === NILAH IA PRODUCT (Public) === */}
        <Route path="/nilah" element={<LandingPage />} />
        <Route path="/nilah/precios" element={<NilahPrecios />} />
        <Route path="/nilah/demo" element={<NilahDemo />} />
        <Route path="/nilah/login" element={<LoginPage />} />

        {/* === ONBOARDING (Public, token-based) === */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* === FREE SELF-SERVICE ONBOARDING === */}
        <Route path="/auth" element={<FreeOnboarding />} />
        {/* === VINCULACIÓN REMOTA WHATSAPP PÚBLICA === */}
        <Route path="/vincular-whatsapp" element={<VincularWhatsAppPublico />} />

        {/* === PUBLIC BOOKING PORTAL === */}
        <Route path="/reservar/:businessId" element={<BookingPortal />} />

        {/* === CARTA DIGITAL PÚBLICA (sin login) === */}
        <Route path="/carta/:businessId" element={<CartaPublica />} />

        {/* === RESEÑAS GOOGLE & CUPONES (PWA Pública sin login) === */}
        <Route path="/resenas/:slug" element={<PublicReviewFlow />} />
        <Route path="/review/:slug" element={<PublicReviewFlow />} />

        {/* === FICHA & CONSENTIMIENTO DIGITAL PÚBLICA (PWA Móvil sin login) === */}
        <Route path="/consentimiento/:salonSlug/:token" element={<PublicConsentimiento />} />
        <Route path="/consentimiento/:token" element={<PublicConsentimiento />} />
        {/* === TARJETA DORADA CLUB GLOW PÚBLICA (WhatsApp link sin login) === */}
        <Route path="/club/:businessId" element={<TarjetaClubGlowPublica />} />
        <Route path="/club-glow/:businessId" element={<TarjetaClubGlowPublica />} />
        <Route path="/club-glow-demo" element={<TarjetaClubGlowPublica />} />
        <Route path="/tarjeta-demo" element={<TarjetaClubGlowPublica />} />

        {/* === SUPER ADMIN (Hidden — guarded) === */}
        <Route path="/god-mode" element={<SuperAdminLogin />} />
        <Route element={<SuperAdminGuard />}>
          <Route path="/god-mode/dashboard" element={<SuperAdminDashboard />} />
        </Route>

        {/* === NILAH IA APP (Protected) === */}
        <Route path="/nilah/app" element={<ProtectedAppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<ErrorBoundary fallbackTitle="Error en Agenda"><CalendarPage /></ErrorBoundary>} />
          <Route path="clients" element={<ErrorBoundary fallbackTitle="Error en Clientes"><CRMPage /></ErrorBoundary>} />
          <Route element={<SaaSModuleGuard moduleName="inbox" />}>
            <Route path="inbox" element={<ErrorBoundary fallbackTitle="Error en Inbox"><InboxPage /></ErrorBoundary>} />
          </Route>
          <Route path="automatizaciones" element={<ErrorBoundary fallbackTitle="Error en Automatizaciones"><AutomatizacionesPage /></ErrorBoundary>} />
          <Route path="store" element={<ErrorBoundary fallbackTitle="Error en Tienda"><StorePage /></ErrorBoundary>} />
          <Route path="broadcasts" element={<Navigate to="/nilah/app/marketing" replace />} />
          <Route path="club-glow" element={<ErrorBoundary fallbackTitle="Error en Club Glow"><ClubGlowPage /></ErrorBoundary>} />
          <Route path="loyalty" element={<Navigate to="/nilah/app/club-glow" replace />} />
          <Route element={<SaaSModuleGuard moduleName="marketing" />}>
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="creative" element={<NilahCreative />} />
          </Route>

          {/* ADMIN ONLY ROUTES */}
          <Route element={<AdminGuard />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="brand-wizard" element={<BrandWizard />} />
            <Route path="carta" element={<CartaDigital />} />
            <Route path="resenas" element={<ReviewsManager />} />
            <Route element={<SaaSModuleGuard moduleName="finanzas" />}>
              <Route path="finances" element={<FinancesPage />} />
            </Route>
          </Route>
        </Route>

        {/* LEGACY REDIRECTS - keep old paths working */}
        <Route path="/login" element={<Navigate to="/nilah/login" replace />} />
        <Route path="/app" element={<Navigate to="/nilah/app" replace />} />
        <Route path="/app/*" element={<Navigate to="/nilah/app" replace />} />

        {/* CATCH ALL - Redirect to Home, but not if we are in God Mode flow */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
};

const RootRedirect: React.FC = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith('/god-mode')) return null; // Let the guard handle it
  return <Navigate to="/" replace />;
};

import ReloadPrompt from './components/PWA/ReloadPrompt';

const App: React.FC = () => {
  useEffect(() => {
    // Iniciar escucha global de purga remota de emergencia
    const unsubscribe = initEmergencyPurgeListener();
    return () => {
      unsubscribe?.();
    };
  }, []);

  return (
    <ThemeProvider>
      <InstallPWAProvider>
        <AuthProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <ReloadPrompt />
              <DynamicFavicon />
              <AppRoutes />
            </BrowserRouter>
          </ConfirmProvider>
        </AuthProvider>
      </InstallPWAProvider>
    </ThemeProvider>
  );
};

export default App;
