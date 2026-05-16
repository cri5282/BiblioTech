import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/Modal.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const Avatar = ({ username, size = 72 }) => {
  const initials = (username || '?').slice(0, 2).toUpperCase();
  return (
    <div
      className="profile-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="profile-section">
      <button
        className="profile-section-header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="profile-section-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="profile-section-body">{children}</div>}
    </div>
  );
};

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [flash, setFlash]           = useState({ msg: '', type: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [infoForm, setInfoForm]     = useState({ username: '', email: '' });
  const [infoErrors, setInfoErrors] = useState({});
  const [infoSaving, setInfoSaving] = useState(false);

  const [pwForm, setPwForm]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors]     = useState({});
  const [pwSaving, setPwSaving]     = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/profile/me');
        setProfile(res.data);
        setInfoForm({ username: res.data.username, email: res.data.email });
      } catch (err) {
        setError(err.response?.data?.message || 'Errore nel caricamento del profilo.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showFlash = (msg, type = 'success') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash({ msg: '', type: '' }), 3500);
  };

  const validateInfo = () => {
    const e = {};
    if (!infoForm.username.trim()) e.username = 'Il nome utente è obbligatorio';
    if (!infoForm.email.trim())    e.email    = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoForm.email)) e.email = "Email non valida";
    return e;
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    const errs = validateInfo();
    if (Object.keys(errs).length) { setInfoErrors(errs); return; }
    setInfoSaving(true);
    try {
      const res = await api.put('/api/profile/me', {
        username: infoForm.username.trim(),
        email:    infoForm.email.trim(),
      });
      setProfile(res.data.user);
      // Re-issue tokens so navbar reflects new email
      login(res.data.accessToken, res.data.refreshToken);
      showFlash('Profilo aggiornato');
      setInfoErrors({});
    } catch (err) {
      showFlash(err.response?.data?.message || 'Errore aggiornamento', 'error');
    } finally {
      setInfoSaving(false);
    }
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword)          e.currentPassword = 'Inserisci la password attuale';
    if (!pwForm.newPassword)              e.newPassword     = 'Inserisci la nuova password';
    else if (pwForm.newPassword.length < 8) e.newPassword   = 'Minimo 8 caratteri';
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirmPassword = 'Le password non coincidono';
    return e;
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePw();
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    try {
      await api.put('/api/profile/me/password', {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
      showFlash('Password aggiornata');
    } catch (err) {
      showFlash(err.response?.data?.message || 'Errore cambio password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/api/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('Inserisci la password per confermare'); return; }
    try {
      await api.delete('/api/profile/me', { data: { password: deletePassword } });
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Errore eliminazione account');
    }
  };

  if (loading) return (
    <main><div className="container">
      <div className="spinner-container"><div className="spinner" /><span>Caricamento...</span></div>
    </div></main>
  );

  if (error) return (
    <main><div className="container">
      <div className="alert alert-error" role="alert">{error}</div>
    </div></main>
  );

  return (
    <main>
      <div className="container">
        <div className="profile-layout">          <aside className="profile-sidebar">
            <div className="profile-card">
              <Avatar username={profile.username} size={80} />
              <h2 className="profile-name">{profile.username}</h2>
              <p className="profile-email">{profile.email}</p>
              <span className={`role-badge role-${profile.role}`} style={{ marginTop: '0.5rem' }}>
                {profile.role === 'admin' ? 'admin' : 'utente'}
              </span>
              <p className="profile-since">
                {profile.createdAt && !Number.isNaN(new Date(profile.createdAt).getTime()) ? (
                  <>Membro dal {new Date(profile.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                ) : (
                  <>Membro della biblioteca</>
                )}
              </p>
              <button type="button" className="btn btn-danger btn-full profile-logout-btn" onClick={handleLogout}>
                Esci
              </button>
            </div>
          </aside>          <div className="profile-main">
            <div className="page-header">
              <div>
                <h1 className="page-title">Il mio profilo</h1>
                <p className="page-subtitle">Gestisci le tue informazioni personali</p>
              </div>
            </div>

            {/* Flash */}
            {flash.msg && (
              <div className={`alert ${flash.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status">
                {flash.msg}
              </div>
            )}            <Section title="Informazioni personali" defaultOpen>
              <form onSubmit={handleInfoSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-username">Nome utente</label>
                  <input
                    id="p-username" type="text" className={`form-input ${infoErrors.username ? 'error' : ''}`}
                    value={infoForm.username}
                    onChange={e => { setInfoForm(f => ({ ...f, username: e.target.value })); setInfoErrors(er => ({ ...er, username: '' })); }}
                  />
                  {infoErrors.username && <p className="form-error">{infoErrors.username}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-email">Email</label>
                  <input
                    id="p-email" type="email" className={`form-input ${infoErrors.email ? 'error' : ''}`}
                    value={infoForm.email}
                    onChange={e => { setInfoForm(f => ({ ...f, email: e.target.value })); setInfoErrors(er => ({ ...er, email: '' })); }}
                  />
                  {infoErrors.email && <p className="form-error">{infoErrors.email}</p>}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={infoSaving}>
                    {infoSaving ? 'Salvataggio...' : 'Salva modifiche'}
                  </button>
                </div>
              </form>
            </Section>

            <Section title="Cambia password">
              <form onSubmit={handlePwSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-curpw">Password attuale</label>
                  <PasswordInput
                    id="p-curpw"
                    className={pwErrors.currentPassword ? 'error' : ''}
                    value={pwForm.currentPassword}
                    autoComplete="current-password"
                    onChange={e => { setPwForm(f => ({ ...f, currentPassword: e.target.value })); setPwErrors(er => ({ ...er, currentPassword: '' })); }}
                  />
                  {pwErrors.currentPassword && <p className="form-error">{pwErrors.currentPassword}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-newpw">Nuova password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 8 caratteri)</span></label>
                  <PasswordInput
                    id="p-newpw"
                    className={pwErrors.newPassword ? 'error' : ''}
                    value={pwForm.newPassword}
                    autoComplete="new-password"
                    onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); setPwErrors(er => ({ ...er, newPassword: '' })); }}
                  />
                  {pwErrors.newPassword && <p className="form-error">{pwErrors.newPassword}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="p-confpw">Conferma nuova password</label>
                  <PasswordInput
                    id="p-confpw"
                    className={pwErrors.confirmPassword ? 'error' : ''}
                    value={pwForm.confirmPassword}
                    autoComplete="new-password"
                    onChange={e => { setPwForm(f => ({ ...f, confirmPassword: e.target.value })); setPwErrors(er => ({ ...er, confirmPassword: '' })); }}
                  />
                  {pwErrors.confirmPassword && <p className="form-error">{pwErrors.confirmPassword}</p>}
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                    {pwSaving ? 'Salvataggio...' : 'Cambia password'}
                  </button>
                </div>
              </form>
            </Section>

            <Section title="Zona pericolosa">
              <div className="danger-zone">
                <div className="danger-zone-info">
                  <p className="danger-zone-title">Elimina account</p>
                  <p className="danger-zone-desc">
                    Questa azione è irreversibile. Tutti i tuoi dati verranno eliminati definitivamente.
                  </p>
                </div>
                <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                  Elimina account
                </button>
              </div>
            </Section>
          </div>
        </div>

        {showDeleteModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-box">
              <h2 className="modal-title">Elimina account</h2>
              <p className="modal-message">
                Sei sicuro? Questa azione non può essere annullata.<br />
                Inserisci la tua password per confermare.
              </p>
              <div className="form-group">
                <PasswordInput
                  className={deleteError ? 'error' : ''}
                  placeholder="La tua password"
                  value={deletePassword}
                  onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                  autoFocus
                />
                {deleteError && <p className="form-error">{deleteError}</p>}
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}>
                  Annulla
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  Elimina definitivamente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Profile;


