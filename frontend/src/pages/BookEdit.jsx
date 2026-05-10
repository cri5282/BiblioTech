import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import BookForm from '../components/BookForm.jsx';

const BookEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await api.get(`/api/books/${id}`);
        setBook(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Libro non trovato.');
        } else {
          setError(err.response?.data?.message || 'Errore nel caricamento del libro.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <main>
        <div className="container">
          <div className="spinner-container" aria-label="Caricamento...">
            <div className="spinner" />
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
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Indietro
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Modifica Libro</h1>
        </div>
        <div className="form-card">
          <BookForm mode="edit" initialData={book} bookId={id} />
        </div>
      </div>
    </main>
  );
};

export default BookEdit;
