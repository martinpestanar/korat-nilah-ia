import React, { useState, useEffect } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { RetoqueOnboarding, saveStepRetoques } from '../../services/onboarding';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: () => void;
  onBack?: () => void;
}

// ─── Opciones Predefinidas de Retoques ──────────────────────────────────────
interface RetoquePredefinido {
  nombre: string;
  keywords: string;
  dias_min: number;
  dias_max: number;
}

const RETOQUES_PREDEFINIDOS: Record<string, RetoquePredefinido[]> = {
  Manos: [
    { nombre: 'Retoque Acrílicas / Gel', keywords: 'acrilica, gel, kapping', dias_min: 15, dias_max: 21 },
    { nombre: 'Cambio Esmaltado Semipermanente', keywords: 'semipermanente, esmaltado', dias_min: 14, dias_max: 20 },
  ],
  Pies: [
    { nombre: 'Pedicure Spa / Profundo', keywords: 'pedicure, pedi, pies', dias_min: 21, dias_max: 30 },
    { nombre: 'Cambio de Esmalte Pies', keywords: 'esmalte pies, semi pies', dias_min: 20, dias_max: 30 },
  ],
  Facial: [
    { nombre: 'Limpieza Facial Profunda', keywords: 'limpieza, facial, peeling', dias_min: 30, dias_max: 45 },
    { nombre: 'Tratamiento Acné / Hidratación', keywords: 'hidratacion, acne, dermapen', dias_min: 15, dias_max: 25 },
  ],
  Pestañas: [
    { nombre: 'Retoque Extensiones Pestañas', keywords: 'extensiones, volumen, clasicas', dias_min: 15, dias_max: 21 },
    { nombre: 'Lifting de Pestañas', keywords: 'lifting, ondulacion', dias_min: 30, dias_max: 45 },
  ],
  Cabello: [
    { nombre: 'Retoque de Raíz / Tinte', keywords: 'tinte, raiz, color', dias_min: 30, dias_max: 45 },
    { nombre: 'Mantenimiento Balayage', keywords: 'balayage, mechas', dias_min: 60, dias_max: 90 },
    { nombre: 'Alisado / Keratina / Botox', keywords: 'keratina, botox, alisado', dias_min: 60, dias_max: 120 },
  ],
  Cejas: [
    { nombre: 'Retoque Diseño de Cejas', keywords: 'cejas, diseño, henna', dias_min: 15, dias_max: 21 },
    { nombre: 'Laminado de Cejas', keywords: 'laminado, planchado', dias_min: 30, dias_max: 45 },
  ],
  Depilación: [
    { nombre: 'Depilación Cera / Hilo', keywords: 'cera, hilo, bozo, axilas', dias_min: 21, dias_max: 30 },
    { nombre: 'Sesión Depilación Láser', keywords: 'laser, ipl', dias_min: 30, dias_max: 45 },
  ]
};

const CATEGORIAS_RETOQUE = Object.keys(RETOQUES_PREDEFINIDOS);
const EMOJIS_CATEGORIA: Record<string, string> = {
  Manos: '💅', Pies: '🦶', Facial: '💆‍♀️', Pestañas: '👁️', Cabello: '💇‍♀️', Cejas: '🤨', Depilación: '🪒'
};

