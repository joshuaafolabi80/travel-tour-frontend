// src/components/blog/AdminBlogManagement.jsx
import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';

const AdminBlogManagement = ({ navigateTo }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com';

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                console.log('🛠️ Admin: Fetching posts from', `${BLOG_API_URL}/api/blog-posts`);
                const response = await fetch(`${BLOG_API_URL}/api/blog-posts`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Handle different response structures
                if (Array.isArray(data)) {
                    setPosts(data);
                } else if (data && data.items && Array.isArray(data.items)) {
                    setPosts(data.items);
                } else {
                    console.warn('Unexpected response structure:', data);
                    setPosts([]);
                }
                
            } catch (err) {
                console.error('Admin: Error fetching posts:', err);
                setError(`Failed to load posts: ${err.message}`);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [BLOG_API_URL]);

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            // Note: You'll need to implement a DELETE endpoint on your server
            console.log('Delete functionality would be implemented here for post:', postId);
            // For now, just remove from local state
            setPosts(prev => prev.filter(p => p.sys?.id !== postId && p.id !== postId));
            alert('Delete functionality needs to be implemented on the server.');
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. Check console for details.');
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading blog posts...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger">
                    <h4><i className="fas fa-exclamation-triangle me-2"></i> Error</h4>
                    <p>{error}</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Blog Management 📝</h2>
                <div className="d-flex gap-2">
                    <button 
                        className="btn btn-outline-secondary" 
                        onClick={() => navigateTo('home')}
                    >
                        <i className="fas fa-home me-2"></i> Home
                    </button>
                    <button 
                        className="btn btn-success" 
                        onClick={() => navigateTo('admin-create-post')}
                    >
                        <i className="fas fa-plus-circle me-2"></i> Create New Post
                    </button>
                </div>
            </div>
            
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">
                        <i className="fas fa-server me-2"></i>
                        Blog Server Status
                    </h5>
                    <p className="card-text mb-1">
                        <strong>API URL:</strong> {BLOG_API_URL}
                    </p>
                    <p className="card-text mb-1">
                        <strong>Total Posts:</strong> {posts.length}
                    </p>
                    <p className="card-text mb-0">
                        <strong>Storage:</strong> Contentful CMS
                    </p>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="alert alert-info text-center">
                    <i className="fas fa-newspaper me-2"></i>
                    No blog posts found yet. Create your first post!
                </div>
            ) : (
                <>
                    <div className="row g-4">
                        {posts.map((post, index) => {
                            const postId = post.sys?.id || post.id || `post-${index}`;
                            return (
                                <div key={postId} className="col-12 col-md-6 col-lg-4">
                                    <PostCard 
                                        post={post.fields || post}
                                        contentfulId={postId}
                                        onSelectPost={() => navigateTo('blog-detail', { postId })}
                                        isAdminView={true}
                                        onDelete={() => handleDeletePost(postId)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4 text-center">
                        <p className="text-muted">
                            <i className="fas fa-info-circle me-2"></i>
                            Showing {posts.length} posts from Contentful
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminBlogManagement;