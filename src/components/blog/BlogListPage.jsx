// src/components/blog/BlogListPage.jsx
import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';

const BlogListPage = ({ navigateTo, isAdminView = false }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Use the Render URL from .env
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com';
    
    // Debug logging
    useEffect(() => {
        console.log('Blog API URL configured:', BLOG_API_URL);
    }, [BLOG_API_URL]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                console.log('📡 Fetching blog posts from:', `${BLOG_API_URL}/api/blog-posts`);
                const response = await fetch(`${BLOG_API_URL}/api/blog-posts`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('API Response data:', data);
                
                // Handle different response structures
                if (Array.isArray(data)) {
                    console.log(`✅ Found ${data.length} posts in array format`);
                    setPosts(data);
                } else if (data && data.items && Array.isArray(data.items)) {
                    console.log(`✅ Found ${data.items.length} posts in items format`);
                    setPosts(data.items);
                } else if (data && typeof data === 'object') {
                    console.log('⚠️ Unexpected object format, trying to extract posts');
                    // Try to find posts in the object
                    const possibleArrays = Object.values(data).filter(Array.isArray);
                    if (possibleArrays.length > 0) {
                        setPosts(possibleArrays[0]);
                    } else {
                        setPosts([]);
                    }
                } else {
                    console.warn('⚠️ Unexpected API response structure:', data);
                    setPosts([]);
                }
                
            } catch (err) {
                console.error("❌ Error fetching blog posts:", err);
                setError(`Failed to load blog posts: ${err.message}`);
                // Set empty array to prevent crash
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [BLOG_API_URL]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading blog posts from {BLOG_API_URL}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger">
                    <h4><i className="fas fa-exclamation-triangle me-2"></i> Error Loading Blog Posts</h4>
                    <p className="mb-2">{error}</p>
                    <p className="mb-3">
                        <strong>API Endpoint:</strong> {BLOG_API_URL}/api/blog-posts
                    </p>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => window.location.reload()}
                        >
                            <i className="fas fa-sync-alt me-2"></i> Try Again
                        </button>
                        <button 
                            className="btn btn-outline-secondary" 
                            onClick={() => navigateTo('home')}
                        >
                            <i className="fas fa-home me-2"></i> Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4 text-center">
                {isAdminView ? (
                    <>
                        <i className="fas fa-newspaper me-2"></i>
                        Blog Management
                    </>
                ) : (
                    <>
                        <i className="fas fa-globe-americas me-2"></i>
                        Travel & Tourism Blog
                    </>
                )}
            </h2>
            
            {posts.length === 0 ? (
                <div className="alert alert-info text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    No blog posts found yet. Check back soon!
                    {isAdminView && (
                        <div className="mt-3">
                            <button 
                                className="btn btn-success"
                                onClick={() => navigateTo('admin-create-post')}
                            >
                                <i className="fas fa-plus-circle me-2"></i>
                                Create Your First Post
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {isAdminView && (
                        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded">
                            <div>
                                <span className="badge bg-primary me-2">Total Posts: {posts.length}</span>
                                <span className="text-muted">
                                    <i className="fas fa-database me-1"></i>
                                    Connected to Contentful
                                </span>
                            </div>
                            <button 
                                className="btn btn-success" 
                                onClick={() => navigateTo('admin-create-post')}
                            >
                                <i className="fas fa-plus-circle me-2"></i> Create New Post
                            </button>
                        </div>
                    )}
                    
                    <div className="row g-4">
                        {posts.map((post, index) => {
                            const postId = post.sys?.id || post.id || `post-${index}`;
                            const postTitle = post.fields?.title?.['en-US'] || post.title || post.fields?.title || 'Untitled Post';
                            
                            return (
                                <div key={postId} className="col-12 col-md-6 col-lg-4">
                                    <PostCard 
                                        post={post.fields || post}
                                        contentfulId={postId}
                                        onSelectPost={() => {
                                            navigateTo('blog-detail', { postId });
                                        }}
                                        isAdminView={isAdminView}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
            
            {!isAdminView && (
                <div className="text-center mt-5 pt-3 border-top">
                    <button 
                        className="btn btn-outline-primary" 
                        onClick={() => navigateTo('home')}
                    >
                        <i className="fas fa-arrow-left me-2"></i> Back to Home
                    </button>
                </div>
            )}
        </div>
    );
};

export default BlogListPage;