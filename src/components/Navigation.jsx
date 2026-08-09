import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';

export const Navigation = () => {
  const { favorites } = useFavorites();
  const count = favorites.length;

  return (
    <nav className="app-nav" aria-label="Main Navigation">
      <ul className="nav-list">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end
          >
            Home
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/favorites"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Favorites {count > 0 && <span className="nav-badge">{count}</span>}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/mood"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            AI Mood Matcher
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};