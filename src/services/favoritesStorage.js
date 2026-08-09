const STORAGE_KEY = 'cine-stream-favorites';

export const favoritesStorage = {
  /**
   * Safely retrieves stored favorites array from localStorage.
   * Handles JSON parse errors, non-array types, and invalid items.
   */
  getFavorites: () => {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (!item) return [];

      const parsed = JSON.parse(item);
      if (!Array.isArray(parsed)) {
        return [];
      }

      // Filter out any malformed objects missing a valid ID
      return parsed.filter((movie) => movie && typeof movie === 'object' && movie.id);
    } catch (error) {
      console.error('Failed to read favorites from localStorage:', error);
      return [];
    }
  },

  /**
   * Safely writes favorites array to localStorage.
   */
  saveFavorites: (favorites) => {
    try {
      if (!Array.isArray(favorites)) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  },

  /**
   * Adds a movie to favorites (prevents duplicates by movie ID).
   */
  addFavorite: (movie) => {
    if (!movie || !movie.id) return favoritesStorage.getFavorites();

    const current = favoritesStorage.getFavorites();
    const exists = current.some((item) => item.id === movie.id);

    if (!exists) {
      // Store minimal movie fields needed by MovieCard
      const minimalMovie = {
        id: movie.id,
        title: movie.title || 'Untitled Movie',
        poster_path: movie.poster_path || null,
        release_date: movie.release_date || '',
        vote_average: typeof movie.vote_average === 'number' ? movie.vote_average : 0,
      };

      const updated = [...current, minimalMovie];
      favoritesStorage.saveFavorites(updated);
      return updated;
    }

    return current;
  },

  /**
   * Removes a movie from favorites by movie ID.
   */
  removeFavorite: (movieId) => {
    const current = favoritesStorage.getFavorites();
    const updated = current.filter((movie) => movie.id !== movieId);
    favoritesStorage.saveFavorites(updated);
    return updated;
  },
};