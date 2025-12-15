
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import ClientsPage from './pages/Clients';
import MarketingPage from './pages/Marketing';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import LandingPage from './pages/Landing';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
   const { isAuthenticated } = useAuth();
   
   return (
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/app" /> : <LoginPage />} />
        
        {/* PROTECTED DASHBOARD ROUTES (Prefixed with /app) */}
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/app/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
        <Route path="/app/marketing" element={<ProtectedRoute><MarketingPage /></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        
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
          <HashRouter>
             <AppRoutes />
          </HashRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
