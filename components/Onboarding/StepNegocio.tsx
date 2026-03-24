import React, { useState } from 'react';
import SelectionChip from './ui/SelectionChip';
import TooltipHelp from './ui/TooltipHelp';
import { StepNegocioData, saveStepNegocio } from '../../services/onboarding';

interface Props {
  businessId: string;
  tokenId: string;
  negocioNombre: string;
  onComplete: () => void;
}

const PAISES = [
  { label: 'Perú', emoji: '🇵🇪', moneda: 'S/.', tz: 'America/Lima', idioma: 'es-PE' },
  { label: 'Colombia', emoji: '🇨🇴', moneda: 'COP', tz: 'America/Bogota', idioma: 'es-CO' },
  { label: 'México', emoji: '🇲🇽', moneda: 'MXN', tz: 'America/Mexico_City', idioma: 'es-MX' },
  { label: 'Ecuador', emoji: '🇪🇨', moneda: 'USD', tz: 'America/Guayaquil', idioma: 'es-EC' },
  { label: 'Chile', emoji: '🇨🇱', moneda: 'CLP', tz: 'America/Santiago', idioma: 'es-CL' },
  { label: 'Argentina', emoji: '🇦🇷', moneda: 'ARS', tz: 'America/Argentina/Buenos_Aires', idioma: 'es-AR' },
];

const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const DIAS_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const METODOS = ['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Binance'];

const COLORES_PRESET = [
  '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316',
];

