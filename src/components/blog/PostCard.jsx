// src/components/blog/PostCard.jsx
import React from 'react';

// Expects post as the 'fields' object from Contentful and contentfulId as the sys.id
const PostCard = ({ post, contentfulId, onSelectPost, isAdminView }) => {
    // Accessing fields with fallback for Contentful structure
    const title = post.title?.['en-US'] || post.title || 'Untitled Post';
    const summary = post.content?.['en-US']?.content?.[0]?.content?.[0]?.value?.substring(0, 100) + '...' || 'No summary available.';
    const postDate = post.publishedDate?.['en-US'] ? new Date(post.publishedDate['en-US']).toLocaleDateString() : 'N/A';
    
    // Author needs lookup (simplified to generic name here)
    const authorName = 'The Conclave Admin'; 
    
    const imageUrl = post.featuredImage 
        ? post.featuredImage['en-US']?.fields?.file['en-US']?.url // Full Contentful Asset URL lookup
        : 'https://via.placeholder.com/400x250?text=Travel+Blog';

    return (
        <div className="card h-100 shadow-sm blog-post-card" onClick={onSelectPost} style={{cursor: 'pointer'}}>
            <img 
                src={imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl} // Handle Contentful protocol-relative URLs
                className="card-img-top" 
                alt={title} 
                style={{height: '200px', objectFit: 'cover'}}
            />
            <div className="card-body d-flex flex-column">
                <h5 className="card-title">{title}</h5>
                <p className="card-text text-muted small mb-1">By {authorName} - {postDate}</p>
                <p className="card-text">{summary}</p>
                
                <div className="mt-auto d-flex justify-content-between align-items-center">
                    <button className="btn btn-sm btn-outline-primary">
                        Read More <i className="fas fa-chevron-right ms-1"></i>
                    </button>
                    {isAdminView && (
                         <button className="btn btn-sm btn-danger ms-2" onClick={(e) => {
                            e.stopPropagation(); 
                            if(window.confirm(`Are you sure you want to delete post ${contentfulId}?`)) {
                                // Add actual delete logic here using CMA
                                console.log(`Deleting post: ${contentfulId}`);
                            }
                        }}>
                           Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;