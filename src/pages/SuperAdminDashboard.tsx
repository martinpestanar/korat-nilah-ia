/**
 * ============================================================
 * SUPER ADMIN DASHBOARD — Korat Flow God-Mode (Clean Light Emerald Edition)
 * Layout: Sidebar desktop + Native App Bottom Bar mobile
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, Users, Link2, DollarSign,
  Settings, LogOut, RefreshCw, Search, Bell, ChevronRight,
  Zap, Store, TrendingUp, UserPlus, Check, AlertCircle,
  Menu, X, Radio, Smartphone, MoreHorizontal, Sparkles, ArrowRight
} from 'lucide-react';
import { fetchNegocios, calcularStats, type GlobalStats } from '../services/godmode';
import type { NegocioAdmin } from '../types/godmode';
import { BottomSheet } from '../components/UI/BottomSheet';

// Sub-páginas (lazy)
import GodModeOverview from '../components/GodMode/GodModeOverview';
import GodModeClientes from '../components/GodMode/GodModeClientes';
import GodModeOnboarding from '../components/GodMode/GodModeOnboarding';
import GodModePrecios from '../components/GodMode/GodModePrecios';
import GodModeAutopilot from '../components/GodMode/GodModeAutopilot';
import { GodModeSoluciones } from '../components/GodMode/GodModeSoluciones';
import { GodModeTikTokAnalytics } from '../components/GodMode/GodModeTikTokAnalytics';

// ─── Tipos ────────────────────────────────────────────────────
type Section = 'overview' | 'tiktok_analytics' | 'soluciones' | 'clientes' | 'onboarding' | 'precios' | 'autopilot';

interface NavItemConfig {
  id: Section;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  badge?: string;
  isPrimaryMobile?: boolean; // Para los 4 slots principales en la barra inferior nativa
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview',         label: 'Overview General',    shortLabel: 'Inicio',     icon: <LayoutDashboard className="w-5 h-5" />, isPrimaryMobile: true },
  { id: 'tiktok_analytics', label: 'TikTok & Tráfico',   shortLabel: 'TikTok',     icon: <TrendingUp className="w-5 h-5" />, badge: 'Live', isPrimaryMobile: true },
  { id: 'soluciones',       label: 'Catálogo & Add-ons',  shortLabel: 'Catálogo',   icon: <Smartphone className="w-5 h-5" />, isPrimaryMobile: true },
  { id: 'clientes',         label: 'Salones & Clientes',  shortLabel: 'Salones',    icon: <Store className="w-5 h-5" />, isPrimaryMobile: true },
  { id: 'onboarding',       label: 'Onboarding de Salón', shortLabel: 'Onboarding', icon: <Link2 className="w-5 h-5" /> },
  { id: 'precios',          label: 'Planes & Precios SaaS', shortLabel: 'Planes',   icon: <DollarSign className="w-5 h-5" /> },
  { id: 'autopilot',        label: 'Autopilot & Flujos',  shortLabel: 'Autopilot',  icon: <Radio className="w-5 h-5" /> },
];

const SuperAdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') as Section || 'overview';
  const [section, setSection] = useState<Section>(currentTab);

  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sincronizar sección con la URL
  useEffect(() => {
    setSearchParams({ tab: section }, { replace: true });
  }, [section, setSearchParams]);

  // Cargar info del admin
  useEffect(() => {
    const session = sessionStorage.getItem('korat_super_admin');
    if (session) {
      try { setAdminInfo(JSON.parse(session)); } catch { /* ignore */ }
    }
  }, []);

  // Fix overflow
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNegocios();
      setNegocios(data);
      setStats(calcularStats(data));
    } catch (err) {
      console.error('Error loading negocios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => {
    sessionStorage.removeItem('korat_super_admin');
    window.location.href = '/god-mode';
  };

  const filteredNegocios = negocios.filter(n =>
    n.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.owner as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMoreTabActive = ['onboarding', 'precios', 'autopilot'].includes(section);

  if (loading && negocios.length === 0) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-emerald-700">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wide uppercase text-slate-600">Cargando Panel SuperAdmin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] text-slate-900 flex overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">

      {/* ── Overlay mobile para Sidebar ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════ SIDEBAR DESKTOP ══════════════════════ */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-68 bg-white border-r border-emerald-100/80
        flex flex-col transition-transform duration-300 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Header */}
        <div className="p-5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/40 to-teal-50/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                Korat God Mode
              </p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">SuperAdmin Hub</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        {adminInfo && (
          <div className="px-4 py-3 border-b border-emerald-50/80 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center shadow-2xs">
                {adminInfo.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{adminInfo.nombre}</p>
                <p className="text-[10px] text-slate-500 truncate">{adminInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación Desktop */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setSidebarOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold
                  transition-all duration-150 text-left group
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }
                `}
              >
                <span className={`transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Stats rápidas Sidebar */}
        {stats && (
          <div className="p-4 border-t border-emerald-50 bg-emerald-50/20 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Salones activos</span>
              <span className="text-emerald-700 font-black px-2 py-0.5 rounded-md bg-emerald-100/80">{stats.activos}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>MRR estimado</span>
              <span className="text-slate-900 font-black">${stats.mrr_total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-emerald-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════ MAIN CONTENT AREA ══════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header Bar */}
        <header className="h-14 bg-white/90 border-b border-emerald-100/80 flex items-center px-4 gap-3 flex-shrink-0 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Box */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar salón o dueño..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-emerald-50 border border-slate-200/80 transition-all ${refreshing ? 'animate-spin text-emerald-600' : ''}`}
              title="Refrescar datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{negocios.length} salones</span>
            </div>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-8">
          {section === 'overview' && stats && (
            <GodModeOverview
              negocios={negocios}
              stats={stats}
              onSelectCliente={(id) => { setSection('clientes'); }}
            />
          )}
          {section === 'tiktok_analytics' && (
            <div className="p-3 sm:p-6 max-w-7xl mx-auto">
              <GodModeTikTokAnalytics />
            </div>
          )}
          {section === 'soluciones' && (
            <GodModeSoluciones />
          )}
          {section === 'clientes' && (
            <GodModeClientes
              negocios={filteredNegocios}
              searchTerm={searchTerm}
              onReload={loadData}
            />
          )}
          {section === 'onboarding' && (
            <GodModeOnboarding onReload={loadData} />
          )}
          {section === 'precios' && (
            <GodModePrecios />
          )}
          {section === 'autopilot' && (
            <GodModeAutopilot />
          )}
        </main>

        {/* ══════════════════════════════════════════════════════════
            NATIVE APP BOTTOM NAVIGATION BAR (MODERNO & ELEGANTE)
        ══════════════════════════════════════════════════════════ */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 border-t border-emerald-100 backdrop-blur-xl z-40 px-2 py-1.5 shadow-[0_-4px_24px_rgba(16,185,129,0.08)] flex items-center justify-around">
          {/* Slot 1: Inicio */}
          <button
            onClick={() => setSection('overview')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              section === 'overview'
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              section === 'overview' ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' : ''
            }`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Inicio</span>
          </button>

          {/* Slot 2: TikTok & Tráfico (Flagship) */}
          <button
            onClick={() => setSection('tiktok_analytics')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 relative ${
              section === 'tiktok_analytics'
                ? 'text-emerald-800 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all relative ${
              section === 'tiktok_analytics' ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25' : ''
            }`}>
              <TrendingUp className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight flex items-center gap-0.5">
              TikTok
              <span className="w-1 h-1 rounded-full bg-emerald-600" />
            </span>
          </button>

          {/* Slot 3: Catálogo */}
          <button
            onClick={() => setSection('soluciones')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              section === 'soluciones'
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              section === 'soluciones' ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' : ''
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Catálogo</span>
          </button>

          {/* Slot 4: Salones / Clientes */}
          <button
            onClick={() => setSection('clientes')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              section === 'clientes'
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              section === 'clientes' ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' : ''
            }`}>
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Salones</span>
          </button>

          {/* Slot 5: Más (BottomSheet Drawer Nativo) */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 relative ${
              isMoreTabActive
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${
              isMoreTabActive ? 'bg-emerald-100/80 text-emerald-700 shadow-xs' : ''
            }`}>
              <MoreHorizontal className="w-5 h-5" />
              {isMoreTabActive && (
                <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-emerald-600" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">
              {section === 'onboarding' ? 'Onboarding' : section === 'precios' ? 'Planes' : section === 'autopilot' ? 'Autopilot' : 'Más'}
            </span>
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM SHEET DRAWER PARA OPCIONES "MÁS" (NATIVO MÓVIL)
        ══════════════════════════════════════════════════════════ */}
        <BottomSheet
          isOpen={moreMenuOpen}
          onClose={() => setMoreMenuOpen(false)}
          title="Módulos & Herramientas"
          maxHeight="75dvh"
        >
          <div className="space-y-2 p-1 font-sans">
            <p className="text-xs text-slate-500 font-medium px-2 mb-3">
              Selecciona una sección para administrar:
            </p>

            {/* Opción: Onboarding */}
            <button
              onClick={() => { setSection('onboarding'); setMoreMenuOpen(false); }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                section === 'onboarding'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Onboarding de Salones</h4>
                  <p className="text-[11px] text-slate-500">Links de invitación y bienvenida</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Opción: Planes SaaS */}
            <button
              onClick={() => { setSection('precios'); setMoreMenuOpen(false); }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                section === 'precios'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Planes & Precios SaaS</h4>
                  <p className="text-[11px] text-slate-500">Configuración de suscripciones</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Opción: Autopilot */}
            <button
              onClick={() => { setSection('autopilot'); setMoreMenuOpen(false); }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-all ${
                section === 'autopilot'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                  : 'bg-white border-slate-200/80 hover:border-emerald-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">Autopilot & Automatizaciones</h4>
                  <p className="text-[11px] text-slate-500">Monitoreo de cronjobs y n8n</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Logout en Modal */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar sesión de Administrador</span>
              </button>
            </div>
          </div>
        </BottomSheet>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
