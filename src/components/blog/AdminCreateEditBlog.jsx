// travel-tour-frontend/src/components/blog/AdminCreateEditBlog.jsx - FIXED
import React, { useState, useEffect, useRef } from 'react';
import { 
    Container, Form, Button, Alert, Spinner, Card,
    Row, Col, Badge, ProgressBar, Modal
} from 'react-bootstrap';
import SimpleMdeReact from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import api from '../../services/api';
import { 
    FaArrowLeft, FaSpinner, FaSave, FaEye, 
    FaUpload, FaImage, FaGlobe, FaCalendarAlt,
    FaCheckCircle, FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';
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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [charCount, setCharCount] = useState({ title: 0, summary: 0, content: 0 });
    const [formValid, setFormValid] = useState({ title: true, category: true, content: true });
    
    const fileInputRef = useRef(null);
    const formRef = useRef(null);
    const mdeRef = useRef(null); // Add ref for the markdown editor

    const isEditMode = mode === 'edit' && postId;
    const pageTitle = isEditMode ? 'Edit Blog Post' : 'Create New Blog Post';

    // Character count limits
    const CHAR_LIMITS = {
        title: 100,
        summary: 200,
        content: 10000
    };

    // Update character counts - use useEffect to prevent re-renders
    useEffect(() => {
        setCharCount({
            title: title.length,
            summary: summary.length,
            content: content.length
        });
    }, [title, summary, content]);

    // Validate form
    const validateForm = () => {
        const isValid = {
            title: title.trim().length > 0 && title.trim().length <= CHAR_LIMITS.title,
            category: category && BLOG_CATEGORIES.includes(category),
            content: content.trim().length > 0 && content.trim().length <= CHAR_LIMITS.content
        };
        setFormValid(isValid);
        return Object.values(isValid).every(v => v);
    };

    // Fetch Post Data for Edit Mode
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
                        setSummary(post.summary || '');
                        setContent(post.content);
                        setCurrentImageUrl(post.imageUrl || '');
                        setIsPublished(post.isPublished || false);
                    } else {
                        setError('Post not found.');
                    }
                } catch (err) {
                    console.error('Fetch error:', err.response?.data || err.message);
                    setError('Failed to fetch post data from the server. Please check your connection.');
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }
    }, [isEditMode, postId]);

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
        setUploadProgress(0);
        setError(null);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 100);
    };

    // Handle Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setError('Please fill out all required fields correctly.');
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
            // For edit mode, if no new file, send the existing URL
            formData.append('currentImageUrl', currentImageUrl);
        }

        try {
            let response;
            const config = {
                headers: { 
                    'Content-Type': 'multipart/form-data' 
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
                timeout: 30000 // 30 second timeout
            };

            if (isEditMode) {
                response = await api.put(`/admin/blog/posts/${postId}`, formData, config);
            } else {
                response = await api.post('/admin/blog/posts', formData, config);
            }

            if (response.data.success) {
                setStatus(isEditMode ? 'updated' : 'created');
                setUploadProgress(100);
                
                // Show success message then redirect
                setTimeout(() => {
                    navigateTo('admin-blog-dashboard');
                }, 2000);
            } else {
                setError(response.data.message || 'Submission failed.');
                setUploadProgress(0);
            }
        } catch (err) {
            console.error('Submission error:', err);
            if (err.code === 'ECONNABORTED') {
                setError('Request timeout. The server is taking too long to respond.');
            } else if (err.response?.status === 413) {
                setError('File too large. Please upload an image smaller than 5MB.');
            } else {
                setError('A server error occurred during submission. Please try again.');
            }
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

    // Configuration options for SimpleMDE with justified text preview
    const mdeOptions = React.useMemo(() => ({
        spellChecker: false,
        placeholder: "Write your blog content here using Markdown...",
        autofocus: false, // Changed from true to false
        status: ['autosave', 'lines', 'words', 'cursor'],
        autosave: {
            enabled: true,
            uniqueId: isEditMode ? postId : 'new-blog-post',
            delay: 1000,
        },
        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
        },
        previewRender: (plainText) => {
            // Custom preview renderer with justified text
            return `
                <div class="justified-text-preview">
                    ${plainText}
                </div>
            `;
        },
        toolbar: [
            "bold", "italic", "heading", "|", 
            "quote", "unordered-list", "ordered-list", "|", 
            "link", "image", "table", "|", 
            "preview", "side-by-side", "fullscreen", "|", 
            "guide"
        ]
    }), [isEditMode, postId]); // Memoize to prevent re-creation

    // Handler functions - memoized to prevent re-renders
    const handleTitleChange = React.useCallback((e) => {
        setTitle(e.target.value);
    }, []);

    const handleCategoryChange = React.useCallback((e) => {
        setCategory(e.target.value);
    }, []);

    const handleSummaryChange = React.useCallback((e) => {
        setSummary(e.target.value);
    }, []);

    const handlePublishedChange = React.useCallback((e) => {
        setIsPublished(e.target.checked);
    }, []);

    const handleContentChange = React.useCallback((value) => {
        setContent(value);
    }, []);

    // Get character count color
    const getCharCountColor = (count, limit) => {
        const percentage = (count / limit) * 100;
        if (percentage >= 90) return 'text-danger';
        if (percentage >= 75) return 'text-warning';
        return 'text-muted';
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
                    <h2 className="mb-1 fw-bold text-dark">
                        {isEditMode ? (
                            <>
                                <FaImage className="me-2 text-warning" />
                                Edit Blog Post
                            </>
                        ) : (
                            <>
                                <FaImage className="me-2 text-primary" />
                                Create New Blog Post
                            </>
                        )}
                    </h2>
                    <p className="text-muted mb-0">
                        {isEditMode 
                            ? 'Update your blog post content and settings' 
                            : 'Create a new engaging blog post for your readers'}
                    </p>
                </div>
                <Button 
                    variant="outline-secondary" 
                    onClick={() => navigateTo('admin-blog-dashboard')}
                    className="d-flex align-items-center"
                >
                    <FaArrowLeft className="me-2" /> Back to Dashboard
                </Button>
            </div>

            {/* Alerts */}
            {status === 'created' && (
                <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <div>
                        <strong>Success!</strong> Post created and saved successfully!
                    </div>
                </Alert>
            )}
            
            {status === 'updated' && (
                <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" />
                    <div>
                        <strong>Success!</strong> Post updated successfully!
                    </div>
                </Alert>
            )}
            
            {error && (
                <Alert variant="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>{error}</div>
                </Alert>
            )}

            {/* Preview Modal */}
            <Modal 
                show={showPreview} 
                onHide={() => setShowPreview(false)} 
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>
                        <FaEye className="me-2" />
                        Post Preview
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Card className="border-0 shadow-sm">
                        {featuredImage ? (
                            <Card.Img 
                                variant="top" 
                                src={URL.createObjectURL(featuredImage)} 
                                alt="Preview"
                            />
                        ) : currentImageUrl ? (
                            <Card.Img 
                                variant="top" 
                                src={currentImageUrl} 
                                alt="Preview"
                            />
                        ) : null}
                        <Card.Body>
                            <Badge bg="primary" className="mb-2">{category}</Badge>
                            <Card.Title className="h3 mb-3">{title || 'Untitled Post'}</Card.Title>
                            <Card.Text className="text-muted mb-4">
                                {summary || 'No summary provided.'}
                            </Card.Text>
                            <div className="justified-text-content" 
                                 dangerouslySetInnerHTML={{ __html: content }} 
                                 style={{ textAlign: 'justify', lineHeight: '1.6' }}
                            />
                        </Card.Body>
                        <Card.Footer className="text-muted small">
                            <FaCalendarAlt className="me-1" />
                            {new Date().toLocaleDateString()} | Status: {isPublished ? 'Published' : 'Draft'}
                        </Card.Footer>
                    </Card>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button variant="secondary" onClick={() => setShowPreview(false)}>
                        Close Preview
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Main Form */}
            <Row>
                <Col lg={8}>
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <Form onSubmit={handleSubmit} ref={formRef} className="blog-form">
                                {/* Title - Use memoized handler */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Title *
                                        <span className={`float-end ${getCharCountColor(charCount.title, CHAR_LIMITS.title)}`}>
                                            {charCount.title}/{CHAR_LIMITS.title}
                                        </span>
                                    </Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={title} 
                                        onChange={handleTitleChange}
                                        className={!formValid.title ? 'is-invalid' : ''}
                                        placeholder="Enter a compelling title for your blog post"
                                        onFocus={() => {
                                            // Force focus to stay on this input
                                            if (mdeRef.current) {
                                                mdeRef.current.simplemde.codemirror.getInputField().blur();
                                            }
                                        }}
                                    />
                                    {!formValid.title && (
                                        <Form.Text className="text-danger">
                                            Title is required and must be under {CHAR_LIMITS.title} characters
                                        </Form.Text>
                                    )}
                                </Form.Group>
                                
                                {/* Category & Status - Use memoized handlers */}
                                <Row className="mb-4">
                                    <Col md={8}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">Category *</Form.Label>
                                            <Form.Select 
                                                value={category} 
                                                onChange={handleCategoryChange}
                                                className={!formValid.category ? 'is-invalid' : ''}
                                            >
                                                {BLOG_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">Status</Form.Label>
                                            <Form.Check 
                                                type="switch"
                                                id="publish-switch"
                                                label={isPublished ? "Published" : "Draft"}
                                                checked={isPublished}
                                                onChange={handlePublishedChange}
                                                className="mt-2"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Summary - Use memoized handler */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Summary
                                        <span className={`float-end ${getCharCountColor(charCount.summary, CHAR_LIMITS.summary)}`}>
                                            {charCount.summary}/{CHAR_LIMITS.summary}
                                        </span>
                                    </Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3} 
                                        value={summary} 
                                        onChange={handleSummaryChange}
                                        placeholder="Brief summary that appears in blog listings (optional)"
                                    />
                                    <Form.Text className="text-muted">
                                        Keep it concise. This appears on the blog listing cards.
                                    </Form.Text>
                                </Form.Group>

                                {/* Featured Image */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold d-flex justify-content-between">
                                        <span>Featured Image</span>
                                        <small className="text-muted">Optional</small>
                                    </Form.Label>
                                    
                                    {/* Image Upload Area */}
                                    <div 
                                        className="image-upload-area border rounded p-4 text-center mb-3"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ 
                                            cursor: 'pointer',
                                            borderStyle: 'dashed',
                                            backgroundColor: '#f8f9fa'
                                        }}
                                    >
                                        <FaUpload size={32} className="text-muted mb-3" />
                                        <h5 className="text-muted mb-2">
                                            {featuredImage ? 'Change Image' : 'Upload Featured Image'}
                                        </h5>
                                        <p className="text-muted small mb-0">
                                            Click to upload or drag and drop<br />
                                            PNG, JPG, GIF up to 5MB
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="d-none"
                                        />
                                    </div>

                                    {/* Upload Progress */}
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                        <div className="mb-3">
                                            <ProgressBar 
                                                now={uploadProgress} 
                                                label={`${uploadProgress}%`}
                                                animated
                                            />
                                            <small className="text-muted">Uploading image...</small>
                                        </div>
                                    )}

                                    {/* Image Previews */}
                                    <Row className="mt-3">
                                        {featuredImage && (
                                            <Col md={6}>
                                                <Card className="border">
                                                    <Card.Header className="bg-success text-white small">
                                                        <FaImage className="me-1" /> New Image
                                                    </Card.Header>
                                                    <Card.Body className="text-center p-2">
                                                        <img 
                                                            src={URL.createObjectURL(featuredImage)} 
                                                            alt="New Featured Preview" 
                                                            className="img-fluid rounded"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                        <p className="small text-muted mt-2 mb-0">
                                                            {featuredImage.name}
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )}
                                        
                                        {isEditMode && currentImageUrl && !featuredImage && (
                                            <Col md={6}>
                                                <Card className="border">
                                                    <Card.Header className="bg-info text-white small">
                                                        <FaGlobe className="me-1" /> Current Image
                                                    </Card.Header>
                                                    <Card.Body className="text-center p-2">
                                                        <img 
                                                            src={currentImageUrl} 
                                                            alt="Current Featured" 
                                                            className="img-fluid rounded"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                        <p className="small text-muted mt-2 mb-0">
                                                            Currently saved image
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        )}
                                    </Row>
                                </Form.Group>
                                
                                {/* Content Editor - Key fix is here */}
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold d-flex justify-content-between">
                                        <span>Content *</span>
                                        <span className={`${getCharCountColor(charCount.content, CHAR_LIMITS.content)}`}>
                                            {charCount.content}/{CHAR_LIMITS.content}
                                        </span>
                                    </Form.Label>
                                    <div className={!formValid.content ? 'border border-danger rounded' : ''}>
                                        <SimpleMdeReact
                                            key={`mde-${isEditMode ? postId : 'new'}`} // Add key to force fresh instance
                                            value={content}
                                            onChange={handleContentChange}
                                            options={mdeOptions}
                                            getMdeInstance={(instance) => {
                                                mdeRef.current = instance;
                                            }}
                                        />
                                    </div>
                                    {!formValid.content && (
                                        <Form.Text className="text-danger">
                                            Content is required and must be under {CHAR_LIMITS.content} characters
                                        </Form.Text>
                                    )}
                                    <Form.Text className="text-muted">
                                        Write your content using Markdown. Use headings, lists, links, and images to make your post engaging.
                                        <strong className="text-primary d-block mt-1">
                                            <FaInfoCircle className="me-1" />
                                            Your content will be automatically justified for better readability.
                                        </strong>
                                    </Form.Text>
                                </Form.Group>

                                {/* Action Buttons */}
                                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                    <div>
                                        <Button
                                            variant="outline-info"
                                            onClick={() => setShowPreview(true)}
                                            className="me-2"
                                            disabled={!title || !content}
                                        >
                                            <FaEye className="me-2" /> Preview
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => navigateTo('admin-blog-dashboard')}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <Button 
                                        variant="success" 
                                        type="submit" 
                                        disabled={loading}
                                        className="px-4"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="me-2 spin" />
                                                {isEditMode ? 'Updating...' : 'Publishing...'}
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="me-2" />
                                                {isEditMode ? 'Update Post' : 'Save & Publish'}
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
                    <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">
                                <FaInfoCircle className="me-2" />
                                Writing Tips
                            </h5>
                        </Card.Header>
                        <Card.Body>
                            <ul className="list-unstyled mb-0">
                                <li className="mb-3">
                                    <strong className="d-block text-primary">Title Tips</strong>
                                    <small className="text-muted">
                                        Keep titles under {CHAR_LIMITS.title} characters. Make them catchy and descriptive.
                                    </small>
                                </li>
                                <li className="mb-3">
                                    <strong className="d-block text-primary">Content Structure</strong>
                                    <small className="text-muted">
                                        Use headings (##) to organize content. Paragraphs will be automatically justified.
                                    </small>
                                </li>
                                <li className="mb-3">
                                    <strong className="d-block text-primary">Images</strong>
                                    <small className="text-muted">
                                        Add relevant images to make your post more engaging. Optimal size: 800x600px.
                                    </small>
                                </li>
                                <li className="mb-3">
                                    <strong className="d-block text-primary">SEO</strong>
                                    <small className="text-muted">
                                        Include keywords in your title and first paragraph. Write comprehensive content.
                                    </small>
                                </li>
                                <li>
                                    <strong className="d-block text-primary">Justified Text</strong>
                                    <small className="text-muted">
                                        Your content will display with justified alignment for professional appearance.
                                    </small>
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Character Count Card */}
                    <Card className="shadow-sm border-0 mt-3">
                        <Card.Header className="bg-light">
                            <h6 className="mb-0">Character Count</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="mb-2 d-flex justify-content-between">
                                <span>Title</span>
                                <span className={getCharCountColor(charCount.title, CHAR_LIMITS.title)}>
                                    {charCount.title}/{CHAR_LIMITS.title}
                                </span>
                            </div>
                            <ProgressBar 
                                now={(charCount.title / CHAR_LIMITS.title) * 100} 
                                variant={charCount.title > CHAR_LIMITS.title * 0.9 ? "danger" : "primary"}
                                className="mb-3"
                            />
                            
                            <div className="mb-2 d-flex justify-content-between">
                                <span>Summary</span>
                                <span className={getCharCountColor(charCount.summary, CHAR_LIMITS.summary)}>
                                    {charCount.summary}/{CHAR_LIMITS.summary}
                                </span>
                            </div>
                            <ProgressBar 
                                now={(charCount.summary / CHAR_LIMITS.summary) * 100} 
                                variant={charCount.summary > CHAR_LIMITS.summary * 0.9 ? "warning" : "info"}
                                className="mb-3"
                            />
                            
                            <div className="mb-2 d-flex justify-content-between">
                                <span>Content</span>
                                <span className={getCharCountColor(charCount.content, CHAR_LIMITS.content)}>
                                    {charCount.content}/{CHAR_LIMITS.content}
                                </span>
                            </div>
                            <ProgressBar 
                                now={(charCount.content / CHAR_LIMITS.content) * 100} 
                                variant={charCount.content > CHAR_LIMITS.content * 0.9 ? "danger" : "success"}
                            />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default AdminCreateEditBlog;