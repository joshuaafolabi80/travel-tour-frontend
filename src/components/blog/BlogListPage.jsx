// src/components/blog/BlogListPage.jsx
import React, { useState, useEffect } from 'react';
import PostCard from './PostCard'; 
import axios from 'axios'; // Using axios for simplicity, but fetch is fine too

const BlogListPage = ({ navigateTo, isAdminView = false }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- UPDATED API URL ---
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL; 

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Fetch posts from your dedicated Blog Backend/CMS endpoint
                const response = await axios.get(`${BLOG_API_URL}/api/blog-posts`);
                
                // Contentful returns data in the 'items' array
                setPosts(response.data); 
            } catch (err) {
                console.error("Error fetching blog posts:", err);
                setError("Failed to load blog posts. Please check the Render backend connection.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [BLOG_API_URL]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger mx-3 mt-3">{error}</div>;
    }

    return (
        <div className="container py-4">
            <h2 className="mb-4 text-center">{isAdminView ? "All Blog Posts" : "Travel & Tourism Blog 🌍"}</h2>
            {posts.length === 0 ? (
                <div className="alert alert-info text-center">No blog posts found yet. Check back soon!</div>
            ) : (
                <div className="row g-4">
                    {posts.map(post => (
                        // Post ID is post.sys.id from Contentful
                        <div key={post.sys.id} className="col-12 col-md-6 col-lg-4">
                            <PostCard 
                                post={post.fields} // Pass only the fields data
                                contentfulId={post.sys.id} // Pass the unique ID
                                onSelectPost={() => navigateTo('blog-detail', { postId: post.sys.id })} 
                                isAdminView={isAdminView}
                            />
                        </div>
                    ))}
                </div>
            )}
            {!isAdminView && (
                <button 
                    className="btn btn-secondary mt-4" 
                    onClick={() => navigateTo('home')}
                >
                    <i className="fas fa-arrow-left me-2"></i> Back to Home
                </button>
            )}
        </div>
    );
};

export default BlogListPage;