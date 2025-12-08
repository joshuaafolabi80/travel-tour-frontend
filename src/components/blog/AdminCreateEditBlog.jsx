// travel-tour-frontend/src/components/blog/AdminCreateEditBlog.jsx - FIXED FOR LIVE
import React, { useState, useEffect } from 'react';
import { 
    Container, Form, Button, Alert, Spinner, Card,
    Row, Col
} from 'react-bootstrap';
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import api from '../../services/api';
import { FaArrowLeft, FaSpinner, FaSave } from 'react-icons/fa';
import '../../App.css';

// Define the fixed categories for the dropdown
const BLOG_CATEGORIES = ["Travels", "Tours", "Hotels", "Tourism"];

const AdminCreateEditBlog = ({ navigateTo, mode = 'create', postId = null }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(BLOG_CATEGORIES[0]);
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [featuredImage, setFeaturedImage] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [backendAvailable, setBackendAvailable] = useState(true);

    const isEditMode = mode === 'edit' && postId;
    const pageTitle = isEditMode ? 'Edit Blog Post' : 'Create New Blog Post';

    // Check backend connection on mount
    useEffect(() => {
        checkBackendConnection();
    }, []);

    // Check if backend is running
    const checkBackendConnection = async () => {
        try {
            await api.get('/health', { timeout: 5000 });
            setBackendAvailable(true);
        } catch (err) {
            console.log('Backend not available:', err.message);
            setBackendAvailable(false);
            setError('Warning: Backend server is not responding. You can still prepare your post, but it cannot be saved until the backend is running.');
        }
    };

    // Fetch Post Data for Edit Mode
    useEffect(() => {
        if (isEditMode && backendAvailable) {
            setLoading(true);
            const fetchPost = async () => {
                try {
                    const response = await api.get(`/admin/blog/posts/${postId}`);
                    if (response.data.success && response.data.post) {
                        const post = response.data.post;
                        setTitle(post.title);
                        setCategory(post.category || BLOG_CATEGORIES[0]);
                        setSummary(post.summary || '');
                        setContent(post.content);
                        setCurrentImageUrl(post.imageUrl || '');
                        setIsPublished(post.isPublished || false);
                    } else {
                        setError('Post not found.');
                    }
                } catch (err) {
                    console.error('Fetch error:', err);
                    setError('Could not load post data. Please check your connection.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [isEditMode, postId, backendAvailable]);

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid image file (JPEG, PNG, GIF, WebP).');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB.');
            return;
        }

        setFeaturedImage(file);
        setError(null);
    };

    // Handle Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if backend is available
        if (!backendAvailable) {
            setError('Cannot save: Backend server is not responding. Please check your Render deployment.');
            return;
        }
        
        // Basic validation
        if (!title.trim()) {
            setError('Please enter a title.');
            return;
        }
        
        if (!content.trim()) {
            setError('Please enter content.');
            return;
        }

        setLoading(true);
        setError(null);
        setStatus('');

        // Use FormData for multi-part submission
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('category', category);
        formData.append('summary', summary.trim());
        formData.append('content', content.trim());
        formData.append('isPublished', isPublished);
        
        // Only append the file if a new one was selected
        if (featuredImage) {
            formData.append('featuredImage', featuredImage); 
        } else if (isEditMode && currentImageUrl) {
            formData.append('currentImageUrl', currentImageUrl);
        }

        try {
            let response;
            const config = {
                headers: { 
                    'Content-Type': 'multipart/form-data' 
                },
                timeout: 30000
            };

            if (isEditMode) {
                response = await api.put(`/admin/blog/posts/${postId}`, formData, config);
            } else {
                response = await api.post('/admin/blog/posts', formData, config);
            }

            if (response.data.success) {
                setStatus(isEditMode ? 'updated' : 'created');
                
                // Show success message then redirect
                setTimeout(() => {
                    navigateTo('admin-blog-dashboard');
                }, 1500);
            } else {
                setError(response.data.message || 'Submission failed.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. Your Render backend might be sleeping. Please wait a moment and try again.');
            } else if (err.response?.status === 413) {
                setError('File too large. Please upload an image smaller than 5MB.');
            } else if (err.response?.status === 404) {
                setError('API endpoint not found. Please check your Render backend URL.');
            } else {
                setError('Failed to save post. Please check your connection and try again.');
            }
            
            // Re-check backend connection
            checkBackendConnection();
        } finally {
            setLoading(false);
        }
    };

    // Configuration options for SimpleMDE
    const mdeOptions = {
        spellChecker: false,
        placeholder: "Write your blog content here using Markdown...",
        status: false,
        autosave: {
            enabled: true,
            uniqueId: isEditMode ? postId : 'new-blog-post',
            delay: 1000,
        },
        toolbar: [
            "bold", "italic", "heading", "|", 
            "quote", "unordered-list", "ordered-list", "|", 
            "link", "image", "|", 
            "preview", "guide"
        ]
    };

    if (loading && isEditMode) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading post data...</p>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">{pageTitle}</h2>
                    <p className="text-muted mb-0">
                        {backendAvailable ? 'Create and publish blog posts' : '⚠️ Backend server offline'}
                    </p>
                </div>
                <Button 
                    variant="outline-secondary" 
                    onClick={() => navigateTo('admin-blog-dashboard')}
                >
                    <FaArrowLeft className="me-2" /> Back to Dashboard
                </Button>
            </div>

            {/* Backend Status Alert */}
            {!backendAvailable && (
                <Alert variant="warning" className="mb-4">
                    <strong>⚠️ Backend Server Unavailable</strong>
                    <p className="mb-0 mt-2">
                        Your Render backend is not responding. This could be because:
                    </p>
                    <ul className="mb-0">
                        <li>The server is sleeping (free tier on Render sleeps after inactivity)</li>
                        <li>The server URL is incorrect in your environment variables</li>
                        <li>The server crashed or is restarting</li>
                    </ul>
                    <Button 
                        variant="outline-warning" 
                        size="sm" 
                        className="mt-2"
                        onClick={checkBackendConnection}
                    >
                        Check Connection Again
                    </Button>
                </Alert>
            )}

            {/* Success Alerts */}
            {status === 'created' && (
                <Alert variant="success" className="mb-4">
                    ✅ Post created successfully! Redirecting...
                </Alert>
            )}
            
            {status === 'updated' && (
                <Alert variant="success" className="mb-4">
                    ✅ Post updated successfully! Redirecting...
                </Alert>
            )}
            
            {/* Error Alert */}
            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            {/* Main Form */}
            <Row>
                <Col lg={8}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                {/* Title */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Title *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter blog post title"
                                        required
                                        disabled={!backendAvailable && isEditMode}
                                    />
                                </Form.Group>
                                
                                {/* Category & Status */}
                                <Row className="mb-3">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label>Category *</Form.Label>
                                            <Form.Select 
                                                value={category} 
                                                onChange={(e) => setCategory(e.target.value)}
                                                required
                                                disabled={!backendAvailable && isEditMode}
                                            >
                                                {BLOG_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Status</Form.Label>
                                            <Form.Check 
                                                type="switch"
                                                id="publish-switch"
                                                label={isPublished ? "Published" : "Draft"}
                                                checked={isPublished}
                                                onChange={(e) => setIsPublished(e.target.checked)}
                                                className="mt-2"
                                                disabled={!backendAvailable && isEditMode}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Summary */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Summary (Optional)</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        value={summary} 
                                        onChange={(e) => setSummary(e.target.value)}
                                        placeholder="Brief summary that appears in blog listings"
                                        disabled={!backendAvailable && isEditMode}
                                    />
                                </Form.Group>

                                {/* Featured Image */}
                                <Form.Group className="mb-3">
                                    <Form.Label>Featured Image (Optional)</Form.Label>
                                    <Form.Control 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload}
                                        disabled={!backendAvailable && isEditMode}
                                    />
                                    
                                    {/* Image Previews */}
                                    <div className="mt-2">
                                        {featuredImage && (
                                            <div className="mb-2">
                                                <p className="text-success mb-1">New Image:</p>
                                                <img 
                                                    src={URL.createObjectURL(featuredImage)} 
                                                    alt="Preview" 
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: '150px' }}
                                                />
                                            </div>
                                        )}
                                        
                                        {isEditMode && currentImageUrl && !featuredImage && (
                                            <div>
                                                <p className="text-muted mb-1">Current Image:</p>
                                                <img 
                                                    src={currentImageUrl} 
                                                    alt="Current" 
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: '150px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Form.Group>
                                
                                {/* Content Editor */}
                                <Form.Group className="mb-4">
                                    <Form.Label>Content *</Form.Label>
                                    <SimpleMdeReact
                                        value={content}
                                        onChange={setContent}
                                        options={mdeOptions}
                                    />
                                </Form.Group>

                                {/* Action Buttons */}
                                <div className="d-flex justify-content-between pt-3 border-top">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigateTo('admin-blog-dashboard')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="success" 
                                        type="submit" 
                                        disabled={loading || !backendAvailable}
                                        className="px-4"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="me-2 spin" />
                                                {isEditMode ? 'Updating...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="me-2" />
                                                {isEditMode ? 'Update Post' : backendAvailable ? 'Save & Publish' : 'Server Offline'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    <Card className="shadow-sm border-0 mb-3">
                        <Card.Header className={`${backendAvailable ? 'bg-light' : 'bg-warning'}`}>
                            <h5 className="mb-0">
                                {backendAvailable ? 'Server Status: ✅ Online' : 'Server Status: ⚠️ Offline'}
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            {backendAvailable ? (
                                <div>
                                    <p className="mb-2"><strong>Your setup:</strong></p>
                                    <ul className="list-unstyled">
                                        <li>✅ Frontend: Netlify</li>
                                        <li>✅ Backend: Render</li>
                                        <li>✅ API: Connected</li>
                                    </ul>
                                    <p className="mt-3 mb-0 small text-muted">
                                        Posts will be saved to your Render backend database.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p><strong>Render Backend Issues:</strong></p>
                                    <ul className="small">
                                        <li>Free tier sleeps after inactivity</li>
                                        <li>First request may take 30-60 seconds</li>
                                        <li>Check your Render dashboard</li>
                                        <li>Verify environment variables</li>
                                    </ul>
                                    <Button 
                                        variant="outline-warning" 
                                        size="sm" 
                                        className="w-100 mt-2"
                                        onClick={checkBackendConnection}
                                    >
                                        Retry Connection
                                    </Button>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Quick Tips</h5>
                        </Card.Header>
                        <Card.Body>
                            <ul className="list-unstyled mb-0 small">
                                <li className="mb-2">• Use clear, descriptive titles</li>
                                <li className="mb-2">• Add images to make posts engaging</li>
                                <li className="mb-2">• Use Markdown for formatting</li>
                                <li className="mb-2">• Save as draft to review later</li>
                                <li>• Publish when ready for readers</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminCreateEditBlog;