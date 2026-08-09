import React, { useState } from 'react';
import { tmdbService } from '../services/tmdbService';

export const MovieCard = ({ movie }) => {
  const { title, poster_path, release_date, vote_average } = movie;
  const [imageError, setImageError] = useState(false);

  const imageUrl = tmdbService.getImageUrl(poster_path);
  const releaseYear = release_date && release_date.length >= 4 
    ? release_date.substring(0, 4) 
    : 'N/A';
  
  const rating = typeof vote_average === 'number' && vote_average > 0 
    ? vote_average.toFixed(1) 
    : 'N/A';

  const showPlaceholder = !imageUrl || imageError;

  return (
    <article className="movie-card" aria-label={title}>
      <div className="movie-poster-container">
        {!showPlaceholder ? (
          <img
            src={imageUrl}
            alt={`${title} poster`}
            className="movie-poster"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="movie-poster-placeholder" aria-hidden="true">
            <span className="placeholder-icon">🎬</span>
            <span className="placeholder-text">No Poster Available</span>
          </div>
        )}
      </div>

      <div className="movie-info">
        <h3 className="movie-title" title={title}>{title || 'Untitled Movie'}</h3>
        <div className="movie-meta">
          <span className="movie-year" aria-label={`Release year ${releaseYear}`}>
            {releaseYear}
          </span>
          <span className="movie-rating" aria-label={`Rating ${rating} out of 10`}>
            ★ {rating}
          </span>
        </div>
      </div>
    </article>
  );
};