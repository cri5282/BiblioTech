import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// fallback copertina via Open Library se manca nel DB
const BookDetailCover = ({ book }) => {
  const [src, setSrc] = useState(book.coverUrl || '');
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!src && !tried) {
      setTried(true);
      api.get(`/api/books/cover-search?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`)
        .then(res => { if (res.data.coverUrl) setSrc(res.data.coverUrl); })
        .catch(() => {});
    }
  }, [book.title, book.author, src, tried]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={`Copertina di ${book.title}`}
      className="book-detail-cover"
      onError={e => {
        if (!tried) {
          setTried(true);
          api.get(`/api/books/cover-search?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`)
            .then(res => { if (res.data.coverUrl) setSrc(res.data.coverUrl); else e.currentTarget.style.display = 'none'; })
            .catch(() => { e.currentTarget.style.display = 'none'; });
        } else {
          e.currentTarget.style.display = 'none';
        }
      }}
    />
  );
};

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      setError('');
      setNotFound(false);
      try {
        const res = await api.get(`/api/books/${id}`);
        setBook(res.data);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else setError(err.response?.data?.message || 'Errore nel caricamento del libro.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/books/${id}`);
      navigate('/books');
    } catch (err) {
      setError(err.response?.data?.message || "Errore durante l'eliminazione.");
      setShowModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main>
        <div className="container">
          <div className="spinner-container" aria-label="Caricamento">
            <div className="spinner" />
            <span>Caricamento...</span>
          </div>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main>
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">?</div>
            <p className="empty-state-title">Libro non trovato</p>
            <p className="empty-state-desc empty-state-desc-spaced">
              Il libro che cerchi non esiste o è stato rimosso.
            </p>
            <Link to="/books" className="btn btn-primary">Torna al catalogo</Link>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="container">
          <div className="alert alert-error" role="alert">{error}</div>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/books', { replace: true })}>Indietro</button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <button
          type="button"
          className="btn btn-secondary btn-back"
          onClick={() => navigate(-1)}
          aria-label="Torna alla pagina precedente"
        >
          Indietro
        </button>

        <div className="book-detail-card">
          <div className="book-detail-header">
            <div className="book-detail-header-inner">
              <BookDetailCover book={book} />
              <div>
                <h1 className="book-detail-header-title">{book.title}</h1>
                <p className="book-detail-header-author">{book.author}</p>
              </div>
            </div>
          </div>

          <div className="book-detail-body">
            <div className="book-detail-row">
              <div className="book-detail-icon">Au</div>
              <div className="book-detail-info">
                <span className="book-detail-label">Autore</span>
                <span className="book-detail-value">{book.author}</span>
              </div>
            </div>

            <div className="book-detail-row">
              <div className="book-detail-icon">An</div>
              <div className="book-detail-info">
                <span className="book-detail-label">Anno</span>
                <span className="book-detail-value">{book.year}</span>
              </div>
            </div>

            <div className="book-detail-row">
              <div className="book-detail-icon">Ge</div>
              <div className="book-detail-info">
                <span className="book-detail-label">Genere</span>
                <span className="book-detail-value">
                  <span className="badge badge-lg">{book.genre}</span>
                </span>
              </div>
            </div>

            <div className="book-detail-synopsis">
              <p className="book-detail-synopsis-label">Trama</p>
              {book.synopsis ? (
                <p className="book-detail-synopsis-text">{book.synopsis}</p>
              ) : (
                <p className="book-detail-synopsis-text synopsis-empty">
                  Nessuna trama disponibile.
                </p>
              )}
            </div>
          </div>

          {isAuthenticated && (
            <div className="book-detail-actions">
              <Link to={`/books/${id}/edit`} className="btn btn-primary">
                Modifica
              </Link>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowModal(true)}
                disabled={deleting}
              >
                Elimina
              </button>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          title="Conferma eliminazione"
          message={`Eliminare "${book?.title}"? Non si può annullare.`}
          onConfirm={handleDelete}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </main>
  );
};

export default BookDetail;

