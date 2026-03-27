import React, { useState } from 'react';
import { StepAccountData, createNegocioAndUsuario } from '../../services/onboarding';

interface Props {
  tokenId: string;
  onComplete: (businessId: string, negocioNombre: string) => void;
}

const StepAccount: React.FC<Props> = ({ tokenId, onComplete }) => {
  const [form, setForm] = useState<StepAccountData>({
    nombre_persona: '',
    nombre_negocio: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const businessId = await createNegocioAndUsuario(form, tokenId);
      onComplete(businessId, form.nombre_negocio);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof StepAccountData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="ob-step">
      <div className="ob-step-icon">🔐</div>
      <h2 className="ob-step-title">Crea tu cuenta</h2>
      <p className="ob-step-subtitle">
        En segundos tendrás acceso a tu sistema de gestión.
      </p>

      <form onSubmit={handleSubmit} className="ob-form">
        <div className="ob-field">
          <label className="ob-label">Tu nombre completo</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: María González"
            value={form.nombre_persona}
            onChange={set('nombre_persona')}
            required
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Nombre de tu salón</label>
          <input
            className="ob-input"
            type="text"
            placeholder="Ej: Lux Beauty Studio"
            value={form.nombre_negocio}
            onChange={set('nombre_negocio')}
            required
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Tu email de acceso</label>
          <input
            className="ob-input"
            type="email"
            placeholder="tu@email.com"
            value={form.email}
            onChange={set('email')}
            required
          />
        </div>

        <div className="ob-field">
          <label className="ob-label">Contraseña</label>
          <div className="ob-input-group">
            <input
              className="ob-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={set('password')}
              required
            />
            <button
              type="button"
              className="ob-input-suffix"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {error && <p className="ob-error">{error}</p>}

        <button
          type="submit"
          className="ob-btn-primary"
          disabled={loading || !form.nombre_persona || !form.nombre_negocio || !form.email || !form.password}
        >
          {loading ? (
            <span className="ob-spinner" />
          ) : (
            <>Crear mi cuenta →</>
          )}
        </button>
      </form>
    </div>
  );
};

export default StepAccount;
