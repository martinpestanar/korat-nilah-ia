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

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CalendarPage = lazy(() => import('./pages/Calendar'));
const CRMPage = lazy(() => import('./pages/CRM'));
const InboxPage = lazy(() => import('./pages/Inbox'));
const MarketingPage = lazy(() => import('./pages/Marketing'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const LoyaltyPage = lazy(() => import('./pages/Loyalty'));
const EngagementPage = lazy(() => import('./pages/Engagement'));
const GrowthPage = lazy(() => import('./pages/Growth'));
const FinancesPage = lazy(() => import('./pages/Finances'));
const LoginPage = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/Landing'));
const KoratHome = lazy(() => import('./pages/KoratHome'));
const MiNegocio = lazy(() => import('./pages/MiNegocio'));
const KoratNosotros = lazy(() => import('./pages/KoratNosotros'));
const KoratContacto = lazy(() => import('./pages/KoratContacto'));
const NilahPrecios = lazy(() => import('./pages/NilahPrecios'));
const NilahDemo = lazy(() => import('./pages/NilahDemo'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const BrandWizard = lazy(() => import('./pages/BrandWizard'));
const NilahCreative = lazy(() => import('./pages/NilahCreative'));
const OnboardingPage = lazy(() => import('./pages/Onboarding'));
const FreeOnboarding = lazy(() => import('./pages/FreeOnboarding'));
const BookingPortal = lazy(() => import('./pages/PublicBooking/BookingPortal'));

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

const ProtectedAppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading || (isAuthenticated && !user)) return <FullscreenLoader />;
  if (!isAuthenticated) return <Navigate to="/nilah/login" replace state={{ from: location }} />;

  return (
    <AppShellProviders>
      <ThemeSync />
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
        <Route path="/mi-negocio" element={<KoratLayout><MiNegocio /></KoratLayout>} />
        <Route path="/custom" element={<Navigate to="/mi-negocio" replace />} />
        <Route path="/nosotros" element={<KoratLayout><KoratNosotros /></KoratLayout>} />
        <Route path="/contacto" element={<KoratLayout><KoratContacto /></KoratLayout>} />

        {/* === NILAH IA PRODUCT (Public) === */}
        <Route path="/nilah" element={<LandingPage />} />
        <Route path="/nilah/precios" element={<NilahPrecios />} />
        <Route path="/nilah/demo" element={<NilahDemo />} />
        <Route path="/nilah/login" element={<LoginPage />} />

        {/* === ONBOARDING (Public, token-based) === */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        {/* === FREE SELF-SERVICE ONBOARDING === */}
        <Route path="/auth" element={<FreeOnboarding />} />

        {/* === PUBLIC BOOKING PORTAL === */}
        <Route path="/reservar/:businessId" element={<BookingPortal />} />

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
          <Route path="inbox" element={<ErrorBoundary fallbackTitle="Error en Inbox"><InboxPage /></ErrorBoundary>} />
          <Route path="growth" element={<ErrorBoundary fallbackTitle="Error en Crecimiento"><GrowthPage /></ErrorBoundary>} />
          <Route element={<SaaSModuleGuard moduleName="marketing" />}>
            <Route path="marketing" element={<MarketingPage />} />
            <Route path="creative" element={<NilahCreative />} />
          </Route>

          {/* ADMIN ONLY ROUTES */}
          <Route element={<AdminGuard />}>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="brand-wizard" element={<BrandWizard />} />
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

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <InstallPWAProvider>
        <AuthProvider>
          <BrowserRouter>
            <DynamicFavicon />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </InstallPWAProvider>
    </ThemeProvider>
  );
};

export default App;
