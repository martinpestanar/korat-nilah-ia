

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { DashboardDataProvider } from './context/DashboardDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import KoratLayout from './components/Layout/KoratLayout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import ClientsPage from './pages/Clients';
import MarketingPage from './pages/Marketing';
import SettingsPage from './pages/Settings';
import LoyaltyPage from './pages/Loyalty';
import EngagementPage from './pages/Engagement';
import LoginPage from './pages/Login';
import LandingPage from './pages/Landing';
import KoratHome from './pages/KoratHome';
import KoratNosotros from './pages/KoratNosotros';
import KoratContacto from './pages/KoratContacto';
import NilahPrecios from './pages/NilahPrecios';
import NilahDemo from './pages/NilahDemo';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Esperar mientras carga la sesión del localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/nilah/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Route that requires Admin role
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Esperar mientras carga la sesión del localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/nilah/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/nilah/app" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Route that requires Pro plan + Admin role
const ProAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isPro, isLoading } = useAuth();

  // Esperar mientras carga la sesión del localStorage
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/nilah/login" replace />;
  }
  if (!isAdmin || !isPro) {
    return <Navigate to="/nilah/app" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
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

      {/* === NILAH IA APP (Protected) === */}
      <Route path="/nilah/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/nilah/app/calendar" element={<ProtectedRoute><ErrorBoundary fallbackTitle="Error en Agenda"><CalendarPage /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/nilah/app/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
      <Route path="/nilah/app/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
      <Route path="/nilah/app/engagement" element={<ProtectedRoute><EngagementPage /></ProtectedRoute>} />

      {/* ADMIN + PRO ONLY ROUTES */}
      <Route path="/nilah/app/marketing" element={<ProAdminRoute><MarketingPage /></ProAdminRoute>} />

      {/* ADMIN ONLY ROUTES */}
      <Route path="/nilah/app/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />

      {/* LEGACY REDIRECTS — keep old paths working */}
      <Route path="/login" element={<Navigate to="/nilah/login" replace />} />
      <Route path="/app" element={<Navigate to="/nilah/app" replace />} />
      <Route path="/app/*" element={<Navigate to="/nilah/app" replace />} />

      {/* CATCH ALL - Redirect to Home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <DashboardDataProvider>
            <HashRouter>
              <AppRoutes />
            </HashRouter>
          </DashboardDataProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
