// travel-tour-frontend/src/components/blog/AdminBlogPage.jsx - ENHANCED UI/UX
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { 
    Container, Row, Col, Card, Button, Table, 
    Badge, Alert, Spinner, Form, InputGroup,
    Dropdown, DropdownButton, Modal
} from 'react-bootstrap';
import { 
    FaPlus, FaEye, FaEdit, FaTrash, FaSearch, 
    FaFilter, FaSync, FaCalendarAlt, FaSortAmountDown,
    FaSortAmountUp, FaChevronLeft, FaChevronRight,
    FaFileAlt, FaChartBar
} from 'react-icons/fa';
import '../../App.css';

const AdminBlogPage = ({ navigateTo }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [counts, setCounts] = useState({ total: 0, published: 0, draft: 0 });
    const [deleteStatus, setDeleteStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'published', 'draft'
    const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'createdAt', 'title'
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statsLoading, setStatsLoading] = useState(false);

    const postsPerPage = 10;

    // Helper to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    };

    // Format date for table
    const formatTableDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Fetch posts with filtering and pagination
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const params = {
                page: currentPage,
                limit: postsPerPage,
                search: searchTerm,
                isPublished: statusFilter === 'all' ? undefined : statusFilter === 'published'
            };

            const response = await api.get('/admin/blog/posts', { 
                params,
                timeout: 10000 // 10 second timeout
            });
            
            if (response.data.success) {
                let filteredPosts = response.data.posts || [];
                
                // Apply client-side sorting
                filteredPosts.sort((a, b) => {
                    let aValue = a[sortBy];
                    let bValue = b[sortBy];
                    
                    if (sortBy === 'title') {
                        aValue = aValue?.toLowerCase();
                        bValue = bValue?.toLowerCase();
                    }
                    
                    if (sortOrder === 'asc') {
                        return aValue > bValue ? 1 : -1;
                    } else {
                        return aValue < bValue ? 1 : -1;
                    }
                });

                setPosts(filteredPosts);
                
                // Calculate counts
                const published = filteredPosts.filter(p => p.isPublished).length;
                const draft = filteredPosts.length - published;
                setCounts({
                    total: response.data.count || filteredPosts.length,
                    published,
                    draft
                });

                // Calculate total pages
                const totalPosts = response.data.count || filteredPosts.length;
                setTotalPages(Math.ceil(totalPosts / postsPerPage));
                
            } else {
                setError('Failed to fetch blog posts: ' + (response.data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('Request timeout. The server is taking too long to respond. Please try again.');
            } else if (err.response?.status === 404) {
                setError('API endpoint not found. Please check if the backend server is running.');
            } else if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
            } else {
                setError('Could not connect to the server or retrieve data.');
            }
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

    // Fetch statistics
    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const response = await api.get('/admin/blog/posts');
            if (response.data.success && response.data.posts) {
                const allPosts = response.data.posts;
                const published = allPosts.filter(p => p.isPublished).length;
                const draft = allPosts.length - published;
                setCounts({
                    total: allPosts.length,
                    published,
                    draft
                });
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        fetchStats();
    }, []);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '' || statusFilter !== 'all') {
                setCurrentPage(1);
                fetchPosts();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Handle delete confirmation
    const confirmDelete = (post) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    // Execute deletion
    const handleDelete = async () => {
        if (!postToDelete) return;

        setDeleteStatus('deleting');
        setShowDeleteModal(false);
        
        try {
            const response = await api.delete(`/admin/blog/posts/${postToDelete._id}`);
            if (response.data.success) {
                setDeleteStatus('success');
                // Refresh data
                fetchPosts();
                fetchStats();
                setTimeout(() => setDeleteStatus(null), 3000);
            } else {
                setDeleteStatus('error');
                setError('Failed to delete post: ' + (response.data.message || 'Unknown error'));
                setTimeout(() => setDeleteStatus(null), 5000);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setDeleteStatus('error');
            setError('Server error during deletion. Please try again.');
            setTimeout(() => setDeleteStatus(null), 5000);
        } finally {
            setPostToDelete(null);
        }
    };

    // Handle sort change
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchPosts();
        fetchStats();
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />;
    };

    // Render pagination
    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        pages.push(
            <Button
                key="prev"
                variant="outline-primary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="me-1"
            >
                <FaChevronLeft />
            </Button>
        );

        // First page
        if (startPage > 1) {
            pages.push(
                <Button
                    key={1}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    className="me-1"
                >
                    1
                </Button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="mx-2">...</span>);
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => handlePageChange(i)}
                    className="me-1"
                >
                    {i}
                </Button>
            );
        }

        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="mx-2">...</span>);
            }
            pages.push(
                <Button
                    key={totalPages}
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    className="me-1"
                >
                    {totalPages}
                </Button>
            );
        }

        // Next button
        pages.push(
            <Button
                key="next"
                variant="outline-primary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="ms-1"
            >
                <FaChevronRight />
            </Button>
        );

        return pages;
    };

    return (
        <Container fluid className="py-4 admin-blog-container">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">
                        <FaFileAlt className="me-2 text-primary" />
                        Blog Management Dashboard
                    </h2>
                    <p className="text-muted mb-0">Manage your blog posts, drafts, and publications</p>
                </div>
                <div className="d-flex gap-2">
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <FaSync className={loading ? "spin" : ""} />
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={() => navigateTo('admin-create-post')}
                        className="d-flex align-items-center"
                    >
                        <FaPlus className="me-2" /> Create New Post
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="mb-4 g-3">
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100 stats-card">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-primary-subtle text-primary rounded-circle me-3 p-3">
                                <FaFileAlt size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Total Posts</Card.Text>
                                <Card.Title className="mb-0">
                                    {statsLoading ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        counts.total
                                    )}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100 stats-card">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-success-subtle text-success rounded-circle me-3 p-3">
                                <FaEye size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Published</Card.Text>
                                <Card.Title className="mb-0 text-success">
                                    {statsLoading ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        counts.published
                                    )}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100 stats-card">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-warning-subtle text-warning rounded-circle me-3 p-3">
                                <FaEdit size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Drafts</Card.Text>
                                <Card.Title className="mb-0 text-warning">
                                    {statsLoading ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        counts.draft
                                    )}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100 stats-card">
                        <Card.Body className="d-flex align-items-center">
                            <div className="stats-icon bg-info-subtle text-info rounded-circle me-3 p-3">
                                <FaChartBar size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Last Updated</Card.Text>
                                <Card.Title className="mb-0 text-info small">
                                    {posts.length > 0 ? formatDate(posts[0].updatedAt) : 'Never'}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Search and Filter Section */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search posts by title or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                    <FaFilter className="me-2" />
                                    Status: {statusFilter === 'all' ? 'All' : statusFilter === 'published' ? 'Published' : 'Drafts'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => setStatusFilter('all')}>All Posts</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setStatusFilter('published')}>Published Only</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setStatusFilter('draft')}>Drafts Only</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                        <Col md={3}>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                    <FaCalendarAlt className="me-2" />
                                    Sort: {sortBy === 'updatedAt' ? 'Last Updated' : sortBy === 'createdAt' ? 'Created' : 'Title'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => handleSort('updatedAt')}>
                                        Last Updated {getSortIcon('updatedAt')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleSort('createdAt')}>
                                        Created Date {getSortIcon('createdAt')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => handleSort('title')}>
                                        Title {getSortIcon('title')}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Alerts */}
            {error && (
                <Alert variant="danger" className="d-flex align-items-center" dismissible onClose={() => setError(null)}>
                    <div className="me-3">
                        <FaTrash />
                    </div>
                    <div>
                        <strong>Error!</strong> {error}
                    </div>
                </Alert>
            )}
            
            {deleteStatus === 'success' && (
                <Alert variant="success" dismissible onClose={() => setDeleteStatus(null)}>
                    Post deleted successfully!
                </Alert>
            )}
            
            {deleteStatus === 'error' && (
                <Alert variant="danger" dismissible onClose={() => setDeleteStatus(null)}>
                    Error deleting post. Please try again.
                </Alert>
            )}

            {/* Posts Table */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading posts...</p>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="empty-state-icon mb-3">
                                <FaFileAlt size={48} className="text-muted" />
                            </div>
                            <h4 className="text-muted mb-2">No blog posts found</h4>
                            <p className="text-muted mb-4">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'No posts match your search criteria.' 
                                    : 'Time to create your first blog post!'}
                            </p>
                            <Button 
                                variant="primary" 
                                onClick={() => navigateTo('admin-create-post')}
                            >
                                <FaPlus className="me-2" /> Create Your First Post
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover className="mb-0 admin-blog-table">
                                    <thead className="bg-light">
                                        <tr>
                                            <th style={{ width: '40%' }}>Title</th>
                                            <th style={{ width: '15%' }}>Category</th>
                                            <th style={{ width: '15%' }}>Status</th>
                                            <th style={{ width: '20%' }}>Last Updated</th>
                                            <th style={{ width: '10%' }} className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map((post) => (
                                            <tr key={post._id} className="align-middle">
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {post.imageUrl && (
                                                            <img 
                                                                src={post.imageUrl} 
                                                                alt={post.title}
                                                                className="rounded me-3"
                                                                style={{ width: '50px', height: '40px', objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <div>
                                                            <strong className="d-block">{post.title}</strong>
                                                            {post.summary && (
                                                                <small className="text-muted text-truncate d-block" style={{ maxWidth: '300px' }}>
                                                                    {post.summary}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <Badge bg="info" className="px-3 py-2">
                                                        {post.category}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <Badge 
                                                        bg={post.isPublished ? "success" : "warning"} 
                                                        className="px-3 py-2"
                                                    >
                                                        {post.isPublished ? "Published" : "Draft"}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="small text-muted">
                                                            {formatTableDate(post.updatedAt)}
                                                        </span>
                                                        <span className="small">
                                                            {formatDate(post.updatedAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <div className="btn-group" role="group">
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            title="View"
                                                            onClick={() => navigateTo('blog-detail', { postId: post._id })}
                                                            className="border-end-0"
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        <Button
                                                            variant="outline-warning"
                                                            size="sm"
                                                            title="Edit"
                                                            onClick={() => navigateTo('admin-edit-post', { postId: post._id })}
                                                            className="border-start-0 border-end-0"
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            title="Delete"
                                                            onClick={() => confirmDelete(post)}
                                                            disabled={deleteStatus === 'deleting'}
                                                            className="border-start-0"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                    <div className="text-muted small">
                                        Showing {(currentPage - 1) * postsPerPage + 1} to {Math.min(currentPage * postsPerPage, counts.total)} of {counts.total} posts
                                    </div>
                                    <div className="d-flex align-items-center">
                                        {renderPagination()}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger">
                        <FaTrash className="me-2" />
                        Confirm Deletion
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-1">
                        Are you sure you want to delete this post?
                    </p>
                    <p className="fw-bold mb-0">
                        "{postToDelete?.title}"
                    </p>
                    <p className="text-muted small mt-2">
                        This action cannot be undone. All associated data will be permanently removed.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={handleDelete}
                        disabled={deleteStatus === 'deleting'}
                    >
                        {deleteStatus === 'deleting' ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Permanently'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Quick Stats Footer */}
            <div className="mt-4 pt-3 border-top">
                <Row>
                    <Col md={6}>
                        <p className="text-muted small mb-0">
                            <FaSync className="me-1" />
                            Last refreshed: {new Date().toLocaleTimeString()}
                        </p>
                    </Col>
                    <Col md={6} className="text-md-end">
                        <p className="text-muted small mb-0">
                            Need help? Check the{' '}
                            <a href="#" className="text-decoration-none">
                                documentation
                            </a>{' '}
                            or{' '}
                            <a href="#" className="text-decoration-none">
                                contact support
                            </a>
                        </p>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default AdminBlogPage;