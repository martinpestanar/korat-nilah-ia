import React, { useState, useEffect } from 'react';
import BottomModal from './ui/BottomModal';
import { saveStepCategorias, CategoriaServicio } from '../../services/onboarding';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  initialData?: CategoriaServicio[];
  onComplete: (categorias: CategoriaServicio[]) => void;
  onBack?: () => void;
}

// Tags predefinidos por categoría — base de conocimiento para el chatbot Nilah
const TAGS_POR_CATEGORIA: Record<string, string[]> = {
  'Manos': ['manicure', 'uñas', 'acrílico', 'semipermanente', 'esmaltado', 'soft gel', 'press on', 'nail art', 'poligel', 'remoción'],
  'Pies': ['pedicure', 'spa de pies', 'uñas pies', 'exfoliación', 'hidratación', 'esmaltado pies'],
  'Pestañas': ['extensiones de pestañas', 'lifting', 'laminado', 'tinte de pestañas', 'pelo a pelo', 'volumen ruso'],
  'Rostro': ['limpieza facial', 'hidratación facial', 'tratamiento facial', 'exfoliación', 'microdermabrasión', 'radiofrecuencia'],
  'Cabello': ['corte', 'tinte', 'mechas', 'balayage', 'alisado', 'keratina', 'ondulado', 'tratamiento capilar', 'hidratación'],
  'Masajes': ['masaje relajante', 'masaje descontracturante', 'masaje reductivo', 'reflexología', 'piedras calientes'],
  'Depilación': ['depilación cera', 'depilación láser', 'depilación hilo', 'zona íntima', 'cejas', 'bigote'],
  'Maquillaje': ['maquillaje social', 'maquillaje novia', 'maquillaje artístico', 'micropigmentación', 'cejas perfiladas'],
};

const PRESET_CATEGORIAS: CategoriaServicio[] = [
  { nombre: 'Manos', emoji: '💅' },
  { nombre: 'Pies', emoji: '🦶' },
  { nombre: 'Pestañas', emoji: '👁️' },
  { nombre: 'Rostro', emoji: '✨' },
  { nombre: 'Cabello', emoji: '💇' },
  { nombre: 'Masajes', emoji: '💆' },
  { nombre: 'Depilación', emoji: '🪮' },
  { nombre: 'Maquillaje', emoji: '💄' },
];

const EMOJIS = ['💅', '🦶', '👁️', '✨', '💇', '💆', '🪮', '💄', '🌿', '🌸', '⭐', '🎨', '🏷️', '🧖', '💈', '🧴', '🌺', '🫧'];

const parseTags = (desc: string | undefined): string[] =>
  (desc || '').split(',').map((t) => t.trim()).filter(Boolean);

const joinTags = (tags: string[]): string => tags.join(', ');

