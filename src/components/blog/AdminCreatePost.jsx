// src/components/blog/AdminCreatePost.jsx
import React, { useState } from 'react';

// --- CONFIGURATION ---
// IMPORTANT: REPLACE THIS with the actual Contentful Entry ID for your Admin Author 
// (e.g., your specific profile entry in Contentful).
const ADMIN_AUTHOR_ID = 'author'; 

// CORRECTED: This is the specific Contentful Entry ID for your "Auto Ingestion Bot" Author.
const AUTO_BOT_AUTHOR_ID = '4WOacPkmp1DHGgDf1ToJGw'; 
// --- END CONFIGURATION ---


const AdminCreatePost = ({ navigateTo }) => {

    const [postData, setPostData] = useState({
        title: '',
        content: '',
        category: 'Travel',
        // Set the default author to the Admin profile ID
        authorId: ADMIN_AUTHOR_ID, 
    });
    const [featuredImageFile, setFeaturedImageFile] = useState(null); // State for the file object
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the dedicated blog server URL from Netlify environment
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL; 
    
    // Helper to generate a basic slug
    const generateSlug = (text) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPostData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        // Capture the selected file object
        setFeaturedImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const finalSlug = generateSlug(postData.title);

        // --- Use FormData for file uploads (must not use JSON.stringify) ---
        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('slug', finalSlug); 
        formData.append('content', postData.content);
        formData.append('category', postData.category);
        formData.append('authorId', postData.authorId);
        
        if (featuredImageFile) {
            // Append the file object under the key 'featuredImage', which the server (multer) expects
            formData.append('featuredImage', featuredImageFile); 
        }

        try {
            const response = await fetch(`${BLOG_API_URL}/api/admin/create-post`, {
                method: 'POST',
                // IMPORTANT: Do NOT set 'Content-Type', the browser sets it automatically to multipart/form-data
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create post.');
            }

            setMessage('✅ Blog Post created and published successfully!');
            // Reset form
            setPostData(prev => ({ ...prev, title: '', content: '' }));
            setFeaturedImageFile(null);
            document.getElementById('featuredImage').value = ''; // Reset file input

            
            // Navigate back to management page after a short delay
            setTimeout(() => navigateTo('admin-blog-management'), 2000);

        } catch (error) {
            console.error('Error creating post:', error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4 text-center">Create New Blog Post</h2>
            
            <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-sm">
                {message && (
                    <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
                        {message}
                    </div>
                )}
                
                {/* Title */}
                <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input type="text" className="form-control" id="title" name="title" value={postData.title} onChange={handleChange} required />
                </div>

                {/* Category */}
                <div className="mb-3">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select className="form-control" id="category" name="category" value={postData.category} onChange={handleChange} required>
                        <option value="Travel">Travel</option>
                        <option value="Tourism">Tourism</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Tour">Tour</option>
                        <option value="General">General</option>
                    </select>
                </div>
                
                {/* Featured Image Upload (File Input) */}
                <div className="mb-3">
                    <label htmlFor="featuredImage" className="form-label">Featured Image (Optional)</label>
                    <input 
                        type="file" 
                        className="form-control" 
                        id="featuredImage" 
                        name="featuredImage" 
                        accept="image/*"
                        onChange={handleFileChange} 
                    />
                    <small className="form-text text-muted">This image will be uploaded to Contentful Assets and linked to the post.</small>
                </div>

                {/* Author Selection/ID (Fixed to use correct Entry IDs) */}
                <div className="mb-3">
                    <label htmlFor="authorId" className="form-label">Author</label>
                    <select className="form-control" id="authorId" name="authorId" value={postData.authorId} onChange={handleChange} required>
                        <option value={ADMIN_AUTHOR_ID}>Admin Writer (Current User)</option>
                        <option value={AUTO_BOT_AUTHOR_ID}>Auto Ingestion Bot (ID: 4WOacPkmp1DHGgDf1ToJGw)</option>
                        {/* Add more options here if you manually create other author entries */}
                    </select>
                </div>
                
                {/* Content */}
                <div className="mb-3">
                    <label htmlFor="content" className="form-label">Content</label>
                    <textarea className="form-control" id="content" name="content" rows="10" value={postData.content} onChange={handleChange} required></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Posting...
                        </>
                    ) : (
                        <><i className="fas fa-paper-plane me-2"></i> Post Blog</>
                    )}
                </button>
            </form>

            <button 
                className="btn btn-secondary mt-3" 
                onClick={() => navigateTo('admin-blog-management')}
            >
                Cancel / Back
            </button>
        </div>
    );
};

export default AdminCreatePost;