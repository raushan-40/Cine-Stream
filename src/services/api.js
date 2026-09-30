const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getPosts = async () => {
  const response = await fetch(`${API_BASE_URL}/posts`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts from backend API');
  }

  return await response.json();
};