const StepCategorias: React.FC<Props> = ({ businessId, tokenId, initialData, onComplete, onBack }) => {
  const [selected, setSelected] = useState<CategoriaServicio[]>(initialData || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [customNombre, setCustomNombre] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🏷️');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    // Solo hidratamos si no vino initialData y el paso ya fue completado antes
    if ((!initialData || initialData.length === 0) && businessId) {
      setFetching(true);
      supabase.from('categorias_servicio').select('*').eq('business_id', businessId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSelected(data.map(d => ({
              id: d.id,
              nombre: d.nombre,
              emoji: d.emoji || '🏷️',
              descripcion: d.descripcion || '',
            })));
          }
          setFetching(false);
        });
    }
  }, [businessId]);

  const isSelected = (nombre: string) => selected.some((c) => c.nombre === nombre);

  const togglePreset = (cat: CategoriaServicio) => {
    if (isSelected(cat.nombre)) {
      setSelected((prev) => prev.filter((c) => c.nombre !== cat.nombre));
    } else {
      const presetTags = TAGS_POR_CATEGORIA[cat.nombre] || [];
      setSelected((prev) => [...prev, { ...cat, descripcion: joinTags(presetTags) }]);
    }
  };

  const openModal = () => {
    setCustomNombre('');
    setCustomEmoji('🏷️');
    setModalOpen(true);
  };

  const confirmCustom = () => {
    const nombre = customNombre.trim();
    if (!nombre) return;
    if (!isSelected(nombre)) {
      setSelected((prev) => [...prev, { nombre, emoji: customEmoji, descripcion: '' }]);
    }
    setModalOpen(false);
  };

  const removeCategoria = (nombre: string) => {
    setSelected((prev) => prev.filter((c) => c.nombre !== nombre));
  };

  const removeTag = (catNombre: string, tag: string) => {
    setSelected((prev) =>
      prev.map((c) => {
        if (c.nombre !== catNombre) return c;
        const tags = parseTags(c.descripcion).filter((t) => t !== tag);
        return { ...c, descripcion: joinTags(tags) };
      })
    );
  };

  const addCustomTag = (catNombre: string) => {
    const raw = (tagInputs[catNombre] || '').trim();
    if (!raw) return;
    const newTags = raw.split(',').map((t) => t.trim()).filter(Boolean);
    setSelected((prev) =>
      prev.map((c) => {
        if (c.nombre !== catNombre) return c;
        const existing = parseTags(c.descripcion);
        const merged = Array.from(new Set([...existing, ...newTags]));
        return { ...c, descripcion: joinTags(merged) };
      })
    );
    setTagInputs((prev) => ({ ...prev, [catNombre]: '' }));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Selecciona al menos una categoría de servicio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await saveStepCategorias(businessId, selected, tokenId);
      onComplete(selected);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando categorías.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="ob-step flex flex-col items-center justify-center min-h-[50vh]">
        <div className="ob-page-spinner" />
        <p className="text-zinc-500 mt-4 text-sm font-medium">Recuperando categorías...</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      <div className="ob-step-icon">🗂️</div>
      <h2 className="ob-step-title">Categorías de Servicio</h2>
      <p className="ob-step-subtitle">
        Define las áreas de trabajo de tu salón. Cada categoría incluye palabras clave que el chatbot usará para encontrar tus servicios.
      </p>

      {/* Presets */}
      <section className="ob-section">
        <label className="ob-label">Selecciona las que ofreces</label>
        <div className="ob-category-grid">
          {PRESET_CATEGORIAS.map((cat) => (
            <button
              key={cat.nombre}
              type="button"
              onClick={() => togglePreset(cat)}
              className={`ob-cat-card ${isSelected(cat.nombre) ? 'ob-cat-card--selected' : ''}`}
            >
              <span className="ob-cat-emoji">{cat.emoji}</span>
              <span className="ob-cat-label">{cat.nombre}</span>
              {isSelected(cat.nombre) && <span className="ob-cat-check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Botón de añadir categoría personalizada */}
      <button type="button" className="ob-btn-secondary" onClick={openModal}>
        ＋ Nueva categoría personalizada
      </button>

      {/* Lista de seleccionadas con chips de tags */}
      {selected.length > 0 && (
        <section className="ob-section">
          <label className="ob-label">Palabras clave por categoría</label>
          <p className="ob-hint" style={{ marginBottom: '0.75rem' }}>
            🤖 Nilah usa estas palabras para encontrar tus servicios. Las predefinidas ya están cargadas — agrega más si quieres.
          </p>
          <div className="ob-cat-selected-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selected.map((cat) => {
              const tags = parseTags(cat.descripcion);
              return (
                <div key={cat.nombre} className="ob-cat-selected-item" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem' }}>
                  {/* Cabecera */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="ob-cat-selected-emoji">{cat.emoji}</span>
                    <span className="ob-cat-selected-nombre">{cat.nombre}</span>
                    <button
                      type="button"
                      className="ob-cat-selected-remove"
                      onClick={() => removeCategoria(cat.nombre)}
                      style={{ marginLeft: 'auto' }}
                    >✕</button>
                  </div>

                  {/* Chips de tags */}
                  {tags.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {tags.map((tag) => (
                        <span key={tag} className="ob-tag-chip">
                          {tag}
                          <button
                            type="button"
                            className="ob-tag-chip-remove"
                            onClick={() => removeTag(cat.nombre, tag)}
                            title="Eliminar palabra clave"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--c-text-sec)', margin: 0 }}>Sin palabras clave aún.</p>
                  )}

                  {/* Input para añadir más tags */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="ob-input"
                      style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', flex: 1, borderRadius: '8px' }}
                      placeholder="Agregar más palabras clave (separar con comas)..."
                      value={tagInputs[cat.nombre] || ''}
                      onChange={(e) => setTagInputs((prev) => ({ ...prev, [cat.nombre]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          if (tagInputs[cat.nombre]?.trim()) {
                            addCustomTag(cat.nombre); 
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addCustomTag(cat.nombre)}
                      disabled={!tagInputs[cat.nombre] || tagInputs[cat.nombre].trim() === ''}
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        borderRadius: '8px',
                        cursor: (!tagInputs[cat.nombre] || tagInputs[cat.nombre].trim() === '') ? 'not-allowed' : 'pointer',
                        backgroundColor: (!tagInputs[cat.nombre] || tagInputs[cat.nombre].trim() === '') ? '#f4f4f5' : '#18181b',
                        color: (!tagInputs[cat.nombre] || tagInputs[cat.nombre].trim() === '') ? '#a1a1aa' : '#ffffff',
                        border: 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && <p className="ob-error">{error}</p>}

      <div className="ob-nav-buttons">
        {onBack && (
          <button type="button" className="ob-btn-back" onClick={onBack}>
            ← Atrás
          </button>
        )}
        <button
          type="button"
          className="ob-btn-primary"
          onClick={handleSubmit}
          disabled={loading || selected.length === 0}
        >
          {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
        </button>
      </div>

      {/* Modal para categoría personalizada */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva categoría">
        <div className="ob-field">
          <label className="ob-label">Nombre de la categoría</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Cejas, Corporal, Depilación..."
            value={customNombre}
            autoFocus
            onChange={(e) => setCustomNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmCustom(); }}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Elige un emoji</label>
          <div className="ob-emoji-grid">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`ob-emoji-option-lg ${customEmoji === e ? 'ob-emoji-option-lg--selected' : ''}`}
                onClick={() => setCustomEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="ob-btn-primary"
          onClick={confirmCustom}
          disabled={!customNombre.trim()}
        >
          Añadir categoría ✓
        </button>
      </BottomModal>
    </div>
  );
};

export default StepCategorias;
