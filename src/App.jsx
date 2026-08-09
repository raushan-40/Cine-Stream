import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { HomePage } from './pages/HomePage';
import { FavoritesPage } from './pages/FavoritesPage';

function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  );
}

export default App;