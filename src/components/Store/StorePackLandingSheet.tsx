import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Check, CheckCircle2, ShieldCheck, TrendingUp, Sparkles,
  MessageCircle, Clock, Flame, ChevronRight, Smartphone
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface StorePackData {
  id: string;
  category: 'combos' | 'whatsapp' | 'marketing' | 'creative';
  nombre: string;
  emoji: string;
  badge: string;
  badgeType: 'highlight' | 'popular' | 'saving' | 'physical';
  precioUsd: number;
  precioPen: number;
  precioRegularUsd?: number;
  precioRegularPen?: number;
  tipoCobro: string;
  subtitulo: string;
  dolorQueResuelve: string;
  beneficios: string[];
  comoFunciona: string[];
  ejemploMensaje?: string;
  isCombo?: boolean;
  isPhysical?: boolean;
  featureKey?: string;
}

interface StorePackLandingSheetProps {
  pack: StorePackData | null;
  isOpen: boolean;
  onClose: () => void;
  onBuy: (pack: StorePackData) => void;
  isOwned?: boolean;
}

export const StorePackLandingSheet: React.FC<StorePackLandingSheetProps> = ({
  pack,
  isOpen,
  onClose,
  onBuy,
  isOwned = false,
}) => {
  const { activePalette, theme } = useTheme();
  const isDark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [confirmedState, setConfirmedState] = useState(false);
  const [weeklyClients, setWeeklyClients] = useState(25);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setConfirmedState(false);
      setWeeklyClients(25);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, 60);
    }
  }, [isOpen, pack?.id]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const estimatedSavedCancellations = Math.max(1, Math.round(weeklyClients * 0.15));
  const estimatedRecoveredMoney = estimatedSavedCancellations * 45;

  const brandPrimary = activePalette?.primary || '#7c3aed';
  const brandFrom = activePalette?.gradientFrom || '#7c3aed';
  const brandTo = activePalette?.gradientTo || '#db2777';
  const shadowRgb = activePalette?.shadowRgb || '124,58,237';

  // El modal se renderiza via portal directamente en document.body
  const modalContent = (
    <AnimatePresence>
      {isOpen && pack && (
        <>
          {/* BACKDROP — cubre toda la pantalla */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.78)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* PANEL que sube desde abajo */}
          <motion.div
            key="panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 310 }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '1.75rem 1.75rem 0 0',
              background: isDark ? '#111113' : '#ffffff',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
              overflow: 'hidden',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
            }}
          >

            {/* ── HEADER (fijo, no scrollea) ── */}
            <div
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem 0.75rem',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                background: isDark ? '#111113' : '#ffffff',
                position: 'relative',
              }}
            >
              {/* Tirador táctil */}
              <div
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '2.5rem',
                  height: '0.25rem',
                  borderRadius: '9999px',
                  background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              />

              <span style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.38)',
              }}>
                Módulo Nilah Pro
              </span>

              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                  color: isDark ? '#ffffff' : '#111111',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onTouchStart={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                onTouchEnd={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Cerrar <X size={13} />
              </button>
            </div>

            {/* ── ZONA SCROLLEABLE ── */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* 1. HERO */}
                <div style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '1.5rem',
                  padding: '1.25rem',
                  background: isDark
                    ? `linear-gradient(145deg, rgba(${shadowRgb},0.18) 0%, rgba(17,17,19,0.97) 100%)`
                    : `linear-gradient(145deg, ${brandPrimary}14 0%, #ffffff 100%)`,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                }}>
                  <div style={{
                    position: 'absolute', top: '-2.5rem', right: '-2.5rem',
                    width: '8rem', height: '8rem', borderRadius: '9999px',
                    background: brandPrimary, filter: 'blur(2.5rem)',
                    opacity: 0.28, pointerEvents: 'none',
                  }} />
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{
                        width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.75rem',
                        background: isDark ? 'rgba(255,255,255,0.08)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'}`,
                      }}>
                        {pack.emoji}
                      </div>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#fff',
                        background: `linear-gradient(90deg, ${brandFrom}, ${brandTo})`,
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                      }}>
                        <Flame size={11} style={{ animation: 'pulse 2s infinite' }} />
                        {pack.badge}
                      </span>
                    </div>

                    <div>
                      <h2 style={{
                        fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3,
                        color: isDark ? '#ffffff' : '#111111', margin: 0,
                      }}>{pack.nombre}</h2>
                      <p style={{
                        fontSize: '0.75rem', marginTop: '0.3rem', lineHeight: 1.5,
                        color: isDark ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.52)',
                      }}>{pack.subtitulo}</p>
                    </div>

                    <div style={{
                      padding: '0.875rem',
                      borderRadius: '1rem',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.88)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
                    }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: 1, marginTop: '0.1rem', flexShrink: 0 }}>💡</span>
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, color: isDark ? '#fff' : '#111' }}>
                          El impacto en tu día a día:
                        </p>
                        <p style={{ fontSize: '0.73rem', marginTop: '0.25rem', lineHeight: 1.5, margin: '0.25rem 0 0', color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)' }}>
                          {pack.dolorQueResuelve}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SIMULADOR WHATSAPP */}
                {pack.ejemploMensaje && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isDark ? '#fff' : '#111' }}>
                        <Smartphone size={13} style={{ color: brandPrimary }} />
                        Experiencia Real de tu Clienta
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
                        ● En vivo
                      </span>
                    </div>
                    <div style={{ background: '#0b141a', borderRadius: '1.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>✨</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Tu Salón de Belleza</p>
                          <p style={{ fontSize: '0.62rem', color: '#34d399', margin: 0 }}>En línea (Asistente 24/7)</p>
                        </div>
                        <MessageCircle size={15} style={{ color: '#34d399', flexShrink: 0 }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ background: '#202c33', borderRadius: '1rem 1rem 1rem 0.25rem', padding: '0.75rem', maxWidth: '90%', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.72rem', color: '#e5e7eb', lineHeight: 1.5, margin: 0 }}>{pack.ejemploMensaje}</p>
                          <div style={{ fontSize: '0.6rem', color: '#9ca3af', textAlign: 'right', marginTop: '0.35rem', display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                            <span>10:30 AM</span>
                            <span style={{ color: '#22d3ee', fontWeight: 700 }}>✓✓</span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setConfirmedState(s => !s)}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.75rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: confirmedState ? '#10b981' : '#00a884',
                          color: '#fff',
                          boxShadow: confirmedState ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                          transition: 'background 0.2s',
                        }}
                      >
                        {confirmedState
                          ? <><CheckCircle2 size={14} /><span>¡Cita Confirmada! Salón Notificado ✨</span></>
                          : <><span>Simular: "SÍ, ASISTIRÉ 💅"</span><ChevronRight size={13} /></>
                        }
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* 3. CALCULADORA DE RETORNO */}
                <div style={{
                  borderRadius: '1.5rem',
                  padding: '1.25rem',
                  background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                  display: 'flex', flexDirection: 'column', gap: '1rem',
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: isDark ? '#fff' : '#111' }}>
                      <TrendingUp size={13} style={{ color: '#10b981' }} />
                      Calculadora de Retorno Estimado
                    </h4>
                    <p style={{ fontSize: '0.68rem', marginTop: '0.2rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: '0.2rem 0 0' }}>
                      Cuánto recuperas evitando huecos en agenda
                    </p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                      <span>Citas en tu salón:</span>
                      <span style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontWeight: 900 }}>
                        {weeklyClients} / semana
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {[15, 25, 40, 60].map(n => (
                        <button
                          key={n}
                          onClick={() => setWeeklyClients(n)}
                          style={{
                            padding: '0.4rem 0',
                            borderRadius: '0.75rem',
                            border: `1px solid ${weeklyClients === n ? 'transparent' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
                            background: weeklyClients === n ? (isDark ? '#fff' : '#111') : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
                            color: weeklyClients === n ? (isDark ? '#111' : '#fff') : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.07em', color: '#059669', margin: 0 }}>Ingresos Salvados al Mes:</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', margin: '0.15rem 0 0' }}>~ S/ {estimatedRecoveredMoney}</p>
                      <p style={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', margin: '0.1rem 0 0' }}>~{estimatedSavedCancellations} plantones evitados</p>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 900, color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '9999px', background: '#059669', flexShrink: 0 }}>
                      <Check size={11} /> Se paga solo
                    </span>
                  </div>
                </div>

                {/* 4. CÓMO FUNCIONA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: isDark ? '#fff' : '#111' }}>
                    <Sparkles size={13} style={{ color: brandPrimary }} />
                    ¿Cómo funciona?
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pack.comoFunciona.map((step, idx) => (
                      <div key={idx} style={{
                        padding: '0.875rem',
                        borderRadius: '1rem',
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      }}>
                        <div style={{
                          width: '1.5rem', height: '1.5rem', borderRadius: '9999px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 900, color: '#fff',
                          background: `linear-gradient(135deg, ${brandFrom}, ${brandTo})`,
                        }}>{idx + 1}</div>
                        <p style={{ fontSize: '0.73rem', lineHeight: 1.5, margin: 0, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. BENEFICIOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, color: isDark ? '#fff' : '#111' }}>
                    Todo lo que desbloqueas hoy:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {pack.beneficios.map((b, i) => (
                      <div key={i} style={{
                        padding: '0.75rem',
                        borderRadius: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      }}>
                        <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.73rem', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Garantía */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={13} style={{ color: '#10b981' }} /> Activación Inmediata
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} style={{ color: '#8b5cf6' }} /> Cancela cuando quieras
                  </span>
                </div>

                {/* Espacio extra para que el último elemento no quede bajo el action bar */}
                <div style={{ height: '0.5rem' }} />
              </div>
            </div>

            {/* ── ACTION BAR (parte del flex, nunca tapa el contenido) ── */}
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1rem 1.25rem',
              background: isDark ? 'rgba(17,17,19,0.96)' : 'rgba(255,255,255,0.96)',
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: isDark ? '#fff' : '#111', letterSpacing: '-0.02em' }}>
                    ${pack.precioUsd}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)' }}>
                    {pack.tipoCobro}
                  </span>
                </div>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)', margin: '0.1rem 0 0' }}>
                  ~ S/ {pack.precioPen} PEN
                </p>
              </div>

              <div style={{ flex: 1, maxWidth: '16rem' }}>
                {isOwned ? (
                  <div style={{
                    width: '100%', padding: '0.875rem 1rem', borderRadius: '1rem',
                    background: 'rgba(16,185,129,0.1)', color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.2)',
                    fontWeight: 900, fontSize: '0.72rem', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  }}>
                    <CheckCircle2 size={15} /> Módulo Activo
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onBuy(pack)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1.25rem',
                      borderRadius: '1rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: `linear-gradient(90deg, ${brandFrom}, ${brandTo})`,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: `0 8px 22px rgba(${shadowRgb},0.42)`,
                    }}
                  >
                    <Zap size={15} style={{ fill: '#fff' }} />
                    Desbloquear en 1 Clic ⚡
                  </motion.button>
                )}
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // React Portal: el modal escapa del árbol DOM y va directo a document.body
  return createPortal(modalContent, document.body);
};
