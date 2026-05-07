import React, { useEffect, useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { ServicioOnboarding, CategoriaServicio, saveStepServicios, getCategoriasServicio } from '../../services/onboarding';
import { supabase } from '../../services/supabase';
import { SERVICIOS_PREDEFINIDOS } from '../../data/serviciosPredefinidos';

interface Props {
  businessId: string;
  tokenId: string;
  categoriasServicio: CategoriaServicio[];
  moneda?: string;
  onComplete: (categorias: string[]) => void;
  onBack?: () => void;
}

const DURACIONES = [
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '1h 30', value: 90 },
  { label: '2 hrs', value: 120 },
  { label: '2h 30', value: 150 },
  { label: '3 hrs', value: 180 },
  { label: '3h 30', value: 210 },
  { label: '4 hrs', value: 240 },
  { label: '5 hrs', value: 300 },
  { label: '6 hrs', value: 360 },
];

const PRIORIDADES = [
  { value: '1', label: '⭐ Alta', desc: 'Nilah la recomienda primero' },
  { value: '2', label: '⭐⭐ Media', desc: 'Se recomienda junto con otras' },
  { value: '3', label: '⭐⭐⭐ Baja', desc: 'Solo si el cliente la pide' },
];

const SOPORTE_WA = 'https://wa.me/51926285289?text=Hola,%20quiero%20enviar%20mi%20lista%20de%20precios%20para%20cargarla%20en%20mi%20cuenta.';