const StepNegocio: React.FC<Props> = ({ businessId, tokenId, negocioNombre, onComplete }) => {
  const [pais, setPais] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [moneda, setMoneda] = useState('S/.');
  const [timezone, setTimezone] = useState('America/Lima');
  const [color, setColor] = useState('#10B981');
  const [telefono, setTelefono] = useState('');
  const [emailNegocio, setEmailNegocio] = useState('');
  const [diasTrabajo, setDiasTrabajo] = useState(['lunes','martes','miércoles','jueves','viernes','sábado']);
  const [horaApertura, setHoraApertura] = useState('09:00');
  const [horaCierre, setHoraCierre] = useState('20:00');
  const [metodosPago, setMetodosPago] = useState<string[]>(['Efectivo', 'Yape']);
  const [politicas, setPoliticas] = useState('');
  
  // Horarios específicos
  const [sabadoOpcion, setSabadoOpcion] = useState<'igual'|'diferente'|'cerrado'>('igual');
  const [sabadoInicio, setSabadoInicio] = useState('09:00');
  const [sabadoFin, setSabadoFin] = useState('18:00');
  const [domingoOpcion, setDomingoOpcion] = useState<'igual'|'diferente'|'cerrado'>('cerrado');
  const [domingoInicio, setDomingoInicio] = useState('10:00');
  const [domingoFin, setDomingoFin] = useState('15:00');
  const [almuerzoActivo, setAlmuerzoActivo] = useState(false);
  const [almuerzoInicio, setAlmuerzoInicio] = useState('13:00');
  const [almuerzoFin, setAlmuerzoFin] = useState('14:00');

  // Redes
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectPais = (p: typeof PAISES[0]) => {
    setPais(p.label);
    setMoneda(p.moneda);
    setTimezone(p.tz);
  };

  const toggleDia = (d: string) => {
    setDiasTrabajo((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleMetodo = (m: string) => {
    setMetodosPago((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const buildHorarioSabado = () => {
    if (sabadoOpcion === 'cerrado') return 'Cerrado';
    if (sabadoOpcion === 'igual') return `${horaApertura} - ${horaCierre}`;
    return `${sabadoInicio} - ${sabadoFin}`;
  };

  const buildHorarioDomingo = () => {
    if (domingoOpcion === 'cerrado') return 'Cerrado';
    if (domingoOpcion === 'igual') return `${horaApertura} - ${horaCierre}`;
    return `${domingoInicio} - ${domingoFin}`;
  };

  const handleSubmit = async () => {
    if (!pais || !ubicacion || !telefono) {
      setError('Por favor completa país, ciudad y teléfono.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data: StepNegocioData = {
        pais,
        ubicacion,
        moneda,
        timezone,
        color_primario: color,
        telefono_recepcionista: telefono,
        email_negocio: emailNegocio,
        dias_trabajo: diasTrabajo,
        hora_apertura: horaApertura,
        hora_cierre: horaCierre,
        metodos_pago: metodosPago.join(', '),
        politicas_reserva: politicas,
        horario_semana: `${horaApertura} - ${horaCierre}`,
        horario_sabado: buildHorarioSabado(),
        horario_domingo: buildHorarioDomingo(),
        hora_almuerzo: almuerzoActivo ? `${almuerzoInicio} - ${almuerzoFin}` : '',
        Instagram: instagram,
        Facebook: facebook,
        Tiktok: tiktok,
      };
      await saveStepNegocio(businessId, data, tokenId);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error guardando datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-step">
      <div className="ob-step-icon">🏪</div>
      <h2 className="ob-step-title">Cuéntanos sobre {negocioNombre || 'tu salón'}</h2>
      <p className="ob-step-subtitle">Esta información la usará Nilah para atender a tus clientes.</p>

      {/* SECCIÓN A: País */}
      <section className="ob-section">
        <h3 className="ob-section-title">¿En qué país está tu salón?</h3>
        <div className="ob-chip-grid">
          {PAISES.map((p) => (
            <SelectionChip
              key={p.label}
              label={p.label}
              emoji={p.emoji}
              selected={pais === p.label}
              onClick={() => selectPais(p)}
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN B: Ciudad */}
      {pais && (
        <section className="ob-section">
          <h3 className="ob-section-title">¿En qué ciudad / dirección?</h3>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Miraflores, Lima / Av. Principal 123"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </section>
      )}

      {/* SECCIÓN C: Horario de trabajo */}
      <section className="ob-section">
        <h3 className="ob-section-title">
          Días de trabajo
          <TooltipHelp text="Nilah no ofrecerá citas en los días que no estén marcados." />
        </h3>
        <div className="ob-days-grid">
          {DIAS.map((d, i) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDia(d)}
              className={`ob-day-btn ${diasTrabajo.includes(d) ? 'ob-day-btn--active' : ''}`}
            >
              {DIAS_LABELS[i]}
            </button>
          ))}
        </div>

        <div className="ob-row">
          <div className="ob-field ob-field--half">
            <label className="ob-label">Apertura</label>
            <input className="ob-input" type="time" value={horaApertura} onChange={(e) => setHoraApertura(e.target.value)} />
          </div>
          <div className="ob-field ob-field--half">
            <label className="ob-label">Cierre</label>
            <input className="ob-input" type="time" value={horaCierre} onChange={(e) => setHoraCierre(e.target.value)} />
          </div>
        </div>
      </section>

      {/* SECCIÓN D: Sábado */}
      <section className="ob-section">
        <h3 className="ob-section-title">¿Abren los sábados?</h3>
        <div className="ob-option-row">
          {[
            { value: 'igual', label: 'Sí, mismo horario' },
            { value: 'diferente', label: 'Sí, otro horario' },
            { value: 'cerrado', label: '❌ Cerrado' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`ob-option-btn ${sabadoOpcion === opt.value ? 'ob-option-btn--active' : ''}`}
              onClick={() => setSabadoOpcion(opt.value as typeof sabadoOpcion)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {sabadoOpcion === 'diferente' && (
          <div className="ob-row">
            <div className="ob-field ob-field--half">
              <label className="ob-label">Inicio</label>
              <input className="ob-input" type="time" value={sabadoInicio} onChange={(e) => setSabadoInicio(e.target.value)} />
            </div>
            <div className="ob-field ob-field--half">
              <label className="ob-label">Cierre</label>
              <input className="ob-input" type="time" value={sabadoFin} onChange={(e) => setSabadoFin(e.target.value)} />
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN E: Domingo */}
      <section className="ob-section">
        <h3 className="ob-section-title">¿Abren los domingos?</h3>
        <div className="ob-option-row">
          {[
            { value: 'igual', label: 'Sí, mismo horario' },
            { value: 'diferente', label: 'Sí, otro horario' },
            { value: 'cerrado', label: '❌ Cerrado' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`ob-option-btn ${domingoOpcion === opt.value ? 'ob-option-btn--active' : ''}`}
              onClick={() => setDomingoOpcion(opt.value as typeof domingoOpcion)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {domingoOpcion === 'diferente' && (
          <div className="ob-row">
            <div className="ob-field ob-field--half">
              <label className="ob-label">Inicio</label>
              <input className="ob-input" type="time" value={domingoInicio} onChange={(e) => setDomingoInicio(e.target.value)} />
            </div>
            <div className="ob-field ob-field--half">
              <label className="ob-label">Cierre</label>
              <input className="ob-input" type="time" value={domingoFin} onChange={(e) => setDomingoFin(e.target.value)} />
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN F: Almuerzo */}
      <section className="ob-section">
        <h3 className="ob-section-title">
          ¿Tienen hora de almuerzo?
          <TooltipHelp text="Si bloquean un horario para almorzar, Nilah no ofrecerá citas en ese rango." />
        </h3>
        <div className="ob-option-row">
          <button
            type="button"
            className={`ob-option-btn ${!almuerzoActivo ? 'ob-option-btn--active' : ''}`}
            onClick={() => setAlmuerzoActivo(false)}
          >
            No, atendemos seguido
          </button>
          <button
            type="button"
            className={`ob-option-btn ${almuerzoActivo ? 'ob-option-btn--active' : ''}`}
            onClick={() => setAlmuerzoActivo(true)}
          >
            Sí, pausamos
          </button>
        </div>
        {almuerzoActivo && (
          <div className="ob-row">
            <div className="ob-field ob-field--half">
              <label className="ob-label">De</label>
              <input className="ob-input" type="time" value={almuerzoInicio} onChange={(e) => setAlmuerzoInicio(e.target.value)} />
            </div>
            <div className="ob-field ob-field--half">
              <label className="ob-label">A</label>
              <input className="ob-input" type="time" value={almuerzoFin} onChange={(e) => setAlmuerzoFin(e.target.value)} />
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN G: Identidad visual */}
      <section className="ob-section">
        <h3 className="ob-section-title">Color de tu marca</h3>
        <div className="ob-color-grid">
          {COLORES_PRESET.map((c) => (
            <button
              key={c}
              type="button"
              className={`ob-color-swatch ${color === c ? 'ob-color-swatch--selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ob-color-picker"
            title="Color personalizado"
          />
        </div>
      </section>

      {/* SECCIÓN H: Contacto */}
      <section className="ob-section">
        <h3 className="ob-section-title">Datos de contacto</h3>
        <div className="ob-field">
          <label className="ob-label">Teléfono de recepción</label>
          <input className="ob-input" type="tel" placeholder="+51 999 888 777" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>
        <div className="ob-field">
          <label className="ob-label">Email del negocio <span className="ob-label-optional">(opcional)</span></label>
          <input className="ob-input" type="email" placeholder="salon@email.com" value={emailNegocio} onChange={(e) => setEmailNegocio(e.target.value)} />
        </div>
      </section>

      {/* SECCIÓN I: Métodos de pago */}
      <section className="ob-section">
        <h3 className="ob-section-title">
          Métodos de pago que aceptan
          <TooltipHelp text="Nilah los compartirá cuando una clienta pregunte '¿Cómo puedo pagar?'" />
        </h3>
        <div className="ob-chip-grid">
          {METODOS.map((m) => (
            <SelectionChip
              key={m}
              label={m}
              selected={metodosPago.includes(m)}
              onClick={() => toggleMetodo(m)}
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN J: Políticas */}
      <section className="ob-section">
        <h3 className="ob-section-title">
          Política de reservas
          <TooltipHelp text="Nilah la leerá cuando una clienta pregunte si puede cancelar o llegar tarde." />
        </h3>
        <div className="ob-chip-grid ob-chip-grid--stacked">
          {[
            'Se requiere 50% de anticipo para confirmar',
            'Cancelaciones con 24h de anticipación',
            'Sin reserva anticipada, solo presencial',
            'Reserva gratis, se cobra al llegar',
          ].map((p) => (
            <SelectionChip
              key={p}
              label={p}
              selected={politicas === p}
              onClick={() => setPoliticas(politicas === p ? '' : p)}
            />
          ))}
        </div>
        <textarea
          className="ob-input ob-textarea"
          placeholder="O escribe tu política personalizada..."
          value={politicas}
          onChange={(e) => setPoliticas(e.target.value)}
          rows={3}
        />
      </section>

      {/* SECCIÓN K: Redes sociales */}
      <section className="ob-section">
        <h3 className="ob-section-title">Redes sociales <span className="ob-label-optional">(opcionales)</span></h3>
        <div className="ob-field">
          <label className="ob-label">📸 Instagram</label>
          <input className="ob-input" type="text" placeholder="@tu_salon" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </div>
        <div className="ob-field">
          <label className="ob-label">📘 Facebook</label>
          <input className="ob-input" type="text" placeholder="Nombre de tu página" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
        </div>
        <div className="ob-field">
          <label className="ob-label">🎵 TikTok</label>
          <input className="ob-input" type="text" placeholder="@tiktok_usuario" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
        </div>
      </section>

      <p className="ob-config-notice">
        💡 Podrás modificar todos los horarios y datos en cualquier momento desde el módulo <strong>Configuración</strong>.
      </p>

      {error && <p className="ob-error">{error}</p>}

      <button
        type="button"
        className="ob-btn-primary"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? <span className="ob-spinner" /> : 'Siguiente →'}
      </button>
    </div>
  );
};

export default StepNegocio;
