// travel-tour-frontend/src/components/blog/UserBlogPage.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Pagination, Badge, Spinner, Alert } from 'react-bootstrap';
import blogApi from '../../services/blogApi';
import { HeroSlider } from '../../App';
import '../../App.css'; 

const UserBlogPage = ({ navigateTo }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [heroPost, setHeroPost] = useState(null);
    
    const postsPerPage = 4;

    // --- Fetch Posts (Published only) ---
    const fetchPosts = async (page = 1) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                limit: postsPerPage,
                search: searchTerm,
                category: selectedCategory,
                isPublished: true // Only fetch published posts for users
            };
            const response = await blogApi.get('/user/blog/posts', { params });
            
            if (response.data.success) {
                const fetchedPosts = response.data.posts;
                
                // Separate hero post (if applicable)
                if (page === 1 && fetchedPosts.length > 0) {
                    setHeroPost(fetchedPosts[0]);
                    setPosts(fetchedPosts.slice(1));
                } else {
                    setHeroPost(null);
                    setPosts(fetchedPosts);
                }

                setCurrentPage(response.data.currentPage);
                setTotalPages(response.data.totalPages);
            } else {
                setError('Failed to fetch blog posts: ' + (response.data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not connect to the server or retrieve data.');
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch Categories ---
    const fetchCategories = async () => {
        try {
            const response = await blogApi.get('/user/blog/categories');
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (err) {
            console.error('Category fetch error:', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Effect for fetching posts based on filters/page change
    useEffect(() => {
        fetchPosts(1); // Reset to page 1 on filter/search change
    }, [searchTerm, selectedCategory]);

    useEffect(() => {
        // Only fetch if page changes and not due to filter reset
        if (currentPage !== 1) {
             fetchPosts(currentPage);
        }
    }, [currentPage]);


    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchPosts(1);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category === selectedCategory ? '' : category); // Toggle category filter
        setSearchTerm(''); // Clear search when category is selected
        setCurrentPage(1);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const paginationItems = [];
    for (let number = 1; number <= totalPages; number++) {
        paginationItems.push(
            <Pagination.Item 
                key={number} 
                active={number === currentPage} 
                onClick={() => handlePageChange(number)}
            >
                {number}
            </Pagination.Item>
        );
    }
    
    const renderPostCard = (post) => (
        <Card className="blog-card mb-4 shadow-sm h-100" key={post._id}>
            <div className="card-img-container">
                <Card.Img 
                    variant="top" 
                    src={post.imageUrl || '/images/default_blog_img.jpg'} 
                    alt={post.title}
                />
            </div>
            <Card.Body>
                <Badge bg="primary" className="mb-2">{post.category}</Badge>
                <Card.Title className="h5">{post.title}</Card.Title>
                <Card.Text className="text-muted">
                    {post.summary || 'Click to read full post...'}
                </Card.Text>
                <Button 
                    variant="link" 
                    className="p-0"
                    onClick={() => navigateTo('blog-detail', { postId: post._id })}
                >
                    Read More <i className="fas fa-arrow-right"></i>
                </Button>
            </Card.Body>
        </Card>
    );

    return (
        <Container fluid className="py-4 blog-page-container">
            <h1 className="mb-4 text-center">📚 The Conclave Academy Blog</h1>
            
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

            {/* --- Hero Section (Latest Post) --- */}
            {heroPost && !searchTerm && !selectedCategory && (
                <Card className="hero-blog-card mb-5 shadow-lg" onClick={() => navigateTo('blog-detail', { postId: heroPost._id })}>
                    <Row className="g-0">
                        <Col md={6}>
                            <img 
                                src={heroPost.imageUrl || '/images/default_blog_img_hero.jpg'} 
                                alt={heroPost.title} 
                                className="img-fluid rounded-start hero-img"
                            />
                        </Col>
                        <Col md={6}>
                            <Card.Body className="d-flex flex-column justify-content-center h-100">
                                <Badge bg="danger" className="mb-2 align-self-start">Featured</Badge>
                                <Card.Title className="h2">{heroPost.title}</Card.Title>
                                <Card.Text className="lead">{heroPost.summary || 'A compelling summary of the featured blog post.'}</Card.Text>
                                <Button variant="primary" className="align-self-start mt-3">Read Full Article</Button>
                            </Card.Body>
                        </Col>
                    </Row>
                </Card>
            )}

            {/* --- Search and Filter Section --- */}
            <Row className="mb-4">
                <Col md={8}>
                    <Form onSubmit={handleSearchSubmit}>
                        <Form.Group className="d-flex">
                            <Form.Control
                                type="text"
                                placeholder="Search by title or content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="me-2"
                            />
                            <Button variant="outline-primary" type="submit">
                                <i className="fas fa-search"></i>
                            </Button>
                        </Form.Group>
                    </Form>
                </Col>
                <Col md={4} className="d-flex align-items-center mt-3 mt-md-0">
                    <p className="mb-0 me-2 text-nowrap">Filter by:</p>
                    <div className="category-badges d-flex flex-wrap">
                        <Button 
                            variant={selectedCategory === '' ? 'primary' : 'outline-primary'} 
                            size="sm" 
                            className="me-2 mb-1"
                            onClick={() => handleCategoryClick('')}
                        >
                            All
                        </Button>
                        {categories.map(cat => (
                            <Button 
                                key={cat}
                                variant={selectedCategory === cat ? 'info' : 'outline-info'} 
                                size="sm" 
                                className="me-2 mb-1"
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </Col>
            </Row>

            {/* --- Post Grid --- */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p>Loading posts...</p>
                </div>
            ) : posts.length === 0 && !heroPost ? (
                <Alert variant="info" className="text-center">No published posts match your criteria.</Alert>
            ) : (
                <>
                    <Row className="g-4">
                        {posts.map(post => (
                            <Col xs={12} sm={6} lg={4} key={post._id}>
                                {renderPostCard(post)}
                            </Col>
                        ))}
                    </Row>
                    
                    {/* --- Pagination --- */}
                    <div className="d-flex justify-content-center mt-5">
                        <Pagination>{paginationItems}</Pagination>
                    </div>
                </>
            )}
        </Container>
    );
};

export default UserBlogPage;