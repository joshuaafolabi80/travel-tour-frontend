// travel-tour-frontend/src/components/blog/UserBlogPage.jsx
import React, { useState, useEffect } from 'react';
import { 
    Container, Row, Col, Card, Form, Button, Pagination, 
    Badge, Spinner, Alert, Dropdown, DropdownButton 
} from 'react-bootstrap';
import blogApi from '../../services/blogApi';
import { FaBookmark } from 'react-icons/fa';
import '../../App.css'; 

const UserBlogPage = ({ navigateTo }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState(['Travels', 'Tours', 'Hotels', 'Tourism']);
    
    const postsPerPage = 9;

    // --- Hero Slider Images for Blog Page ---
    const blogHeroImages = [
        "/images/travelling_and_tour_1.jpg",
        "/images/travelling_and_tour_2.jpg",
        "/images/travelling_and_tour_3.jpg",
        "/images/travelling_and_tour_4.jpg",
        "/images/travelling_and_tour_5.jpg"
    ];

    const blogHeroTexts = [
        "Discover Amazing Travel Stories & Tips",
        "Expert Advice from Industry Professionals", 
        "Explore Hidden Gems Around the World",
        "Learn Tourism Business Strategies",
        "Join Our Community of Travel Enthusiasts"
    ];

    // --- Simple Hero Slider Component for Blog Page ---
    const BlogHeroSlider = () => {
        const [currentIndex, setCurrentIndex] = useState(0);

        useEffect(() => {
            const timer = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % blogHeroImages.length);
            }, 4000);
            return () => clearInterval(timer);
        }, [blogHeroImages.length]);

        return (
            <div className="blog-hero-slider mb-5">
                <div className="blog-carousel-wrapper">
                    <div 
                        className="blog-carousel-image"
                        style={{ backgroundImage: `url(${blogHeroImages[currentIndex]})` }}
                    >
                        <div className="blog-carousel-overlay">
                            <h2 className="blog-carousel-title">The Conclave Academy Blog</h2>
                            <p className="blog-carousel-text">{blogHeroTexts[currentIndex]}</p>
                            <Button 
                                variant="primary" 
                                size="lg"
                                onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
                            >
                                Explore Articles <i className="fas fa-arrow-down ms-2"></i>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="blog-slider-indicators">
                    {blogHeroImages.map((_, index) => (
                        <span
                            key={index}
                            className={`blog-slider-indicator ${currentIndex === index ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        ></span>
                    ))}
                </div>
            </div>
        );
    };

    // --- Fetch Posts (Published only) ---
    const fetchPosts = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                limit: postsPerPage,
                search: searchTerm,
                category: selectedCategory || undefined,
            };
            
            const response = await blogApi.get('/user/blog/posts', { params });
            
            if (response.data.success) {
                setPosts(response.data.posts || []);
                setTotalPosts(response.data.count || 0);
                setTotalPages(response.data.pagination?.pages || 1);
            } else {
                setError('Failed to fetch blog posts');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not connect to the server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Effect for fetching posts based on filters/page change
    useEffect(() => {
        fetchPosts(1);
    }, [searchTerm, selectedCategory]);

    useEffect(() => {
        fetchPosts(currentPage);
    }, [currentPage]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPosts(1);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedCategory('');
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const renderPostCard = (post) => (
        <Col xs={12} sm={6} lg={4} key={post._id} className="mb-4">
            <Card className="blog-card h-100 shadow-sm border-0">
                <div className="blog-card-img-container">
                    <Card.Img 
                        variant="top" 
                        src={post.imageUrl || '/images/default_blog_img.jpg'} 
                        alt={post.title}
                        className="blog-card-img"
                    />
                    <div className="blog-card-badge">
                        <Badge bg="primary">{post.category}</Badge>
                    </div>
                </div>
                <Card.Body className="d-flex flex-column">
                    <Card.Title className="h5 mb-3">{post.title}</Card.Title>
                    <Card.Text className="text-muted flex-grow-1">
                        {post.summary || post.content.substring(0, 120) + '...'}
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                            <i className="far fa-calendar me-1"></i>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </small>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigateTo('blog-detail', { postId: post._id })}
                        >
                            Read More <i className="fas fa-arrow-right ms-1"></i>
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const items = [];
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Previous button
        items.push(
            <Pagination.Item 
                key="prev" 
                disabled={currentPage === 1}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
            >
                <i className="fas fa-chevron-left"></i>
            </Pagination.Item>
        );

        // First page
        if (startPage > 1) {
            items.push(
                <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
                    1
                </Pagination.Item>
            );
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <Pagination.Item 
                    key={i} 
                    active={i === currentPage}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
            }
            items.push(
                <Pagination.Item 
                    key={totalPages} 
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Next button
        items.push(
            <Pagination.Item 
                key="next" 
                disabled={currentPage === totalPages}
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
            >
                <i className="fas fa-chevron-right"></i>
            </Pagination.Item>
        );

        return <Pagination className="justify-content-center mt-4">{items}</Pagination>;
    };

    return (
        <Container fluid className="py-0 blog-page-container">
            {/* --- Hero Slider Section --- */}
            <BlogHeroSlider />
            
            {/* --- Main Content --- */}
            <Container className="py-4">
                <Row className="mb-4">
                    <Col lg={8}>
                        <h1 className="display-6 fw-bold mb-3">📚 Travel, Tourism, Hotel and Tour Blog</h1>
                        <p className="text-muted mb-0">
                            Explore insightful articles, travel tips, and industry news from The Conclave Academy experts.
                        </p>
                    </Col>
                    <Col lg={4} className="text-lg-end">
                        <Badge bg="light" text="dark" className="p-2 me-2">
                            <i className="fas fa-newspaper me-1"></i> {totalPosts} Articles
                        </Badge>
                        {(searchTerm || selectedCategory) && (
                            <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={handleClearFilters}
                            >
                                <i className="fas fa-times me-1"></i> Clear Filters
                            </Button>
                        )}
                    </Col>
                </Row>

                {/* --- Search and Filter Section --- */}
                <Card className="mb-4 shadow-sm border-0">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form onSubmit={handleSearchSubmit}>
                                    <Form.Group>
                                        <div className="input-group">
                                            <Form.Control
                                                type="text"
                                                placeholder="Search articles by title or content..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="border-end-0"
                                            />
                                            <Button 
                                                variant="outline-primary" 
                                                type="submit"
                                                className="border-start-0"
                                            >
                                                <i className="fas fa-search"></i>
                                            </Button>
                                        </div>
                                    </Form.Group>
                                </Form>
                            </Col>
                            <Col md={6}>
                                <div className="d-flex align-items-center h-100">
                                    <div className="me-3 text-nowrap">
                                        <strong>Filter by:</strong>
                                    </div>
                                    <div className="flex-grow-1">
                                        <DropdownButton
                                            title={selectedCategory || "All Categories"}
                                            variant="outline-secondary"
                                            className="w-100"
                                        >
                                            <Dropdown.Item 
                                                onClick={() => handleCategorySelect('')}
                                                active={!selectedCategory}
                                            >
                                                All Categories
                                            </Dropdown.Item>
                                            <Dropdown.Divider />
                                            {categories.map(cat => (
                                                <Dropdown.Item 
                                                    key={cat}
                                                    onClick={() => handleCategorySelect(cat)}
                                                    active={selectedCategory === cat}
                                                >
                                                    <i className="fas fa-tag me-2 text-muted"></i> {cat}
                                                </Dropdown.Item>
                                            ))}
                                        </DropdownButton>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                        
                        {/* Active filters display */}
                        {(searchTerm || selectedCategory) && (
                            <div className="mt-3">
                                <small className="text-muted me-2">Active filters:</small>
                                {searchTerm && (
                                    <Badge bg="info" className="me-2">
                                        Search: "{searchTerm}" <i 
                                            className="fas fa-times ms-1 cursor-pointer"
                                            onClick={() => setSearchTerm('')}
                                        ></i>
                                    </Badge>
                                )}
                                {selectedCategory && (
                                    <Badge bg="success">
                                        Category: {selectedCategory} <i 
                                            className="fas fa-times ms-1 cursor-pointer"
                                            onClick={() => setSelectedCategory('')}
                                        ></i>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* --- Error Alert --- */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* --- Loading State --- */}
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3">Loading articles...</p>
                    </div>
                ) : posts.length === 0 ? (
                    <Alert variant="info" className="text-center">
                        <i className="fas fa-info-circle me-2"></i>
                        {searchTerm || selectedCategory 
                            ? 'No articles match your search criteria.' 
                            : 'No published articles yet. Check back soon!'}
                    </Alert>
                ) : (
                    <>
                        {/* --- Posts Grid --- */}
                        <Row className="g-4">
                            {posts.map(renderPostCard)}
                        </Row>

                        {/* --- Pagination --- */}
                        {renderPagination()}

                        {/* --- Results Summary --- */}
                        <div className="text-center mt-4 text-muted">
                            <small>
                                Showing {(currentPage - 1) * postsPerPage + 1} to{' '}
                                {Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts} articles
                            </small>
                        </div>
                    </>
                )}

                {/* --- Call to Action --- */}
                {!loading && posts.length > 0 && (
                    <Card className="mt-5 border-0 bg-light">
                        <Card.Body className="text-center py-4">
                            <h4 className="mb-3" style={{textAlign: 'center'}}><strong>Want to contribute?</strong></h4>
                            <p className="text-muted mb-4" style={{textAlign: 'justify'}}>
                                <strong>Share your travel experiences and tourism insights</strong> with our community. Whether you're a professional or an enthusiast, your perspective is valuable.
                            </p>
                            <div className="d-flex justify-content-center gap-3 flex-wrap">
                                <Button 
                                    variant="outline-primary" 
                                    size="lg"
                                    onClick={() => navigateTo('write-for-us')}
                                    className="d-flex align-items-center"
                                >
                                    <i className="fas fa-pen-fancy me-2"></i> Write for Us
                                </Button>
                                <Button 
                                    variant="outline-success" 
                                    size="lg"
                                    onClick={() => navigateTo('user-submissions')}
                                    className="d-flex align-items-center"
                                >
                                    <i className="fas fa-envelope me-2"></i> My Submissions
                                </Button>
                                {/* ADD THIS NEW BUTTON */}
                                <Button 
                                    variant="outline-warning" 
                                    size="lg"
                                    onClick={() => navigateTo('my-bookmarks')}
                                    className="d-flex align-items-center"
                                >
                                    <FaBookmark className="me-2" /> My Bookmarks
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                )}
            </Container>
        </Container>
    );
};

export default UserBlogPage;