import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

/* ── Stat card ─────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => (
  <div className="admin-stat-card" style={{ '--stat-color': color }}>
    <div className="admin-stat-icon">{icon}</div>
    <div>
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-label">{label}</p>
    </div>
  </div>
);

/* ── Main component ─────────────────────────────────────────── */
const AdminDashboard = () => {
  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [books, setBooks]         = useState([]);
  const [tab, setTab]             = useState('dashboard');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [actionMsg, setActionMsg] = useState({ msg: '', type: '' });

  // Modal: type = 'edit' | 'delete'
  const [modal, setModal]         = useState(null);

  // Edit form state
  const [editForm, setEditForm]   = useState({ username: '', email: '', role: 'user' });
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  /* ── Load ──────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, booksRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/books'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setBooks(booksRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei dati admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (msg, type = 'success') => {
    setActionMsg({ msg, type });
    setTimeout(() => setActionMsg({ msg: '', type: '' }), 3500);
  };

  /* ── Open modals ───────────────────────────────────────── */
  const openEdit = (u) => {
    setEditForm({ username: u.username, email: u.email, role: u.role });
    setEditErrors({});
    setModal({ type: 'edit', user: u });
  };

  const openDelete = (u) => {
    setModal({ type: 'delete', user: u });
  };

  /* ── Edit user ─────────────────────────────────────────── */
  const validateEdit = () => {
    const e = {};
    if (!editForm.username.trim()) e.username = 'Obbligatorio';
    if (!editForm.email.trim())    e.email    = 'Obbligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) e.email = 'Email non valida';
    return e;
  };

  const handleEditSave = async () => {
    const errs = validateEdit();
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setEditSaving(true);
    try {
      const res = await api.put(`/api/admin/users/${modal.user._id}`, {
        username: editForm.username.trim(),
        email:    editForm.email.trim(),
        role:     editForm.role,
      });
      setUsers(prev => prev.map(u => u._id === modal.user._id ? res.data : u));
      // Refresh stats if role changed
      if (editForm.role !== modal.user.role) {
        const statsRes = await api.get('/api/admin/stats');
        setStats(statsRes.data);
      }
      flash(`✅ Utente "${res.data.username}" aggiornato`);
      setModal(null);
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Errore aggiornamento'), 'error');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete user ───────────────────────────────────────── */
  const handleDeleteUser = async () => {
    try {
      await api.delete(`/api/admin/users/${modal.user._id}`);
      setUsers(prev => prev.filter(u => u._id !== modal.user._id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
      flash('✅ Utente eliminato');
      setModal(null);
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Errore eliminazione'), 'error');
      setModal(null);
    }
  };

  /* ── Delete book ───────────────────────────────────────── */
  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Eliminare "${title}"?`)) return;
    try {
      await api.delete(`/api/books/${bookId}`);
      setBooks(prev => prev.filter(b => b._id !== bookId));
      setStats(prev => ({ ...prev, totalBooks: prev.totalBooks - 1 }));
      flash('✅ Libro eliminato');
    } catch (err) {
      flash('❌ ' + (err.response?.data?.message || 'Errore eliminazione libro'), 'error');
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  if (loading) return (
    <main><div className="container">
      <div className="spinner-container"><div className="spinner" /><span>Caricamento...</span></div>
    </div></main>
  );

  if (error) return (
    <main><div className="container">
      <div className="alert alert-error" role="alert">⚠️ {error}</div>
    </div></main>
  );

  return (
    <main>
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">👑 Pannello Admin</h1>
            <p className="page-subtitle">Gestione completa della biblioteca</p>
          </div>
        </div>

        {/* Flash */}
        {actionMsg.msg && (
          <div className={`alert ${actionMsg.type === 'error' ? 'alert-error' : 'alert-success'}`} role="status">
            {actionMsg.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {['dashboard', 'users', 'books'].map(t => (
            <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'dashboard' && '📊 Dashboard'}
              {t === 'users'     && `👥 Utenti (${users.length})`}
              {t === 'books'     && `📚 Libri (${books.length})`}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && stats && (
          <div className="admin-section">
            <div className="admin-stats-grid">
              <StatCard icon="📚" label="Libri totali"   value={stats.totalBooks}  color="#4f46e5" />
              <StatCard icon="👥" label="Utenti totali"  value={stats.totalUsers}  color="#0891b2" />
              <StatCard icon="👑" label="Amministratori" value={stats.adminCount}  color="#d97706" />
              <StatCard icon="👤" label="Utenti normali" value={stats.totalUsers - stats.adminCount} color="#16a34a" />
            </div>
            <div className="admin-recent-grid">
              <div className="admin-recent-card">
                <h3 className="admin-recent-title">📚 Ultimi libri aggiunti</h3>
                {stats.recentBooks.length === 0
                  ? <p className="admin-empty">Nessun libro</p>
                  : stats.recentBooks.map(b => (
                    <div key={b._id} className="admin-recent-item">
                      <span className="admin-recent-name">{b.title}</span>
                      <span className="admin-recent-sub">{b.author}</span>
                    </div>
                  ))
                }
              </div>
              <div className="admin-recent-card">
                <h3 className="admin-recent-title">👥 Ultimi utenti registrati</h3>
                {stats.recentUsers.length === 0
                  ? <p className="admin-empty">Nessun utente</p>
                  : stats.recentUsers.map(u => (
                    <div key={u._id} className="admin-recent-item">
                      <span className="admin-recent-name">{u.username}</span>
                      <span className="admin-recent-sub">
                        {u.email} &nbsp;
                        <span className={`role-badge role-${u.role}`}>{u.role}</span>
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <div className="admin-section">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Ruolo</th>
                    <th>Registrato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="admin-td-bold">{u.username}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                      <td className="admin-td-muted">{new Date(u.createdAt).toLocaleDateString('it-IT')}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="btn btn-primary btn-sm"   onClick={() => openEdit(u)}     title="Modifica utente">✏️ Modifica</button>
                          <button className="btn btn-danger btn-sm"    onClick={() => openDelete(u)}   title="Elimina utente">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── BOOKS ── */}
        {tab === 'books' && (
          <div className="admin-section">
            <div style={{ marginBottom: '1rem' }}>
              <Link to="/books/new" className="btn btn-primary">+ Aggiungi Libro</Link>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>Autore</th>
                    <th>Anno</th>
                    <th>Genere</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map(b => (
                    <tr key={b._id}>
                      <td className="admin-td-bold">{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.year}</td>
                      <td><span className="badge">{b.genre}</span></td>
                      <td>
                        <div className="admin-actions">
                          <Link to={`/books/${b._id}`}      className="btn btn-secondary btn-sm" title="Visualizza">👁️</Link>
                          <Link to={`/books/${b._id}/edit`} className="btn btn-primary btn-sm"   title="Modifica">✏️</Link>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBook(b._id, b.title)} title="Elimina">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            MODALS
        ══════════════════════════════════════════════════ */}

        {/* ── Edit user modal ── */}
        {modal?.type === 'edit' && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-box" style={{ maxWidth: '500px' }}>
              <h2 className="modal-title">✏️ Modifica utente</h2>
              <div className="form-group">
                <label className="form-label">Nome utente</label>
                <input
                  type="text" className={`form-input ${editErrors.username ? 'error' : ''}`}
                  value={editForm.username}
                  onChange={e => { setEditForm(f => ({ ...f, username: e.target.value })); setEditErrors(er => ({ ...er, username: '' })); }}
                />
                {editErrors.username && <p className="form-error">{editErrors.username}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email" className={`form-input ${editErrors.email ? 'error' : ''}`}
                  value={editForm.email}
                  onChange={e => { setEditForm(f => ({ ...f, email: e.target.value })); setEditErrors(er => ({ ...er, email: '' })); }}
                />
                {editErrors.email && <p className="form-error">{editErrors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Ruolo</label>
                <select
                  className="form-input"
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="user">👤 Utente</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Annulla</button>
                <button className="btn btn-primary" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? 'Salvataggio...' : '💾 Salva'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ── Delete user modal ── */}
        {modal?.type === 'delete' && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-box">
              <h2 className="modal-title">🗑️ Elimina utente</h2>
              <p className="modal-message">
                Sei sicuro di voler eliminare <strong>{modal.user.username}</strong>?<br />
                Questa azione non può essere annullata.
              </p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Annulla</button>
                <button className="btn btn-danger" onClick={handleDeleteUser}>Elimina</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;
