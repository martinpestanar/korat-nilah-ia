import React, { useState, useEffect } from 'react';
import { Bot, ChevronRight, Gift, Percent, DollarSign, Activity, MessageSquare } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { updateTokenProgress } from '../../services/onboarding';

interface StepRescateProps {
  businessId: string;
  tokenId: string;
  moneda?: string;
  onComplete: () => void;
  onBack: () => void;
}

const PREMIOS_IDEAS = {
  nivel0: [
    "Mensaje de seguimiento emocional (sin premio físico)",
    "Preguntar si todo está bien con su servicio anterior",
    "Recordatorio amigable de mantenimiento sugerido"
  ],
  nivel1: [
    "Mascarilla facial hidratante de cortesía",
    "Tratamiento hidratante capilar básico (ampolla)",
    "Bebida premium de bienvenida y snack",
    "Exfoliación de manos y crema especial",
    "Diagnóstico capilar/facial con cámara HD gratis"
  ],
  nivel2: [
    "10% de descuento en todos los servicios",
    "15% de DSCTO en tu servicio favorito",
    "20% de descuento si vienes con un acompañante",
    "25% off en cualquier servicio nuevo que pruebes"
  ],
  nivel3: [
    "Cupón de 15 dólares/soles para tu próxima visita",
    "Corte de puntas o depilación de cejas totalmente gratis",
    "Servicio de pedicure de cortesía al hacerse color o mechas",
    "Cupón de 50 soles para canjear en cualquier tratamiento"
  ]
};

type DiaObjetivo = 35 | 60 | 90;

interface CampanaConfig {
  dia_objetivo: DiaObjetivo;
  agresividad: number;
  premio: string;
  activo: boolean;
}

const DEFAULT_CONFIGS: CampanaConfig[] = [
  { dia_objetivo: 35, agresividad: 0, premio: PREMIOS_IDEAS.nivel0[0], activo: true },
  { dia_objetivo: 60, agresividad: 2, premio: PREMIOS_IDEAS.nivel2[1], activo: true },
  { dia_objetivo: 90, agresividad: 3, premio: PREMIOS_IDEAS.nivel3[0], activo: true }
];

