import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

/* ── Debounce hook ─────────────────────────────────────────── */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* ── Main component ─────────────────────────────────────────── */
const BookForm = ({ mode = 'create', initialData = {}, bookId = null }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title:    initialData.title    || '',
    author:   initialData.author   || '',
    year:     initialData.year     !== undefined ? String(initialData.year) : '',
    genre:    initialData.genre    || '',
    synopsis: initialData.synopsis || '',
    coverUrl: initialData.coverUrl || '',
  });

  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [apiError, setApiError]       = useState('');
  const [coverSearching, setCoverSearching] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions]   = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [olLoading, setOlLoading]       = useState(false);
  const dropdownRef = useRef(null);

  const debouncedTitle = useDebounce(formData.title, 400);

  // Search Open Library when title changes (only in create mode or when user types)
  useEffect(() => {
    if (debouncedTitle.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setOlLoading(true);
    api.get(`/api/books/search-ol?q=${encodeURIComponent(debouncedTitle)}`)
      .then(res => {
        setSuggestions(res.data || []);
        setShowDropdown((res.data || []).length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setOlLoading(false));
  }, [debouncedTitle]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Select suggestion ─────────────────────────────────── */
  const handleSelectSuggestion = async (book) => {
    // Immediately fill what we have
    setFormData(prev => ({
      ...prev,
      title:    book.title    || prev.title,
      author:   book.author   || prev.author,
      year:     book.year     ? String(book.year) : prev.year,
      genre:    book.genre    || prev.genre,
      synopsis: book.synopsis || prev.synopsis,
      coverUrl: book.coverUrl || prev.coverUrl,
    }));
    setShowDropdown(false);
    setSuggestions([]);
    setErrors({});

    // Fetch full details (description + better genre) if we have a key
    if (book.key) {
      try {
        const res = await api.get(`/api/books/details-ol?key=${encodeURIComponent(book.key)}`);
        setFormData(prev => ({
          ...prev,
          genre:    res.data.genre    || prev.genre,
          synopsis: res.data.synopsis || prev.synopsis,
        }));
      } catch {
        // silently ignore — partial data already filled
      }
    }
  };

  /* ── Field change ──────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    // Re-open dropdown if user edits title
    if (name === 'title' && value.trim().length >= 2) {
      setShowDropdown(suggestions.length > 0);
    }
  };

  /* ── Manual cover search ───────────────────────────────── */
  const handleSearchCover = async () => {
    if (!formData.title.trim() && !formData.author.trim()) return;
    setCoverSearching(true);
    try {
      const params = new URLSearchParams({ title: formData.title.trim(), author: formData.author.trim() });
      const res = await api.get(`/api/books/cover-search?${params}`);
      if (res.data.coverUrl) {
        setFormData(prev => ({ ...prev, coverUrl: res.data.coverUrl }));
      } else {
        setApiError('Nessuna copertina trovata per questo libro.');
        setTimeout(() => setApiError(''), 3000);
      }
    } catch {
      setApiError('Errore nella ricerca della copertina.');
      setTimeout(() => setApiError(''), 3000);
    } finally {
      setCoverSearching(false);
    }
  };

  /* ── Validation ────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!formData.title.trim())  e.title  = 'Il titolo è obbligatorio';
    if (!formData.author.trim()) e.author = "L'autore è obbligatorio";
    if (!formData.year.trim())   e.year   = "L'anno è obbligatorio";
    else if (isNaN(Number(formData.year)) || !Number.isInteger(Number(formData.year)))
      e.year = "L'anno deve essere un numero intero";
    if (!formData.genre.trim())  e.genre  = 'Il genere è obbligatorio';
    return e;
  };

  /* ── Submit ────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setSubmitting(true);
    try {
      const payload = {
        title:    formData.title.trim(),
        author:   formData.author.trim(),
        year:     Number(formData.year),
        genre:    formData.genre.trim(),
        synopsis: formData.synopsis.trim(),
        coverUrl: formData.coverUrl.trim(),
      };
      if (mode === 'create') {
        const res = await api.post('/api/books', payload);
        navigate(`/books/${res.data._id}`, { replace: true, state: { from: '/books' } });
      } else {
        await api.put(`/api/books/${bookId}`, payload);
        navigate(`/books/${bookId}`, { replace: true, state: { from: '/books' } });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Si è verificato un errore. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Form libro">
      {apiError && <div className="alert alert-error" role="alert">⚠️ {apiError}</div>}

      {/* ── Titolo con autocomplete ── */}
      <div className="form-group" ref={dropdownRef} style={{ position: 'relative' }}>
        <label className="form-label" htmlFor="title">
          Titolo *
          {olLoading && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔍 Ricerca...</span>}
        </label>
        <input
          id="title" name="title" type="text"
          className={`form-input ${errors.title ? 'error' : ''}`}
          value={formData.title}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          autoComplete="off"
          placeholder="Inizia a scrivere il titolo..."
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        {errors.title && <p className="form-error" role="alert">{errors.title}</p>}

        {/* Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <ul className="ol-dropdown" role="listbox" aria-label="Suggerimenti libri">
            {suggestions.map((book, i) => (
              <li
                key={i}
                className="ol-dropdown-item"
                role="option"
                onMouseDown={() => handleSelectSuggestion(book)}
              >
                {book.coverUrl && (
                  <img
                    src={book.coverUrl}
                    alt=""
                    className="ol-dropdown-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="ol-dropdown-info">
                  <span className="ol-dropdown-title">{book.title}</span>
                  <span className="ol-dropdown-meta">
                    {book.author}{book.year ? ` · ${book.year}` : ''}
                    {book.genre ? ` · ${book.genre}` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Autore ── */}
      <div className="form-group">
        <label className="form-label" htmlFor="author">Autore *</label>
        <input
          id="author" name="author" type="text"
          className={`form-input ${errors.author ? 'error' : ''}`}
          value={formData.author} onChange={handleChange}
          aria-invalid={!!errors.author}
        />
        {errors.author && <p className="form-error" role="alert">{errors.author}</p>}
      </div>

      {/* ── Anno ── */}
      <div className="form-group">
        <label className="form-label" htmlFor="year">Anno di pubblicazione *</label>
        <input
          id="year" name="year" type="number"
          className={`form-input ${errors.year ? 'error' : ''}`}
          value={formData.year} onChange={handleChange}
          aria-invalid={!!errors.year}
        />
        {errors.year && <p className="form-error" role="alert">{errors.year}</p>}
      </div>

      {/* ── Genere ── */}
      <div className="form-group">
        <label className="form-label" htmlFor="genre">Genere *</label>
        <input
          id="genre" name="genre" type="text"
          className={`form-input ${errors.genre ? 'error' : ''}`}
          value={formData.genre} onChange={handleChange}
          aria-invalid={!!errors.genre}
        />
        {errors.genre && <p className="form-error" role="alert">{errors.genre}</p>}
      </div>

      {/* ── Trama ── */}
      <div className="form-group">
        <label className="form-label" htmlFor="synopsis">
          Trama <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opzionale)</span>
        </label>
        <textarea
          id="synopsis" name="synopsis"
          className="form-input"
          value={formData.synopsis} onChange={handleChange}
          rows={5}
          placeholder="Inserisci una breve descrizione della trama..."
          style={{ resize: 'vertical', minHeight: '110px', fontFamily: 'inherit', lineHeight: '1.6' }}
        />
      </div>

      {/* ── Copertina ── */}
      <div className="form-group">
        <label className="form-label">
          Copertina <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opzionale)</span>
        </label>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            id="coverUrl" name="coverUrl" type="url"
            className="form-input"
            value={formData.coverUrl} onChange={handleChange}
            placeholder="URL copertina (compilato automaticamente)"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button
            type="button" className="btn btn-secondary"
            onClick={handleSearchCover}
            disabled={coverSearching || (!formData.title.trim() && !formData.author.trim())}
            title="Cerca copertina su Open Library"
          >
            {coverSearching ? '⏳ Ricerca...' : '🔍 Cerca copertina'}
          </button>
        </div>
        {formData.coverUrl && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <img
              src={formData.coverUrl}
              alt="Anteprima copertina"
              style={{ width: 80, height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <button
              type="button" className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
              onClick={() => setFormData(prev => ({ ...prev, coverUrl: '' }))}
            >
              ✕ Rimuovi
            </button>
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Salvataggio...' : mode === 'create' ? 'Aggiungi Libro' : 'Salva Modifiche'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>
          Annulla
        </button>
      </div>
    </form>
  );
};

export default BookForm;