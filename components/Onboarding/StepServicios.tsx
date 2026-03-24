import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { ServicioOnboarding, saveStepServicios } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  onComplete: (categorias: string[]) => void;
}

const CATEGORIAS_PRESET = [
  { label: 'Manos', emoji: '💅' },
  { label: 'Pies', emoji: '🦶' },
  { label: 'Pestañas', emoji: '👁️' },
  { label: 'Rostro', emoji: '✨' },
  { label: 'Cabello', emoji: '💇' },
];

const DURACIONES = [
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '1h 30', value: 90 },
  { label: '2 horas', value: 120 },
];

const PRIORIDADES = [
  { value: '1', label: '⭐ Alta', desc: 'Nilah la recomienda primero' },
  { value: '2', label: '⭐⭐ Media', desc: 'Se recomienda junto con otras' },
  { value: '3', label: '⭐⭐⭐ Baja', desc: 'Solo si el cliente la pide' },
];

const SOPORTE_WA = 'https://wa.me/51999000000?text=Hola,%20quiero%20enviar%20mi%20lista%20de%20precios%20para%20cargarla%20en%20mi%20cuenta.';

const StepServicios: React.FC<Props> = ({ businessId, tokenId, onComplete }) => {
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState('');
  const [prioridades, setPrioridades] = useState<Record<string, string>>({});
  const [servicios, setServicios] = useState<ServicioOnboarding[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [prioridadModalCat, setPrioridadModalCat] = useState('');
  const [prioridadModalOpen, setPrioridadModalOpen] = useState(false);
  const [currentServicio, setCurrentServicio] = useState<Partial<ServicioOnboarding>>({ es_variable: false });
  const [currentCat, setCurrentCat] = useState('');
  const [imagenEnviada, setImagenEnviada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const todasCategorias = [
    ...CATEGORIAS_PRESET,
    ...(categoriaPersonalizada ? [{ label: categoriaPersonalizada, emoji: '🏷️' }] : []),
  ];

  const toggleCategoria = (cat: string) => {
    if (categoriasSeleccionadas.includes(cat)) {
      setCategoriasSeleccionadas((p) => p.filter((x) => x !== cat));
    } else {
      setCategoriasSeleccionadas((p) => [...p, cat]);
      // Abrir modal de prioridad inmediatamente
      setPrioridadModalCat(cat);
      setPrioridadModalOpen(true);
    }
  };

  const setPrioridad = (cat: string, prio: string) => {
    setPrioridades((p) => ({ ...p, [cat]: prio }));
    setPrioridadModalOpen(false);
  };

  const openAddServicio = (cat: string) => {
    setCurrentCat(cat);
    setCurrentServicio({ es_variable: false, categoria: cat, prioridad: prioridades[cat] || '2' });
    setModalOpen(true);
  };

  const confirmServicio = () => {
    if (!currentServicio.nombre || currentServicio.precio === undefined || !currentServicio.duracion) return;
    setServicios((prev) => [
      ...prev,
      {
        nombre: currentServicio.nombre!,
        categoria: currentCat,
        precio: currentServicio.precio!,
        duracion: currentServicio.duracion!,
        es_variable: currentServicio.es_variable || false,
        prioridad: prioridades[currentCat] || '2',
        subcategoria: currentServicio.subcategoria,
      },
    ]);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!servicios.length && !imagenEnviada) {
      setError('Agrega al menos un servicio o envía tu lista de precios.');
      return;
    }
    setLoading(true);
    try {
      if (servicios.length > 0) {
        await saveStepServicios(businessId, servicios, tokenId);
      }
      onComplete(categoriasSeleccionadas);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando servicios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-step">
      <div className="ob-step-icon">💅</div>
      <h2 className="ob-step-title">Tus servicios</h2>
      <p className="ob-step-subtitle">¿Qué categorías de servicios ofreces?</p>

      {/* Categorías */}
      <section className="ob-section">
        <div className="ob-category-grid">
          {CATEGORIAS_PRESET.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => toggleCategoria(cat.label)}
              className={`ob-cat-card ${categoriasSeleccionadas.includes(cat.label) ? 'ob-cat-card--selected' : ''}`}
            >
              <span className="ob-cat-emoji">{cat.emoji}</span>
              <span className="ob-cat-label">{cat.label}</span>
              {categoriasSeleccionadas.includes(cat.label) && (
                <span className="ob-cat-check">✓</span>
              )}
              {prioridades[cat.label] && (
                <span className="ob-cat-prio">
                  {prioridades[cat.label] === '1' ? '⭐' : prioridades[cat.label] === '2' ? '⭐⭐' : '⭐⭐⭐'}
                </span>
              )}
            </button>
          ))}
          {/* Categoría personalizada */}
          <div className="ob-cat-custom">
            <input
              className="ob-input ob-input--small"
              type="text"
              placeholder="＋ Personalizada"
              value={categoriaPersonalizada}
              onChange={(e) => setCategoriaPersonalizada(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && categoriaPersonalizada.trim()) {
                  toggleCategoria(categoriaPersonalizada.trim());
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Servicios por categoría */}
      {categoriasSeleccionadas.map((cat) => {
        const catServs = servicios.filter((s) => s.categoria === cat);
        const catEmoji = todasCategorias.find((c) => c.label === cat)?.emoji || '🏷️';
        return (
          <section key={cat} className="ob-section ob-section--cat">
            <div className="ob-cat-header">
              <span>{catEmoji} <strong>{cat}</strong></span>
              <span className="ob-cat-prio-label">
                Prioridad: {prioridades[cat] === '1' ? '⭐ Alta' : prioridades[cat] === '2' ? '⭐⭐ Media' : '⭐⭐⭐ Baja'}
              </span>
            </div>

            {catServs.map((s, i) => (
              <div key={i} className="ob-servicio-row">
                <span className="ob-servicio-nombre">{s.nombre}</span>
                <span className="ob-servicio-precio">S/. {s.precio}</span>
                <span className="ob-servicio-dur">{s.duracion}min</span>
                {s.es_variable && <span className="ob-servicio-var">Variable</span>}
              </div>
            ))}

            <button
              type="button"
              className="ob-btn-ghost ob-btn-ghost--small"
              onClick={() => openAddServicio(cat)}
            >
              ＋ Agregar servicio
            </button>
          </section>
        );
      })}

      {/* Opción imagen */}
      <section className="ob-section ob-section--alt">
        <p className="ob-alt-title">¿Prefieres enviar tu lista de precios?</p>
        <p className="ob-alt-desc">
          Envía una foto de tu menú de servicios a nuestro equipo de soporte y lo cargamos por ti en menos de 24h.
        </p>
        <a
          href={SOPORTE_WA}
          target="_blank"
          rel="noopener noreferrer"
          className="ob-btn-wa"
          onClick={() => setImagenEnviada(true)}
        >
          📷 Enviar foto al soporte por WhatsApp
        </a>
        {imagenEnviada && (
          <p className="ob-success-note">✅ ¡Gracias! Tu lista llegará a nuestro equipo. Puedes continuar mientras.</p>
        )}
      </section>

      {error && <p className="ob-error">{error}</p>}

      <button
        type="button"
        className="ob-btn-primary"
        onClick={handleSubmit}
        disabled={loading || (servicios.length === 0 && !imagenEnviada)}
      >
        {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
      </button>

      {/* Modal prioridad */}
      <BottomModal
        isOpen={prioridadModalOpen}
        onClose={() => { setPrioridadModalOpen(false); }}
        title={`¿Qué tan importante es "${prioridadModalCat}"?`}
      >
        <p className="ob-modal-hint">
          Nilah recomienda los servicios según su prioridad.
          <TooltipHelp text="Los servicios de prioridad Alta aparecen primero cuando Nilah sugiere opciones a tus clientes." />
        </p>
        <div className="ob-prio-list">
          {PRIORIDADES.map((p) => (
            <button
              key={p.value}
              type="button"
              className="ob-prio-btn"
              onClick={() => setPrioridad(prioridadModalCat, p.value)}
            >
              <span className="ob-prio-label">{p.label}</span>
              <span className="ob-prio-desc">{p.desc}</span>
            </button>
          ))}
        </div>
      </BottomModal>

      {/* Modal agregar servicio */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Nuevo en ${currentCat}`}>
        <div className="ob-field">
          <label className="ob-label">Nombre del servicio</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Esmaltado en gel"
            value={currentServicio.nombre || ''}
            onChange={(e) => setCurrentServicio((c) => ({ ...c, nombre: e.target.value }))}
          />
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
          <label className="ob-label">Subcategoría <span className="ob-label-optional">(opcional)</span></label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Pies naturales, Uñas acrílicas"
            value={currentServicio.subcategoria || ''}
            onChange={(e) => setCurrentServicio((c) => ({ ...c, subcategoria: e.target.value }))}
          />
        </div>

        <button
          type="button"
          className="ob-btn-primary"
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
