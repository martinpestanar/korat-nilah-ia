import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { DashboardDataProvider } from './context/DashboardDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CopilotProvider } from './context/CopilotContext';
import Layout from './components/Layout/Layout';
import KoratLayout from './components/Layout/KoratLayout';
import ErrorBoundary from './components/ErrorBoundary';

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
const KoratNosotros = lazy(() => import('./pages/KoratNosotros'));
const KoratContacto = lazy(() => import('./pages/KoratContacto'));
const NilahPrecios = lazy(() => import('./pages/NilahPrecios'));
const NilahDemo = lazy(() => import('./pages/NilahDemo'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const BrandWizard = lazy(() => import('./pages/BrandWizard'));
const NilahCreative = lazy(() => import('./pages/NilahCreative'));
const OnboardingPage = lazy(() => import('./pages/Onboarding'));

const FullscreenLoader: React.FC = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullscreenLoader />;
  if (!isAuthenticated) return <Navigate to="/nilah/login" replace state={{ from: location }} />;

  return (
    <AppShellProviders>
      <Layout>
        <Outlet />
      </Layout>
    </AppShellProviders>
  );
};

const AdminGuard: React.FC = () => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/nilah/app" replace />;
  return <Outlet />;
};

const SaaSModuleGuard: React.FC<{ moduleName: Parameters<ReturnType<typeof useAuth>['hasSaaSModule']>[0] }> = ({ moduleName }) => {
  const { hasSaaSModule } = useAuth();
  if (!hasSaaSModule(moduleName)) return <Navigate to="/nilah/app" replace />;
  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<FullscreenLoader />}>
      <Routes>
        {/* === KORAT FLOW CORPORATE (Public) === */}
        <Route path="/" element={<KoratLayout><KoratHome /></KoratLayout>} />
        <Route path="/nosotros" element={<KoratLayout><KoratNosotros /></KoratLayout>} />
        <Route path="/contacto" element={<KoratLayout><KoratContacto /></KoratLayout>} />

        {/* === NILAH IA PRODUCT (Public) === */}
        <Route path="/nilah" element={<LandingPage />} />
        <Route path="/nilah/precios" element={<NilahPrecios />} />
        <Route path="/nilah/demo" element={<NilahDemo />} />
        <Route path="/nilah/login" element={<LoginPage />} />

        {/* === ONBOARDING (Public, token-based) === */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* === SUPER ADMIN (Hidden) === */}
        <Route path="/god-mode" element={<SuperAdminLogin />} />
        <Route path="/god-mode/dashboard" element={<SuperAdminDashboard />} />

        {/* === NILAH IA APP (Protected) === */}
        <Route path="/nilah/app" element={<ProtectedAppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<ErrorBoundary fallbackTitle="Error en Agenda"><CalendarPage /></ErrorBoundary>} />
          <Route path="clients" element={<CRMPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="growth" element={<GrowthPage />} />
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

        {/* CATCH ALL - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
