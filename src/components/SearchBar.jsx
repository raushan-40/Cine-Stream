import React, { useState, useEffect, useRef } from 'react';

export const SearchBar = ({ onSearch, initialQuery = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const isFirstRender = useRef(true);

  // Debounce effect: dispatches onSearch 500ms after user stops typing
  useEffect(() => {
    // Skip initial mount so popular movies load uninterrupted on page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);

    // Cleanup timer on every keystroke or component unmount
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Immediate execution on explicit form submission
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    // Immediate execution on clearing search input
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor="movie-search" className="sr-only">
        Search movies by title
      </label>
      <div className="search-input-wrapper">
        <input
          id="movie-search"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for movies..."
          aria-label="Search movies"
          className="search-input"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-button"
            aria-label="Clear search input"
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="search-submit-button">
        Search
      </button>
    </form>
  );
};