const StepRetoques: React.FC<Props> = ({ businessId, tokenId, onComplete, onBack }) => {
  const [tieneRetoques, setTieneRetoques] = useState<boolean | null>(null);
  const [retoques, setRetoques] = useState<RetoqueOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState<string | null>(null);
  const [current, setCurrent] = useState<Partial<RetoqueOnboarding>>({ activo: true });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (retoques.length === 0 && businessId) {
      setFetching(true);
      supabase.from('configuracion_recordatorios').select('*').eq('business_id', businessId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setRetoques(data.map(d => ({
              nombre: d.nombre_servicio || d.nombre || '',
              keywords: d.keywords || '',
              dias_min: d.dias_minimo || d.dias_min || 14,
              dias_max: d.dias_maximo || d.dias_max || 21,
              activo: d.activo ?? true,
            })));
            setTieneRetoques(true);
          }
          setFetching(false);
        });
    }
  }, [businessId]);

  const abrirModal = () => {
    setCurrentCat(null);
    setCurrent({ activo: true });
    setModalOpen(true);
  };

  const seleccionarPredefinido = (cat: string, pref: RetoquePredefinido) => {
    setCurrent({
      nombre: pref.nombre,
      keywords: pref.keywords,
      dias_min: pref.dias_min,
      dias_max: pref.dias_max,
      activo: true,
    });
  };

  const confirmRetoque = () => {
    if (!current.nombre || !current.dias_min || !current.dias_max) return;
    setRetoques((prev) => [...prev, current as RetoqueOnboarding]);
    setModalOpen(false);
    setCurrent({});
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (tieneRetoques === false) {
        // Enviar array vacío si decide saltar
        await saveStepRetoques(businessId, [], tokenId);
      } else {
        await saveStepRetoques(businessId, retoques, tokenId);
      }
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando recordatorios.');
    } finally {
      setLoading(false);
    }
  };

  const predCatActual = currentCat ? RETOQUES_PREDEFINIDOS[currentCat] : [];

  if (fetching) {
    return (
      <div className="ob-step flex flex-col items-center justify-center min-h-[50vh]">
        <div className="ob-page-spinner" />
        <p className="text-zinc-500 mt-4 text-sm font-medium">Recuperando recordatorios...</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      <div className="ob-step-icon">⏰</div>
      <h2 className="ob-step-title">Recordatorios de Mantenimiento</h2>
      <p className="ob-step-subtitle">
        ¿Te gustaría que Nilah envíe recodatorios automáticos a clientes que necesiten retoques?
        <TooltipHelp text="Nilah identificará cuándo una clienta se hace un servicio de la lista y calculará automáticamente en cuántos días le toca su mantenimiento." />
      </p>

      {/* Paso 1: Decisión Inicial */}
      {tieneRetoques === null && (
        <div className="ob-big-choice">
          <button type="button" className="ob-big-choice-btn" onClick={() => setTieneRetoques(true)}>
            <span className="ob-big-choice-emoji">✅</span>
            <span>Sí, programar retoques</span>
            <span className="ob-big-choice-note">Uñas, Pestañas, Cabello, etc.</span>
          </button>
          <button type="button" className="ob-big-choice-btn ob-big-choice-btn--ghost" onClick={() => setTieneRetoques(false)}>
            <span className="ob-big-choice-emoji">⏭️</span>
            <span>No por ahora</span>
            <span className="ob-big-choice-note">Prefiero no enviar recordatorios</span>
          </button>
          {onBack && (
            <button type="button" className="ob-back-link" style={{ textAlign: 'center', marginTop: 8 }} onClick={onBack}>
              ← Volver
            </button>
          )}
        </div>
      )}

      {/* Paso 2: Opción No */}
      {tieneRetoques === false && (
        <div className="ob-skip-confirm">
          <p>Entendido. Podrás configurar tus automatizaciones desde Ajustes en cualquier momento.</p>
          <button type="button" className="ob-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
          </button>
        </div>
      )}

      {/* Paso 3: Interfaz de Retoques */}
      {tieneRetoques === true && (
        <>
          {retoques.length > 0 && (
            <div className="ob-extras-list">
              {retoques.map((ret, i) => (
                <div key={i} className="ob-extra-row">
                  <span className="ob-extra-nombre" style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{ret.nombre}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--c-text-sec)', marginTop: 2 }}>{ret.dias_min} a {ret.dias_max} días ({ret.activo ? 'Activado 🟢' : 'Pausado ⏸️'})</span>
                  </span>
                  <button
                    type="button"
                    className="ob-staff-remove"
                    onClick={() => setRetoques((p) => p.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="ob-btn-secondary" onClick={abrirModal}>
            ＋ Agregar Recordatorio
          </button>

          {error && <p className="ob-error">{error}</p>}

          <button
            type="button"
            className="ob-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
          </button>
        </>
      )}

      {/* MODAL BOTTOM */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo Recordatorio">
        {/* Paso A: Seleccionar Categoría Predefinida */}
        <div className="ob-field">
          <label className="ob-label">¿Qué tipo de mantenimiento es?</label>
          <div className="ob-chip-grid">
            {CATEGORIAS_RETOQUE.map((c) => (
              <SelectionChip
                key={c}
                label={`${EMOJIS_CATEGORIA[c]} ${c}`}
                selected={currentCat === c}
                onClick={() => setCurrentCat(c)}
              />
            ))}
          </div>
        </div>

        {/* Paso B: Predefinidos */}
        {currentCat && predCatActual.length > 0 && (
          <div className="ob-field">
            <label className="ob-label">Sugerencias (haz clic para usar):</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {predCatActual.map((pref) => (
                <button
                  key={pref.nombre}
                  type="button"
                  onClick={() => seleccionarPredefinido(currentCat, pref)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: current.nombre === pref.nombre
                      ? '1.5px solid var(--c-primary)'
                      : '1.5px solid var(--c-border)',
                    background: current.nombre === pref.nombre
                      ? 'color-mix(in srgb, var(--c-primary) 10%, transparent)'
                      : 'var(--c-surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--c-text)' }}>{pref.nombre}</span>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--c-text-sec)' }}>
                    {pref.dias_min}-{pref.dias_max} días
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso C: Formulario */}
        {currentCat && (
          <>
            <div className="ob-field">
              <label className="ob-label">Nombre del Servicio / Retoque</label>
              <input
                className="ob-input"
                type="text"
                placeholder="Ej: Retoque de Pestañas Volumen"
                value={current.nombre || ''}
                onChange={(e) => setCurrent((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">
                Palabras Clave
                <TooltipHelp text="Palabras que Nilah buscará en la conversación (ej: uñas, acrilicas) para saber que la clienta se hizo este servicio." />
              </label>
              <input
                className="ob-input"
                type="text"
                placeholder="Ej: acrilicas, gel, esculturales"
                value={current.keywords || ''}
                onChange={(e) => setCurrent((p) => ({ ...p, keywords: e.target.value }))}
              />
            </div>

            <div className="ob-row">
              <div className="ob-field ob-field--half">
                <label className="ob-label">Día mínimo</label>
                <input
                  className="ob-input"
                  type="number"
                  placeholder="15"
                  value={current.dias_min ?? ''}
                  onChange={(e) => setCurrent((p) => ({ ...p, dias_min: Number(e.target.value) }))}
                  min={1}
                />
              </div>
              <div className="ob-field ob-field--half">
                <label className="ob-label">Día máximo</label>
                <input
                  className="ob-input"
                  type="number"
                  placeholder="21"
                  value={current.dias_max ?? ''}
                  onChange={(e) => setCurrent((p) => ({ ...p, dias_max: Number(e.target.value) }))}
                  min={2}
                />
              </div>
            </div>

            <div className="ob-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--c-surface-2)', borderRadius: '10px' }}>
              <div>
                <label className="ob-label" style={{ marginBottom: 4 }}>Activar inmediatamente</label>
                <span style={{ fontSize: '11px', color: 'var(--c-text-sec)' }}>Aplica este recordatorio a nuevos clientes</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={current.activo}
                  onChange={(e) => setCurrent((p) => ({ ...p, activo: e.target.checked }))}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <button
              type="button"
              className="ob-btn-primary"
              style={{ marginTop: 12 }}
              onClick={confirmRetoque}
              disabled={!current.nombre || !current.dias_min || !current.dias_max}
            >
              Guardar Recordatorio ✓
            </button>
          </>
        )}
      </BottomModal>
    </div>
  );
};

export default StepRetoques;