const StepServicios: React.FC<Props> = ({ businessId, tokenId, categoriasServicio: propCategorias, moneda = 'S/.', onComplete, onBack }) => {
  const [categorias, setCategorias] = useState<CategoriaServicio[]>(propCategorias || []);
  const [categoriasActivas, setCategoriasActivas] = useState<string[]>([]);
  const [servicios, setServicios] = useState<ServicioOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentServicio, setCurrentServicio] = useState<Partial<ServicioOnboarding>>({ es_variable: false });
  const [currentCat, setCurrentCat] = useState<CategoriaServicio | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    if (servicios.length === 0 && businessId) {
      setFetching(true);
      supabase.from('servicios').select('*').eq('business_id', businessId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setServicios(data.map(d => ({
              nombre: d.nombre,
              categoria: d.categoria_servicio || '',
              categoria_id: d.categoria_id,
              precio: parseFloat(d.precio) || 0,
              duracion: d.duracion || 60,
              es_variable: d.precio === 0 || false, // approximation
              prioridad: d.prioridad?.toString() || '2',
              subcategoria: d.subcategoria,
              tags: d.tags,
              descripcion_detallada: d.descripcion_detallada
            })));
            const userCats = Array.from(new Set(data.filter(d => d.categoria_servicio).map(d => d.categoria_servicio)));
            setCategoriasActivas(userCats as string[]);
          }
          setFetching(false);
        });
    }
  }, [businessId]);

  // Si no vienen por props (ej: recarga), las cargamos de DB
  useEffect(() => {
    if (categorias.length === 0 && businessId) {
      getCategoriasServicio(businessId).then(setCategorias);
    }
  }, [businessId]);

  const toggleCategoria = (cat: CategoriaServicio) => {
    const nombre = cat.nombre;
    if (categoriasActivas.includes(nombre)) {
      setCategoriasActivas((p) => p.filter((x) => x !== nombre));
    } else {
      setCategoriasActivas((p) => [...p, nombre]);
    }
  };

  const openAddServicio = (cat: CategoriaServicio) => {
    setCurrentCat(cat);
    setCurrentServicio({
      es_variable: false,
      categoria: cat.nombre,
      categoria_id: cat.id,
      prioridad: '2',
    });
    setPickerOpen(false);
    setPickerSearch('');
    setModalOpen(true);
  };

  const confirmServicio = () => {
    if (!currentServicio.nombre || currentServicio.precio === undefined || !currentServicio.duracion) return;
    setServicios((prev) => [
      ...prev,
      {
        nombre: currentServicio.nombre!,
        categoria: currentCat?.nombre || '',
        categoria_id: currentCat?.id,
        precio: currentServicio.precio!,
        duracion: currentServicio.duracion!,
        es_variable: currentServicio.es_variable || false,
        prioridad: currentServicio.prioridad || '2',
        subcategoria: currentServicio.subcategoria,
        tags: currentServicio.tags,
        descripcion_detallada: currentServicio.descripcion_detallada,
      },
    ]);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    // Ya no es obligatorio agregar servicios si se prefiere soporte directo
    setLoading(true);
    try {
      if (servicios.length > 0) {
        await saveStepServicios(businessId, servicios, tokenId);
      }
      onComplete(categoriasActivas);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando servicios.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="ob-step flex flex-col items-center justify-center min-h-[50vh]">
        <div className="ob-page-spinner" />
        <p className="text-zinc-500 mt-4 text-sm font-medium">Recuperando servicios...</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      <div className="ob-step-icon">💅</div>
      <h2 className="ob-step-title">Tus servicios</h2>
      <p className="ob-step-subtitle">Selecciona tus categorías y añade los servicios con precio y duración.</p>

      {/* Categorías desde DB */}
      <section className="ob-section">
        <label className="ob-label">¿Qué áreas quieres configurar hoy?</label>
        {categorias.length === 0 ? (
          <p className="ob-hint">Cargando categorías...</p>
        ) : (
          <div className="ob-category-grid">
            {categorias.map((cat) => (
              <button
                key={cat.nombre}
                type="button"
                onClick={() => toggleCategoria(cat)}
                className={`ob-cat-card ${categoriasActivas.includes(cat.nombre) ? 'ob-cat-card--selected' : ''}`}
              >
                <span className="ob-cat-emoji">{cat.emoji}</span>
                <span className="ob-cat-label">{cat.nombre}</span>
                {categoriasActivas.includes(cat.nombre) && (
                  <span className="ob-cat-check">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Servicios por categoría */}
      {categoriasActivas.map((catNombre) => {
        const cat = categorias.find((c) => c.nombre === catNombre);
        const catServs = servicios.filter((s) => s.categoria === catNombre);
        return (
          <section key={catNombre} className="ob-section ob-section--cat">
            <div className="ob-cat-header">
              <span>{cat?.emoji || '🏷️'} <strong>{catNombre}</strong></span>
            </div>

            {catServs.map((s, i) => (
              <div key={i} className="ob-servicio-row">
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span className="ob-servicio-nombre">{s.nombre}</span>
                  <span style={{fontSize: 10, color: 'var(--c-text-sec)', marginTop: 2}}>
                    Prioridad: {s.prioridad === '1' ? '⭐ Alta' : s.prioridad === '2' ? '⭐⭐ Media' : '⭐⭐⭐ Baja'}
                  </span>
                </div>
                <span className="ob-servicio-precio">{moneda} {s.precio}</span>
                <span className="ob-servicio-dur">{s.duracion}min</span>
                {s.es_variable && <span className="ob-servicio-var">Variable</span>}
              </div>
            ))}

            <button
              type="button"
              className="ob-btn-ghost ob-btn-ghost--small"
              onClick={() => cat && openAddServicio(cat)}
            >
              ＋ Agregar servicio
            </button>
          </section>
        );
      })}

      {/* Opción informativa de soporte */}
      <section className="ob-section ob-section--alt" style={{
        background: 'rgba(16,185,129,0.05)',
        border: '1px dashed rgba(16,185,129,0.3)',
        borderRadius: '16px',
        padding: '1.25rem',
        marginTop: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem' }}>📄</span>
          <div>
            <p className="ob-alt-title" style={{ margin: 0, color: 'var(--ob-primary, #10b981)', fontSize: '15px' }}>
              ¿Prefieres que nosotros lo hagamos?
            </p>
            <p className="ob-alt-desc" style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
              Si tienes tu lista en una <strong>foto, PDF o archivo Excel</strong>, envíalo a nuestro equipo de soporte por WhatsApp y lo cargaremos por ti en menos de 24h.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--ob-text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
              * Puedes presionar "Siguiente" y enviar el archivo luego para no detener tu configuración.
            </p>
          </div>
        </div>
      </section>

      {error && <p className="ob-error">{error}</p>}

      <button
        type="button"
        className="ob-btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
      </button>
      {onBack && (
        <button type="button" className="ob-btn-back" style={{marginTop: 8}} onClick={onBack}>
          ← Atrás
        </button>
      )}


      {/* Modal agregar servicio */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Nuevo en ${currentCat?.nombre || ''}`}>
        <div className="ob-field">
          <label className="ob-label">Nombre del servicio</label>

          {/* ── PICKER DESPLEGABLE ── */}
          {currentCat?.nombre && (() => {
            const n = currentCat.nombre.toLowerCase();
            let categoryKey = '';
            if (n.includes('mano') || n.includes('uña') || n.includes('nail')) categoryKey = 'Manos';
            else if (n.includes('pie') || n.includes('pedi') || n.includes('foot')) categoryKey = 'Pies';
            else if (n.includes('pestaña') || n.includes('lash')) categoryKey = 'Pestañas';
            else if (n.includes('ceja') || n.includes('brow')) categoryKey = 'Cejas';
            else if (n.includes('cabello') || n.includes('pelo') || n.includes('hair')) categoryKey = 'Cabello';
            else if (n.includes('rostro') || n.includes('facial') || n.includes('cara')) categoryKey = 'Rostro';
            else if (n.includes('masaje') || n.includes('cuerpo') || n.includes('body') || n.includes('corporal')) categoryKey = 'Masajes';
            else if (n.includes('depila') || n.includes('wax')) categoryKey = 'Depilación';
            else if (n.includes('maquillaje') || n.includes('makeup')) categoryKey = 'Maquillaje';

            const allPrefs = SERVICIOS_PREDEFINIDOS[categoryKey] || [];
            if (allPrefs.length === 0) return null;

            const filtered = pickerSearch.trim()
              ? allPrefs.filter((p) => p.nombre.toLowerCase().includes(pickerSearch.toLowerCase()))
              : allPrefs;

            return (
              <div className="ob-service-picker">
                {/* Botón activador */}
                <button
                  type="button"
                  className={`ob-service-picker-btn ${pickerOpen ? 'ob-service-picker-btn--open' : ''}`}
                  onClick={() => setPickerOpen((o) => !o)}
                >
                  <span className="ob-service-picker-btn-icon">{currentCat.emoji || '🏷️'}</span>
                  <span className="ob-service-picker-btn-text">
                    {currentServicio.nombre
                      ? <><strong>{currentServicio.nombre}</strong><span className="ob-service-picker-change"> · Cambiar</span></>
                      : 'Elige un servicio predefinido'}
                  </span>
                  <span className="ob-service-picker-arrow">{pickerOpen ? '▲' : '▼'}</span>
                </button>

                {/* Panel desplegable */}
                {pickerOpen && (
                  <>
                    <div className="ob-service-picker-backdrop" onClick={() => setPickerOpen(false)} style={{
                      position: 'fixed', inset: 0, zIndex: 99 
                    }} />
                    <div className="ob-service-picker-panel" style={{ position: 'relative', zIndex: 100 }}>
                    {/* Buscador */}
                    <div className="ob-service-picker-search">
                      <span className="ob-service-picker-search-icon">🔍</span>
                      <input
                        type="text"
                        className="ob-service-picker-search-input"
                        placeholder={`Buscar en ${categoryKey}...`}
                        value={pickerSearch}
                        autoFocus
                        onChange={(e) => setPickerSearch(e.target.value)}
                      />
                      {pickerSearch && (
                        <button type="button" className="ob-service-picker-clear" onClick={() => setPickerSearch('')}>✕</button>
                      )}
                    </div>

                    {/* Lista de servicios */}
                    <div className="ob-service-picker-list">
                      {filtered.length === 0 ? (
                        <p className="ob-service-picker-empty">Sin resultados para "{pickerSearch}"</p>
                      ) : (
                        filtered.map((pref, idx) => {
                          const isSelected = currentServicio.nombre === pref.nombre;
                          return (
                            <button
                              key={pref.nombre}
                              type="button"
                              className={`ob-service-picker-item ${isSelected ? 'ob-service-picker-item--selected' : ''}`}
                              onClick={() => {
                                setCurrentServicio((c) => ({
                                  ...c,
                                  nombre: pref.nombre,
                                  subcategoria: pref.subcategoria,
                                  tags: pref.tagsDefault,
                                }));
                                setPickerOpen(false);
                                setPickerSearch('');
                              }}
                            >
                              <span className="ob-service-picker-item-num">{String(idx + 1).padStart(2, '0')}</span>
                              <span className="ob-service-picker-item-name">{pref.nombre}</span>
                              <span className="ob-service-picker-item-sub">{pref.subcategoria}</span>
                              {isSelected && <span className="ob-service-picker-item-check">✓</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* Input custom — show if picker closed OR no category presets */}
          {!pickerOpen && (
            <input
              className="ob-input"
              type="text"
              style={{ marginTop: currentServicio.nombre ? '0.5rem' : '0.5rem' }}
              placeholder={currentServicio.nombre ? 'O escribe un nombre diferente...' : 'O escribe tu propio servicio...'}
              value={currentServicio.nombre || ''}
              onChange={(e) => setCurrentServicio((c) => ({ ...c, nombre: e.target.value }))}
            />
          )}
        </div>

        <div className="ob-field">
          <label className="ob-label">Precio</label>
          <input
            className="ob-input"
            type="number"
            placeholder="0.00"
            min={0}
            value={currentServicio.precio ?? ''}
            onChange={(e) => setCurrentServicio((c) => ({ ...c, precio: Number(e.target.value) }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Duración
            <TooltipHelp text="Nilah usará esto para calcular cuándo hay disponibilidad." />
          </label>
          <div className="ob-chip-grid">
            {DURACIONES.map((d) => (
              <SelectionChip
                key={d.value}
                label={d.label}
                selected={currentServicio.duracion === d.value}
                onClick={() => setCurrentServicio((c) => ({ ...c, duracion: d.value }))}
              />
            ))}
          </div>
        </div>

        <div className="ob-field ob-field--row">
          <label className="ob-label">
            ¿Precio variable?
            <TooltipHelp text="Actívalo si el precio cambia según diseño, largo o complejidad. Nilah avisará que es referencial." />
          </label>
          <button
            type="button"
            className={`ob-toggle ${currentServicio.es_variable ? 'ob-toggle--on' : ''}`}
            onClick={() => setCurrentServicio((c) => ({ ...c, es_variable: !c.es_variable }))}
          >
            {currentServicio.es_variable ? 'Sí' : 'No'}
          </button>
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Subcategoría
            <TooltipHelp text="Agrupa servicios similares. Ayuda a Nilah a encontrarlos más rápido." />
          </label>
          <div className="ob-chip-grid">
            {currentCat?.nombre && (() => {
              const n = currentCat.nombre.toLowerCase();
              let opciones = ['Básico', 'Premium', 'Mantenimiento'];
              if (n.includes('mano') || n.includes('uña') || n.includes('nail')) opciones = ['Esmaltado', 'Sistemas', 'Manicura Clásica', 'Manicura Premium', 'Press On', 'Nail Art', 'Retiro', 'Tratamiento'];
              else if (n.includes('pie') || n.includes('pedi')) opciones = ['Pedicura Spa', 'Esmaltado', 'Pedicura Clásica', 'Pedicura Medicinal', 'Sistemas', 'Retiro', 'Tratamiento'];
              else if (n.includes('pestaña') || n.includes('lash')) opciones = ['Extensiones', 'Lifting', 'Tinte', 'Retoque', 'Retiro'];
              else if (n.includes('ceja') || n.includes('brow')) opciones = ['Diseño', 'Laminado', 'Tinte', 'Micropigmentación'];
              else if (n.includes('cabello') || n.includes('pelo') || n.includes('hair')) opciones = ['Colorimetría', 'Corte', 'Tratamiento', 'Alisado', 'Peinado', 'Rizado', 'Extensiones'];
              else if (n.includes('rostro') || n.includes('facial')) opciones = ['Limpieza Facial', 'Hidratación', 'Tratamiento', 'Estética Avanzada', 'Maquillaje', 'Micropigmentación', 'Depilación Facial'];
              else if (n.includes('masaje') || n.includes('cuerpo') || n.includes('body') || n.includes('corporal')) opciones = ['Masajes Terapéuticos', 'Masajes Estéticos', 'Masajes Especiales', 'Reflexología', 'Estética Corporal'];
              else if (n.includes('depila') || n.includes('wax')) opciones = ['Depilación Corporal', 'Depilación Zona Íntima', 'Depilación Facial', 'Micropigmentación'];
              else if (n.includes('maquillaje') || n.includes('makeup')) opciones = ['Maquillaje Social', 'Maquillaje Novia', 'Maquillaje Artístico', 'Maquillaje Premium', 'Micropigmentación', 'Maquillaje Exprés'];
              
              const isCustom = currentServicio.subcategoria && !opciones.includes(currentServicio.subcategoria);

              return (
                <>
                  {opciones.map((opcion) => (
                    <SelectionChip
                      key={opcion}
                      label={opcion}
                      selected={currentServicio.subcategoria === opcion}
                      onClick={() => setCurrentServicio((c) => ({ ...c, subcategoria: opcion }))}
                    />
                  ))}
                  <SelectionChip
                    label="Personalizada..."
                    selected={!!isCustom}
                    onClick={() => setCurrentServicio((c) => ({ ...c, subcategoria: isCustom ? '' : 'Otra' }))}
                  />
                </>
              );
            })()}
          </div>
          {currentServicio.subcategoria !== undefined && (() => {
            const n = currentCat?.nombre?.toLowerCase() || '';
            let opciones = ['Básico', 'Premium', 'Mantenimiento'];
            if (n.includes('mano') || n.includes('uña') || n.includes('nail')) opciones = ['Esmaltado', 'Sistemas (Acrílico, Gel)', 'Manicura Spa', 'Nail Art', 'Mantenimiento'];
            else if (n.includes('pie') || n.includes('pedi')) opciones = ['Pedicura Spa', 'Esmaltado', 'Tratamiento Pedi'];
            else if (n.includes('pestaña') || n.includes('lash')) opciones = ['Extensiones', 'Lifting', 'Retoque'];
            else if (n.includes('ceja') || n.includes('brow')) opciones = ['Diseño y Depilación', 'Laminado', 'Micropigmentación'];
            else if (n.includes('cabello') || n.includes('pelo') || n.includes('hair')) opciones = ['Colorimetría', 'Corte', 'Tratamiento', 'Alisado', 'Peinado'];
            else if (n.includes('rostro') || n.includes('facial')) opciones = ['Limpieza Facial', 'Depilación', 'Tratamiento Anti-edad'];
            else if (n.includes('cuerpo') || n.includes('masaje') || n.includes('body')) opciones = ['Masaje Relajante', 'Masaje Reductor', 'Depilación Corporal'];
            
            if (!opciones.includes(currentServicio.subcategoria) || currentServicio.subcategoria === 'Otra') {
              return (
                <input
                  className="ob-input mt-2"
                  type="text"
                  placeholder="Escribe tu subcategoría..."
                  value={currentServicio.subcategoria === 'Otra' ? '' : currentServicio.subcategoria}
                  onChange={(e) => setCurrentServicio((c) => ({ ...c, subcategoria: e.target.value }))}
                />
              );
            }
            return null;
          })()}
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Keywords / Palabras Clave <span className="ob-label-optional">(opcional)</span>
            <TooltipHelp text="Por ejemplo, si el servicio es 'Lifting', pon palabras como 'rizado permanente', 'lifting de pestañas', 'lash lift'. Esto ayuda a Nilah a sugerirlo correctamente." />
          </label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: rizado, pestañas, permanente"
            value={currentServicio.tags || ''}
            onChange={(e) => setCurrentServicio((c) => ({ ...c, tags: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Detalles Adicionales <span className="ob-label-optional">(opcional pero muy recomendado)</span>
            <TooltipHelp text="Escribe qué marcas o productos usas, si incluye algo extra, o información que el chatbot debe saber. ¡El chatbot lo usará para vender mejor!" />
          </label>
          <textarea
            className="ob-input"
            rows={2}
            style={{ resize: 'vertical', fontSize: '13px', lineHeight: '1.4' }}
            placeholder="Ej: Usamos productos Davines orgánicos, dura 3 meses, apto para embarazadas..."
            value={currentServicio.descripcion_detallada || ''}
            onChange={(e) => setCurrentServicio((c) => ({ ...c, descripcion_detallada: e.target.value }))}
          />
        </div>

        <div className="ob-field ob-field--row">
          <label className="ob-label" style={{margin: 0}}>
            Prioridad del Servicio
            <TooltipHelp text="Nilah sugerirá de forma más agresiva los de prioridad Alta." />
          </label>
          <div className="ob-chip-grid" style={{flex: 1, justifyContent: 'flex-end', margin: 0}}>
             {PRIORIDADES.map((p) => (
              <SelectionChip
                key={p.value}
                label={p.value === '1' ? '⭐ Alta' : p.value === '2' ? '⭐⭐ Media' : '⭐⭐⭐ Baja'}
                selected={currentServicio.prioridad === p.value}
                onClick={() => setCurrentServicio(c => ({...c, prioridad: p.value}))}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className="ob-btn-primary"
          style={{marginTop: 16}}
          onClick={confirmServicio}
          disabled={!currentServicio.nombre || currentServicio.precio === undefined || !currentServicio.duracion}
        >
          Agregar servicio ✓
        </button>
      </BottomModal>
    </div>
  );
};

export default StepServicios;
