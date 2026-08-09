import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { geminiService } from '../services/geminiService';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';

export const MoodMatcherPage = () => {
  const [moodInput, setMoodInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState([]);
  
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setErrorMessage('');

    if (!moodInput.trim()) {
      setValidationError('Please enter a description of how you are feeling or what you want to watch.');
      return;
    }

    setStatus('loading');

    try {
      const titles = await geminiService.generateMoodRecommendations(moodInput);
      setSuggestedTitles(titles);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate recommendations.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setMoodInput('');
    setValidationError('');
    setSuggestedTitles([]);
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
          <div className="mood-matcher-header">
            <span className="mood-badge" aria-hidden="true">✨ AI Powered</span>
            <h2 className="section-title">AI Mood Matcher</h2>
            <p className="section-subtitle">
              Describe your vibe, mood, or what kind of experience you're craving. Our AI will curate tailored movie titles for you.
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
                {status === 'loading' ? 'Consulting AI...' : 'Find My Movies ✨'}
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

          {/* Loading State */}
          {status === 'loading' && (
            <div className="mood-state-wrapper">
              <LoadingState message="Analyzing your mood and selecting movie recommendations..." />
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

          {/* Success State */}
          {status === 'success' && suggestedTitles.length > 0 && (
            <section className="mood-results-container" aria-label="AI Recommended Movie Titles">
              <h3 className="mood-results-title">
                🎬 AI Recommended Titles ({suggestedTitles.length})
              </h3>
              <p className="mood-results-subtitle">
                Here are the movie titles suggested by Gemini AI matching your mood:
              </p>

              <ul className="mood-titles-list">
                {suggestedTitles.map((title, index) => (
                  <li key={index} className="mood-title-card">
                    <span className="mood-title-number">{index + 1}</span>
                    <span className="mood-title-text">{title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>
    </div>
  );
};