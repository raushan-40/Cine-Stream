const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const apiKey = import.meta.env.VITE_TMDB_KEY;

/**
 * Validates API configuration and returns headers/params config.
 */
const getFetchConfig = () => {
  if (!apiKey) {
    throw new Error('TMDB API Key is missing. Please set VITE_TMDB_KEY in your .env file.');
  }

  // Support TMDB v4 Read Access Bearer Tokens as well as v3 API key strings
  const isBearer = apiKey.startsWith('eyJ') || apiKey.length > 32;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (isBearer) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return { isBearer, headers };
};

/**
 * Generic fetch wrapper for TMDB endpoints.
 */
const request = async (endpoint, params = {}) => {
  const { isBearer, headers } = getFetchConfig();

  const url = new URL(`${BASE_URL}${endpoint}`);

  if (!isBearer) {
    url.searchParams.append('api_key', apiKey);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid or unauthorized TMDB API Key.');
    }
    if (response.status === 404) {
      throw new Error('Requested endpoint or movie not found.');
    }
    throw new Error(`TMDB API request failed with status ${response.status}`);
  }

  return response.json();
};

export const tmdbService = {
  getPopularMovies: async (page = 1) => {
    return request('/movie/popular', { page });
  },

  searchMovies: async (query, page = 1) => {
    if (!query || !query.trim()) {
      return tmdbService.getPopularMovies(page);
    }
    return request('/search/movie', { query: query.trim(), page });
  },

  getImageUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}${path}` : null;
  },
};