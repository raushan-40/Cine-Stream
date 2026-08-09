import React, { useState } from 'react';

export const SearchBar = ({ onSearch, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies..."
          aria-label="Search movies"
          className="search-input"
        />
        {query && (
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