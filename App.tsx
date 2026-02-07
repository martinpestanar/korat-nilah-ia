

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { DashboardDataProvider } from './context/DashboardDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import ClientsPage from './pages/Clients';
import MarketingPage from './pages/Marketing';
import SettingsPage from './pages/Settings';
import LoyaltyPage from './pages/Loyalty';
import EngagementPage from './pages/Engagement';
import LoginPage from './pages/Login';
import LandingPage from './pages/Landing';
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
    return <Navigate to="/login" replace />;
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
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/app" replace />;
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
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin || !isPro) {
    return <Navigate to="/app" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* PROTECTED DASHBOARD ROUTES (Prefixed with /app) */}
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/app/calendar" element={<ProtectedRoute><ErrorBoundary fallbackTitle="Error en Agenda"><CalendarPage /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/app/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
      <Route path="/app/loyalty" element={<ProtectedRoute><LoyaltyPage /></ProtectedRoute>} />
      <Route path="/app/engagement" element={<ProtectedRoute><EngagementPage /></ProtectedRoute>} />

      {/* ADMIN + PRO ONLY ROUTES */}
      <Route path="/app/marketing" element={<ProAdminRoute><MarketingPage /></ProAdminRoute>} />

      {/* ADMIN ONLY ROUTES */}
      <Route path="/app/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />


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
