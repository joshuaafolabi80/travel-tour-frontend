// src/components/blog/BlogDetailPage.jsx
import React, { useState, useEffect } from 'react';

const BlogDetailPage = ({ postId, navigateTo }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- UPDATED API URL ---
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL;

    useEffect(() => {
        if (!postId) {
            setError("No post selected.");
            setLoading(false);
            return;
        }

        const fetchPostDetails = async () => {
            try {
                // NOTE: The current backend only has a list endpoint.
                // We'll simulate fetching from a list or use the main endpoint.
                // For a real app, you would need a /api/blog-posts/:id endpoint.
                
                // FALLBACK: Fetch all and find the ID locally (not recommended for large lists)
                // For now, let's assume the public endpoint can return the data structure needed.
                
                // Assuming you would eventually implement a single post endpoint on the server:
                const response = await fetch(`${BLOG_API_URL}/api/blog-posts/${postId}`); // ASSUMED ENDPOINT
                
                if (!response.ok) {
                    // Fallback to fetching all and checking locally if the direct ID fetch fails
                    const listResponse = await fetch(`${BLOG_API_URL}/api/blog-posts`);
                    if (!listResponse.ok) throw new Error(`List fetch failed: ${listResponse.status}`);
                    
                    const listData = await listResponse.json();
                    const foundPost = listData.find(p => p.sys.id === postId); // Contentful ID check
                    
                    if (!foundPost) throw new Error("Post not found.");
                    
                    setPost(foundPost.fields || foundPost);
                    setLoading(false);
                    return;
                }
                
                const data = await response.json();
                setPost(data.post.fields || data.fields || data.post || data);
            } catch (err) {
                console.error("Error fetching blog post detail:", err);
                setError(`Failed to load post details. Check if the backend has /api/blog-posts/${postId} endpoint.`);
            } finally {
                setLoading(false);
            }
        };

        fetchPostDetails();
    }, [postId, BLOG_API_URL]); // Dependency on BLOG_API_URL ensures effect runs if environment changes

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

    if (!post) {
        return <div className="alert alert-warning mx-3 mt-3">Post not found.</div>;
    }

    // Access Contentful fields via post.fieldName['en-US'] or directly if linked
    const title = post.title?.['en-US'] || post.title || 'Untitled Post';
    const content = post.content?.['en-US'] || post.content; // Rich Text structure
    const postDate = post.publishedDate?.['en-US'] ? new Date(post.publishedDate['en-US']).toDateString() : 'Unknown Date';
    const category = post.category?.['en-US'] || post.category || 'General';
    // Author needs a lookup using the post.author.sys.id if fully implemented
    const authorName = post.author?.['en-US']?.fields?.name?.['en-US'] || 'The Conclave Admin'; 
    
    // Simple Rich Text to plain text conversion for display (TEMPORARY)
    const richTextToPlain = (richText) => {
        if (!richText || richText.nodeType !== 'document') return "Content structure error.";
        
        return richText.content.map(node => {
            if (node.nodeType === 'paragraph') {
                return node.content.map(textNode => textNode.value).join('');
            }
            return '';
        }).join('\n\n');
    };
    
    return (
        <div className="container py-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigateTo('blog-list')}>
                <i className="fas fa-arrow-left me-2"></i> Back to Blog List
            </button>

            <article className="blog-detail-post bg-light p-4 rounded shadow-sm">
                <h1 className="mb-3">{title}</h1>
                <div className="text-muted mb-4 small">
                    By <strong>{authorName}</strong> | Published on {postDate} | Category: {category}
                </div>
                {/* Image handling needs Contentful Asset resolution, skipped here for simplicity */}
                
                <div className="post-content">
                    {/* NOTE: Rich text parsing is complex. We are using a simple plain text conversion here. 
                        In production, use a library like '@contentful/rich-text-react-renderer' */}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{richTextToPlain(content)}</p> 
                </div>
            </article>
        </div>
    );
};

export default BlogDetailPage;