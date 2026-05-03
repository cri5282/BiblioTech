import React, { useState, useEffect } from 'react';

const SearchBar = ({ onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, onSearch]);

  return (
    <div className="search-wrapper">
      <svg className="search-icon search-icon-svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" />
      </svg>
      <input
        type="search"
        className="search-input"
        placeholder="Cerca per titolo o autore..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        aria-label="Cerca libri per titolo o autore"
      />
    </div>
  );
};

export default SearchBar;
