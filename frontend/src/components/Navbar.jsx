import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import api from '../services/api.js';
import logo from '../../BiblioTech-Logo.png';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/api/auth/logout', { refreshToken });
    } catch { /* ok se fallisce */ }
    logout();
    navigate('/login');
  };

  const initials = (user?.email || '?').slice(0, 2).toUpperCase();

  return (
    <nav className="navbar" role="navigation" aria-label="Navigazione principale">
      <div className="container navbar-inner">
        <Link to="/books" className="navbar-brand">
          <img src={logo} alt="BiblioTech Logo" className="navbar-brand-logo" />
        </Link>

        <ul className="navbar-links">
          <li>
            <NavLink to="/books" className={({ isActive }) => isActive ? 'active' : ''}>
              Catalogo
            </NavLink>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <NavLink to="/books/new" className={({ isActive }) => isActive ? 'active' : ''}>
                  Aggiungi libro
                </NavLink>
              </li>
              {isAdmin && (
                <li>
                  <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                    <span className="navbar-admin-badge">Admin</span>
                  </NavLink>
                </li>
              )}
              <li ref={dropdownRef} className="navbar-dropdown-wrap">
                <button
                  className="navbar-avatar-btn"
                  onClick={() => setDropdownOpen(o => !o)}
                  aria-label="Menu profilo"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="navbar-avatar">{initials}</span>
                  <span className="navbar-avatar-name">{user?.username || user?.email?.split('@')[0]}</span>
                  <span className="navbar-avatar-chevron">{dropdownOpen ? '▲' : '▼'}</span>
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <div className="navbar-dropdown-header">
                      <span className="navbar-dropdown-email">{user?.email}</span>
                      <span className={`role-badge role-${user?.role || 'user'}`}>
                        {isAdmin ? 'admin' : 'utente'}
                      </span>
                    </div>
                    <div className="navbar-dropdown-divider" />
                    <Link to="/profile" className="navbar-dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                      Il mio profilo
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="navbar-dropdown-item" role="menuitem" onClick={() => setDropdownOpen(false)}>
                        Pannello admin
                      </Link>
                    )}
                    <div className="navbar-dropdown-divider" />
                    <button className="navbar-dropdown-item navbar-dropdown-logout" role="menuitem" onClick={handleLogout}>
                      Esci
                    </button>
                  </div>
                )}
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>Registrati</NavLink>
              </li>
            </>
          )}

          <li>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
              title={theme === 'dark' ? 'Tema chiaro' : 'Tema scuro'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
