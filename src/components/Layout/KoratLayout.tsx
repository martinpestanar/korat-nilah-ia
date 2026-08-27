
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Leaf, MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface KoratLayoutProps {
    children: React.ReactNode;
}

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero saber más sobre cómo pueden ayudar a mi negocio')}`;

const KoratLayout: React.FC<KoratLayoutProps> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const menuRef = useRef<HTMLDivElement>(null);

    // Scroll listener — passive for performance
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change + scroll to top
    useEffect(() => {
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    // Close menu when tapping outside
    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleOutside = (e: TouchEvent | MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('touchstart', handleOutside, { passive: true });
        document.addEventListener('mousedown', handleOutside);
        return () => {
            document.removeEventListener('touchstart', handleOutside);
            document.removeEventListener('mousedown', handleOutside);
        };
    }, [mobileMenuOpen]);

    // Lock body scroll when menu open (prevents background scroll on iOS)
    useEffect(() => {
        if (mobileMenuOpen) {
            document.documentElement.classList.add('bottom-sheet-open');
        } else {
            document.documentElement.classList.remove('bottom-sheet-open');
        }
        return () => { document.documentElement.classList.remove('bottom-sheet-open'); };
    }, [mobileMenuOpen]);

    const navLinks = [
        { to: '/', label: 'Inicio' },
        { to: '/nilah', label: 'Nilah IA — Salones' },
        { to: '/mi-negocio', label: 'Para mi negocio' },
        { to: '/nosotros', label: 'Nosotros' },
    ];

    const isActive = (path: string) => location.pathname === path;
    const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

    return (
        // Use normal document flow — NO custom scroll container (kills native momentum scroll on iOS)
        <div className="force-hardcoded-violet bg-[#F8FAF8] dark:bg-[#060E06] text-gray-900 dark:text-white font-sans overflow-x-hidden">

            {/* === NAVBAR === */}
            <nav
                ref={menuRef}
                className={`fixed top-0 left-0 right-0 z-50 ${
                    scrolled
                        ? 'border-b border-emerald-100/50 dark:border-emerald-500/10 shadow-sm'
                        : ''
                }`}
                style={{
                    // Use background inline to avoid triggering CSS transitions on every paint
                    background: scrolled
                        ? theme === 'dark'
                            ? 'rgba(6,14,6,0.92)'
                            : 'rgba(255,255,255,0.88)'
                        : 'transparent',
                    // backdrop-blur only when scrolled and on non-mobile (costly on mobile)
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                    WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
                    transition: 'background 200ms ease, box-shadow 200ms ease',
                }}
            >
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-6 md:py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2" style={{ WebkitTapHighlightColor: 'transparent' }}>
                        <Leaf className="h-6 w-6 text-emerald-500" />
                        <span className="text-lg font-bold">Korat Flow</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium ${isActive(link.to)
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
                                }`}
                                style={{ transition: 'color 150ms ease' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2.5 text-gray-500 dark:text-gray-400"
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                transition: 'color 150ms ease',
                            }}
                            aria-label="Cambiar tema"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25"
                            style={{ transition: 'transform 150ms ease, box-shadow 150ms ease' }}
                        >
                            <MessageCircle size={15} />
                            Hablemos
                        </a>
                        {/* Hamburger — large tap target */}
                        <button
                            onClick={() => setMobileMenuOpen(prev => !prev)}
                            className="md:hidden flex items-center justify-center rounded-xl p-2.5 text-gray-600 dark:text-gray-300"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={mobileMenuOpen}
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    transition: 'transform 200ms ease, opacity 200ms ease',
                                    transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                                }}
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ===== MOBILE MENU — full sheet, GPU-accelerated ===== */}
                <div
                    aria-hidden={!mobileMenuOpen}
                    style={{
                        // GPU-layer — use transform+opacity (compositor thread, no layout/paint)
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: theme === 'dark' ? '#060E06' : '#ffffff',
                        borderBottom: theme === 'dark'
                            ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                        transform: mobileMenuOpen ? 'translateY(0)' : 'translateY(-8px)',
                        opacity: mobileMenuOpen ? 1 : 0,
                        pointerEvents: mobileMenuOpen ? 'auto' : 'none',
                        // Use will-change so browser promotes to GPU layer from the start
                        willChange: 'transform, opacity',
                        transition: 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1), opacity 150ms ease',
                    }}
                >
                    <div className="p-3 space-y-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={closeMobileMenu}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                                className={`flex items-center w-full py-3.5 px-4 rounded-2xl text-[0.95rem] font-semibold active:opacity-70 ${
                                    isActive(link.to)
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                }`}
                            >
                                {link.label}
                                {isActive(link.to) && (
                                    <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                                )}
                            </Link>
                        ))}
                        <div className="pt-1 pb-1.5">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobileMenu}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-4 text-[0.95rem] font-bold text-white shadow-lg shadow-emerald-500/20 active:opacity-80"
                            >
                                <MessageCircle size={18} />
                                Hablemos por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content — normal flow, native browser scroll */}
            <main>{children}</main>

            {/* === FLOATING WHATSAPP BUTTON === */}
            <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                className="fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 active:scale-95"
                title="Contáctanos por WhatsApp"
            >
                <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#060E06] animate-pulse" />
            </a>

            {/* === FOOTER === */}
            <footer className="bg-[#0A1F0A] text-white py-16 border-t border-emerald-900/30">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="grid gap-12 md:grid-cols-4">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Leaf className="text-emerald-400" size={28} />
                                <span className="text-xl font-bold tracking-tight">Korat Flow</span>
                            </div>
                            <p className="text-emerald-100/60 max-w-xs mb-6">
                                Creamos automatizaciones inteligentes con IA para negocios de servicios en Latinoamérica.
                            </p>
                            <div className="flex gap-3">
                                {[
                                    { name: 'Instagram', href: '#' },
                                    { name: 'LinkedIn', href: '#' },
                                ].map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        className="h-10 w-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400/60"
                                    >
                                        <span className="sr-only">{social.name}</span>
                                        <MessageCircle size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-400/80">Empresa</h4>
                            <ul className="space-y-3 text-emerald-100/50">
                                <li><Link to="/nosotros" className="hover:text-emerald-400">Nosotros</Link></li>
                                <li><Link to="/contacto" className="hover:text-emerald-400">Contacto</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-400/80">Productos</h4>
                            <ul className="space-y-3 text-emerald-100/50">
                                <li><Link to="/nilah" className="hover:text-emerald-400">Nilah IA</Link></li>
                                <li><Link to="/nilah/login" className="hover:text-emerald-400">Iniciar Sesión</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-emerald-900/30 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-emerald-100/30">© {new Date().getFullYear()} Korat Flow. Todos los derechos reservados.</p>
                        <p className="text-sm text-emerald-100/30">Hecho con 💚 en Perú para Latinoamérica</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default KoratLayout;
