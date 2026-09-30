const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://the-data-hub-1-owrx.onrender.com';

// GET all posts
export const getPosts = async () => {
  const response = await fetch(`${API_BASE_URL}/posts`);
  if (!response.ok) {
    throw new Error('Failed to fetch posts from backend API');
  }
  return await response.json();
};

// POST a new post using FormData (supports title, content, and optional image)
export const createPost = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    // IMPORTANT: Do NOT set Content-Type header manually here.
    // The browser automatically sets Content-Type to multipart/form-data with the correct boundary.
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create post');
  }

  return await response.json();
};

// DELETE a post by ID
export const deletePost = async (postId) => {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete post');
  }

  return await response.json();
};