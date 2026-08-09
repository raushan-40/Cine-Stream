import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tmdbService } from '../services/tmdbService';
import { SearchBar } from '../components/SearchBar';
import { MovieGrid } from '../components/MovieGrid';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination & Infinite Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // UI States
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorInitial, setErrorInitial] = useState(null);
  const [errorMore, setErrorMore] = useState(null);

  // Refs for request lifecycle & duplicate guards
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);
  const requestIdRef = useRef(0);

  /**
   * Fetches movies for page 1 (initial load or new search).
   * Supports AbortSignal for cleanup on unmount or query switch.
   */
  const fetchInitialMovies = useCallback(async (query, signal) => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoadingInitial(true);
    setErrorInitial(null);
    setErrorMore(null);
    isLoadingRef.current = true;

    try {
      let data;
      if (query.trim()) {
        data = await tmdbService.searchMovies(query, 1, { signal });
      } else {
        data = await tmdbService.getPopularMovies(1, { signal });
      }

      // Ignore response if a newer search/request was triggered
      if (currentRequestId !== requestIdRef.current) return;

      const results = data.results || [];
      setMovies(results);
      setPage(1);
      setHasMore(1 < data.total_pages);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Silently ignore aborted requests from React StrictMode remounts
        return;
      }
      if (currentRequestId !== requestIdRef.current) return;
      
      setErrorInitial(
        err.message || 'Failed to fetch movies. Please check your network or API configuration.'
      );
      setMovies([]);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoadingInitial(false);
        isLoadingRef.current = false;
      }
    }
  }, []);

  /**
   * Fetches the next page of movies (Page 2+).
   */
  const fetchNextPage = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || errorMore) return;

    const nextPage = page + 1;
    const currentRequestId = requestIdRef.current;
    setIsLoadingMore(true);
    setErrorMore(null);
    isLoadingRef.current = true;

    try {
      let data;
      if (searchQuery.trim()) {
        data = await tmdbService.searchMovies(searchQuery, nextPage);
      } else {
        data = await tmdbService.getPopularMovies(nextPage);
      }

      if (currentRequestId !== requestIdRef.current) return;

      const newMovies = data.results || [];

      setMovies((prevMovies) => {
        const existingIds = new Set(prevMovies.map((m) => m.id));
        const uniqueNewMovies = newMovies.filter((m) => !existingIds.has(m.id));
        return [...prevMovies, ...uniqueNewMovies];
      });

      setPage(nextPage);
      setHasMore(nextPage < data.total_pages);
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (currentRequestId !== requestIdRef.current) return;
      setErrorMore(err.message || 'Failed to load additional movies.');
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    }
  }, [page, hasMore, searchQuery, errorMore]);

  // Initial load on mount with AbortController cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetchInitialMovies('', controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchInitialMovies]);

  // Set up IntersectionObserver for sentinel observation
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        // Ensure sentinel only triggers when initial load is complete and movies are displayed
        if (
          target.isIntersecting &&
          hasMore &&
          !isLoadingInitial &&
          !isLoadingRef.current &&
          !errorMore &&
          movies.length > 0
        ) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [hasMore, fetchNextPage, errorMore, isLoadingInitial, movies.length]);

  // Handle explicit search submission
  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchInitialMovies(query);
  };

  // Handle clearing search query
  const handleResetSearch = () => {
    setSearchQuery('');
    fetchInitialMovies('');
  };

  // Handle retry for next page failure
  const handleRetryNextPage = () => {
    setErrorMore(null);
    setTimeout(() => {
      fetchNextPage();
    }, 0);
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

        {/* Page 1 Initial Loading State */}
        {isLoadingInitial && (
          <LoadingState message={searchQuery ? 'Searching movies...' : 'Loading popular movies...'} />
        )}

        {/* Page 1 Initial Error State */}
        {!isLoadingInitial && errorInitial && (
          <ErrorState message={errorInitial} onRetry={() => fetchInitialMovies(searchQuery)} />
        )}

        {/* Empty State */}
        {!isLoadingInitial && !errorInitial && movies.length === 0 && (
          <EmptyState
            message={searchQuery ? `No movies found matching "${searchQuery}".` : 'No movies available.'}
            onReset={searchQuery ? handleResetSearch : undefined}
          />
        )}

        {/* Movie Grid & Infinite Scroll UI */}
        {!isLoadingInitial && !errorInitial && movies.length > 0 && (
          <>
            <MovieGrid movies={movies} />

            {/* Page 2+ Loading Indicator */}
            {isLoadingMore && (
              <div className="load-more-container" role="status" aria-live="polite">
                <div className="loading-spinner small" aria-hidden="true" />
                <p className="load-more-text">Loading more movies...</p>
              </div>
            )}

            {/* Page 2+ Error State */}
            {errorMore && (
              <div className="load-more-container error-more" role="alert">
                <p className="load-more-error-text">{errorMore}</p>
                <button onClick={handleRetryNextPage} className="retry-button small">
                  Retry Loading More
                </button>
              </div>
            )}

            {/* End of Pages Indicator */}
            {!hasMore && (
              <div className="end-of-results">
                <p>You've reached the end of the list.</p>
              </div>
            )}

            {/* Bottom Sentinel Element */}
            <div ref={sentinelRef} className="sentinel" aria-hidden="true" />
          </>
        )}
      </main>
    </div>
  );
};