import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const Register = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already authenticated
  if (!loading && isAuthenticated) {
    return <Navigate to="/books" replace />;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Il nome utente è obbligatorio';
    if (!formData.email.trim())    newErrors.email    = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Inserisci un'email valida";
    if (!formData.password)        newErrors.password = 'La password è obbligatoria';
    else if (formData.password.length < 8)
      newErrors.password = 'La password deve essere di almeno 8 caratteri';
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = 'Le password non coincidono';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Register
      await api.post('/api/auth/register', {
        username: formData.username.trim(),
        email:    formData.email.trim(),
        password: formData.password,
      });

      // Auto-login after successful registration
      const loginRes = await api.post('/api/auth/login', {
        email:    formData.email.trim(),
        password: formData.password,
      });
      login(loginRes.data.accessToken, loginRes.data.refreshToken);
      navigate('/books');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Errore durante la registrazione. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <div className="auth-container">
        <h1 className="auth-title">Registrati</h1>
        <p className="auth-subtitle">Crea un account per gestire il catalogo</p>
        <div className="auth-card">
          <form onSubmit={handleSubmit} noValidate aria-label="Form di registrazione">
            {apiError && (
              <div className="alert alert-error" role="alert">{apiError}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="username">Nome utente *</label>
              <input
                id="username"
                name="username"
                type="text"
                className={`form-input ${errors.username ? 'error' : ''}`}
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                aria-required="true"
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={!!errors.username}
              />
              {errors.username && (
                <p id="username-error" className="form-error" role="alert">{errors.username}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p id="email-error" className="form-error" role="alert">{errors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 8 caratteri)</span></label>
              <PasswordInput
                id="password"
                name="password"
                className={errors.password ? 'error' : ''}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={errors.password ? 'password-error' : undefined}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p id="password-error" className="form-error" role="alert">{errors.password}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Conferma password *</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                className={errors.confirmPassword ? 'error' : ''}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                aria-required="true"
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="form-error" role="alert">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Registrazione in corso...' : 'Crea account'}
            </button>
          </form>

          <p className="auth-divider">
            Hai già un account?{' '}
            <Link to="/login">Accedi</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Register;
