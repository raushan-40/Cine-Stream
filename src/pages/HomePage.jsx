import React, { useState, useEffect, useCallback } from 'react';
import { tmdbService } from '../services/tmdbService';
import { SearchBar } from '../components/SearchBar';
import { MovieGrid } from '../components/MovieGrid';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMovies = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);

    try {
      let data;
      if (query.trim()) {
        data = await tmdbService.searchMovies(query);
      } else {
        data = await tmdbService.getPopularMovies();
      }
      setMovies(data.results || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch movies. Please check your network or API key configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchMovies(query);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    fetchMovies('');
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <h1 className="brand-title">Cine-Stream</h1>
            <p className="brand-subtitle">Media Explorer</p>
          </div>
          <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
        </div>
      </header>

      <main className="main-content">
        <section className="section-title-container">
          <h2 className="section-title">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Popular Movies'}
          </h2>
        </section>

        {isLoading && (
          <LoadingState message={searchQuery ? 'Searching movies...' : 'Loading popular movies...'} />
        )}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={() => fetchMovies(searchQuery)} />
        )}

        {!isLoading && !error && movies.length === 0 && (
          <EmptyState
            message={searchQuery ? `No movies found matching "${searchQuery}".` : 'No movies available.'}
            onReset={searchQuery ? handleResetSearch : undefined}
          />
        )}

        {!isLoading && !error && movies.length > 0 && (
          <MovieGrid movies={movies} />
        )}
      </main>
    </div>
  );
};