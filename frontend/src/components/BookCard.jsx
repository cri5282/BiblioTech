import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="220" viewBox="0 0 160 220"><rect width="160" height="220" fill="%23e2e8f0"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="36" font-weight="700" fill="%2394a3b8">B</text></svg>';

const BookCover = ({ book }) => {
  const [src, setSrc] = useState(book.coverUrl || '');
  const [tried, setTried] = useState(false);

  // If no coverUrl stored, try fetching from Open Library once
  useEffect(() => {
    if (!src && !tried) {
      setTried(true);
      api.get(`/api/books/cover-search?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`)
        .then(res => { if (res.data.coverUrl) setSrc(res.data.coverUrl); })
        .catch(() => {});
    }
  }, [book.title, book.author, src, tried]);

  const handleError = () => {
    if (!tried) {
      setTried(true);
      api.get(`/api/books/cover-search?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`)
        .then(res => { if (res.data.coverUrl) setSrc(res.data.coverUrl); else setSrc(PLACEHOLDER); })
        .catch(() => setSrc(PLACEHOLDER));
    } else {
      setSrc(PLACEHOLDER);
    }
  };

  return (
    <img
      src={src || PLACEHOLDER}
      alt={`Copertina di ${book.title}`}
      className="book-card-cover"
      onError={handleError}
      loading="lazy"
    />
  );
};

const BookCard = ({ book }) => {
  const badgeRef   = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const badge   = badgeRef.current;
    const wrapper = wrapperRef.current;
    if (!badge || !wrapper) return;
    const overflow = badge.scrollWidth - wrapper.clientWidth;
    badge.style.setProperty('--badge-overflow', overflow > 0 ? `-${overflow + 8}px` : '0px');
  }, [book.genre]);

  return (
    <article className="book-card" aria-label={`Libro: ${book.title}`}>
      <div className="book-card-accent" />
      <Link to={`/books/${book._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Cover */}
        <div className="book-card-cover-wrap">
          <BookCover book={book} />
        </div>

        {/* Text */}
        <div className="book-card-body">
          <p className="book-card-title">{book.title}</p>
          <p className="book-card-author">{book.author}</p>

          {book.synopsis && (
            <p className="book-card-synopsis">{book.synopsis}</p>
          )}

          <div className="book-card-footer">
            <span className="book-card-year">{book.year}</span>
            <div className="badge-wrapper" ref={wrapperRef}>
              <span className="badge" ref={badgeRef}>{book.genre}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BookCard;
