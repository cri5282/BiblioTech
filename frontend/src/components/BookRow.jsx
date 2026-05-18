import React from 'react';
import { Link } from 'react-router-dom';

const BookRow = ({ book }) => (
  <tr className="book-row">
    <td className="book-row-title">
      <Link to={`/books/${book._id}`} className="book-row-link">
        {book.title}
      </Link>
    </td>
    <td className="book-row-author">{book.author}</td>
    <td className="book-row-year">{book.year}</td>
    <td className="book-row-genre">
      <span className="badge">{book.genre}</span>
    </td>
  </tr>
);

export default BookRow;
