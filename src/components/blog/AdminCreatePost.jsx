// src/components/blog/AdminCreatePost.jsx
import React, { useState } from 'react';

const ADMIN_AUTHOR_ID = 'author'; 
const AUTO_BOT_AUTHOR_ID = '4WOacPkmp1DHGgDf1ToJGw'; 

const AdminCreatePost = ({ navigateTo }) => {
    const [postData, setPostData] = useState({
        title: '',
        content: '',
        category: 'Travel',
        authorId: ADMIN_AUTHOR_ID, 
    });
    const [featuredImageFile, setFeaturedImageFile] = useState(null); 
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Use the Render URL from .env
    const BLOG_API_URL = process.env.REACT_APP_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com';
    
    const generateSlug = (text) => {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 50);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPostData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFeaturedImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const finalSlug = generateSlug(postData.title);
        console.log('Creating post with slug:', finalSlug);
        console.log('API URL:', `${BLOG_API_URL}/api/admin/create-post`);

        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('slug', finalSlug); 
        formData.append('content', postData.content);
        formData.append('category', postData.category);
        formData.append('authorId', postData.authorId);
        
        if (featuredImageFile) {
            formData.append('featuredImage', featuredImageFile); 
        }

        try {
            console.log('Sending request to:', `${BLOG_API_URL}/api/admin/create-post`);
            const response = await fetch(`${BLOG_API_URL}/api/admin/create-post`, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header when using FormData
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Error response:', errorData);
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Success response:', data);
            
            setMessage('✅ Blog Post created and published successfully!');
            setPostData({ title: '', content: '', category: 'Travel', authorId: ADMIN_AUTHOR_ID });
            setFeaturedImageFile(null);
            if (document.getElementById('featuredImage')) {
                document.getElementById('featuredImage').value = ''; 
            }

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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Create New Blog Post</h2>
                <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => navigateTo('admin-blog-management')}
                >
                    <i className="fas fa-arrow-left me-2"></i> Back to Management
                </button>
            </div>
            
            <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                Posts are stored in Contentful and accessible via: {BLOG_API_URL}
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-sm">
                {message && (
                    <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
                        <i className={`fas ${message.startsWith('✅') ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2`}></i>
                        {message}
                    </div>
                )}
                
                <div className="mb-3">
                    <label htmlFor="title" className="form-label fw-bold">Title *</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        id="title" 
                        name="title" 
                        value={postData.title} 
                        onChange={handleChange} 
                        required 
                        placeholder="Enter post title"
                    />
                    <small className="text-muted">This will be used to generate the URL slug</small>
                </div>

                <div className="mb-3">
                    <label htmlFor="category" className="form-label fw-bold">Category *</label>
                    <select 
                        className="form-control" 
                        id="category" 
                        name="category" 
                        value={postData.category} 
                        onChange={handleChange} 
                        required
                    >
                        <option value="Travel">Travel</option>
                        <option value="Tourism">Tourism</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Tour">Tour</option>
                        <option value="General">General</option>
                    </select>
                </div>
                
                <div className="mb-3">
                    <label htmlFor="featuredImage" className="form-label fw-bold">Featured Image (Optional)</label>
                    <input 
                        type="file" 
                        className="form-control" 
                        id="featuredImage" 
                        name="featuredImage" 
                        accept="image/*"
                        onChange={handleFileChange} 
                    />
                    <small className="form-text text-muted">
                        Supported: JPG, PNG, GIF. Max size: 10MB
                    </small>
                </div>

                <div className="mb-3">
                    <label htmlFor="authorId" className="form-label fw-bold">Author *</label>
                    <select 
                        className="form-control" 
                        id="authorId" 
                        name="authorId" 
                        value={postData.authorId} 
                        onChange={handleChange} 
                        required
                    >
                        <option value={ADMIN_AUTHOR_ID}>Admin Writer (Your Account)</option>
                        <option value={AUTO_BOT_AUTHOR_ID}>Auto Ingestion Bot</option>
                    </select>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="content" className="form-label fw-bold">Content *</label>
                    <textarea 
                        className="form-control" 
                        id="content" 
                        name="content" 
                        rows="10" 
                        value={postData.content} 
                        onChange={handleChange} 
                        required
                        placeholder="Write your blog post content here..."
                    ></textarea>
                    <small className="text-muted">Supports basic formatting. For rich text, use Contentful directly.</small>
                </div>
                
                <div className="d-grid gap-2">
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-lg" 
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Publishing Post...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane me-2"></i> Publish Blog Post
                            </>
                        )}
                    </button>
                    
                    <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => navigateTo('admin-blog-management')}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreatePost;