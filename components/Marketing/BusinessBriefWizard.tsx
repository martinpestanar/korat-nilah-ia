/**
 * BusinessBriefWizard Component
 * Formulario multi-step para capturar información del negocio
 */

import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Building2,
    DollarSign,
    Scissors,
    Users,
    Target,
    Palette,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2
} from 'lucide-react';
import { business } from '../../services/api';

interface BriefData {
    businessId: string;
    businessName: string;
    businessType: string;
    yearsOperating: number;
    monthlyRevenue: string;
    avgTicket: number;
    activeClients: number;
    topService1: string;
    topService2: string;
    premiumService: string;
    hookService: string;
    targetGender: string;
    targetAge: string;
    preferredChannel: string;
    weakDay: string;
    mainChallenge: string;
    brandWords: string;
    brandColor: string;
}

interface BusinessBriefWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: BriefData) => void;
    businessId: string;
}

const INITIAL_DATA: BriefData = {
    businessId: '',
    businessName: '',
    businessType: 'salon',
    yearsOperating: 1,
    monthlyRevenue: '5000-15000',
    avgTicket: 50,
    activeClients: 50,
    topService1: '',
    topService2: '',
    premiumService: '',
    hookService: '',
    targetGender: 'mujeres',
    targetAge: '25-45',
    preferredChannel: 'whatsapp',
    weakDay: 'martes',
    mainChallenge: '',
    brandWords: '',
    brandColor: '#E91E63'
};

const STEPS = [
    { id: 1, title: 'Tu Negocio', icon: Building2 },
    { id: 2, title: 'Finanzas', icon: DollarSign },
    { id: 3, title: 'Servicios', icon: Scissors },
    { id: 4, title: 'Clientes', icon: Users },
    { id: 5, title: 'Objetivos', icon: Target },
    { id: 6, title: 'Marca', icon: Palette },
];

