import React, { useState, useEffect } from 'react';
import { getPosts } from './services/api';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="status-container">
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container error">
        <p>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="status-container">
        <p>No posts available.</p>
      </div>
    );
  }

  return (
    <div className="posts-container">
      <h2>Latest Blog Posts</h2>
      <div className="posts-grid">
        {posts.map((post) => (
          <article key={post._id} className="post-card">
            <h3>{post.title}</h3>
            <p className="post-content">{post.content}</p>
            <div className="post-meta">
              {post.author && <span>By: {post.author.name}</span>}
              <time>{new Date(post.createdAt).toLocaleDateString()}</time>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PostList;