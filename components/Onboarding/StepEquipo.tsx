import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import BottomModal from './ui/BottomModal';
import TooltipHelp from './ui/TooltipHelp';
import { StaffMember, saveStepEquipo } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  diasNegocio: string[];
  onComplete: () => void;
}

const ROLES = ['Staff', 'Encargada', 'Gerente'];
const CATEGORIAS_STAFF = ['Nail Tech', 'Estilista', 'Facialista', 'Maquilladora', 'Masajista', 'Aesthetician'];
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DIAS_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const emptyMember = (diasNegocio: string[]): StaffMember => ({
  nombre: '',
  especialidad: '',
  cat_staff: '',
  rol: 'Staff',
  dias_trabajo: diasNegocio,
  horario_trabajo: { inicio: '09:00', fin: '20:00' },
});

const StepEquipo: React.FC<Props> = ({ businessId, tokenId, diasNegocio, onComplete }) => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [current, setCurrent] = useState<StaffMember>(emptyMember(diasNegocio));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="ob-step">
      <div className="ob-step-icon">👩‍🎨</div>
      <h2 className="ob-step-title">Tu equipo de trabajo</h2>
      <p className="ob-step-subtitle">Agrega las profesionales de tu salón. Nilah las asignará a las citas.</p>

      {/* Lista de staff agregado */}
      {staffList.length > 0 && (
        <div className="ob-staff-list">
          {staffList.map((s, i) => (
            <div key={i} className="ob-staff-card">
              <div className="ob-staff-avatar">{s.nombre[0]?.toUpperCase()}</div>
              <div className="ob-staff-info">
                <span className="ob-staff-name">{s.nombre}</span>
                <span className="ob-staff-role">{s.cat_staff} · {s.rol}</span>
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

      <button
        type="button"
        className="ob-btn-primary"
        onClick={handleSubmit}
        disabled={loading || staffList.length === 0}
      >
        {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
      </button>

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
          <label className="ob-label">Especialidad</label>
          <div className="ob-chip-grid">
            {CATEGORIAS_STAFF.map((cat) => (
              <SelectionChip
                key={cat}
                label={cat}
                selected={current.cat_staff === cat}
                onClick={() => setCurrent((c) => ({ ...c, cat_staff: cat, especialidad: cat }))}
              />
            ))}
          </div>
        </div>

        <div className="ob-field">
          <label className="ob-label">Rol</label>
          <div className="ob-chip-grid">
            {ROLES.map((r) => (
              <SelectionChip
                key={r}
                label={r}
                selected={current.rol === r}
                onClick={() => setCurrent((c) => ({ ...c, rol: r }))}
              />
            ))}
          </div>
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
