// travel-tour-frontend/src/components/blog/AdminCreateEditBlog.jsx - MODIFIED

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';
import api from '../../services/api';
import '../../App.css';

// Define the fixed categories for the dropdown
const BLOG_CATEGORIES = ["Travels", "Tours", "Hotels", "Tourism"];

const AdminCreateEditBlog = ({ navigateTo, mode = 'create', postId = null }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(BLOG_CATEGORIES[0]); // Default to first category
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [featuredImage, setFeaturedImage] = useState(null); // Holds the file object
    const [currentImageUrl, setCurrentImageUrl] = useState(''); // Holds the existing URL for edit mode
    const [isPublished, setIsPublished] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editorRef, setEditorRef] = useState(null);

    const isEditMode = mode === 'edit' && postId;
    const pageTitle = isEditMode ? 'Edit Blog Post' : 'Create New Blog Post';

    // --- Fetch Post Data for Edit Mode ---
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchPost = async () => {
                try {
                    const response = await api.get(`/admin/blog/posts/${postId}`);
                    if (response.data.success && response.data.post) {
                        const post = response.data.post;
                        setTitle(post.title);
                        setCategory(post.category || BLOG_CATEGORIES[0]);
                        setSummary(post.summary);
                        setContent(post.content);
                        setCurrentImageUrl(post.imageUrl); // Store existing URL
                        setIsPublished(post.isPublished);
                    } else {
                        setError('Post not found.');
                    }
                } catch (err) {
                    setError('Failed to fetch post data.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [isEditMode, postId]);

    // --- Handle Submission (Using FormData for File Upload) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setStatus('');

        if (!title || !content || !category) {
            setError('Please fill out the Title, Category, and Content fields.');
            setLoading(false);
            return;
        }

        // Use FormData for multi-part submission (includes file and text data)
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('summary', summary);
        formData.append('content', content);
        formData.append('isPublished', isPublished);
        
        // Only append the file if a new one was selected
        if (featuredImage) {
            formData.append('featuredImage', featuredImage); 
        } else if (isEditMode) {
             // For edit mode, if no new file, we must send the existing URL so the backend preserves it
             formData.append('currentImageUrl', currentImageUrl);
        }

        try {
            let response;
            if (isEditMode) {
                // Must explicitly set content-type to multipart/form-data for files
                response = await api.put(`/admin/blog/posts/${postId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('/admin/blog/posts', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (response.data.success) {
                setStatus(isEditMode ? 'updated' : 'created');
                setTimeout(() => {
                    navigateTo('admin-blog-dashboard');
                }, 1500);
            } else {
                setError(response.data.message || 'Submission failed.');
            }
        } catch (err) {
            console.error('Submission error:', err.response?.data || err);
            setError('A server error occurred during submission. Check if the backend is running and configured for file uploads.');
        } finally {
            setLoading(false);
        }
    };
    
    // TinyMCE setup for rich text editing
    const handleEditorChange = (content, editor) => {
        setContent(content);
    };

    if (loading && isEditMode) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p>Loading post data...</p>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{pageTitle}</h2>
                <Button variant="secondary" onClick={() => navigateTo('admin-blog-dashboard')}>
                    <i className="fas fa-arrow-left me-2"></i> Back to Dashboard
                </Button>
            </div>

            {status === 'created' && <Alert variant="success">Post created and saved successfully!</Alert>}
            {status === 'updated' && <Alert variant="success">Post updated successfully!</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit} className="blog-form">
                {/* 1. TITLE INPUT */}
                <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                    />
                </Form.Group>
                
                {/* 2. CATEGORY SELECTION OPTION (MODIFIED) */}
                <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Select 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        required
                    >
                        {BLOG_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                {/* 3. SUMMARY INPUT */}
                <Form.Group className="mb-3">
                    <Form.Label>Summary (for card display)</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={3} 
                        value={summary} 
                        onChange={(e) => setSummary(e.target.value)} 
                    />
                </Form.Group>

                {/* 4. FEATURED IMAGE FILE UPLOAD (MODIFIED) */}
                <Form.Group className="mb-3">
                    <Form.Label>Featured Image (Select a file)</Form.Label>
                    <Form.Control 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setFeaturedImage(e.target.files[0])} 
                    />
                    
                    {/* Display current image in Edit Mode */}
                    {isEditMode && currentImageUrl && !featuredImage && (
                        <div className="mt-2">
                            <p className="text-muted mb-1">Current Image:</p>
                            <img src={currentImageUrl} alt="Current Featured" style={{maxWidth: '200px', height: 'auto'}} />
                        </div>
                    )}
                    
                    {/* Display preview of the newly selected image */}
                    {featuredImage && (
                        <div className="mt-2">
                             <p className="text-success mb-1">New Image Selected:</p>
                             <img src={URL.createObjectURL(featuredImage)} alt="New Featured Preview" style={{maxWidth: '200px', height: 'auto'}} />
                        </div>
                    )}
                </Form.Group>
                
                {/* 5. CONTENT INPUT (TINYMCE) */}
                <Form.Group className="mb-3">
                    <Form.Label>Content *</Form.Label>
                    <Editor
                        apiKey={process.env.REACT_APP_TINY_MCE_API_KEY}
                        onInit={(evt, editor) => setEditorRef(editor)}
                        value={content}
                        onEditorChange={handleEditorChange}
                        init={{
                            height: 500,
                            menubar: true,
                            plugins: [
                                'advlist autolink lists link image charmap print preview anchor',
                                'searchreplace visualblocks code fullscreen',
                                'insertdatetime media table paste code help wordcount'
                            ],
                            toolbar: 'undo redo | formatselect | bold italic backcolor | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | removeformat | image media | help',
                            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                    />
                </Form.Group>

                <Form.Group className="mb-4">
                    <Form.Check 
                        type="checkbox"
                        label="Publish immediately"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                    />
                </Form.Group>

                <Button variant="success" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            {isEditMode ? 'Updating...' : 'Publishing...'}
                        </>
                    ) : (
                        isEditMode ? 'Update Post' : 'Save & Publish'
                    )}
                </Button>
            </Form>
        </Container>
    );
};

export default AdminCreateEditBlog;