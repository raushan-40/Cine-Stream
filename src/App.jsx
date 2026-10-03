import React, { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, deletePost } from './services/api';
import { socket } from './services/socket';

const CHANNELS = ['General', 'Tech Support'];

function App() {
  // Session Identity State
  const [username, setUsername] = useState('');

  // Channel Selection State
  const [currentChannel, setCurrentChannel] = useState('General');

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

  // Real-Time Chat & Typing state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});

  // Refs
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentChannelRef = useRef(currentChannel);

  // Keep channel ref synced for event callbacks
  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  // 1. Prompt user for unique session username on mount
  useEffect(() => {
    let name = '';
    while (!name || !name.trim()) {
      name = window.prompt('Enter your username for the real-time chat:') || '';
      if (!name.trim()) {
        alert('Username cannot be empty. Please enter a valid name.');
      }
    }
    setUsername(name.trim());
  }, []);

  // 2. Join selected channel room on Socket.io connection & channel switch
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Join room on backend
    socket.emit('channel:join', currentChannel);

    // Clear typing indicator when switching channels
    setTypingUsers({});

    const handleConnect = () => {
      console.log(`✅ Socket connected: ${socket.id}`);
      socket.emit('channel:join', currentChannelRef.current);
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [currentChannel]);

  // 3. Persistent WebSocket listeners for channel-scoped messages & typing
  useEffect(() => {
    const handleChatMessage = (incomingMessage) => {
      if (incomingMessage.channel === currentChannelRef.current) {
        setMessages((prevMessages) => [...prevMessages, incomingMessage]);
      }
    };

    const handleUserTyping = ({ channel, user, isTyping }) => {
      if (channel !== currentChannelRef.current || !user) return;

      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (isTyping) {
          updated[user] = true;
        } else {
          delete updated[user];
        }
        return updated;
      });
    };

    socket.on('chat:message', handleChatMessage);
    socket.on('user:typing', handleUserTyping);

    return () => {
      socket.off('chat:message', handleChatMessage);
      socket.off('user:typing', handleUserTyping);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // 4. Initial REST API data fetch for posts
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

  // 5. Handle channel switch
  const handleChannelChange = (channelName) => {
    if (channelName === currentChannel) return;

    // Reset typing state on current channel before switching
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('user:typing', {
      channel: currentChannel,
      user: username || 'Anonymous',
      isTyping: false
    });

    setCurrentChannel(channelName);
  };

  // 6. Handle input changes and emit room-scoped typing events
  const handleMessageInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    if (!socket.connected) {
      socket.connect();
    }

    if (val.trim()) {
      socket.emit('user:typing', {
        channel: currentChannel,
        user: username || 'Anonymous',
        isTyping: true
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('user:typing', {
          channel: currentChannel,
          user: username || 'Anonymous',
          isTyping: false
        });
      }, 1500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('user:typing', {
        channel: currentChannel,
        user: username || 'Anonymous',
        isTyping: false
      });
    }
  };

  // 7. Handle sending real-time chat message to current channel
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('user:typing', {
      channel: currentChannel,
      user: username || 'Anonymous',
      isTyping: false
    });

    const payload = {
      channel: currentChannel,
      user: username || 'Anonymous',
      text: messageInput.trim()
    };

    socket.emit('chat:message', payload);
    setMessageInput('');
  };

  // 8. Handle image file selection with validation
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

  // 9. Handle post creation via FormData
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

  // 10. Handle post deletion
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

  const typingNames = Object.keys(typingUsers);
  const channelMessages = messages.filter((m) => m.channel === currentChannel);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#f3f4f6' }}>
      {/* HEADER */}
      <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid #333', paddingBottom: '1.25rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.5px' }}>
          The Data Hub <span style={{ fontSize: '1.2rem', color: '#60a5fa', fontWeight: '400' }}>— Fullstack Blog & Channels</span>
        </h1>
      </header>

      {/* REAL-TIME CHAT & CHANNELS SECTION */}
      <section style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #2e2e2e',
        padding: '1.75rem',
        borderRadius: '12px',
        marginBottom: '3rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💬</span> Live Community Chat
          </h2>
          {username && (
            <span style={{ fontSize: '0.85rem', color: '#9ca3af', backgroundColor: '#262626', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #333' }}>
              Chatting as: <strong style={{ color: '#60a5fa' }}>{username}</strong>
            </span>
          )}
        </div>

        {/* Channel Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #2e2e2e', paddingBottom: '0.75rem' }}>
          {CHANNELS.map((channel) => {
            const isActive = currentChannel === channel;
            return (
              <button
                key={channel}
                type="button"
                onClick={() => handleChannelChange(channel)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #3b82f6' : '1px solid #333',
                  backgroundColor: isActive ? '#1d4ed8' : '#262626',
                  color: isActive ? '#ffffff' : '#9ca3af',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>#</span> {channel}
              </button>
            );
          })}
        </div>

        {/* Message List for Current Channel */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #2e2e2e',
          borderRadius: '8px',
          padding: '1rem',
          minHeight: '140px',
          maxHeight: '240px',
          overflowY: 'auto',
          marginBottom: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem'
        }}>
          {channelMessages.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 'auto' }}>
              No messages in #{currentChannel} yet. Be the first to post!
            </p>
          ) : (
            channelMessages.map((msg) => (
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
                <strong style={{ color: '#60a5fa', marginRight: '0.4rem' }}>[{msg.user}]:</strong>
                <span>{msg.text}</span>
              </div>
            ))
          )}
        </div>

        {/* Real-time Room Typing Indicator */}
        <div style={{ minHeight: '1.25rem', marginBottom: '0.5rem' }}>
          {typingNames.length > 0 && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#93c5fd', fontStyle: 'italic' }}>
              ✍️ [{typingNames.join(', ')}] {typingNames.length === 1 ? 'is' : 'are'} typing in #{currentChannel}...
            </p>
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={messageInput}
            onChange={handleMessageInputChange}
            placeholder={`Message #${currentChannel} as ${username || 'user'}...`}
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