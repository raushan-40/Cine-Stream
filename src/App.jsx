import React, { useState, useEffect } from 'react';
import { getPosts, createPost, deletePost } from './services/api';

function App() {
  // Posts list state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete action state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // 1. Initial data fetch
  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPosts();
        if (isMounted) {
          setPosts(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load posts. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Handle post creation
  const handleCreatePost = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!title.trim() || !content.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const newPost = await createPost({
        title: title.trim(),
        content: content.trim()
      });

      // Optimistically prepend the returned post to local state
      setPosts((prevPosts) => [newPost, ...prevPosts]);

      // Reset form
      setTitle('');
      setContent('');
    } catch (err) {
      setFormError(err.message || 'Unable to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle post deletion
  const handleDeletePost = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setDeleteError(null);

      await deletePost(id);

      // Remove from state immediately
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== id));
    } catch (err) {
      setDeleteError(`Failed to delete post: ${err.message || 'Please try again.'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #ddd', paddingBottom: '1rem' }}>
        <h1>The Data Hub — Fullstack Blog</h1>
      </header>

      {/* CREATE POST FORM */}
      <section style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2.5rem' }}>
        <h2>Create New Post</h2>

        {formError && (
          <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreatePost}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="content" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Content
            </label>
            <textarea
              id="content"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write post content here..."
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.6rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.7rem 1.5rem',
              backgroundColor: isSubmitting ? '#9e9e9e' : '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </section>

      {/* POST LIST SECTION */}
      <section>
        <h2>All Posts</h2>

        {deleteError && (
          <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
            {deleteError}
          </div>
        )}

        {loading && <p>Loading posts...</p>}

        {error && <p style={{ color: '#d32f2f' }}>{error}</p>}

        {!loading && !error && posts.length === 0 && <p>No posts available.</p>}

        {!loading && !error && posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {posts.map((post) => (
              <article
                key={post._id}
                style={{
                  border: '1px solid #e0e0e0',
                  padding: '1.25rem',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{post.title}</h3>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deletingId === post._id}
                    style={{
                      backgroundColor: deletingId === post._id ? '#ccc' : '#e53935',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.4rem 0.8rem',
                      cursor: deletingId === post._id ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {deletingId === post._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                <p style={{ margin: '0.5rem 0 1rem 0', lineHeight: '1.5', color: '#333' }}>{post.content}</p>

                <div style={{ fontSize: '0.85rem', color: '#757575', display: 'flex', gap: '1rem' }}>
                  {post.author && <span>By: {post.author.name}</span>}
                  <time>{new Date(post.createdAt).toLocaleDateString()}</time>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;