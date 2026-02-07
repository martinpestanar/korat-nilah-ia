/**
 * ===========================================
 * ProFeature Component
 * ===========================================
 * 
 * Componente wrapper que controla la visibilidad de features Pro.
 * Si el usuario no tiene acceso a la feature, muestra un banner de upgrade.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserFeatures } from '../types';

interface ProFeatureProps {
    /** Nombre de la feature a verificar (debe coincidir con UserFeatures) */
    featureName: keyof UserFeatures;
    /** Contenido a mostrar si el usuario tiene acceso */
    children: React.ReactNode;
    /** Modo de fallback: 'banner' muestra upgrade, 'hidden' no muestra nada, 'blur' muestra contenido borroso */
    fallback?: 'banner' | 'hidden' | 'blur';
    /** Título personalizado para el banner */
    bannerTitle?: string;
    /** Descripción personalizada para el banner */
    bannerDescription?: string;
}

const ProFeature: React.FC<ProFeatureProps> = ({
    featureName,
    children,
    fallback = 'banner',
    bannerTitle,
    bannerDescription,
}) => {
    const { features, isPro } = useAuth();

    // Verificar si el usuario tiene acceso a esta feature
    const hasAccess = features?.[featureName] ?? false;

    // Si tiene acceso, renderizar el contenido normalmente
    if (hasAccess) {
        return <>{children}</>;
    }

    // Mapeo de nombres de features a títulos legibles
    const featureTitles: Record<keyof UserFeatures, string> = {
        ai_insights: 'Insights de IA',
        marketing_module: 'Módulo de Marketing',
        advanced_reports: 'Reportes Avanzados',
        client_rescue: 'Rescate de Clientes',
        financial_forecast: 'Pronóstico Financiero',
        custom_branding: 'Marca Personalizada',
        api_access: 'Acceso a API',
        priority_support: 'Soporte Prioritario',
    };

    const title = bannerTitle || `${featureTitles[featureName]} - Función Pro`;
    const description = bannerDescription ||
        `Actualiza a Pro para desbloquear ${featureTitles[featureName].toLowerCase()} y potenciar tu negocio.`;

    // Fallback: hidden - no mostrar nada
    if (fallback === 'hidden') {
        return null;
    }

    // Fallback: blur - mostrar contenido borroso con overlay
    if (fallback === 'blur') {
        return (
            <div style={{ position: 'relative' }}>
                <div style={{
                    filter: 'blur(4px)',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    userSelect: 'none'
                }}>
                    {children}
                </div>
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                }}>
                    <UpgradeBanner title={title} description={description} compact />
                </div>
            </div>
        );
    }

    // Fallback: banner - mostrar banner de upgrade (default)
    return <UpgradeBanner title={title} description={description} />;
};

// Componente interno para el banner de upgrade
interface UpgradeBannerProps {
    title: string;
    description: string;
    compact?: boolean;
}

const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ title, description, compact = false }) => {
    const handleUpgradeClick = () => {
        // TODO: Implementar lógica de redirección a página de upgrade
        window.location.hash = '#/app/settings';
    };

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: compact ? '12px' : '16px',
                padding: compact ? '16px 20px' : '24px 32px',
                display: 'flex',
                flexDirection: compact ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: compact ? '16px' : '12px',
                textAlign: compact ? 'left' : 'center',
            }}
        >
            {/* Icono de candado/corona */}
            <div
                style={{
                    width: compact ? '40px' : '56px',
                    height: compact ? '40px' : '56px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <svg
                    width={compact ? '20' : '28'}
                    height={compact ? '20' : '28'}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            </div>

            <div style={{ flex: 1 }}>
                <h4
                    style={{
                        margin: 0,
                        fontSize: compact ? '14px' : '18px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                    }}
                >
                    {title}
                </h4>
                <p
                    style={{
                        margin: 0,
                        fontSize: compact ? '12px' : '14px',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    {description}
                </p>
            </div>

            <button
                onClick={handleUpgradeClick}
                style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: compact ? '8px 16px' : '12px 24px',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: compact ? '12px' : '14px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                ⚡ Upgrade a Pro
            </button>
        </div>
    );
};

export default ProFeature;
