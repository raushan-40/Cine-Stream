import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { geminiService } from '../services/geminiService';
import { tmdbService } from '../services/tmdbService';
import { MovieGrid } from '../components/MovieGrid';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const MoodMatcherPage = () => {
  const [moodInput, setMoodInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [matchedMovies, setMatchedMovies] = useState([]);
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'empty' | 'error'
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for tracking active request lifecycle and avoiding race conditions
  const activeControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setErrorMessage('');

    if (!moodInput.trim()) {
      setValidationError('Please enter a description of how you are feeling or what you want to watch.');
      return;
    }

    // Cancel any previous pending request
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;
    const currentRequestId = ++requestIdRef.current;

    setStatus('loading');
    setLoadingMessage('Consulting AI for movie recommendations...');

    try {
      // Step 1: Request 3-5 movie title recommendations from Gemini AI
      const titles = await geminiService.generateMoodRecommendations(moodInput);

      if (currentRequestId !== requestIdRef.current) return;

      // Step 2: Query TMDB API for matching movie objects
      setLoadingMessage('Searching TMDB for matching movies...');

      const tmdbPromises = titles.map((title) =>
        tmdbService.searchMovieByTitle(title, { signal: controller.signal })
      );

      const tmdbResults = await Promise.all(tmdbPromises);

      if (currentRequestId !== requestIdRef.current) return;

      // Step 3: Filter out nulls (missing matches) and deduplicate by TMDB ID
      const validMovies = tmdbResults.filter((m) => Boolean(m) && m.id);

      const uniqueMovies = [];
      const seenIds = new Set();
      for (const movie of validMovies) {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          uniqueMovies.push(movie);
        }
      }

      // Step 4: Update UI state
      if (uniqueMovies.length === 0) {
        setStatus('empty');
      } else {
        setMatchedMovies(uniqueMovies);
        setStatus('success');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (currentRequestId !== requestIdRef.current) return;

      setErrorMessage(err.message || 'An error occurred while fetching AI mood matches.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    setMoodInput('');
    setValidationError('');
    setMatchedMovies([]);
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="mood-matcher-page">
      <header className="app-header">
        <div className="header-content">
          <div className="header-top">
            <Link to="/" className="brand-link">
              <div className="brand">
                <h1 className="brand-title">Cine-Stream</h1>
                <p className="brand-subtitle">Media Explorer</p>
              </div>
            </Link>
            <Navigation />
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="mood-matcher-container">
          <div className="mood-form-card">
            <div className="mood-matcher-header">
              <span className="mood-badge" aria-hidden="true">✨ AI Powered</span>
              <h2 className="section-title">AI Mood Matcher</h2>
              <p className="section-subtitle">
                Describe your vibe, mood, or what kind of experience you're craving. Our AI will recommend real TMDB movies for you.
              </p>
            </div>

            {/* Form Input */}
            <form onSubmit={handleSubmit} className="mood-form" role="search">
              <label htmlFor="mood-textarea" className="mood-label">
                How are you feeling today?
              </label>

              <textarea
                id="mood-textarea"
                value={moodInput}
                onChange={(e) => {
                  setMoodInput(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="e.g. I want something dark and mysterious with mind-bending twists, or a cozy, funny movie for a lazy Sunday..."
                rows={4}
                className={`mood-textarea ${validationError ? 'input-error' : ''}`}
                disabled={status === 'loading'}
              />

              {validationError && (
                <p className="validation-error-text" role="alert">
                  ⚠️ {validationError}
                </p>
              )}

              <div className="mood-actions">
                <button
                  type="submit"
                  className="search-submit-button mood-submit-button"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Searching...' : 'Find My Movies ✨'}
                </button>

                {status !== 'idle' && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="reset-button small"
                    disabled={status === 'loading'}
                  >
                    Clear & Start Over
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="mood-state-wrapper">
              <LoadingState message={loadingMessage} />
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="mood-state-wrapper">
              <ErrorState
                message={errorMessage}
                onRetry={() => handleSubmit({ preventDefault: () => {} })}
              />
            </div>
          )}

          {/* Empty Matching State */}
          {status === 'empty' && (
            <div className="state-container empty-state">
              <div className="state-icon" aria-hidden="true">🔍</div>
              <p className="state-message">
                We couldn't find matching TMDB movies right now. Try describing your mood differently.
              </p>
              <button onClick={handleReset} className="reset-button">
                Try Another Mood
              </button>
            </div>
          )}

          {/* Success State: Renders Real TMDB MovieCards via MovieGrid */}
          {status === 'success' && matchedMovies.length > 0 && (
            <section className="mood-results-container" aria-label="AI Recommended Movies">
              <div className="section-title-container">
                <h3 className="section-title">
                  ✨ Recommended Movies ({matchedMovies.length})
                </h3>
              </div>
              <MovieGrid movies={matchedMovies} />
            </section>
          )}
        </section>
      </main>
    </div>
  );
};