import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { ExtraOnboarding, saveStepExtras } from '../../services/onboarding';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  moneda?: string;
  onComplete: () => void;
  onBack?: () => void;
}

// ─── Extras predefinidos por categoría ───────────────────────────────────────
interface ExtraPredefinido {
  nombre: string;
  etiqueta: string;
  precioSugerido: number;
}

const EXTRAS_PREDEFINIDOS: Record<string, ExtraPredefinido[]> = {
  Largo: [
    { nombre: 'Largo Corto / Natural', etiqueta: 'Natural', precioSugerido: 0 },
    { nombre: 'Largo Medio', etiqueta: 'M', precioSugerido: 10 },
    { nombre: 'Largo L', etiqueta: 'L', precioSugerido: 15 },
    { nombre: 'Largo XL', etiqueta: 'XL', precioSugerido: 20 },
    { nombre: 'Largo XXL / Extremo', etiqueta: 'XXL', precioSugerido: 30 },
    { nombre: 'Stiletto / Punta', etiqueta: 'Stiletto', precioSugerido: 10 },
    { nombre: 'Coffin / Ballerina', etiqueta: 'Coffin', precioSugerido: 10 },
    { nombre: 'Almond / Almendra', etiqueta: 'Almond', precioSugerido: 10 },
  ],
  Diseño: [
    { nombre: 'Sin Diseño (Liso)', etiqueta: 'Liso', precioSugerido: 0 },
    { nombre: 'Diseño Simple (1 uña)', etiqueta: '1 dedo', precioSugerido: 5 },
    { nombre: 'Diseño en 2 uñas', etiqueta: '2 dedos', precioSugerido: 10 },
    { nombre: 'Diseño Completo (todas)', etiqueta: 'Full', precioSugerido: 20 },
    { nombre: 'French Clásico', etiqueta: 'French', precioSugerido: 10 },
    { nombre: 'Baby Boomer / Ombre', etiqueta: 'Boomer', precioSugerido: 15 },
    { nombre: 'Glitter / Efecto Espejo', etiqueta: 'Glitter', precioSugerido: 10 },
    { nombre: 'Piedras / Gemas', etiqueta: 'Piedras', precioSugerido: 15 },
    { nombre: 'Nail Art 3D / Relieve', etiqueta: '3D', precioSugerido: 25 },
    { nombre: 'Encapsulado (flores, etc.)', etiqueta: 'Encapsulado', precioSugerido: 20 },
  ],
  Material: [
    { nombre: 'Gel UV (base)', etiqueta: 'Gel', precioSugerido: 0 },
    { nombre: 'Acrílico Claro', etiqueta: 'Acrílico', precioSugerido: 0 },
    { nombre: 'Polygel / PoliAcrílico', etiqueta: 'Polygel', precioSugerido: 15 },
    { nombre: 'Soft Gel (System)', etiqueta: 'Soft Gel', precioSugerido: 10 },
    { nombre: 'Rubber Base (gel caucho)', etiqueta: 'Rubber', precioSugerido: 10 },
    { nombre: 'Builder Gel', etiqueta: 'Builder', precioSugerido: 10 },
    { nombre: 'Fiberglass', etiqueta: 'Fibra', precioSugerido: 15 },
  ],
  Tratamiento: [
    { nombre: 'Hidratación Profunda', etiqueta: 'Hidratación', precioSugerido: 15 },
    { nombre: 'Vitaminas / Aceite de Cutícula', etiqueta: 'Vitaminas', precioSugerido: 10 },
    { nombre: 'Mascarilla de Parafina (manos)', etiqueta: 'Parafina', precioSugerido: 20 },
    { nombre: 'Exfoliación de Manos', etiqueta: 'Exfoliación', precioSugerido: 15 },
    { nombre: 'Masaje de Manos', etiqueta: 'Masaje', precioSugerido: 15 },
    { nombre: 'Refuerzo de Uña Dañada', etiqueta: 'Refuerzo', precioSugerido: 10 },
    { nombre: 'Tinte de Pestaña', etiqueta: 'Tinte', precioSugerido: 20 },
    { nombre: 'Botox de Pestañas', etiqueta: 'Botox', precioSugerido: 30 },
    { nombre: 'Diseño de Ceja extra', etiqueta: 'Ceja', precioSugerido: 15 },
  ],
  Depilación: [
    { nombre: 'Axilas', etiqueta: 'Axilas', precioSugerido: 15 },
    { nombre: 'Bozo / Labio Superior', etiqueta: 'Bozo', precioSugerido: 10 },
    { nombre: 'Media Pierna', etiqueta: 'Media pierna', precioSugerido: 20 },
    { nombre: 'Pierna Completa', etiqueta: 'Pierna completa', precioSugerido: 35 },
    { nombre: 'Bikini / Ingles', etiqueta: 'Bikini', precioSugerido: 25 },
    { nombre: 'Cavado / Brasileña', etiqueta: 'Cavado', precioSugerido: 35 },
    { nombre: 'Brazo / Antebrazo', etiqueta: 'Brazo', precioSugerido: 20 },
    { nombre: 'Cola / Glúteos', etiqueta: 'Cola', precioSugerido: 20 },
  ],
  Otro: [],
};

