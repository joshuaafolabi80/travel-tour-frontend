// src/components/blog/BlogDetailPage.jsx
import React, { useState, useEffect } from 'react';

const BlogDetailPage = ({ postId, navigateTo }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use the Render URL from .env
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com';

    useEffect(() => {
        if (!postId) {
            setError("No post selected. Please select a blog post first.");
            setLoading(false);
            return;
        }

        const fetchPostDetails = async () => {
            try {
                console.log('🔍 Fetching post details for ID:', postId);
                console.log('📡 API URL:', `${BLOG_API_URL}/api/blog-posts`);
                
                // Fetch all posts and find the matching one
                const response = await fetch(`${BLOG_API_URL}/api/blog-posts`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API Error Response:', errorText);
                    throw new Error(`Failed to fetch posts: ${response.status} - ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('📦 All posts data:', data);
                
                // Find the post by ID in different possible structures
                let foundPost = null;
                
                // Structure 1: Direct array
                if (Array.isArray(data)) {
                    foundPost = data.find(p => 
                        p.sys?.id === postId || 
                        p.id === postId || 
                        p.fields?.slug?.['en-US'] === postId ||
                        p.fields?.slug === postId
                    );
                }
                // Structure 2: Items array
                else if (data && data.items && Array.isArray(data.items)) {
                    foundPost = data.items.find(p => 
                        p.sys?.id === postId || 
                        p.id === postId || 
                        p.fields?.slug?.['en-US'] === postId ||
                        p.fields?.slug === postId
                    );
                }
                
                if (foundPost) {
                    console.log('✅ Found post:', foundPost);
                    setPost(foundPost.fields || foundPost);
                } else {
                    throw new Error(`Post with ID "${postId}" not found in ${data.length || data.items?.length || 0} posts.`);
                }
            } catch (err) {
                console.error("❌ Error fetching blog post detail:", err);
                setError(`Failed to load post: ${err.message}`);
                
                // Create a fallback post for demo purposes
                setPost({
                    title: 'Sample Blog Post',
                    content: 'This is a sample blog post content. The actual post data could not be loaded from the API.',
                    category: 'Travel',
                    publishedDate: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPostDetails();
    }, [postId, BLOG_API_URL]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading blog post from Contentful...</p>
                <small className="text-muted">Post ID: {postId}</small>
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger">
                    <h4><i className="fas fa-exclamation-circle me-2"></i> Error Loading Post</h4>
                    <p className="mb-2">{error}</p>
                    <p className="mb-3">
                        <strong>API Endpoint:</strong> {BLOG_API_URL}/api/blog-posts
                    </p>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigateTo('blog-list')}
                        >
                            <i className="fas fa-arrow-left me-2"></i> Back to Blog List
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

    // Extract post data with multiple fallbacks
    const title = post?.title?.['en-US'] || post?.title || post?.fields?.title || 'Untitled Post';
    const category = post?.category?.['en-US'] || post?.category || post?.fields?.category || 'General';
    
    const postDate = post?.publishedDate?.['en-US'] 
        ? new Date(post.publishedDate['en-US']).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : post?.publishedDate 
            ? new Date(post.publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Unknown Date';
    
    // Handle content extraction
    const getContentText = () => {
        if (post?.content?.['en-US']?.content) {
            // Rich text content
            return post.content['en-US'].content
                .filter(node => node.nodeType === 'paragraph')
                .map(node => 
                    node.content
                        .filter(textNode => textNode.nodeType === 'text')
                        .map(textNode => textNode.value)
                        .join('')
                )
                .join('\n\n');
        } else if (post?.content) {
            // Plain text content
            return post.content;
        }
        return 'No content available for this post.';
    };

    const content = getContentText();
    const authorName = post?.author?.['en-US']?.fields?.name?.['en-US'] || 
                      post?.author?.fields?.name || 
                      'The Conclave Academy Team';

    return (
        <div className="container py-4">
            <button 
                className="btn btn-outline-secondary mb-4" 
                onClick={() => navigateTo('blog-list')}
            >
                <i className="fas fa-arrow-left me-2"></i> Back to Blog List
            </button>

            <article className="bg-white p-4 p-md-5 rounded shadow-sm">
                <div className="mb-3">
                    <span className="badge bg-primary px-3 py-2">
                        <i className="fas fa-tag me-2"></i>
                        {category}
                    </span>
                </div>
                
                <h1 className="mb-3 display-5 fw-bold">{title}</h1>
                
                <div className="text-muted mb-4 pb-3 border-bottom">
                    <div className="d-flex flex-wrap gap-4">
                        <div>
                            <i className="far fa-calendar-alt me-2"></i>
                            <strong>Published:</strong> {postDate}
                        </div>
                        <div>
                            <i className="fas fa-user me-2"></i>
                            <strong>Author:</strong> {authorName}
                        </div>
                    </div>
                </div>

                <div className="post-content mt-4" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
                    {content.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">
                            {paragraph}
                        </p>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-top">
                    <div className="d-flex flex-wrap gap-2">
                        <button 
                            className="btn btn-primary me-2"
                            onClick={() => navigateTo('blog-list')}
                        >
                            <i className="fas fa-newspaper me-2"></i> View More Posts
                        </button>
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigateTo('home')}
                        >
                            <i className="fas fa-home me-2"></i> Go to Home
                        </button>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default BlogDetailPage;