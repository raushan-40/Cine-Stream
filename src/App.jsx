import React, { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, deletePost } from './services/api';
import { socket } from './services/socket';

function App() {
  // Posts list state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete action state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Real-Time Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Ref to reset the file input element
  const fileInputRef = useRef(null);

  // 1. Initialize Persistent WebSocket Connection & Message Listener
  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log(`Socket connected: ${socket.id}`);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    const handleConnectError = (err) => {
      console.error('Socket connection error:', err.message);
    };

    const handleChatMessage = (incomingMessage) => {
      setMessages((prevMessages) => [...prevMessages, incomingMessage]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('chat:message', handleChatMessage);
      socket.disconnect();
    };
  }, []);

  // 2. Initial REST API data fetch for posts
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

  // 3. Handle sending real-time chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // Emit event to Socket.io server
    socket.emit('chat:message', {
      text: messageInput.trim()
    });

    setMessageInput('');
  };

  // 4. Handle image file selection with validation
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (JPEG, PNG, WEBP, etc.).');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError('Image size must be less than 5 MB.');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFormError(null);
    setImage(file);
  };

  // 5. Handle post creation via FormData
  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      if (image) {
        formData.append('image', image);
      }

      const newPost = await createPost(formData);
      setPosts((prevPosts) => [newPost, ...prevPosts]);

      setTitle('');
      setContent('');
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setFormError(err.message || 'Unable to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle post deletion
  const handleDeletePost = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setDeleteError(null);

      await deletePost(id);
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== id));
    } catch (err) {
      setDeleteError(`Failed to delete post: ${err.message || 'Please try again.'}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f3f4f6' }}>
      {/* HEADER */}
      <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid #333', paddingBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.5px' }}>
          The Data Hub <span style={{ fontSize: '1.2rem', color: '#60a5fa', fontWeight: '400' }}>— Fullstack Blog & Real-Time</span>
        </h1>
      </header>

      {/* REAL-TIME CHAT SECTION */}
      <section style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #2e2e2e',
        padding: '1.75rem',
        borderRadius: '12px',
        marginBottom: '3rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>💬</span> Live Community Chat
        </h2>

        {/* Message List */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '1rem',
          minHeight: '130px',
          maxHeight: '220px',
          overflowY: 'auto',
          marginBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}>
          {messages.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 'auto' }}>No messages yet. Send a message below!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  backgroundColor: '#262626',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  color: '#f3f4f6',
                  fontSize: '0.95rem',
                  borderLeft: '3px solid #3b82f6',
                  wordBreak: 'break-word'
                }}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a real-time message..."
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #3e3e3e',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          >
            Send
          </button>
        </form>
      </section>

      {/* CREATE POST FORM */}
      <section style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #2e2e2e',
        padding: '1.75rem',
        borderRadius: '12px',
        marginBottom: '3rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1.3rem', color: '#ffffff' }}>Create New Post</h2>

        {formError && (
          <div style={{ color: '#fca5a5', backgroundColor: '#450a0a', border: '1px solid #7f1d1d', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreatePost}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="title" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.95rem' }}>
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid #3e3e3e',
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="content" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.95rem' }}>
              Content
            </label>
            <textarea
              id="content"
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write post content here..."
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem',
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid #3e3e3e',
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
                fontSize: '1rem',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="image" style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#d1d5db', fontSize: '0.95rem' }}>
              Post Image (Optional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              disabled={isSubmitting}
              style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem' }}
            />
            {image && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#60a5fa' }}>
                Selected: <strong>{image.name}</strong> ({(image.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.75rem',
              backgroundColor: isSubmitting ? '#4b5563' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          >
            {isSubmitting ? 'Uploading & Creating...' : 'Create Post'}
          </button>
        </form>
      </section>

      {/* ALL POSTS LIST */}
      <section>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', color: '#ffffff' }}>All Posts</h2>

        {deleteError && (
          <div style={{ color: '#fca5a5', backgroundColor: '#450a0a', border: '1px solid #7f1d1d', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            {deleteError}
          </div>
        )}

        {loading && <p style={{ color: '#9ca3af' }}>Loading posts...</p>}

        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>No posts available.</p>
        )}

        {!loading && !error && posts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {posts.map((post) => (
              <article
                key={post._id}
                style={{
                  border: '1px solid #2e2e2e',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  backgroundColor: '#1e1e1e',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#ffffff', fontWeight: '600' }}>
                    {post.title}
                  </h3>
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    disabled={deletingId === post._id}
                    style={{
                      backgroundColor: deletingId === post._id ? '#4b5563' : '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.45rem 0.9rem',
                      cursor: deletingId === post._id ? 'not-allowed' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    {deletingId === post._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>

                {post.imageUrl && (
                  <div style={{ margin: '1rem 0' }}>
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      style={{
                        width: '100%',
                        maxHeight: '420px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #333'
                      }}
                    />
                  </div>
                )}

                <p style={{ margin: '0.75rem 0 1.25rem 0', lineHeight: '1.6', color: '#d1d5db', fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>

                <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #2e2e2e', paddingTop: '0.75rem' }}>
                  <span>{post.author ? `By: ${post.author.name}` : 'By: Anonymous'}</span>
                  <time>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</time>
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