const CATEGORIAS_EXTRA = Object.keys(EXTRAS_PREDEFINIDOS);

// ─── Componente ──────────────────────────────────────────────────────────────

const StepExtras: React.FC<Props> = ({ businessId, tokenId, moneda = 'S/.', onComplete, onBack }) => {
  const [tieneExtras, setTieneExtras] = useState<boolean | null>(null);
  const [extras, setExtras] = useState<ExtraOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<ExtraOnboarding>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Nota: La pre-carga de extras se almacena vía la RPC onboarding_step_6_extras
  // No realizamos una consulta de hidratación aquí porque la tabla menu_categorias
  // no está habilitada para lectura directa desde el cliente en el flujo de onboarding.
  // Los extras se pueden reconfigurar desde el módulo de Configuración post-onboarding.


  const abrirModal = () => {
    setCurrent({});
    setModalOpen(true);
  };

  const seleccionarPredefinido = (cat: string, pref: ExtraPredefinido) => {
    setCurrent({ categoria: cat, nombre: pref.nombre, etiqueta: pref.etiqueta, precio: pref.precioSugerido });
  };

  const confirmExtra = () => {
    if (!current.categoria || !current.nombre || current.precio === undefined) return;
    setExtras((prev) => [...prev, current as ExtraOnboarding]);
    setCurrent({});
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveStepExtras(businessId, extras, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando extras.');
    } finally {
      setLoading(false);
    }
  };

  // Categoría activa detectada en el modal
  const catActual = current.categoria || '';
  const predCatActual = EXTRAS_PREDEFINIDOS[catActual] || [];

  const categoriaEmojis: Record<string, string> = {
    Largo: '📏', Diseño: '🎨', Material: '💅', Tratamiento: '✨', Depilación: '🪒', Otro: '📦',
  };



  return (
    <div className="ob-step">
      <div className="ob-step-icon">💎</div>
      <h2 className="ob-step-title">Precios adicionales</h2>
      <p className="ob-step-subtitle">
        ¿Tus servicios tienen extras que cambian el precio?
        <TooltipHelp text="Por ejemplo: largo XL, diseño complejo, piedras. Nilah los usará para cotizar automáticamente cuando una clienta pregunte o envíe una foto." />
      </p>

      {/* Paso 1: Pregunta inicial */}
      {tieneExtras === null && (
        <div className="ob-big-choice">
          <button type="button" className="ob-big-choice-btn" onClick={() => setTieneExtras(true)}>
            <span className="ob-big-choice-emoji">✅</span>
            <span>Sí, tengo adicionales</span>
            <span className="ob-big-choice-note">Largo, diseño, material, depilación, etc.</span>
          </button>
          <button type="button" className="ob-big-choice-btn ob-big-choice-btn--ghost" onClick={() => { setTieneExtras(false); }}>
            <span className="ob-big-choice-emoji">⏭️</span>
            <span>No por ahora</span>
            <span className="ob-big-choice-note">Podrás configurarlo desde Ajustes</span>
          </button>
          {onBack && (
            <button type="button" className="ob-back-link" style={{ textAlign: 'center', marginTop: 8 }} onClick={onBack}>
              ← Volver
            </button>
          )}
        </div>
      )}

      {/* Paso 2: Saltó extras */}
      {tieneExtras === false && (
        <div className="ob-skip-confirm">
          <p>Perfecto. Puedes agregar adicionales desde <strong>Configuración → Precios Extras</strong> cuando quieras.</p>
          <button type="button" className="ob-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
          </button>
        </div>
      )}

      {/* Paso 3: Lista de extras configurados */}
      {tieneExtras === true && (
        <>
          {extras.length > 0 && (
            <div className="ob-extras-list">
              {extras.map((ex, i) => (
                <div key={i} className="ob-extra-row">
                  <span className="ob-extra-cat">{categoriaEmojis[ex.categoria] || '📦'} {ex.categoria}</span>
                  <span className="ob-extra-nombre">{ex.nombre} <em>({ex.etiqueta})</em></span>
                  <span className="ob-extra-precio">+{moneda} {ex.precio}</span>
                  <button
                    type="button"
                    className="ob-staff-remove"
                    onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="ob-btn-secondary" onClick={abrirModal}>
            ＋ Agregar adicional
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

      {/* Modal adicional */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo adicional">

        {/* Paso A: Elegir categoría */}
        <div className="ob-field">
          <label className="ob-label">
            ¿Qué tipo de adicional es?
            <TooltipHelp text="Agrupamos los extras por tipo para que Nilah los aplique correctamente al cotizar." />
          </label>
          <div className="ob-chip-grid">
            {CATEGORIAS_EXTRA.map((c) => (
              <SelectionChip
                key={c}
                label={`${categoriaEmojis[c] || '📦'} ${c}`}
                selected={current.categoria === c}
                onClick={() => setCurrent({ categoria: c })}
              />
            ))}
          </div>
        </div>

        {/* Paso B: Sugerencias predefinidas según categoría */}
        {catActual && predCatActual.length > 0 && (
          <div className="ob-field">
            <label className="ob-label">Sugerencias rápidas para <strong>{catActual}</strong></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {predCatActual.map((pref) => (
                <button
                  key={pref.nombre}
                  type="button"
                  onClick={() => seleccionarPredefinido(catActual, pref)}
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
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--c-text)' }}>{pref.nombre}</span>
                    <span style={{ fontSize: '11px', color: 'var(--c-text-sec)', marginLeft: 8 }}>({pref.etiqueta})</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--c-primary)' }}>
                    {pref.precioSugerido === 0 ? 'Gratis' : `+${moneda} ${pref.precioSugerido}`}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--c-text-sec)', marginTop: '6px' }}>
              💡 Haz clic en uno para autocompletar y ajusta el precio si es diferente en tu salón.
            </p>
          </div>
        )}

        {/* Paso C: Nombre (editable o personalizado) */}
        {catActual && (
          <>
            <div className="ob-field">
              <label className="ob-label">Nombre del extra <span className="ob-label-optional">(personaliza si quieres)</span></label>
              <input
                className="ob-input"
                type="text"
                placeholder={catActual === 'Largo' ? 'Ej: Largo XL o Extremo' : catActual === 'Diseño' ? 'Ej: Encapsulado, French' : 'Escribe el nombre...'}
                value={current.nombre || ''}
                onChange={(e) => setCurrent((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">Etiqueta corta <span className="ob-label-optional">(para mostrar al cliente)</span></label>
              <input
                className="ob-input"
                type="text"
                placeholder="Ej: XL, Coffin, 3D, French"
                value={current.etiqueta || ''}
                onChange={(e) => setCurrent((p) => ({ ...p, etiqueta: e.target.value }))}
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">
                Precio adicional
                <TooltipHelp text="0 = incluido en el precio base. Coloca el cobro extra sobre el precio del servicio." />
              </label>
              <input
                className="ob-input"
                type="number"
                placeholder="+0.00"
                min={0}
                value={current.precio ?? ''}
                onChange={(e) => setCurrent((p) => ({ ...p, precio: Number(e.target.value) }))}
              />
            </div>

            <button
              type="button"
              className="ob-btn-primary"
              onClick={confirmExtra}
              disabled={!current.categoria || !current.nombre || current.precio === undefined}
            >
              Agregar ✓
            </button>
          </>
        )}
      </BottomModal>
    </div>
  );
};

export default StepExtras;
