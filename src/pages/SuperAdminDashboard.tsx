/**
 * ============================================================
 * SUPER ADMIN DASHBOARD — Korat Flow God-Mode (Tree Hub Edition)
 * Arquitectura Jerárquica en Árbol (Raíz -> 4 Ramas -> 10 Nodos)
 * ============================================================
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, LayoutDashboard, Users, Link2, DollarSign,
  LogOut, RefreshCw, Search, ChevronRight, ChevronDown,
  Store, TrendingUp, Menu, X, Radio, Smartphone,
  MessageCircle, GitBranch, Sparkles, Layers, FlaskConical,
  FileText
} from 'lucide-react';
import { fetchNegocios, calcularStats, type GlobalStats } from '../services/godmode';
import type { NegocioAdmin } from '../types/godmode';
import { BottomSheet } from '../components/UI/BottomSheet';
import {
  SUPERADMIN_TREE_BRANCHES,
  resolveSuperAdminTreeRoute,
  type TreeBranchId,
  type TreeNodeId,
  type ActivacionSubTab,
  type SreSaludSubTab,
  type AutopilotSubTab,
} from '../core/navigation/superAdminTreeConfig';

// Sub-páginas del Árbol
import GodModeOverview from '../components/GodMode/GodModeOverview';
import GodModeClientes from '../components/GodMode/GodModeClientes';
import GodModeOnboarding from '../components/GodMode/GodModeOnboarding';
import GodModePrecios from '../components/GodMode/GodModePrecios';
import GodModeAutopilot from '../components/GodMode/GodModeAutopilot';
import { GodModeSoluciones } from '../components/GodMode/GodModeSoluciones';
import { GodModeTikTokAnalytics } from '../components/GodMode/GodModeTikTokAnalytics';
import { GodModeErrores } from '../components/GodMode/GodModeErrores';
import GodModeWhatsApp from '../components/GodMode/GodModeWhatsApp';
import GodModeSeguimiento from '../components/GodMode/GodModeSeguimiento';
import GodModeCentinelaSRE from '../components/GodMode/GodModeCentinelaSRE';

const BRANCH_ICONS: Record<TreeBranchId, React.ReactNode> = {
  root: <GitBranch className="w-4 h-4 text-emerald-600" />,
  salones: <Store className="w-4 h-4 text-blue-600" />,
  infraestructura: <MessageCircle className="w-4 h-4 text-emerald-600" />,
  autopilot: <Radio className="w-4 h-4 text-violet-600" />,
  comercial: <TrendingUp className="w-4 h-4 text-amber-600" />,
};

const NODE_ICONS: Record<TreeNodeId, React.ReactNode> = {
  overview: <LayoutDashboard className="w-4 h-4" />,
  clientes: <Store className="w-4 h-4" />,
  activacion: <Users className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  sre_salud: <ShieldAlert className="w-4 h-4" />,
  autopilot: <Radio className="w-4 h-4" />,
  autopilot_plantillas: <FileText className="w-4 h-4" />,
  autopilot_test: <FlaskConical className="w-4 h-4" />,
  precios: <DollarSign className="w-4 h-4" />,
  soluciones: <Smartphone className="w-4 h-4" />,
  tiktok_analytics: <TrendingUp className="w-4 h-4" />,
};

const BADGE_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  rose: 'bg-rose-100 text-rose-800 border-rose-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
};

const SuperAdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolver ruta actual en el árbol (compatible con URLs nuevas y legacy)
  const resolvedRoute = useMemo(
    () => resolveSuperAdminTreeRoute(searchParams.get('tab'), searchParams.get('view')),
    [searchParams]
  );

  const activeBranch = resolvedRoute.branch;
  const activeNode = resolvedRoute.node;

  // Sub-vistas locales sincronizadas con la ruta resuelta
  const [activacionSub, setActivacionSub] = useState<ActivacionSubTab>(
    resolvedRoute.activacionView || 'seguimiento'
  );
  const [sreSub, setSreSub] = useState<SreSaludSubTab>(
    resolvedRoute.sreView || 'centinela'
  );
  const [autopilotSub, setAutopilotSub] = useState<AutopilotSubTab>(
    resolvedRoute.autopilotView || 'monitor'
  );

  useEffect(() => {
    if (resolvedRoute.activacionView) setActivacionSub(resolvedRoute.activacionView);
    if (resolvedRoute.sreView) setSreSub(resolvedRoute.sreView);
    if (resolvedRoute.autopilotView) setAutopilotSub(resolvedRoute.autopilotView);
  }, [resolvedRoute]);

  // Estado de expansión de las 4 ramas en el Sidebar en Árbol
  const [expandedBranches, setExpandedBranches] = useState<Record<TreeBranchId, boolean>>({
    root: true,
    salones: true,
    infraestructura: true,
    autopilot: true,
    comercial: true,
  });

  // Asegurar que la rama activa siempre esté desplegada al navegar
  useEffect(() => {
    setExpandedBranches(prev =>
      prev[activeBranch.id] ? prev : { ...prev, [activeBranch.id]: true }
    );
  }, [activeBranch.id]);

  const [negocios, setNegocios] = useState<NegocioAdmin[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<{ nombre: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treeSheetOpen, setTreeSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Navegación centralizada hacia cualquier Nodo y Sub-vista del Árbol.
   * Preserva `salon` y `subtab` únicamente cuando el nodo destino es `clientes`.
   */
  const navigateToNode = useCallback(
    (nodeId: TreeNodeId, subView?: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', nodeId);
          if (subView) {
            next.set('view', subView);
          } else {
            next.delete('view');
          }
          if (nodeId !== 'clientes') {
            next.delete('salon');
            next.delete('subtab');
          }
          return next;
        },
        { replace: true }
      );
      setSidebarOpen(false);
      setTreeSheetOpen(false);
    },
    [setSearchParams]
  );

  /**
   * Abre directamente el expediente 360° de un salón en el Nodo 1.1 (`clientes`).
   */
  const navigateToSalon = useCallback(
    (salonId: string) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', 'clientes');
          next.delete('view');
          next.set('salon', salonId);
          if (!next.get('subtab')) {
            next.set('subtab', 'resumen');
          }
          return next;
        },
        { replace: true }
      );
      setSidebarOpen(false);
      setTreeSheetOpen(false);
    },
    [setSearchParams]
  );

  const toggleBranch = (branchId: TreeBranchId) => {
    setExpandedBranches(prev => ({ ...prev, [branchId]: !prev[branchId] }));
  };

  const allExpanded =
    expandedBranches.salones &&
    expandedBranches.infraestructura &&
    expandedBranches.autopilot &&
    expandedBranches.comercial;

  const toggleAllBranches = () => {
    const nextState = !allExpanded;
    setExpandedBranches({
      root: true,
      salones: nextState,
      infraestructura: nextState,
      autopilot: nextState,
      comercial: nextState,
    });
  };

  // Cargar info del admin
  useEffect(() => {
    const session = sessionStorage.getItem('korat_super_admin');
    if (session) {
      try {
        setAdminInfo(JSON.parse(session));
      } catch {
        /* ignore */
      }
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    sessionStorage.removeItem('korat_super_admin');
    window.location.href = '/god-mode';
  };

  const filteredNegocios = negocios.filter(
    n =>
      n.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.owner as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && negocios.length === 0) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-emerald-700">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold tracking-wide uppercase text-slate-600">
            Cargando Árbol Maestro SuperAdmin...
          </p>
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

      {/* ══════════════════════ SIDEBAR JERÁRQUICO EN ÁRBOL (DESKTOP) ══════════════════════ */}
      <aside
        className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 bg-white border-r border-emerald-100/80
        flex flex-col transition-transform duration-300 shadow-sm
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        {/* Logo & Tree Header */}
        <div className="p-4 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 to-teal-50/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <GitBranch className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  Korat God Mode
                </p>
                <p className="text-[10px] text-emerald-700 font-black uppercase tracking-wider">
                  Árbol de Control Total
                </p>
              </div>
            </div>
            <button
              onClick={toggleAllBranches}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/70 transition-colors cursor-pointer"
              title={allExpanded ? 'Contraer ramas' : 'Expandir todas las ramas'}
            >
              {allExpanded ? 'Contraer' : 'Expandir'}
            </button>
          </div>
        </div>

        {/* Admin info */}
        {adminInfo && (
          <div className="px-4 py-2.5 border-b border-emerald-50/80 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center shadow-2xs">
                {adminInfo.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{adminInfo.nombre}</p>
                <p className="text-[10px] text-slate-500 truncate">{adminInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navegación en Árbol (Raíz + 4 Ramas Desplegables) ── */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {/* NODO RAÍZ (0.1) */}
          <button
            onClick={() => navigateToNode('overview')}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black
              transition-all duration-150 text-left cursor-pointer
              ${
                activeNode.id === 'overview'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-emerald-50/60 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-200/70'
              }
            `}
          >
            <GitBranch
              className={`w-4 h-4 flex-shrink-0 ${
                activeNode.id === 'overview' ? 'text-white' : 'text-emerald-600'
              }`}
            />
            <span className="font-mono text-[10px] opacity-80">0.1</span>
            <span className="flex-1 truncate">Centro de Mando (Raíz)</span>
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                activeNode.id === 'overview'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-200/80 text-emerald-900'
              }`}
            >
              Root
            </span>
          </button>

          {/* 4 RAMAS MAESTRAS */}
          {SUPERADMIN_TREE_BRANCHES.filter(b => b.id !== 'root').map(branch => {
            const isBranchActive = activeBranch.id === branch.id;
            const isExpanded = expandedBranches[branch.id];

            return (
              <div
                key={branch.id}
                className={`rounded-xl border transition-all ${
                  isBranchActive
                    ? 'border-emerald-200/90 bg-emerald-50/20'
                    : 'border-slate-100 bg-white'
                }`}
              >
                {/* Cabecera de la Rama */}
                <button
                  type="button"
                  onClick={() => toggleBranch(branch.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50/80 rounded-t-xl transition-colors cursor-pointer"
                >
                  {BRANCH_ICONS[branch.id]}
                  <span className="text-[11px] font-black text-slate-800 flex-1 truncate">
                    {branch.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {branch.nodes.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Nodos Hijos con líneas de árbol ├─ y └─ */}
                {isExpanded && (
                  <div className="px-2 pb-2 pt-0.5 space-y-1">
                    {branch.nodes.map((node, idx) => {
                      const isNodeActive = activeNode.id === node.id;
                      const isLast = idx === branch.nodes.length - 1;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => navigateToNode(node.id)}
                          className={`
                            w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs
                            transition-all duration-150 text-left group cursor-pointer
                            ${
                              isNodeActive
                                ? 'bg-emerald-600 text-white font-black shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-bold'
                            }
                          `}
                        >
                          <span
                            className={`font-mono text-[11px] select-none ${
                              isNodeActive ? 'text-emerald-200' : 'text-slate-300'
                            }`}
                          >
                            {isLast ? '└─' : '├─'}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1 py-0.2 rounded ${
                              isNodeActive
                                ? 'bg-white/20 text-white font-black'
                                : 'bg-slate-100 text-slate-600 font-bold'
                            }`}
                          >
                            {node.code}
                          </span>
                          <span className="flex-1 truncate">{node.label}</span>
                          {node.badge && (
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                                isNodeActive
                                  ? 'bg-white/20 text-white border-white/30'
                                  : BADGE_STYLES[node.badgeColor || 'emerald']
                              }`}
                            >
                              {node.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Stats rápidas Sidebar */}
        {stats && (
          <div className="p-3.5 border-t border-emerald-50 bg-emerald-50/20 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Salones activos</span>
              <span className="text-emerald-700 font-black px-2 py-0.5 rounded-md bg-emerald-100/80">
                {stats.activos} / {stats.total_clientes}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>MRR estimado</span>
              <span className="text-slate-900 font-black">
                S/. {Math.round(stats.mrr_total).toLocaleString('es-PE')}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t border-emerald-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════ MAIN CONTENT AREA ══════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Top Header Bar */}
        <header className="h-14 bg-white/95 border-b border-emerald-100/80 flex items-center px-4 gap-3 flex-shrink-0 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb del Árbol Activo (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <button
              onClick={() => navigateToNode('overview')}
              className="font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Raíz</span>
            </button>
            {activeNode.id !== 'overview' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-slate-600">{activeBranch.shortLabel}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {activeNode.code}
                </span>
                <span className="font-black text-slate-900">{activeNode.label}</span>
              </>
            )}
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-xs relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar salón o dueño..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                if (e.target.value && activeNode.id !== 'clientes') {
                  navigateToNode('clientes');
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sibling Quick Switcher (Nodos hermanos de la misma Rama) */}
          {activeBranch.nodes.length > 1 && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
              {activeBranch.nodes.map(sibling => (
                <button
                  key={sibling.id}
                  onClick={() => navigateToNode(sibling.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    sibling.id === activeNode.id
                      ? 'bg-white text-emerald-800 shadow-2xs font-black'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{sibling.code}</span>
                  <span>{sibling.shortLabel}</span>
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-emerald-50 border border-slate-200/80 transition-all cursor-pointer ${
                refreshing ? 'animate-spin text-emerald-600' : ''
              }`}
              title="Refrescar datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigateToNode('clientes')}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Ir al Directorio de Salones (Nodo 1.1)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{negocios.length} salones</span>
            </button>
          </div>
        </header>

        {/* Dynamic Tree Node Content */}
        <main className="flex-1 overflow-y-auto pb-28 lg:pb-8">
          {/* ── NODO 0.1: RAÍZ (OVERVIEW & MAPA DEL ÁRBOL) ── */}
          {activeNode.id === 'overview' && stats && (
            <GodModeOverview
              negocios={negocios}
              stats={stats}
              onSelectCliente={id => navigateToSalon(id)}
              onNavigateNode={(nodeId, subView) => navigateToNode(nodeId, subView)}
            />
          )}

          {/* ── NODO 1.1: DIRECTORIO & EXPEDIENTE 360° DE SALONES ── */}
          {activeNode.id === 'clientes' && (
            <GodModeClientes
              negocios={filteredNegocios}
              searchTerm={searchTerm}
              onReload={loadData}
            />
          )}

          {/* ── NODO 1.2: EMBUDO DE ACTIVACIÓN & ONBOARDING (UNIFICADO) ── */}
          {activeNode.id === 'activacion' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
              <div className="bg-white border border-blue-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-black text-[10px]">
                      Rama 1 · Nodo 1.2
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      Embudo de Activación & Links de Invitación
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitorea qué salones ya crearon sus servicios, clientas y citas, o genera links de invitación mágica.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center">
                  <button
                    onClick={() => navigateToNode('activacion', 'seguimiento')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activacionSub === 'seguimiento'
                        ? 'bg-white text-blue-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>1.2.A · Embudo Paso a Paso</span>
                  </button>
                  <button
                    onClick={() => navigateToNode('activacion', 'onboarding')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activacionSub === 'onboarding'
                        ? 'bg-white text-blue-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>1.2.B · Links & Tokens</span>
                  </button>
                </div>
              </div>

              {activacionSub === 'seguimiento' ? (
                <GodModeSeguimiento negocios={negocios} onReload={loadData} />
              ) : (
                <GodModeOnboarding onReload={loadData} />
              )}
            </div>
          )}

          {/* ── NODO 2.1: INSTANCIAS WHATSAPP & EVOLUTION API ── */}
          {activeNode.id === 'whatsapp' && (
            <GodModeWhatsApp negocios={negocios} onReload={loadData} />
          )}

          {/* ── NODO 2.2: CENTRO SRE & AUDITORÍA DE ERRORES (UNIFICADO) ── */}
          {activeNode.id === 'sre_salud' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
              <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono font-black text-[10px]">
                      Rama 2 · Nodo 2.2
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      Centro SRE & Auditoría de Errores en Tiempo Real
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salud de agenda 7:00 AM, horas punta de citas y consola en vivo de fallos técnicos.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-center">
                  <button
                    onClick={() => navigateToNode('sre_salud', 'centinela')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      sreSub === 'centinela'
                        ? 'bg-white text-emerald-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>2.2.A · Agente Centinela SRE</span>
                  </button>
                  <button
                    onClick={() => navigateToNode('sre_salud', 'errores')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      sreSub === 'errores'
                        ? 'bg-white text-rose-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>2.2.B · Consola de Errores</span>
                  </button>
                </div>
              </div>

              {sreSub === 'centinela' ? (
                <GodModeCentinelaSRE />
              ) : (
                <GodModeErrores
                  negocios={negocios.map(n => ({ id: n.id, nombre: n.nombre }))}
                />
              )}
            </div>
          )}

          {/* ── RAMA 3 (NODOS 3.1, 3.2, 3.3): MOTOR AUTOPILOT & PLANTILLAS ── */}
          {(activeNode.id === 'autopilot' ||
            activeNode.id === 'autopilot_plantillas' ||
            activeNode.id === 'autopilot_test') && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-3">
              <div className="bg-white border border-violet-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-800 font-mono font-black text-[10px]">
                      Rama 3 · Nodo {activeNode.code}
                    </span>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      {activeNode.label}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{activeNode.description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => navigateToNode('autopilot', 'monitor')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeNode.id === 'autopilot'
                        ? 'bg-white text-violet-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3.1 · Flujos & Horarios
                  </button>
                  <button
                    onClick={() => navigateToNode('autopilot_plantillas', 'templates')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeNode.id === 'autopilot_plantillas'
                        ? 'bg-white text-violet-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3.2 · Plantillas & Club Glow
                  </button>
                  <button
                    onClick={() => navigateToNode('autopilot_test', 'test')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeNode.id === 'autopilot_test'
                        ? 'bg-white text-violet-700 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3.3 · Simulador
                  </button>
                </div>
              </div>

              <GodModeAutopilot
                negocios={negocios.map(n => ({
                  id: n.id,
                  nombre: n.nombre,
                  slug: (n as any).slug,
                }))}
                initialTab={autopilotSub}
              />
            </div>
          )}

          {/* ── NODO 4.1: PLANES & PRECIOS SAAS ── */}
          {activeNode.id === 'precios' && <GodModePrecios />}

          {/* ── NODO 4.2: CATÁLOGO & ADD-ONS ── */}
          {activeNode.id === 'soluciones' && <GodModeSoluciones />}

          {/* ── NODO 4.3: TIKTOK & TRÁFICO EN VIVO ── */}
          {activeNode.id === 'tiktok_analytics' && (
            <div className="p-3 sm:p-6 max-w-7xl mx-auto">
              <GodModeTikTokAnalytics />
            </div>
          )}
        </main>

        {/* ══════════════════════════════════════════════════════════
            NATIVE APP BOTTOM NAVIGATION BAR (MÓVIL - 4 RAMAS + ÁRBOL)
        ══════════════════════════════════════════════════════════ */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 border-t border-emerald-100 backdrop-blur-xl z-40 px-2 py-1.5 shadow-[0_-4px_24px_rgba(16,185,129,0.08)] flex items-center justify-around">
          {/* Slot 1: Raíz (0.1) */}
          <button
            onClick={() => navigateToNode('overview')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              activeNode.id === 'overview'
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeNode.id === 'overview'
                  ? 'bg-emerald-100/80 text-emerald-700 shadow-xs'
                  : ''
              }`}
            >
              <GitBranch className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Raíz</span>
          </button>

          {/* Slot 2: Rama 1 · Salones (1.1) */}
          <button
            onClick={() => navigateToNode('clientes')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              activeBranch.id === 'salones'
                ? 'text-blue-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeBranch.id === 'salones' ? 'bg-blue-100/80 text-blue-700 shadow-xs' : ''
              }`}
            >
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Salones</span>
          </button>

          {/* Slot 3: Rama 2 · WhatsApp & SRE (2.1) */}
          <button
            onClick={() => navigateToNode('whatsapp')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              activeBranch.id === 'infraestructura'
                ? 'text-emerald-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeBranch.id === 'infraestructura'
                  ? 'bg-emerald-100/80 text-emerald-700 shadow-xs'
                  : ''
              }`}
            >
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">WA / SRE</span>
          </button>

          {/* Slot 4: Rama 3 · Autopilot (3.1) */}
          <button
            onClick={() => navigateToNode('autopilot')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 ${
              activeBranch.id === 'autopilot'
                ? 'text-violet-700 font-black'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeBranch.id === 'autopilot'
                  ? 'bg-violet-100/80 text-violet-700 shadow-xs'
                  : ''
              }`}
            >
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Autopilot</span>
          </button>

          {/* Slot 5: Árbol Completo (BottomSheet) */}
          <button
            onClick={() => setTreeSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 active:scale-95 relative ${
              activeBranch.id === 'comercial'
                ? 'text-amber-700 font-black'
                : 'text-slate-500 hover:text-slate-700 font-bold'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeBranch.id === 'comercial'
                  ? 'bg-amber-100/80 text-amber-700 shadow-xs'
                  : 'bg-slate-100'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Árbol</span>
          </button>
        </nav>

        {/* ══════════════════════════════════════════════════════════
            BOTTOM SHEET DRAWER: MAPA COMPLETO DEL ÁRBOL EN MÓVIL
        ══════════════════════════════════════════════════════════ */}
        <BottomSheet
          isOpen={treeSheetOpen}
          onClose={() => setTreeSheetOpen(false)}
          title="🌳 Árbol Maestro SuperAdmin"
          maxHeight="82dvh"
        >
          <div className="space-y-3 p-1 font-sans">
            <p className="text-xs text-slate-500 font-medium px-1">
              Selecciona cualquier rama o nodo del ecosistema:
            </p>

            {SUPERADMIN_TREE_BRANCHES.map(branch => (
              <div
                key={branch.id}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden"
              >
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  {BRANCH_ICONS[branch.id]}
                  <span className="text-xs font-black text-slate-900">{branch.label}</span>
                </div>
                <div className="p-2 space-y-1.5">
                  {branch.nodes.map((node, idx) => {
                    const isNodeActive = activeNode.id === node.id;
                    const isLast = idx === branch.nodes.length - 1;
                    return (
                      <button
                        key={node.id}
                        onClick={() => navigateToNode(node.id)}
                        className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                          isNodeActive
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                            : 'bg-white border-slate-100 hover:border-emerald-200 text-slate-800'
                        }`}
                      >
                        <span className="font-mono text-xs text-slate-300">
                          {isLast ? '└─' : '├─'}
                        </span>
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {node.code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">
                            {node.label}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {node.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Logout en Modal */}
            <div className="pt-2 border-t border-slate-100">
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
