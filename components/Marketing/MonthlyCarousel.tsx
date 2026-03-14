/**
 * MonthlyCarousel Component
 * Carousel horizontal que muestra las 3 tarjetas mensuales
 * Mobile optimizado con touch swipe natural
 */

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Settings, Sparkles } from 'lucide-react';
import MonthCard from './MonthCard';
import { MonthCard as MonthCardType, CountryCode, SUPPORTED_COUNTRIES } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';

interface MonthlyCarouselProps {
    cards: MonthCardType[];
    currentCountry: CountryCode;
    onChangeCountry: (country: CountryCode) => void;
    onSelectWeeklyIdea?: (idea: any, card: MonthCardType) => void;
    businessId: string;
}

const MonthlyCarousel: React.FC<MonthlyCarouselProps> = ({
    cards,
    currentCountry,
    onChangeCountry,
    onSelectWeeklyIdea,
    businessId,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Mobile detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const countryInfo = SUPPORTED_COUNTRIES[currentCountry];

    const scrollToCard = (index: number) => {
        if (scrollRef.current) {
            const cardWidth = isMobile
                ? scrollRef.current.offsetWidth
                : scrollRef.current.offsetWidth / 1.5;
            scrollRef.current.scrollTo({
                left: index * (cardWidth + (isMobile ? 16 : 24)),
                behavior: 'smooth',
            });
            setActiveIndex(index);
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const scrollLeft = scrollRef.current.scrollLeft;
            const cardWidth = isMobile
                ? scrollRef.current.offsetWidth
                : scrollRef.current.offsetWidth / 1.5;
            const newIndex = Math.round(scrollLeft / (cardWidth + (isMobile ? 16 : 24)));
            setActiveIndex(Math.min(newIndex, cards.length - 1));
        }
    };

    useEffect(() => {
        const ref = scrollRef.current;
        if (ref) {
            ref.addEventListener('scroll', handleScroll);
            return () => ref.removeEventListener('scroll', handleScroll);
        }
    }, [isMobile]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header with Country Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                        Calendario de Campañas
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {isMobile ? 'Desliza para ver meses' : 'Elige un mes para crear tu campaña personalizada'}
                    </p>
                </div>

                {/* Country Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-primary transition-colors text-sm"
                    >
                        <span className="text-lg">{countryInfo.flag}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {countryInfo.name}
                        </span>
                        <Globe size={14} className="text-gray-400" />
                    </button>

                    {/* Country Dropdown */}
                    {showCountryPicker && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowCountryPicker(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-200 dark:border-dark-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2">
                                    <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">
                                        Selecciona tu país
                                    </p>
                                    {Object.values(SUPPORTED_COUNTRIES).map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => {
                                                onChangeCountry(country.code);
                                                setShowCountryPicker(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${currentCountry === country.code
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            <span className="text-xl">{country.flag}</span>
                                            <span className="font-medium">{country.name}</span>
                                            {currentCountry === country.code && (
                                                <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full font-bold">
                                                    Actual
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-gray-100 dark:border-dark-border">
                                    <p className="px-3 py-2 text-xs text-gray-400">
                                        Las fechas clave se actualizarán según el país seleccionado
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Desktop: Month tabs / Mobile: Hide tabs */}
            {!isMobile && (
                <div className="flex items-center gap-4">
                    {/* Nilah Tip / Header */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Tu asistente de marketing está lista para planificar los próximos meses 🚀
                        </span>
                    </div>
                </div>
            )}

            {/* Cards Container - Mobile: Full width swipe / Desktop: 33% cards */}
            <div
                ref={scrollRef}
                className={`flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide ${isMobile ? '-mx-4 px-4' : ''}`}
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {cards.map((card) => (
                    <div
                        key={`${card.month}-${card.year}`}
                        className={`flex-shrink-0 snap-center ${isMobile
                            ? 'w-[calc(100vw-32px)] min-w-[280px]'
                            : 'w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] min-w-[320px]'
                            }`}
                    >
                        <MonthCard
                            card={card}
                            onSelectWeeklyIdea={onSelectWeeklyIdea}
                            businessId={businessId}
                        />
                    </div>
                ))}
            </div>

            {/* Scroll Indicator - Always visible */}
            <div className="flex justify-center gap-2">
                {cards.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToCard(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${activeIndex === index
                            ? 'w-8 bg-primary'
                            : 'w-2 bg-gray-200 dark:bg-dark-border hover:bg-gray-300'
                            }`}
                    />
                ))}
            </div>

            {/* Mobile swipe hint */}
            {isMobile && activeIndex === 0 && (
                <p className="text-center text-xs text-gray-400 animate-pulse">
                    👆 Desliza para ver más meses
                </p>
            )}
        </div>
    );
};

export default MonthlyCarousel;
