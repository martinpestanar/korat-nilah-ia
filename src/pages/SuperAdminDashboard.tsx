/**
 * ============================================================
 * NUEVO SUPER ADMIN DASHBOARD — Korat Flow God-Mode
 * Layout principal: sidebar fijo + contenido modular
 * ============================================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, Users, Link2, DollarSign,
  Settings, LogOut, RefreshCw, Search, Bell, ChevronRight,
  Zap, Store, TrendingUp, UserPlus, Check, AlertCircle,
  Sun, Moon, Menu, X, Radio, Smartphone
} from 'lucide-react';
import { fetchNegocios, calcularStats, type GlobalStats } from '../services/godmode';
import type { NegocioAdmin } from '../types/godmode';

// Sub-páginas (lazy)
import GodModeOverview from '../components/GodMode/GodModeOverview';
import GodModeClientes from '../components/GodMode/GodModeClientes';
import GodModeOnboarding from '../components/GodMode/GodModeOnboarding';
import GodModePrecios from '../components/GodMode/GodModePrecios';
import GodModeAutopilot from '../components/GodMode/GodModeAutopilot';
import { GodModeSoluciones } from '../components/GodMode/GodModeSoluciones';

// ─── Tipos ────────────────────────────────────────────────────
type Section = 'overview' | 'clientes' | 'onboarding' | 'precios' | 'autopilot' | 'soluciones';

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'soluciones',  label: 'TikTok Linktree', icon: <Smartphone className="w-4 h-4" />, badge: 'Nuevo' },
  { id: 'clientes',    label: 'Clientes',    icon: <Store className="w-4 h-4" /> },
  { id: 'onboarding',  label: 'Onboarding',  icon: <Link2 className="w-4 h-4" /> },
  { id: 'precios',     label: 'Precios',     icon: <DollarSign className="w-4 h-4" /> },
  { id: 'autopilot',   label: 'Autopilot',   icon: <Radio className="w-4 h-4" /> },
];

// ─── Componente ───────────────────────────────────────────────
const SuperAdminDasheboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') as Section || 'overview';
  const [section, setSection] = useState<Section>(currentTab);

  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Sincronizar sección con la URL
  useEffect(() => {
    setSearchParams({ tab: section }, { replace: true });
  }, [section, setSearchParams]);

  // Cargar info del admin (la redirección la maneja el SuperAdminGuard en App.tsx)
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

  if (loading && negocios.length === 0) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-zinc-400">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando god-mode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-100 dark:bg-zinc-950 text-slate-900 dark:text-white flex overflow-hidden font-sans">

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════ SIDEBAR ══════════════════════ */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800
        flex flex-col transition-transform duration-300 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">God Mode</p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider">Korat Flow Admin</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        {adminInfo && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                {adminInfo.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-zinc-200 truncate">{adminInfo.nombre}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 truncate">{adminInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 text-left
                ${section === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {section === item.id && (
                <ChevronRight className="ml-auto w-3 h-3" />
              )}
            </button>
          ))}
        </nav>

        {/* Stats rápidas */}
        {stats && (
          <div className="p-4 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Clientes activos</span>
              <span className="text-emerald-400 font-bold">{stats.activos}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>MRR estimado</span>
              <span className="text-cyan-400 font-bold">${stats.mrr_total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Onboarding pendientes</span>
              <span className={stats.onboarding_pendientes > 0 ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
                {stats.onboarding_pendientes}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════ MAIN CONTENT ══════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-zinc-950">
        {/* Top bar */}
        <header className="h-14 bg-white/80 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 flex items-center px-4 gap-3 flex-shrink-0 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white p-1"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar salón o dueño..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all ${refreshing ? 'animate-spin' : ''}`}
              title="Refrescar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              {negocios.length} salones
            </div>
          </div>
        </header>

        {/* Contenido de la sección */}
        <main className="flex-1 overflow-y-auto">
          {section === 'overview' && stats && (
            <GodModeOverview
              negocios={negocios}
              stats={stats}
              onSelectCliente={(id) => { setSection('clientes'); }}
            />
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
      </div>
    </div>
  );
};

export default SuperAdminDasheboard;
