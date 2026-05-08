import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <main>
    <div className="container">
      <div className="not-found">
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">Pagina non trovata</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link to="/books" className="btn btn-primary">
          Torna al catalogo
        </Link>
      </div>
    </div>
  </main>
);

export default NotFound;