const BusinessBriefWizard: React.FC<BusinessBriefWizardProps> = ({
    isOpen,
    onClose,
    onComplete,
    businessId
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<BriefData>({ ...INITIAL_DATA, businessId });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    // Load existing brief data when modal opens
    useEffect(() => {
        const loadExistingBrief = async () => {
            if (!isOpen) return;

            setIsLoading(true);
            try {
                // Try to load from n8n first
                const response = await business.getBrief(businessId);
                const serverBrief = response?.brief || response;

                if (serverBrief && serverBrief.businessName) {
                    setIsUpdateMode(true);
                    // Map API response to local state format
                    // La respuesta de n8n viene en camelCase igual que nuestro estado local
                    setData({
                        businessId: serverBrief.businessId || businessId,
                        businessName: serverBrief.businessName || '',
                        businessType: serverBrief.businessType || 'salon',
                        yearsOperating: Number(serverBrief.yearsOperating) || 1,
                        monthlyRevenue: serverBrief.monthlyRevenue || '5000-15000',
                        avgTicket: Number(serverBrief.avgTicket) || 50,
                        activeClients: Number(serverBrief.activeClients) || 50,
                        topService1: serverBrief.topService1 || '',
                        topService2: serverBrief.topService2 || '',
                        premiumService: serverBrief.premiumService || '',
                        hookService: serverBrief.hookService || '',
                        targetGender: serverBrief.targetGender || 'mujeres',
                        targetAge: serverBrief.targetAge || '25-45',
                        preferredChannel: serverBrief.preferredChannel || 'whatsapp',
                        weakDay: serverBrief.weakDay || 'martes',
                        mainChallenge: serverBrief.mainChallenge || '',
                        brandWords: serverBrief.brandWords || '',
                        brandColor: serverBrief.brandColor || '#E91E63'
                    });
                    console.log('Loaded brief from n8n');
                }
            } catch (err) {
                // Fallback to localStorage
                const localBrief = localStorage.getItem(`business_brief_${businessId}`);
                if (localBrief) {
                    setData(JSON.parse(localBrief));
                    console.log('Loaded brief from localStorage');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadExistingBrief();
    }, [isOpen, businessId]);

    const updateData = (field: keyof BriefData, value: string | number) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < 6) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        // Always save locally first (for offline/CORS fallback)
        localStorage.setItem(`business_brief_${businessId}`, JSON.stringify(data));

        try {
            if (isUpdateMode) {
                await business.updateBrief(data);
                console.log('Brief updated (PUT) successfully');
            } else {
                await business.saveBrief(data);
                console.log('Brief created (POST) successfully');
            }
        } catch (err) {
            console.warn('Could not save to n8n (CORS?), but saved locally:', err);
        }

        // Always complete regardless of API
        setIsSubmitting(false);
        onComplete(data);
        onClose();
    };

    if (!isOpen) return null;


    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Tu Negocio
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre de tu negocio *
                            </label>
                            <input
                                type="text"
                                value={data.businessName}
                                onChange={(e) => updateData('businessName', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                placeholder="Ej: Spa Bella"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tipo de negocio
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'salon', label: '💅 Salón de Belleza' },
                                    { value: 'spa', label: '🧖 Spa' },
                                    { value: 'barberia', label: '💈 Barbería' },
                                    { value: 'estetica', label: '✨ Estética' },
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => updateData('businessType', type.value)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${data.businessType === type.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿Cuántos años llevas operando?
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.yearsOperating}
                                onChange={(e) => updateData('yearsOperating', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                );

            case 2: // Finanzas
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Facturación mensual promedio (S/.)
                            </label>
                            <select
                                value={data.monthlyRevenue}
                                onChange={(e) => updateData('monthlyRevenue', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="0-5000">Menos de S/. 5,000</option>
                                <option value="5000-15000">S/. 5,000 - 15,000</option>
                                <option value="15000-30000">S/. 15,000 - 30,000</option>
                                <option value="30000-50000">S/. 30,000 - 50,000</option>
                                <option value="50000+">Más de S/. 50,000</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ticket promedio por cliente (S/.)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.avgTicket}
                                onChange={(e) => updateData('avgTicket', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: 80"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿Cuántos clientes activos tienes?
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.activeClients}
                                onChange={(e) => updateData('activeClients', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: 150"
                            />
                            <p className="text-xs text-gray-500 mt-1">Clientes que han venido en los últimos 3 meses</p>
                        </div>
                    </div>
                );

            case 3: // Servicios
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tu servicio más vendido (#1) *
                            </label>
                            <input
                                type="text"
                                value={data.topService1}
                                onChange={(e) => updateData('topService1', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: Manicura gel"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Segundo servicio más vendido (#2)
                            </label>
                            <input
                                type="text"
                                value={data.topService2}
                                onChange={(e) => updateData('topService2', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: Pedicura spa"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Servicio premium (el más caro)
                            </label>
                            <input
                                type="text"
                                value={data.premiumService}
                                onChange={(e) => updateData('premiumService', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: Facial premium con oro"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Servicio "gancho" (económico, para atraer)
                            </label>
                            <input
                                type="text"
                                value={data.hookService}
                                onChange={(e) => updateData('hookService', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                placeholder="Ej: Manicura básica"
                            />
                        </div>
                    </div>
                );

            case 4: // Clientes
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿A quién atiendes principalmente?
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'mujeres', label: '👩 Mujeres' },
                                    { value: 'hombres', label: '👨 Hombres' },
                                    { value: 'ambos', label: '👥 Ambos' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateData('targetGender', opt.value)}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${data.targetGender === opt.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-dark-border'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Rango de edad principal
                            </label>
                            <select
                                value={data.targetAge}
                                onChange={(e) => updateData('targetAge', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            >
                                <option value="18-25">18 - 25 años</option>
                                <option value="25-35">25 - 35 años</option>
                                <option value="25-45">25 - 45 años</option>
                                <option value="35-50">35 - 50 años</option>
                                <option value="45+">45+ años</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿Por dónde prefieren contactarte?
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'whatsapp', label: '📱 WhatsApp' },
                                    { value: 'instagram', label: '📸 Instagram' },
                                    { value: 'llamada', label: '📞 Llamada' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateData('preferredChannel', opt.value)}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${data.preferredChannel === opt.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-dark-border'
                                            }`}
                                    >
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 5: // Objetivos
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿Qué día de la semana tiene menos citas?
                            </label>
                            <select
                                value={data.weakDay}
                                onChange={(e) => updateData('weakDay', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            >
                                <option value="lunes">Lunes</option>
                                <option value="martes">Martes</option>
                                <option value="miercoles">Miércoles</option>
                                <option value="jueves">Jueves</option>
                                <option value="viernes">Viernes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Nilah te ayudará a llenar ese día</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿Cuál es tu mayor reto actualmente? *
                            </label>
                            <select
                                value={data.mainChallenge}
                                onChange={(e) => updateData('mainChallenge', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                            >
                                <option value="">Selecciona una opción</option>
                                <option value="llenar_horas_muertas">Llenar horas muertas entre semana</option>
                                <option value="atraer_nuevos">Atraer clientes nuevos</option>
                                <option value="recuperar_inactivos">Recuperar clientes que dejaron de venir</option>
                                <option value="vender_premium">Vender más servicios premium</option>
                                <option value="competencia">Diferenciarse de la competencia</option>
                                <option value="redes_sociales">Mejorar presencia en redes</option>
                            </select>
                        </div>
                    </div>
                );

            case 6: // Marca
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                3 palabras que describan tu marca
                            </label>
                            <input
                                type="text"
                                value={data.brandWords}
                                onChange={(e) => updateData('brandWords', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                                placeholder="Ej: premium, cercano, confiable"
                            />
                            <p className="text-xs text-gray-500 mt-1">Separadas por coma</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Color principal de tu marca
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={data.brandColor}
                                    onChange={(e) => updateData('brandColor', e.target.value)}
                                    className="w-16 h-12 rounded-lg cursor-pointer border-0"
                                />
                                <input
                                    type="text"
                                    value={data.brandColor}
                                    onChange={(e) => updateData('brandColor', e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                                    placeholder="#E91E63"
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-violet-400/10 border border-primary/20">
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <Sparkles className="w-4 h-4 mt-0.5 text-primary" />
                                <span>
                                    <strong>¡Casi listo!</strong> Con esta información, Nilah creará campañas
                                    personalizadas para tu negocio.
                                </span>
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                Business Brief
                            </h2>
                            <p className="text-sm text-gray-500">
                                Cuéntanos sobre tu negocio
                            </p>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex gap-1">
                        {STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`flex-1 h-1 rounded-full transition-colors ${step.id <= currentStep
                                    ? 'bg-primary'
                                    : 'bg-gray-200 dark:bg-dark-border'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            {React.createElement(STEPS[currentStep - 1].icon, {
                                size: 18,
                                className: 'text-primary'
                            })}
                            <span className="text-sm font-medium text-primary">
                                Paso {currentStep} de 6
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {STEPS[currentStep - 1].title}
                        </h3>
                    </div>

                    {renderStepContent()}

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-dark-border flex justify-between">
                    <button
                        onClick={currentStep === 1 ? onClose : handleBack}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                    </button>

                    {currentStep < 6 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90"
                        >
                            Siguiente
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Completar Brief
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessBriefWizard;
