import React from 'react';
import { MovieCard } from './MovieCard';

export const MovieGrid = ({ movies }) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="movie-grid-container" aria-label="Movie Discovery Grid">
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
};