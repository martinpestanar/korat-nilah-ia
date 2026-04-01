import React, { useState, useEffect } from 'react';
import BigOptionCard from './ui/BigOptionCard';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { PremioOnboarding, saveStepFidelizacion, getCategoriasServicio } from '../../services/onboarding';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  categoriasServicio: string[];
  onComplete: () => void;
  onBack?: () => void;
}

const StepFidelizacion: React.FC<Props> = ({ businessId, tokenId, categoriasServicio: propCategorias, onComplete, onBack }) => {
  const [categorias, setCategorias] = useState<string[]>(propCategorias || []);
  const [loadingCats, setLoadingCats] = useState(propCategorias.length === 0);
  const [modo, setModo] = useState<'global' | 'staff' | null>(null);
  const [premios, setPremios] = useState<PremioOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCat, setCurrentCat] = useState('General');
  const [current, setCurrent] = useState<Partial<PremioOnboarding>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si llegan vacías (ej: usuario retoma desde token), las carga de la DB
  useEffect(() => {
    if (propCategorias.length === 0 && businessId) {
      getCategoriasServicio(businessId)
        .then((cats) => setCategorias(cats.map((c) => c.nombre)))
        .finally(() => setLoadingCats(false));
    } else {
      setLoadingCats(false);
    }
  }, [businessId]);

  // Hidratar premios y modo de fidelización si ya se guardaron antes
  useEffect(() => {
    if (premios.length === 0 && businessId) {
      supabase.from('premios_fidelizacion').select('*').eq('business_id', businessId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setPremios(data.map(d => ({
              nombre: d.nombre,
              categoria: d.categoria || 'General',
              costo_puntos: d.costo_puntos || 100,
              descripcion: d.descripcion,
            })));
          }
        });
      supabase.from('negocios').select('recursos_saas').eq('id', businessId).single()
        .then(({ data }) => {
          if (data?.recursos_saas?.fidelizacion_modo) {
            setModo(data.recursos_saas.fidelizacion_modo);
          }
        });
    }
  }, [businessId]);

  const openModalPremio = (cat = 'General') => {
    setCurrentCat(cat);
    setCurrent({ categoria: cat, costo_puntos: 100 });
    setModalOpen(true);
  };

  const confirmPremio = () => {
    if (!current.nombre || !current.costo_puntos) return;
    setPremios((prev) => [...prev, { ...current, categoria: currentCat } as PremioOnboarding]);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!modo) { setError('Elige un modo de fidelización.'); return; }
    
    // Validar premios sólo como un warning si es posible, pero no bloquear. Dejamos que Nilah lo configure con ellos después si quieren.
    // Solo bloqueamos si no hay modo seleccionado.
    setLoading(true);
    try {
      await saveStepFidelizacion(businessId, modo, premios, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando fidelización.');
    } finally {
      setLoading(false);
    }
  };

  const premiosPorCat = (cat: string) => premios.filter((p) => p.categoria === cat);

  if (loadingCats) {
    return (
      <div className="ob-step">
        <div className="ob-step-icon">🎁</div>
        <p className="ob-hint">Cargando tus categorías...📦</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      <div className="ob-step-icon">🎁</div>
      <h2 className="ob-step-title">Sistema de fidelización</h2>
      <p className="ob-step-subtitle">
        ¿Cómo quieres que tus clientes acumulen puntos?
        <TooltipHelp text="Podrás cambiar el modo después. Lo activaremos juntos en tu sesión de configuración inicial." />
      </p>

      {/* Selección de modo */}
      <div className="ob-big-cards-row">
        <BigOptionCard
          emoji="🌐"
          title="Global"
          description="Puntos por cualquier servicio, sin importar quién lo atienda."
          pros={['Más simple de gestionar', 'Clientes acumulan más rápido']}
          selected={modo === 'global'}
          onClick={() => { setModo('global'); setError(''); }}
        />
        <BigOptionCard
          emoji="👩‍🎨"
          title="Por Especialista"
          description="Puntos separados por categoría. Las clientas fidelizan con su artista favorita."
          pros={['Más personalizado', 'Incentiva servicios específicos']}
          selected={modo === 'staff'}
          onClick={() => { setModo('staff'); setError(''); }}
        />
      </div>

      {/* Premios según modo */}
      {modo === 'global' && (
        <section className="ob-section">
          <h3 className="ob-section-title">Tus premios</h3>
          {premios.map((p, i) => (
            <div key={i} className="ob-premio-row">
              <span className="ob-premio-nombre">🎁 {p.nombre}</span>
              <span className="ob-premio-puntos">{p.costo_puntos} pts</span>
              <button type="button" className="ob-staff-remove" onClick={() => setPremios((prev) => prev.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="ob-btn-secondary" onClick={() => openModalPremio('General')}>
            ＋ Agregar premio
          </button>
        </section>
      )}

      {modo === 'staff' && (
        <section className="ob-section">
          <h3 className="ob-section-title">Premios por categoría</h3>
          {categorias.length > 0 ? (
            <>
              <p className="ob-section-hint">Agrega al menos 1 premio por categoría.</p>
              {categorias.map((cat) => {
                const catPremios = premiosPorCat(cat);
                return (
                  <div key={cat} className="ob-cat-premios">
                    <div className="ob-cat-header">
                      <strong>{cat}</strong>
                      <span className="ob-cat-count" style={{ color: catPremios.length > 0 ? 'var(--c-success, #10b981)' : 'var(--c-text-sec)' }}>
                        {catPremios.length > 0 ? `✓ ${catPremios.length} premio(s)` : 'Sin premios aún'}
                      </span>
                    </div>
                    {catPremios.map((p, i) => (
                      <div key={i} className="ob-premio-row ob-premio-row--indent">
                        <span className="ob-premio-nombre">🎁 {p.nombre}</span>
                        <span className="ob-premio-puntos">{p.costo_puntos} pts</span>
                        <button
                          type="button"
                          className="ob-staff-remove"
                          onClick={() => setPremios((prev) => prev.filter((_, j) => prev.indexOf(p) !== j))}
                        >✕</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ob-btn-ghost ob-btn-ghost--small"
                      onClick={() => openModalPremio(cat)}
                    >
                      ＋ Premio para {cat}
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <p className="ob-section-hint" style={{color: 'var(--c-text-sec)'}}>
                No definiste categorías de servicio. Puedes agregar premios generales o configurarlo desde Ajustes.
              </p>
              {premios.map((p, i) => (
                <div key={i} className="ob-premio-row">
                  <span className="ob-premio-nombre">🎁 {p.nombre}</span>
                  <span className="ob-premio-puntos">{p.costo_puntos} pts</span>
                  <button type="button" className="ob-staff-remove" onClick={() => setPremios((prev) => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button type="button" className="ob-btn-secondary" onClick={() => openModalPremio('General')}>
                ＋ Agregar premio general
              </button>
            </>
          )}
        </section>
      )}

      {modo && (
        <div className="ob-notice-box">
          ✋ Activaremos el sistema de puntos contigo en la reunión de configuración. Por ahora define tus premios.
        </div>
      )}

      {error && <p className="ob-error">{error}</p>}

      {modo && (
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
            disabled={loading}
          >
            {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
          </button>
        </div>
      )}

      {/* Modal premio */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Nuevo premio${modo === 'staff' ? ` — ${currentCat}` : ''}`}>
        <div className="ob-field">
          <label className="ob-label">Nombre del premio</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Descuento 20%, Uñas gratis"
            value={current.nombre || ''}
            onChange={(e) => setCurrent((c) => ({ ...c, nombre: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Puntos necesarios para canjearlo
            <TooltipHelp text="Define cuántos puntos necesita acumular un cliente para ganar este premio." />
          </label>
          <input
            className="ob-input"
            type="number"
            placeholder="Ej: 500"
            min={1}
            value={current.costo_puntos ?? ''}
            onChange={(e) => setCurrent((c) => ({ ...c, costo_puntos: Number(e.target.value) }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Descripción <span className="ob-label-optional">(opcional)</span></label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Aplica solo en servicios de manos"
            value={current.descripcion || ''}
            onChange={(e) => setCurrent((c) => ({ ...c, descripcion: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Stock límite <span className="ob-label-optional">(opcional, deja vacío para ilimitado)</span></label>
          <input
            className="ob-input"
            type="number"
            placeholder="Ej: 10"
            min={1}
            value={current.limite_stock ?? ''}
            onChange={(e) => setCurrent((c) => ({ ...c, limite_stock: Number(e.target.value) || undefined }))}
          />
        </div>

        <button
          type="button"
          className="ob-btn-primary"
          onClick={confirmPremio}
          disabled={!current.nombre || !current.costo_puntos}
        >
          Agregar premio ✓
        </button>
      </BottomModal>
    </div>
  );
};

export default StepFidelizacion;
