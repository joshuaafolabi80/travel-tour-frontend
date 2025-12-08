import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Editor } from '@tinymce/tinymce-react';
import api from '../../services/api';
import '../../App.css'; 

const AdminCreateEditBlog = ({ navigateTo, mode = 'create', postId = null }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
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
                        setCategory(post.category);
                        setSummary(post.summary);
                        setContent(post.content);
                        setImageUrl(post.imageUrl);
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

    // --- Handle Submission ---
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

        const postData = {
            title,
            category,
            summary,
            content,
            imageUrl,
            isPublished
        };

        try {
            let response;
            if (isEditMode) {
                response = await api.put(`/admin/blog/posts/${postId}`, postData);
            } else {
                response = await api.post('/admin/blog/posts', postData);
            }

            if (response.data.success) {
                setStatus(isEditMode ? 'updated' : 'created');
                // Navigate back to the dashboard after a short delay
                setTimeout(() => {
                    navigateTo('admin-blog-dashboard');
                }, 1500);
            } else {
                setError(response.data.message || 'Submission failed.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError('A server error occurred during submission.');
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
                <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                    />
                </Form.Group>
                
                <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Control 
                        type="text" 
                        value={category} 
                        onChange={(e) => setCategory(e.target.value)} 
                        required 
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Summary (for card display)</Form.Label>
                    <Form.Control 
                        as="textarea" 
                        rows={3} 
                        value={summary} 
                        onChange={(e) => setSummary(e.target.value)} 
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Featured Image URL</Form.Label>
                    <Form.Control 
                        type="url" 
                        value={imageUrl} 
                        onChange={(e) => setImageUrl(e.target.value)} 
                    />
                    {imageUrl && <img src={imageUrl} alt="Featured" className="mt-2" style={{maxWidth: '200px', height: 'auto'}} />}
                </Form.Group>
                
                <Form.Group className="mb-3">
                    <Form.Label>Content *</Form.Label>
                    <Editor
                        apiKey={process.env.REACT_APP_TINY_MCE_API_KEY} // Ensure this is set in your .env
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