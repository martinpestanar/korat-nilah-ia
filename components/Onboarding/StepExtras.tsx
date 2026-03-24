import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { ExtraOnboarding, saveStepExtras } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: () => void;
}

const CATEGORIAS_EXTRA = ['Largo', 'Diseño', 'Material', 'Tratamiento', 'Otro'];

const StepExtras: React.FC<Props> = ({ businessId, tokenId, onComplete }) => {
  const [tieneExtras, setTieneExtras] = useState<boolean | null>(null);
  const [extras, setExtras] = useState<ExtraOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState<Partial<ExtraOnboarding>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="ob-step">
      <div className="ob-step-icon">💎</div>
      <h2 className="ob-step-title">Precios adicionales</h2>
      <p className="ob-step-subtitle">
        ¿Tus servicios tienen extras que cambian el precio?
        <TooltipHelp text="Por ejemplo: largo XL, piedras, diseño complejo. Nilah los usará para cotizar automáticamente cuando una clienta envíe una foto de sus uñas." />
      </p>

      {tieneExtras === null && (
        <div className="ob-big-choice">
          <button
            type="button"
            className="ob-big-choice-btn"
            onClick={() => setTieneExtras(true)}
          >
            <span className="ob-big-choice-emoji">✅</span>
            <span>Sí, tengo adicionales</span>
          </button>
          <button
            type="button"
            className="ob-big-choice-btn ob-big-choice-btn--ghost"
            onClick={() => { setTieneExtras(false); }}
          >
            <span className="ob-big-choice-emoji">⏭️</span>
            <span>No por ahora</span>
            <span className="ob-big-choice-note">Podrás configurarlo desde Ajustes</span>
          </button>
        </div>
      )}

      {tieneExtras === false && (
        <div className="ob-skip-confirm">
          <p>Perfecto. Puedes agregar adicionales desde <strong>Configuración → Precios Extras</strong> cuando quieras.</p>
          <button type="button" className="ob-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
          </button>
        </div>
      )}

      {tieneExtras === true && (
        <>
          {extras.length > 0 && (
            <div className="ob-extras-list">
              {extras.map((ex, i) => (
                <div key={i} className="ob-extra-row">
                  <span className="ob-extra-cat">{ex.categoria}</span>
                  <span className="ob-extra-nombre">{ex.nombre} <em>({ex.etiqueta})</em></span>
                  <span className="ob-extra-precio">+S/. {ex.precio}</span>
                  <button
                    type="button"
                    className="ob-staff-remove"
                    onClick={() => setExtras((p) => p.filter((_, j) => j !== i))}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="ob-btn-secondary" onClick={() => setModalOpen(true)}>
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

      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo adicional">
        <div className="ob-field">
          <label className="ob-label">Categoría del adicional</label>
          <div className="ob-chip-grid">
            {CATEGORIAS_EXTRA.map((c) => (
              <SelectionChip
                key={c}
                label={c}
                selected={current.categoria === c}
                onClick={() => setCurrent((p) => ({ ...p, categoria: c }))}
              />
            ))}
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label">Nombre del extra</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Largo XL"
            value={current.nombre || ''}
            onChange={(e) => setCurrent((p) => ({ ...p, nombre: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Etiqueta descriptiva</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Extremo, Super largo"
            value={current.etiqueta || ''}
            onChange={(e) => setCurrent((p) => ({ ...p, etiqueta: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Precio adicional</label>
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
      </BottomModal>
    </div>
  );
};

export default StepExtras;
