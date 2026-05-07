import React, { useEffect, useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import { StaffMember, CategoriaServicio, saveStepEquipo, getCategoriasServicio } from '../../services/onboarding';
import { supabase } from '../../services/supabase';

interface Props {
  businessId: string;
  tokenId: string;
  diasNegocio: string[];
  categoriasServicio: CategoriaServicio[];
  onComplete: () => void;
  onBack?: () => void;
}

const NIVELES = ['Junior', 'Pro', 'Top Artist', 'Master'];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DIAS_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Especialidades = Área de dominio profesional (no técnicas individuales).
// Ej: "Extensiones de Pestañas" engloba pelo a pelo, volumen ruso, híbridas, etc.
const ESPECIALIDADES_POR_CATEGORIA: Record<string, { label: string; emoji: string; hint: string }[]> = {
  'Manos': [
    { label: 'Sistemas', emoji: '💅', hint: 'Acrílicas, Poligel, Soft Gel — uñas con estructura' },
    { label: 'Esmaltado y Semipermanente', emoji: '✨', hint: 'Esmaltado simple, gel color, semipermanente' },
    { label: 'Nail Art Decorativo', emoji: '🎨', hint: 'Diseños a mano, stamping, chrome, 3D art' },
    { label: 'Uñas Naturales', emoji: '🌿', hint: 'Manicure clásico, cutícula, hidratación' },
    { label: 'Press On / Esculpidas', emoji: '🌸', hint: 'Uñas postizas y sculpted' },
  ],
  'Pies': [
    { label: 'Pedicure Estético y Spa', emoji: '🦶', hint: 'Spa, hidratación, esmaltado, relajación' },
    { label: 'Pedicure Medicinal', emoji: '🩺', hint: 'Callicida, tratamiento de callosidades y hongos' },
    { label: 'Nail Art Pies', emoji: '🎨', hint: 'Diseños y decoración en uñas de pies' },
  ],
  'Pestañas': [
    { label: 'Extensiones de Pestañas', emoji: '👁️', hint: 'Pelo a pelo, volumen ruso, megavolumen, híbridas' },
    { label: 'Lifting y Laminado', emoji: '⬆️', hint: 'Lifting, laminado y tinte de pestañas naturales' },
  ],
  'Rostro': [
    { label: 'Tratamientos Faciales', emoji: '✨', hint: 'Limpieza profunda, hidratación, peeling, LED' },
    { label: 'Estética Avanzada', emoji: '⚡', hint: 'Radiofrecuencia, microdermabrasión, ondas' },
    { label: 'Micropigmentación Facial', emoji: '🖌️', hint: 'Cejas, pestañas y labios con pigmentación permanente' },
  ],
  'Cabello': [
    { label: 'Colorimetría y Color', emoji: '🎨', hint: 'Tintes, mechas, balayage, decoloración' },
    { label: 'Keratinas y Alisados', emoji: '💇', hint: 'Keratina, nanoplastia, alisado permanente' },
    { label: 'Corte y Peinado', emoji: '✂️', hint: 'Corte de cabello y estilos con secador' },
    { label: 'Extensiones de Cabello', emoji: '💈', hint: 'Extensiones naturales y sintéticas' },
    { label: 'Tratamientos Capilares', emoji: '🌿', hint: 'Hidratación, nutrición, reconstrucción' },
    { label: 'Ondas y Rizos', emoji: '🌊', hint: 'Permanente, rizos definidos, styling' },
  ],
  'Masajes': [
    { label: 'Masajes Terapéuticos', emoji: '💆', hint: 'Relajante, descontracturante, deportivo' },
    { label: 'Masajes Estéticos y Reductivos', emoji: '🌸', hint: 'Reductivo, drenaje linfático, anticelulítico' },
    { label: 'Reflexología y Bienestar', emoji: '🦶', hint: 'Reflexología podal, piedras calientes, aromaterapia' },
  ],
  'Depilación': [
    { label: 'Depilación Corporal', emoji: '🪮', hint: 'Cera fría/caliente, hilo — piernas, brazos, cuerpo' },
    { label: 'Depilación Zona Íntima', emoji: '🌸', hint: 'Bikini, brasileña, zona íntima completa' },
    { label: 'Depilación Facial', emoji: '✨', hint: 'Cejas, bozo, mentón, rostro completo' },
    { label: 'Micropigmentación', emoji: '🖌️', hint: 'Cejas, labios y delineado permanente' },
  ],
  'Maquillaje': [
    { label: 'Maquillaje Social y Artístico', emoji: '💄', hint: 'Social, novia, gala, artístico, airbrush' },
    { label: 'Micropigmentación', emoji: '🖌️', hint: 'Cejas, labios y delineado permanente' },
  ],
};



const emptyMember = (diasNegocio: string[]): StaffMember => ({
  nombre: '',
  especialidad: '',
  sub_especialidad: '',
  cat_staff: '',
  nivel_experiencia: 'Pro',
  crear_cuenta: false,
  dias_trabajo: diasNegocio,
  horario_trabajo: { inicio: '09:00', fin: '20:00' },
  categoria_id: undefined,
});

const StepEquipo: React.FC<Props> = ({ businessId, tokenId, diasNegocio, categoriasServicio: propCategorias, onComplete, onBack }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState<StaffMember>(emptyMember(diasNegocio));
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<CategoriaServicio[]>(propCategorias || []);

  useEffect(() => {
    if (staffList.length === 0 && businessId) {
      setFetching(true);
      supabase.from('staff').select('*').eq('business_id', businessId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setStaffList(data.map(d => ({
              nombre: d.nombre,
              especialidad: d.especialidad_principal || '',
              sub_especialidad: d.sub_especialidades?.join(', ') || '',
              nivel_experiencia: d.nivel_experiencia || 'Pro',
              cat_staff: d.categoria_staff || '',
              dias_trabajo: d.dias_trabajo || diasNegocio,
              horario_trabajo: { inicio: d.hora_entrada?.substring(0,5) || '09:00', fin: d.hora_salida?.substring(0,5) || '20:00' },
              crear_cuenta: false,
              categoria_id: d.categoria_id,
            })));
          }
          setFetching(false);
        });
    }
  }, [businessId]);

  // Si por alguna razón no vienen por props (ej: reload), las cargamos desde DB
  useEffect(() => {
    if (categorias.length === 0 && businessId) {
      getCategoriasServicio(businessId).then(setCategorias);
    }
  }, [businessId]);

  const openAddModal = () => {
    setCurrent(emptyMember(diasNegocio));
    setModalOpen(true);
  };

  const toggleDia = (d: string) => {
    setCurrent((c) => ({
      ...c,
      dias_trabajo: c.dias_trabajo.includes(d)
        ? c.dias_trabajo.filter((x) => x !== d)
        : [...c.dias_trabajo, d],
    }));
  };

  const selectCategoria = (cat: CategoriaServicio) => {
    setCurrent((c) => ({
      ...c,
      cat_staff: cat.nombre,
      especialidad: cat.nombre,
      categoria_id: cat.id,
      sub_especialidad: '', // reset al cambiar categoría
    }));
  };

  const confirmMember = () => {
    if (!current.nombre || !current.cat_staff) return;
    setStaffList((prev) => [...prev, current]);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!staffList.length) {
      setError('Agrega al menos una empleada para continuar.');
      return;
    }
    setLoading(true);
    try {
      await saveStepEquipo(businessId, staffList, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando equipo.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="ob-step flex flex-col items-center justify-center min-h-[50vh]">
        <div className="ob-page-spinner" />
        <p className="text-zinc-500 mt-4 text-sm font-medium">Recuperando el equipo...</p>
      </div>
    );
  }

  return (
    <div className="ob-step">
      <div className="ob-step-icon">👩‍🎨</div>
      <h2 className="ob-step-title">Tu equipo de trabajo</h2>
      <p className="ob-step-subtitle">Agrega las profesionales de tu salón. Nilah las asignará a las citas según su categoría.</p>

      {/* Lista de staff agregado */}
      {staffList.length > 0 && (
        <div className="ob-staff-list">
          {staffList.map((s, i) => (
            <div key={i} className="ob-staff-card">
              <div className="ob-staff-avatar">{s.nombre[0]?.toUpperCase()}</div>
              <div className="ob-staff-info">
                <span className="ob-staff-name">{s.nombre}</span>
                <span className="ob-staff-role">
                  {categorias.find(c => c.nombre === s.cat_staff)?.emoji || '🏷️'} {s.cat_staff} {s.sub_especialidad ? `(${s.sub_especialidad}) ` : ' '}· {s.nivel_experiencia}
                </span>
              </div>
              <button
                type="button"
                className="ob-staff-remove"
                onClick={() => setStaffList((prev) => prev.filter((_, j) => j !== i))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="ob-btn-secondary" onClick={openAddModal}>
        ＋ Agregar empleada
      </button>

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
          disabled={loading || staffList.length === 0}
        >
          {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
        </button>
      </div>

      {/* Modal agregar empleada */}
      <BottomModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva empleada">
        <div className="ob-field">
          <label className="ob-label">Nombre</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Valentina Ruiz"
            value={current.nombre}
            onChange={(e) => setCurrent((c) => ({ ...c, nombre: e.target.value }))}
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Categoría de trabajo</label>
          {categorias.length > 0 ? (
            <div className="ob-chip-grid">
              {categorias.map((cat) => (
                <SelectionChip
                  key={cat.nombre}
                  label={`${cat.emoji} ${cat.nombre}`}
                  selected={current.cat_staff === cat.nombre}
                  onClick={() => selectCategoria(cat)}
                />
              ))}
            </div>
          ) : (
            <p className="ob-hint">Cargando categorías...</p>
          )}
        </div>

        {current.cat_staff && (() => {
          const presetSpecs = ESPECIALIDADES_POR_CATEGORIA[current.cat_staff] || [];
          return (
            <div className="ob-field">
              <label className="ob-label">Especialidad</label>
              {presetSpecs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  {presetSpecs.map((spec) => {
                    const isSelected = current.sub_especialidad === spec.label;
                    return (
                      <button
                        key={spec.label}
                        type="button"
                        onClick={() =>
                          setCurrent((c) => ({
                            ...c,
                            sub_especialidad: c.sub_especialidad === spec.label ? '' : spec.label,
                          }))
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.6rem',
                          padding: '0.65rem 0.85rem',
                          background: isSelected ? 'rgba(16,185,129,0.12)' : 'var(--ob-surface-2, rgba(255,255,255,0.04))',
                          border: `1.5px solid ${isSelected ? 'var(--ob-primary, #10b981)' : 'var(--ob-border, rgba(255,255,255,0.1))'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          width: '100%',
                        }}
                      >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1.2, flexShrink: 0 }}>{spec.emoji}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: isSelected ? 'var(--ob-primary, #10b981)' : 'var(--ob-text)' }}>
                            {spec.label}
                            {isSelected && <span style={{ marginLeft: '6px', fontSize: '11px' }}>✓</span>}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--ob-text-muted)', lineHeight: 1.4 }}>{spec.hint}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                className="ob-input"
                type="text"
                placeholder="O escribe una especialidad personalizada..."
                value={current.sub_especialidad || ''}
                onChange={(e) => setCurrent((c) => ({ ...c, sub_especialidad: e.target.value }))}
              />
            </div>
          );
        })()}

        <div className="ob-field">
          <label className="ob-label">Nivel de Experiencia</label>
          <div className="ob-chip-grid">
            {NIVELES.map((n) => (
              <SelectionChip
                key={n}
                label={n}
                selected={current.nivel_experiencia === n}
                onClick={() => setCurrent((c) => ({ ...c, nivel_experiencia: n }))}
              />
            ))}
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label">¿Crear cuenta web temporal a esta especialista?</label>
          <p className="text-xs text-zinc-400 mb-2">Más adelante podrás configurar su correo y permisos en Ajustes {'>'} Equipo.</p>
          <label className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrent((c) => ({ ...c, crear_cuenta: !c.crear_cuenta }))}>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${current.crear_cuenta ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${current.crear_cuenta ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-zinc-300">
              {current.crear_cuenta ? 'Sí, crearle cuenta' : 'No, solo para agenda'}
            </span>
          </label>
          
          {current.crear_cuenta && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Datos de acceso WebApp</h4>
              
              <div className="ob-field">
                <label className="ob-label">Permisos de la Aplicación</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setCurrent((c) => ({ ...c, rol_webapp: 'Staff' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm border font-medium transition-colors ${
                      (!current.rol_webapp || current.rol_webapp === 'Staff')
                        ? 'bg-violet-500 border-violet-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    💆‍♀️ Solo Staff (Agenda)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrent((c) => ({ ...c, rol_webapp: 'Admin' }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm border font-medium transition-colors ${
                      current.rol_webapp === 'Admin'
                        ? 'bg-violet-500 border-violet-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    👑 Administrador
                  </button>
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Correo electrónico</label>
                <input
                  className="ob-input"
                  type="email"
                  placeholder="ej: staff@nilah.com"
                  value={current.email || ''}
                  onChange={(e) => setCurrent((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
              <div className="ob-field">
                <label className="ob-label">Contraseña provisional</label>
                <input
                  className="ob-input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={current.password || ''}
                  onChange={(e) => setCurrent((c) => ({ ...c, password: e.target.value }))}
                />
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">Podrá configurar su perfil después. Se le crearán los permisos por defecto según el rol seleccionado.</p>
            </div>
          )}
        </div>

        <div className="ob-field">
          <label className="ob-label">Días que trabaja</label>
          <div className="ob-days-grid">
            {DIAS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDia(d)}
                className={`ob-day-btn ${current.dias_trabajo.includes(d) ? 'ob-day-btn--active' : ''}`}
              >
                {DIAS_LABELS[i]}
              </button>
            ))}
          </div>
        </div>

        <div className="ob-row">
          <div className="ob-field ob-field--half">
            <label className="ob-label">Entrada</label>
            <input
              className="ob-input"
              type="time"
              value={current.horario_trabajo.inicio}
              onChange={(e) =>
                setCurrent((c) => ({ ...c, horario_trabajo: { ...c.horario_trabajo, inicio: e.target.value } }))
              }
            />
          </div>
          <div className="ob-field ob-field--half">
            <label className="ob-label">Salida</label>
            <input
              className="ob-input"
              type="time"
              value={current.horario_trabajo.fin}
              onChange={(e) =>
                setCurrent((c) => ({ ...c, horario_trabajo: { ...c.horario_trabajo, fin: e.target.value } }))
              }
            />
          </div>
        </div>

        <button
          type="button"
          className="ob-btn-primary"
          onClick={confirmMember}
          disabled={!current.nombre || !current.cat_staff}
        >
          Agregar al equipo ✓
        </button>
      </BottomModal>
    </div>
  );
};

export default StepEquipo;
