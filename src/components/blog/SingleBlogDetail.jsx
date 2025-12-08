// travel-tour-frontend/src/components/blog/SingleBlogDetail.jsx - ENHANCED
import React, { useState, useEffect } from 'react';
import { 
    Container, Button, Spinner, Alert, Card, 
    Row, Col, Badge, Breadcrumb, ButtonGroup, Form
} from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import blogApi from '../../services/blogApi';
import { 
    FaArrowLeft, FaCalendarAlt, FaUser, FaEye, 
    FaShareAlt, FaBookmark, FaPrint, FaFacebook, 
    FaTwitter, FaLinkedin, FaWhatsapp, FaCopy
} from 'react-icons/fa';
import '../../App.css';

const SingleBlogDetail = ({ navigate, postId }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [views, setViews] = useState(0);

    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to get reading time
    const getReadingTime = (content) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);
        return readingTime;
    };

    useEffect(() => {
        if (!postId) {
            setError("Error: Post ID not provided.");
            setLoading(false);
            return;
        }

        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await blogApi.get(`/user/blog/posts/${postId}`);
                if (response.data.success && response.data.post) {
                    const fetchedPost = response.data.post;
                    setPost(fetchedPost);
                    setViews(prev => prev + 1);
                    
                    // Fetch related posts
                    fetchRelatedPosts(fetchedPost.category);
                    
                    // Check if bookmarked
                    const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
                    setIsBookmarked(bookmarks.includes(postId));
                } else {
                    setError('Blog post not found or not yet published.');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                if (err.response?.status === 404) {
                    setError('This blog post could not be found.');
                } else if (!navigator.onLine) {
                    setError('No internet connection. Please check your network.');
                } else {
                    setError('Failed to fetch blog post content.');
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchRelatedPosts = async (category) => {
            try {
                const response = await blogApi.get('/user/blog/posts', {
                    params: {
                        category,
                        limit: 3,
                        isPublished: true
                    }
                });
                if (response.data.success) {
                    // Filter out current post
                    const related = response.data.posts
                        .filter(p => p._id !== postId)
                        .slice(0, 3);
                    setRelatedPosts(related);
                }
            } catch (err) {
                console.error('Error fetching related posts:', err);
            }
        };

        fetchPost();
    }, [postId]);

    const handleBackClick = () => {
        navigate('blog-list-page');
    };

    const handleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
        
        if (isBookmarked) {
            const newBookmarks = bookmarks.filter(id => id !== postId);
            localStorage.setItem('blogBookmarks', JSON.stringify(newBookmarks));
            setIsBookmarked(false);
        } else {
            bookmarks.push(postId);
            localStorage.setItem('blogBookmarks', JSON.stringify(bookmarks));
            setIsBookmarked(true);
        }
    };

    const handleShare = (platform) => {
        const url = window.location.href;
        const title = post?.title || 'Check out this blog post!';
        
        let shareUrl = '';
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
                return;
        }
        
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    const handlePrint = () => {
        window.print();
    };

    // Custom renderers for ReactMarkdown with justified text
    const components = {
        p: ({node, ...props}) => (
            <p {...props} className="text-justify" style={{ 
                textAlign: 'justify', 
                lineHeight: '1.6',
                marginBottom: '1rem'
            }} />
        ),
        h1: ({node, ...props}) => <h1 {...props} className="h2 mt-4 mb-3" />,
        h2: ({node, ...props}) => <h2 {...props} className="h3 mt-4 mb-3" />,
        h3: ({node, ...props}) => <h3 {...props} className="h4 mt-4 mb-2" />,
        code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
        blockquote: ({node, ...props}) => (
            <blockquote {...props} className="border-start border-3 ps-3 py-2 my-3" style={{
                backgroundColor: '#f8f9fa',
                borderLeftColor: '#0d6efd !important'
            }} />
        ),
        img: ({node, ...props}) => (
            <img {...props} className="img-fluid rounded my-3" style={{ maxWidth: '100%' }} />
        )
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-3 text-muted">Loading blog post...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger" className="d-flex align-items-center">
                    <FaEye className="me-3" size={24} />
                    <div>
                        <h5 className="alert-heading">Post Not Found</h5>
                        <p className="mb-0">{error}</p>
                    </div>
                </Alert>
                <Button variant="secondary" onClick={handleBackClick} className="mt-3">
                    <FaArrowLeft className="me-2" /> Back to Blog
                </Button>
            </Container>
        );
    }

    if (!post) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="info">
                    No post data to display.
                </Alert>
                <Button variant="secondary" onClick={handleBackClick}>
                    <FaArrowLeft className="me-2" /> Back to Blog
                </Button>
            </Container>
        );
    }

    const readingTime = getReadingTime(post.content);

    return (
        <Container fluid="lg" className="py-4 blog-detail-container">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item onClick={handleBackClick} style={{ cursor: 'pointer' }}>
                    Blog
                </Breadcrumb.Item>
                <Breadcrumb.Item active>{post.category}</Breadcrumb.Item>
                <Breadcrumb.Item active>{post.title}</Breadcrumb.Item>
            </Breadcrumb>

            <Row>
                {/* Main Content */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        {post.imageUrl && (
                            <div className="position-relative">
                                <img 
                                    src={post.imageUrl} 
                                    alt={post.title} 
                                    className="card-img-top detail-hero-image"
                                    style={{ 
                                        height: '400px', 
                                        objectFit: 'cover',
                                        width: '100%'
                                    }}
                                />
                                <Badge 
                                    bg="primary" 
                                    className="position-absolute"
                                    style={{ top: '20px', left: '20px' }}
                                >
                                    {post.category}
                                </Badge>
                            </div>
                        )}
                        
                        <Card.Body className="p-4 p-lg-5">
                            {/* Header */}
                            <header className="mb-5">
                                <h1 className="display-5 fw-bold mb-3">{post.title}</h1>
                                
                                <div className="d-flex flex-wrap align-items-center text-muted mb-4">
                                    <span className="me-3 d-flex align-items-center">
                                        <FaUser className="me-1" size={14} />
                                        By Admin
                                    </span>
                                    <span className="me-3 d-flex align-items-center">
                                        <FaCalendarAlt className="me-1" size={14} />
                                        {formatDate(post.updatedAt)}
                                    </span>
                                    <span className="me-3 d-flex align-items-center">
                                        <FaEye className="me-1" size={14} />
                                        {views} views
                                    </span>
                                    <span className="me-3">
                                        ⏱️ {readingTime} min read
                                    </span>
                                </div>
                                
                                {post.summary && (
                                    <div className="lead p-3 bg-light rounded mb-4">
                                        <strong>Summary:</strong> {post.summary}
                                    </div>
                                )}
                            </header>

                            {/* Content with justified text */}
                            <article className="blog-content">
                                <div className="justified-text-container">
                                    <ReactMarkdown components={components}>
                                        {post.content}
                                    </ReactMarkdown>
                                </div>
                            </article>

                            {/* Tags */}
                            <div className="mt-5 pt-4 border-top">
                                <div className="d-flex align-items-center">
                                    <strong className="me-3">Tags:</strong>
                                    <div>
                                        <Badge bg="secondary" className="me-2 p-2">#travel</Badge>
                                        <Badge bg="secondary" className="me-2 p-2">#tourism</Badge>
                                        <Badge bg="secondary" className="me-2 p-2">#{post.category.toLowerCase()}</Badge>
                                        <Badge bg="secondary" className="p-2">#blog</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Share and Action Buttons */}
                            <div className="mt-4 pt-3 border-top">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <ButtonGroup className="me-3">
                                            <Button 
                                                variant={isBookmarked ? "warning" : "outline-secondary"}
                                                onClick={handleBookmark}
                                            >
                                                <FaBookmark className="me-2" />
                                                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                                            </Button>
                                            <Button 
                                                variant="outline-secondary"
                                                onClick={handlePrint}
                                            >
                                                <FaPrint className="me-2" />
                                                Print
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                                    
                                    <div className="d-flex align-items-center">
                                        <span className="me-3 text-muted">Share:</span>
                                        <ButtonGroup>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                onClick={() => handleShare('facebook')}
                                                title="Share on Facebook"
                                            >
                                                <FaFacebook />
                                            </Button>
                                            <Button 
                                                variant="outline-info" 
                                                size="sm"
                                                onClick={() => handleShare('twitter')}
                                                title="Share on Twitter"
                                            >
                                                <FaTwitter />
                                            </Button>
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm"
                                                onClick={() => handleShare('linkedin')}
                                                title="Share on LinkedIn"
                                            >
                                                <FaLinkedin />
                                            </Button>
                                            <Button 
                                                variant="outline-success" 
                                                size="sm"
                                                onClick={() => handleShare('whatsapp')}
                                                title="Share on WhatsApp"
                                            >
                                                <FaWhatsapp />
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                size="sm"
                                                onClick={() => handleShare('copy')}
                                                title="Copy link"
                                            >
                                                <FaCopy />
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Navigation */}
                    <div className="d-flex justify-content-between mt-4">
                        <Button 
                            variant="outline-primary" 
                            onClick={handleBackClick}
                            className="d-flex align-items-center"
                        >
                            <FaArrowLeft className="me-2" /> Back to Blog
                        </Button>
                        
                        {relatedPosts.length > 0 && (
                            <Button 
                                variant="primary"
                                onClick={() => navigate('blog-detail', { postId: relatedPosts[0]._id })}
                            >
                                Next Post <FaArrowLeft className="ms-2 rotate-180" />
                            </Button>
                        )}
                    </div>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    {/* Author Card */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="text-center">
                            <div className="mb-3">
                                <div className="author-avatar mx-auto mb-3">
                                    <FaUser size={48} className="text-primary" />
                                </div>
                                <h5 className="mb-1">The Conclave Academy</h5>
                                <p className="text-muted small mb-3">Travel & Tourism Experts</p>
                                <p className="text-muted small">
                                    Providing expert insights and guides for travel enthusiasts and professionals.
                                </p>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">Related Posts</h5>
                            </Card.Header>
                            <Card.Body>
                                {relatedPosts.map(relatedPost => (
                                    <div 
                                        key={relatedPost._id} 
                                        className="mb-3 pb-3 border-bottom"
                                        onClick={() => navigate('blog-detail', { postId: relatedPost._id })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex">
                                            {relatedPost.imageUrl && (
                                                <img 
                                                    src={relatedPost.imageUrl} 
                                                    alt={relatedPost.title}
                                                    className="rounded me-3"
                                                    style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                                                />
                                            )}
                                            <div>
                                                <h6 className="mb-1">{relatedPost.title}</h6>
                                                <small className="text-muted">
                                                    {new Date(relatedPost.updatedAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Reading Stats */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-light">
                            <h5 className="mb-0">Reading Statistics</h5>
                        </Card.Header>
                        <Card.Body>
                            <ul className="list-unstyled mb-0">
                                <li className="mb-2 d-flex justify-content-between">
                                    <span className="text-muted">Reading Time:</span>
                                    <span className="fw-bold">{readingTime} minutes</span>
                                </li>
                                <li className="mb-2 d-flex justify-content-between">
                                    <span className="text-muted">Word Count:</span>
                                    <span className="fw-bold">{post.content.split(/\s+/).length} words</span>
                                </li>
                                <li className="mb-2 d-flex justify-content-between">
                                    <span className="text-muted">Last Updated:</span>
                                    <span className="fw-bold">{formatDate(post.updatedAt)}</span>
                                </li>
                                <li className="d-flex justify-content-between">
                                    <span className="text-muted">Category:</span>
                                    <Badge bg="primary">{post.category}</Badge>
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>

                    {/* Newsletter Signup */}
                    <Card className="shadow-sm border-0">
                        <Card.Body className="text-center bg-primary text-white rounded">
                            <h5 className="mb-3">Stay Updated</h5>
                            <p className="small mb-3">
                                Subscribe to our newsletter for the latest travel tips and blog posts.
                            </p>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Control 
                                        type="email" 
                                        placeholder="Your email address"
                                        size="sm"
                                    />
                                </Form.Group>
                                <Button variant="light" size="sm" className="w-100">
                                    Subscribe
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SingleBlogDetail;