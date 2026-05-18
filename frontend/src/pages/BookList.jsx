import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import BookCard from '../components/BookCard.jsx';
import BookRow from '../components/BookRow.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'list'
  const { isAuthenticated } = useAuth();

  const fetchBooks = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      const params = query ? { search: query } : {};
      const res = await api.get('/api/books', { params });
      setBooks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Errore nel caricamento dei libri. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(searchQuery);
  }, [searchQuery, fetchBooks]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  return (
    <main>
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Catalogo libri</h1>
            <p className="page-subtitle">Esplora la collezione della biblioteca</p>
          </div>
          {isAuthenticated && (
            <Link to="/books/new" className="btn btn-primary">
              Aggiungi libro
            </Link>
          )}
        </div>

        <SearchBar onSearch={handleSearch} />

        {!loading && !error && (
          <div className="booklist-toolbar">
            <p className="stats-bar" style={{ margin: 0 }}>
              {searchQuery
                ? <><strong>{books.length}</strong> risultati per &quot;{searchQuery}&quot;</>
                : <><strong>{books.length}</strong> libri nel catalogo</>
              }
            </p>
            <div className="view-toggle" role="group" aria-label="Modalità di visualizzazione">
              <button
                className={`view-toggle-btn${viewMode === 'card' ? ' active' : ''}`}
                onClick={() => setViewMode('card')}
                aria-pressed={viewMode === 'card'}
                title="Vista card"
              >
                ⊞ Card
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                title="Vista lista"
              >
                ☰ Lista
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="spinner-container" aria-label="Caricamento libri">
            <div className="spinner" />
            <span>Caricamento...</span>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error" role="alert">{error}</div>
        )}

        {!loading && !error && books.length === 0 && (
          <div className="empty-state" role="status">
            <div className="empty-state-icon" aria-hidden="true">—</div>
            <p className="empty-state-title">
              {searchQuery ? 'Nessun libro trovato' : 'Catalogo vuoto'}
            </p>
            <p className="empty-state-desc">
              {searchQuery
                ? `Nessun risultato per "${searchQuery}"`
                : 'Aggiungi il primo libro dalla sezione dedicata.'}
            </p>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          viewMode === 'card' ? (
            <div className="book-grid" role="list" aria-label="Lista libri">
              {books.map((book) => (
                <div key={book._id} role="listitem">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <table className="book-list-view" aria-label="Lista libri">
              <tbody>
                {books.map((book) => (
                  <BookRow key={book._id} book={book} />
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </main>
  );
};

export default BookList;
