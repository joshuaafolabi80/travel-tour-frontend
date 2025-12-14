// travel-tour-frontend/src/components/blog/MyBookmarksPage.jsx
import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button, Spinner,
    Alert, Badge, Breadcrumb, ButtonGroup, Modal
} from 'react-bootstrap';
import blogApi from '../../services/blogApi';
import {
    FaArrowLeft, FaBookmark, FaTrash, FaEye,
    FaCalendarAlt, FaUser, FaTimes, FaExclamationTriangle,
    FaBookOpen, FaListAlt, FaRegBookmark
} from 'react-icons/fa';
import '../../App.css';

const MyBookmarksPage = ({ navigate }) => {
    const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Fetch bookmarked posts
    const fetchBookmarkedPosts = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
            
            if (bookmarks.length === 0) {
                setBookmarkedPosts([]);
                setLoading(false);
                return;
            }

            const posts = [];
            const failedPosts = [];
            
            // Fetch each bookmarked post
            for (const postId of bookmarks) {
                try {
                    const response = await blogApi.get(`/user/blog/posts/${postId}`);
                    if (response.data.success && response.data.post) {
                        posts.push(response.data.post);
                    } else {
                        failedPosts.push(postId);
                    }
                } catch (err) {
                    console.error(`Error fetching post ${postId}:`, err);
                    failedPosts.push(postId);
                }
            }

            // Remove posts that no longer exist
            if (failedPosts.length > 0) {
                const updatedBookmarks = bookmarks.filter(id => !failedPosts.includes(id));
                localStorage.setItem('blogBookmarks', JSON.stringify(updatedBookmarks));
            }

            setBookmarkedPosts(posts);
            
        } catch (err) {
            console.error('Error fetching bookmarked posts:', err);
            setError('Failed to load bookmarked posts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarkedPosts();
    }, []);

    // Handle back to blog
    const handleBackClick = () => {
        navigate('blog-list-page');
    };

    // Handle view post
    const handleViewPost = (postId) => {
        navigate('blog-detail', { postId });
    };

    // Handle remove bookmark
    const handleRemoveBookmark = (postId, e) => {
        if (e) e.stopPropagation();
        setPostToDelete(postId);
        setShowDeleteModal(true);
    };

    // Confirm remove bookmark
    const confirmRemoveBookmark = async () => {
        if (!postToDelete) return;

        setDeleting(true);
        try {
            const bookmarks = JSON.parse(localStorage.getItem('blogBookmarks') || '[]');
            const updatedBookmarks = bookmarks.filter(id => id !== postToDelete);
            localStorage.setItem('blogBookmarks', JSON.stringify(updatedBookmarks));
            
            setBookmarkedPosts(prev => prev.filter(post => post._id !== postToDelete));
            setShowDeleteModal(false);
            setPostToDelete(null);
        } catch (err) {
            console.error('Error removing bookmark:', err);
            setError('Failed to remove bookmark. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    // Handle remove all bookmarks
    const handleRemoveAll = () => {
        if (window.confirm('Are you sure you want to remove all bookmarks? This action cannot be undone.')) {
            localStorage.removeItem('blogBookmarks');
            setBookmarkedPosts([]);
        }
    };

    // Get post to delete title
    const getPostTitle = () => {
        if (!postToDelete) return '';
        const post = bookmarkedPosts.find(p => p._id === postToDelete);
        return post ? post.title : 'this post';
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-3 text-muted" style={{textAlign: 'center'}}>Loading your bookmarks...</p>
                <Button variant="secondary" onClick={handleBackClick} className="mt-3">
                    <FaArrowLeft className="me-2" /> Back to Blog
                </Button>
            </Container>
        );
    }

    return (
        <Container fluid="lg" className="py-4">
            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onHide={() => !deleting && setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton={!deleting} className="border-0 pb-0">
                    <Modal.Title className="text-danger" style={{textAlign: 'center'}}>
                        <FaExclamationTriangle className="me-2" />
                        Remove Bookmark
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-4" style={{textAlign: 'justify'}}>
                        <strong>Are you sure you want to remove "{getPostTitle()}" from your bookmarks?</strong>
                    </p>
                    <p className="text-muted small" style={{textAlign: 'justify'}}>
                        This post will be removed from your bookmarks list, but you can bookmark it again anytime.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmRemoveBookmark}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Removing...
                            </>
                        ) : (
                            <>
                                <FaTrash className="me-2" />
                                Remove Bookmark
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
                <Breadcrumb.Item onClick={handleBackClick} style={{ cursor: 'pointer' }}>
                    Blog
                </Breadcrumb.Item>
                <Breadcrumb.Item active>My Bookmarks</Breadcrumb.Item>
            </Breadcrumb>

            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                        <div>
                            <h1 className="display-6 fw-bold mb-2" style={{textAlign: 'center'}}>
                                <FaBookmark className="me-2 text-warning" />
                                My Bookmarked Posts
                            </h1>
                            <p className="text-muted mb-0" style={{textAlign: 'center'}}>
                                All your saved blog posts in one place
                            </p>
                        </div>
                        <div className="mt-3 mt-md-0">
                            <ButtonGroup>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleBackClick}
                                    className="me-2"
                                >
                                    <FaArrowLeft className="me-2" /> Back to Blog
                                </Button>
                                {bookmarkedPosts.length > 0 && (
                                    <Button
                                        variant="outline-danger"
                                        onClick={handleRemoveAll}
                                    >
                                        <FaTimes className="me-2" /> Clear All
                                    </Button>
                                )}
                            </ButtonGroup>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Stats Card */}
            <Row className="mb-4">
                <Col>
                    <Card className="border-0 shadow-sm bg-warning bg-opacity-10">
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col md={8}>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-warning text-white rounded-circle p-3 me-3">
                                            <FaBookOpen size={24} />
                                        </div>
                                        <div>
                                            <h5 className="mb-1" style={{textAlign: 'left'}}>
                                                <strong>Your Reading List</strong>
                                            </h5>
                                            <p className="text-muted mb-0" style={{textAlign: 'justify'}}>
                                                <strong>{bookmarkedPosts.length} saved posts</strong> that you can read anytime. Bookmarks are stored in your browser's local storage.
                                            </p>
                                        </div>
                                    </div>
                                </Col>
                                <Col md={4} className="text-md-end mt-3 mt-md-0">
                                    <Badge bg="warning" className="px-3 py-2 fs-6">
                                        <FaBookmark className="me-1" />
                                        {bookmarkedPosts.length} Posts
                                    </Badge>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
                    <div style={{textAlign: 'justify'}}>
                        <strong>Error:</strong> {error}
                    </div>
                </Alert>
            )}

            {/* Bookmarked Posts */}
            {bookmarkedPosts.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <div className="empty-state-icon mb-4">
                            <FaRegBookmark size={64} className="text-muted" />
                        </div>
                        <h4 className="text-muted mb-3" style={{textAlign: 'center'}}>
                            <strong>No Bookmarked Posts</strong>
                        </h4>
                        <p className="text-muted mb-4" style={{textAlign: 'justify'}}>
                            <strong>You haven't saved any blog posts yet.</strong> When you're reading a post you like, click the "Bookmark" button to save it here for later reading.
                        </p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <Button
                                variant="primary"
                                onClick={handleBackClick}
                            >
                                <FaArrowLeft className="me-2" /> Browse Blog
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={() => navigate('blog-list-page')}
                            >
                                <FaListAlt className="me-2" /> View All Posts
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <Row className="g-4">
                        {bookmarkedPosts.map((post) => (
                            <Col xs={12} md={6} lg={4} key={post._id} className="mb-4">
                                <Card 
                                    className="h-100 shadow-sm border-0 bookmark-card"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleViewPost(post._id)}
                                >
                                    {post.imageUrl && (
                                        <div className="position-relative">
                                            <Card.Img
                                                variant="top"
                                                src={post.imageUrl || '/images/default_blog_img.jpg'}
                                                alt={post.title}
                                                className="bookmark-card-img"
                                                style={{ height: '200px', objectFit: 'cover' }}
                                            />
                                            <Badge
                                                bg="primary"
                                                className="position-absolute"
                                                style={{ top: '10px', left: '10px' }}
                                            >
                                                {post.category}
                                            </Badge>
                                            <div className="position-absolute" style={{ top: '10px', right: '10px' }}>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={(e) => handleRemoveBookmark(post._id, e)}
                                                    title="Remove bookmark"
                                                >
                                                    <FaTimes />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="h5 mb-3" style={{textAlign: 'left'}}>
                                            <strong>{post.title}</strong>
                                        </Card.Title>
                                        <Card.Text className="text-muted flex-grow-1" style={{textAlign: 'justify'}}>
                                            {post.summary || post.content.substring(0, 100) + '...'}
                                        </Card.Text>
                                        
                                        <div className="mt-auto">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <small className="text-muted" style={{textAlign: 'left'}}>
                                                    <FaCalendarAlt className="me-1" />
                                                    {formatDate(post.updatedAt)}
                                                </small>
                                                <Badge bg="light" text="dark" className="px-2">
                                                    <FaBookmark className="me-1 text-warning" />
                                                    Bookmarked
                                                </Badge>
                                            </div>
                                            
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="flex-grow-1"
                                                    onClick={() => handleViewPost(post._id)}
                                                >
                                                    <FaEye className="me-2" /> Read Post
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={(e) => handleRemoveBookmark(post._id, e)}
                                                    title="Remove bookmark"
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    {/* Summary */}
                    <Card className="mt-4 border-0 shadow-sm">
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <div style={{textAlign: 'left'}}>
                                        <h6 className="mb-0">
                                            <strong>Bookmark Summary</strong>
                                        </h6>
                                        <p className="text-muted small mb-0">
                                            {bookmarkedPosts.length} posts saved • Stored locally in your browser
                                        </p>
                                    </div>
                                </Col>
                                <Col md={6} className="text-md-end mt-2 mt-md-0">
                                    <ButtonGroup>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={handleBackClick}
                                        >
                                            <FaArrowLeft className="me-2" /> Back to Blog
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={handleRemoveAll}
                                        >
                                            <FaTimes className="me-2" /> Clear All
                                        </Button>
                                    </ButtonGroup>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </>
            )}

            {/* Info Alert */}
            <Alert variant="info" className="mt-4">
                <div style={{textAlign: 'justify'}}>
                    <h6 className="alert-heading" style={{textAlign: 'center'}}>
                        <FaBookmark className="me-2" />
                        <strong>About Bookmarks</strong>
                    </h6>
                    <p className="mb-0">
                        <strong>Bookmarks are stored locally in your browser.</strong> This means:
                    </p>
                    <ul className="mb-0 mt-2">
                        <li style={{textAlign: 'left'}}>They only work on this device and browser</li>
                        <li style={{textAlign: 'left'}}>Clearing browser data will remove all bookmarks</li>
                        <li style={{textAlign: 'left'}}>You can bookmark posts for offline reading (if available)</li>
                    </ul>
                </div>
            </Alert>
        </Container>
    );
};

export default MyBookmarksPage;