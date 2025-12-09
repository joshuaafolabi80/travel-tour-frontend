// travel-tour-frontend/src/components/blog/AdminCreateEditBlog.jsx
import React, { useState, useEffect } from 'react';
import { 
    Container, Card, Form, Button, Row, Col, 
    Alert, Spinner, Badge
} from 'react-bootstrap';
import { 
    FaSave, FaTimes, FaEye, FaCloudUploadAlt,
    FaImage, FaFileAlt, FaCheck
} from 'react-icons/fa';
import blogApi from '../../services/blogApi';
import '../../App.css';

const AdminCreateEditBlog = ({ mode = 'create', postId = null, navigateTo }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: 'Travels',
        summary: '',
        content: '',
        isPublished: false
    });
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [charCount, setCharCount] = useState(0);

    const categories = ['Travels', 'Tours', 'Hotels', 'Tourism'];

    // Fetch post data if in edit mode
    useEffect(() => {
        if (mode === 'edit' && postId) {
            fetchPostData();
        }
    }, [mode, postId]);

    const fetchPostData = async () => {
        setLoading(true);
        try {
            const response = await blogApi.get(`/admin/blog/posts/${postId}`);
            if (response.data.success) {
                const post = response.data.post;
                setFormData({
                    title: post.title || '',
                    category: post.category || 'Travels',
                    summary: post.summary || '',
                    content: post.content || '',
                    isPublished: post.isPublished || false
                });
                setCharCount(post.content?.length || 0);
            }
        } catch (err) {
            console.error('Error fetching post:', err);
            setError('Failed to load post data');
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'content') {
            setCharCount(value.length);
        }
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    // Handle form submission - SIMPLIFIED
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        console.log('📤 Starting form submission...');
        
        // Basic validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        
        if (!formData.content.trim()) {
            setError('Content is required');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            console.log('📝 Form data:', formData);
            console.log('🖼️ Image file:', imageFile ? 'Yes' : 'No');
            
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('category', formData.category);
            submitData.append('summary', formData.summary);
            submitData.append('content', formData.content);
            submitData.append('isPublished', formData.isPublished);
            
            if (imageFile) {
                submitData.append('featuredImage', imageFile);
                console.log('📎 Appending image file');
            }

            console.log('🚀 Sending request to server...');
            
            let response;
            
            if (mode === 'create') {
                response = await blogApi.post('/admin/blog/posts', submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 60000
                });
            } else {
                response = await blogApi.put(`/admin/blog/posts/${postId}`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 60000
                });
            }

            console.log('✅ Server response:', response.data);
            
            if (response.data.success) {
                const message = mode === 'create' 
                    ? 'Blog post created successfully!' 
                    : 'Blog post updated successfully!';
                
                setSuccess(message);
                console.log('🎉 Success:', message);
                
                // Redirect after delay
                setTimeout(() => {
                    navigateTo('admin-blog-dashboard');
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to save post');
                console.error('❌ Server error:', response.data);
            }
        } catch (err) {
            console.error('📛 Submission error:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                code: err.code
            });
            
            if (err.response?.status === 404) {
                setError('Server endpoint not found. Check your server URL.');
            } else if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Server is taking too long.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to save post. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Cancel and go back
    const handleCancel = () => {
        navigateTo('admin-blog-dashboard');
    };

    if (loading) {
        return (
            <Container className="py-5">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading post data...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">
                        <FaFileAlt className="me-2 text-primary" />
                        {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
                    </h2>
                    <p className="text-muted mb-0">
                        {mode === 'create' 
                            ? 'Fill in the details to create a new blog post' 
                            : 'Update your existing blog post'}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleCancel}
                        disabled={saving}
                    >
                        <FaTimes className="me-2" /> Cancel
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            
            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    <FaCheck className="me-2" />
                    {success}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col lg={8}>
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body>
                                {/* Title */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Title <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter blog post title"
                                        required
                                        maxLength={200}
                                    />
                                    <Form.Text className="text-muted">
                                        Maximum 200 characters.
                                    </Form.Text>
                                </Form.Group>

                                {/* Category & Status */}
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">
                                                Category <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">Status</Form.Label>
                                            <div className="mt-2">
                                                <Form.Check
                                                    type="switch"
                                                    id="publish-switch"
                                                    label={formData.isPublished ? "Published" : "Draft"}
                                                    name="isPublished"
                                                    checked={formData.isPublished}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Summary */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Summary (Optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        placeholder="Brief summary of your post"
                                        rows={3}
                                        maxLength={500}
                                    />
                                </Form.Group>

                                {/* Content */}
                                <Form.Group className="mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Form.Label className="fw-bold">
                                            Content <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Badge bg="info">
                                            {charCount} characters
                                        </Badge>
                                    </div>
                                    <Form.Control
                                        as="textarea"
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="Write your blog post content here..."
                                        rows={12}
                                        required
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4}>
                        {/* Image Upload */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body>
                                <Card.Title className="mb-3">
                                    <FaImage className="me-2" />
                                    Featured Image (Optional)
                                </Card.Title>
                                
                                <Form.Group>
                                    <Form.Label>Upload Image</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <Form.Text className="text-muted">
                                        JPG, PNG, or GIF. Max 5MB.
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Tips Card */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body>
                                <Card.Title className="mb-3">
                                    Quick Tips
                                </Card.Title>
                                <ul className="list-unstyled mb-0 small">
                                    <li className="mb-2">• Use clear, descriptive titles</li>
                                    <li className="mb-2">• Add images to make posts engaging</li>
                                    <li className="mb-2">• Save as draft to review later</li>
                                    <li className="mb-2">• Publish when ready for readers</li>
                                    <li>• Use categories to organize content</li>
                                </ul>
                            </Card.Body>
                        </Card>

                        {/* Save Button */}
                        <div className="mt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-100 py-3"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        {mode === 'create' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="me-2" />
                                        {mode === 'create' ? 'Create Post' : 'Update Post'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default AdminCreateEditBlog;