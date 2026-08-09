import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { MovieGrid } from '../components/MovieGrid';
import { Navigation } from '../components/Navigation';

export const FavoritesPage = () => {
  const { favorites } = useFavorites();

  return (
    <div className="favorites-page">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <Link to="/" className="brand-link">
              <h1 className="brand-title">Cine-Stream</h1>
              <p className="brand-subtitle">Media Explorer</p>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      <main className="main-content">
        <section className="section-title-container">
          <h2 className="section-title">My Favorites ({favorites.length})</h2>
        </section>

        {favorites.length === 0 ? (
          <div className="state-container empty-state">
            <div className="state-icon" aria-hidden="true">💔</div>
            <p className="state-message">No favorite movies yet.</p>
            <Link to="/" className="reset-button">
              Explore Popular Movies
            </Link>
          </div>
        ) : (
          <MovieGrid movies={favorites} />
        )}
      </main>
    </div>
  );
};