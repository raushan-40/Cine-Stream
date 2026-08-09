const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const apiKey = import.meta.env.VITE_TMDB_KEY;

const getFetchConfig = () => {
  if (!apiKey) {
    throw new Error('TMDB API Key is missing. Please set VITE_TMDB_KEY in your .env file.');
  }

  const isBearer = apiKey.startsWith('eyJ') || apiKey.length > 32;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (isBearer) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return { isBearer, headers };
};

const request = async (endpoint, params = {}, options = {}) => {
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

  const response = await fetch(url.toString(), {
    headers,
    signal: options.signal,
  });

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
  getPopularMovies: async (page = 1, options = {}) => {
    return request('/movie/popular', { page }, options);
  },

  searchMovies: async (query, page = 1, options = {}) => {
    if (!query || !query.trim()) {
      return tmdbService.getPopularMovies(page, options);
    }
    return request('/search/movie', { query: query.trim(), page }, options);
  },

  getImageUrl: (path) => {
    return path ? `${IMAGE_BASE_URL}${path}` : null;
  },
};