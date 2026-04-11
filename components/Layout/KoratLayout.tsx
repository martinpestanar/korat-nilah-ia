
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Leaf, MessageCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface KoratLayoutProps {
    children: React.ReactNode;
}

const WHATSAPP_NUMBER = '51926285289';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Me interesa conocer más sobre los servicios de Korat Flow')}`;

const KoratLayout: React.FC<KoratLayoutProps> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const navLinks = [
        { to: '/', label: 'Inicio' },
        { to: '/nosotros', label: 'Nosotros' },
        { to: '/nilah', label: 'Nilah IA' },
        { to: '/contacto', label: 'Contacto' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="force-hardcoded-violet h-[100dvh] overflow-y-auto overflow-x-hidden bg-[#F8FAF8] dark:bg-[#060E06] text-gray-900 dark:text-white font-sans">
            {/* === NAVBAR === */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'border-b border-emerald-100/50 bg-white/85 backdrop-blur-lg shadow-sm dark:border-emerald-500/10 dark:bg-[#060E06]/85'
                : 'bg-transparent'
                }`}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <Leaf className="h-7 w-7 text-emerald-500 transition-transform group-hover:rotate-12" />
                            <div className="absolute inset-0 h-7 w-7 rounded-full bg-emerald-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-xl font-bold">Korat Flow</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden items-center gap-8 md:flex">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium transition-colors ${isActive(link.to)
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2.5 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden md:inline-flex btn-cta-primary rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105 items-center gap-2"
                        >
                            <MessageCircle size={16} />
                            Hablemos
                        </a>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                <div
                    className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-[#060E06] border-b border-gray-100 dark:border-white/10 shadow-2xl transition-[opacity,transform] duration-300 ease-out origin-top ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
                >
                    <div className="p-4 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block w-full text-left py-3.5 px-4 rounded-xl text-base font-semibold transition-all ${isActive(link.to)
                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-2 pb-1">
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full btn-cta-primary flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25"
                            >
                                <MessageCircle size={18} />
                                Hablemos por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            <main>{children}</main>

            {/* === FLOATING WHATSAPP BUTTON === */}
            <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:scale-110 transition-transform group"
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
                                <span className="text-2xl font-bold">Korat Flow</span>
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
                                        className="h-10 w-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
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
                                <li><Link to="/nosotros" className="hover:text-emerald-400 transition-colors">Nosotros</Link></li>
                                <li><Link to="/contacto" className="hover:text-emerald-400 transition-colors">Contacto</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-400/80">Productos</h4>
                            <ul className="space-y-3 text-emerald-100/50">
                                <li><Link to="/nilah" className="hover:text-emerald-400 transition-colors">Nilah IA</Link></li>
                                <li><Link to="/nilah/login" className="hover:text-emerald-400 transition-colors">Iniciar Sesión</Link></li>
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