const StepRescate: React.FC<StepRescateProps> = ({
  businessId,
  tokenId,
  moneda = 'S/.',
  onComplete,
  onBack
}) => {
  const [configs, setConfigs] = useState<CampanaConfig[]>(DEFAULT_CONFIGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DiaObjetivo>(35);
  const [customPremios, setCustomPremios] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('campanas_rescate')
        .select('*')
        .eq('business_id', businessId);
      
      if (!error && data && data.length > 0) {
        const mapped = [35, 60, 90].map(dia => {
          const found = data.find(c => c.dia_objetivo === dia);
          return found as CampanaConfig || DEFAULT_CONFIGS.find(d => d.dia_objetivo === dia)!;
        });
        setConfigs(mapped);
        
        const allStatic = Object.values(PREMIOS_IDEAS).flat();
        const customs = data.map(c => c.premio).filter(p => !allStatic.includes(p) && p.trim() !== "");
        setCustomPremios(Array.from(new Set(customs)));
      }
      setLoading(false);
    };
    loadData();
  }, [businessId]);

  const updateConfig = (dia: DiaObjetivo, updates: Partial<CampanaConfig>) => {
    setConfigs(configs.map(c => c.dia_objetivo === dia ? { ...c, ...updates } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = configs.map(c => ({
        business_id: businessId,
        dia_objetivo: c.dia_objetivo,
        agresividad: c.agresividad,
        premio: c.premio,
        activo: c.activo
      }));
      
      const { error } = await supabase.from('campanas_rescate').upsert(payload, { onConflict: 'business_id,dia_objetivo' });
      if (error) throw error;
      
      const allStatic = Object.values(PREMIOS_IDEAS).flat();
      const currentCustoms = configs.map(c => c.premio).filter(p => !allStatic.includes(p) && p.trim() !== "");
      setCustomPremios(prev => Array.from(new Set([...prev, ...currentCustoms])));
      
      await updateTokenProgress(tokenId, 9);
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Hubo un error guardando las alertas de retención.');
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = configs.find(c => c.dia_objetivo === activeTab)!;

  const renderAgresividadButton = (num: number, icon: React.ReactNode, label: string) => {
    const isSelected = currentConfig.agresividad === num;
    return (
      <button
        key={num}
        onClick={() => updateConfig(activeTab, { agresividad: num, premio: (PREMIOS_IDEAS as any)[`nivel${num}`][0] })}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          borderRadius: '12px',
          border: `2px solid ${isSelected ? 'var(--ob-primary)' : 'var(--ob-border)'}`,
          background: isSelected ? 'rgba(139,92,246,0.12)' : 'var(--ob-surface-2)',
          color: isSelected ? '#a78bfa' : 'var(--ob-text-muted)',
          cursor: 'pointer',
          transition: 'var(--ob-transition)',
          gap: '8px',
          minWidth: 0,
        }}
      >
        <div style={{
          padding: '8px',
          borderRadius: '50%',
          background: isSelected ? 'rgba(139,92,246,0.2)' : 'var(--ob-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isSelected ? '#a78bfa' : 'var(--ob-text-muted)',
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, textAlign: 'center', lineHeight: 1.3, color: 'inherit' }}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="ob-step">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          background: 'rgba(139,92,246,0.15)',
          borderRadius: '16px',
          marginBottom: '16px',
          color: '#a78bfa',
        }}>
          <Activity size={28} />
        </div>
        <h2 className="ob-step-title">Sistema de Retención Inteligente</h2>
        <p className="ob-step-subtitle">
          Automáticamente detectaremos a los clientes que dejen de venir y les enviaremos un mensaje
          sugiriéndoles regresar con un incentivo. Puedes desactivar alguna alerta si prefieres.
        </p>
      </div>

      {/* Card principal */}
      <div style={{
        background: 'var(--ob-surface)',
        border: '1px solid var(--ob-border)',
        borderRadius: 'var(--ob-radius)',
        padding: '20px',
        marginTop: '8px',
      }}>

        {/* TABS */}
        <div style={{
          display: 'flex',
          background: 'var(--ob-surface-2)',
          padding: '4px',
          borderRadius: '12px',
          marginBottom: '20px',
          gap: '4px',
        }}>
          {([35, 60, 90] as DiaObjetivo[]).map((dia) => (
            <button
              key={dia}
              onClick={() => setActiveTab(dia)}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'var(--ob-transition)',
                background: activeTab === dia ? 'var(--ob-surface)' : 'transparent',
                color: activeTab === dia ? '#a78bfa' : 'var(--ob-text-muted)',
                boxShadow: activeTab === dia ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {dia} Días
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ob-text-muted)', fontSize: '14px' }}>
            <div className="ob-page-spinner" style={{ margin: '0 auto 12px' }} />
            Cargando configuración...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Título de alerta */}
            <div>
              <h3 style={{ fontWeight: 700, color: 'var(--ob-text)', fontSize: '16px', margin: '0 0 4px' }}>
                Alerta de {activeTab} Días
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ob-text-muted)', margin: 0 }}>
                {activeTab === 35 && "Recordatorio en caso hayan olvidado agendar. Útil antes de que miren otro salón."}
                {activeTab === 60 && "Cliente en riesgo de abandono. Dale un beneficio de cortesía."}
                {activeTab === 90 && "Cliente inactivo. Es el momento de la oferta más agresiva para recuperarlo."}
              </p>
            </div>

            {/* Panel interior */}
            <div style={{
              background: 'var(--ob-surface-2)',
              border: '1px solid var(--ob-border)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {/* Nivel de agresividad */}
              <div>
                <label className="ob-label">¿Qué tan agresivo será el gancho?</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeTab === 35 && renderAgresividadButton(0, <MessageSquare size={18} />, "Solo Mensaje")}
                  {renderAgresividadButton(1, <Gift size={18} />, "Cortesía")}
                  {renderAgresividadButton(2, <Percent size={18} />, "Descuento %")}
                  {renderAgresividadButton(3, <DollarSign size={18} />, "Cupón Efectivo")}
                </div>
              </div>

              {/* Select + input de premio */}
              <div>
                <label className="ob-label">Selecciona o escribe el incentivo</label>
                <select
                  className="ob-input"
                  value={
                    ([...(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`], ...customPremios].includes(currentConfig.premio))
                      ? currentConfig.premio : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) updateConfig(activeTab, { premio: e.target.value });
                  }}
                  style={{ marginBottom: '8px' }}
                >
                  <option value="" disabled>Selecciona una opción predefinida...</option>
                  <optgroup label="Sugerencias IA">
                    {(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`].map((idea: string, idx: number) => (
                      <option key={idx} value={idea}>{idea}</option>
                    ))}
                  </optgroup>
                  {customPremios.length > 0 && (
                    <optgroup label="Tus Premios Personalizados">
                      {customPremios.map((p, idx) => (
                        <option key={'c' + idx} value={p}>{p}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={currentConfig.premio}
                    onChange={(e) => updateConfig(activeTab, { premio: e.target.value })}
                    placeholder="O escribe tu propio premio personalizado..."
                    className="ob-input"
                  />
                  {currentConfig.premio && !([...(PREMIOS_IDEAS as any)[`nivel${currentConfig.agresividad}`], ...customPremios].includes(currentConfig.premio)) && (
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#a78bfa',
                      background: 'rgba(139,92,246,0.15)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      whiteSpace: 'nowrap',
                    }}>
                      ¡Nuevo!
                    </span>
                  )}
                </div>

                <p style={{
                  fontSize: '12px',
                  color: 'var(--ob-text-muted)',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}>
                  <Bot size={13} style={{ color: '#a78bfa', marginTop: '1px', flexShrink: 0 }} />
                  <span>
                    La IA usará este texto, por ej: <em>"Sofía, noté que no nos visitas hace {activeTab} días. Quisiera obsequiarte: {currentConfig.premio}"</em>
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="ob-nav-buttons" style={{ marginTop: '20px' }}>
        <button type="button" onClick={onBack} disabled={saving} className="ob-btn-back">
          ← Atrás
        </button>
        <button type="button" onClick={handleSave} disabled={saving || loading} className="ob-btn-primary">
          {saving ? <span className="ob-spinner" /> : <>Siguiente paso <ChevronRight size={16} /></>}
        </button>
      </div>
    </div>
  );
};

export default StepRescate;
