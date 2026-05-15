import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const Login = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    return <Navigate to="/books" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier.trim() || !formData.password.trim()) {
      setError('Inserisci email (o nome utente) e password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/api/auth/login', {
        identifier: formData.identifier.trim(),
        password:   formData.password,
      });
      login(res.data.accessToken, res.data.refreshToken);
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenziali non valide. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <div className="auth-container">
        <h1 className="auth-title">Accedi</h1>
        <p className="auth-subtitle">Inserisci le tue credenziali per accedere</p>
        <div className="auth-card">
          <form onSubmit={handleSubmit} noValidate aria-label="Form di login">
            {error && (
              <div className="alert alert-error" role="alert">{error}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Email o nome utente</label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                className="form-input"
                value={formData.identifier}
                onChange={handleChange}
                autoComplete="username"
                placeholder="es. mario o mario@biblioteca.it"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                aria-required="true"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={submitting}
            >
              {submitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <p className="auth-divider">
            Non hai un account?{' '}
            <Link to="/register">Registrati</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
