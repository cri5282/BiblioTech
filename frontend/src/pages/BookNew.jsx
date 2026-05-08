import React from 'react';
import BookForm from '../components/BookForm.jsx';

const BookNew = () => (
  <main>
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aggiungi Libro</h1>
          <p className="page-subtitle">Inserisci i dati del nuovo libro nel catalogo</p>
        </div>
      </div>
      <div className="form-card">
        <BookForm mode="create" />
      </div>
    </div>
  </main>
);

export default BookNew;
