import React, { createContext, useContext, useState, useEffect } from 'react';
import { favoritesStorage } from '../services/favoritesStorage';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Initialize state from localStorage on initial render
  useEffect(() => {
    const loaded = favoritesStorage.getFavorites();
    setFavorites(loaded);
  }, []);

  const toggleFavorite = (movie) => {
    if (!movie || !movie.id) return;

    setFavorites((prevFavorites) => {
      const exists = prevFavorites.some((item) => item.id === movie.id);
      let updated;
      if (exists) {
        updated = favoritesStorage.removeFavorite(movie.id);
      } else {
        updated = favoritesStorage.addFavorite(movie);
      }
      return updated;
    });
  };

  const isFavorite = (movieId) => {
    return favorites.some((item) => item.id === movieId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};