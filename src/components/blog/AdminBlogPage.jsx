import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Container, Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap';
import '../../App.css'; // Assuming common styles are here

const AdminBlogPage = ({ navigateTo }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [counts, setCounts] = useState({ total: 0, published: 0, draft: 0 });
    const [deleteStatus, setDeleteStatus] = useState(null);

    // Helper to format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // --- Data Fetching ---
    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/blog/posts');
            if (response.data.success) {
                setPosts(response.data.posts);
                const published = response.data.posts.filter(p => p.isPublished).length;
                const draft = response.data.posts.length - published;
                setCounts({
                    total: response.data.posts.length,
                    published,
                    draft
                });
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

    useEffect(() => {
        fetchPosts();
    }, []);

    // --- Post Deletion ---
    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to permanently delete this blog post?')) {
            return;
        }
        setDeleteStatus('deleting');
        try {
            const response = await api.delete(`/admin/blog/posts/${postId}`);
            if (response.data.success) {
                setDeleteStatus('success');
                // Re-fetch data to update table
                fetchPosts();
                setTimeout(() => setDeleteStatus(null), 3000);
            } else {
                setDeleteStatus('error');
                setError('Failed to delete post: ' + (response.data.message || 'Unknown error'));
                setTimeout(() => setDeleteStatus(null), 5000);
            }
        } catch (err) {
            console.error('Delete error:', err);
            setDeleteStatus('error');
            setError('Server error during deletion.');
            setTimeout(() => setDeleteStatus(null), 5000);
        }
    };

    return (
        <Container fluid className="py-4">
            <h2 className="mb-4">📝 Blog Management Dashboard</h2>
            
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Posts</Card.Title>
                            <Card.Text className="h3 text-primary">{counts.total}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Published</Card.Title>
                            <Card.Text className="h3 text-success">{counts.published}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Card.Title>Drafts</Card.Title>
                            <Card.Text className="h3 text-warning">{counts.draft}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3>Post Archive</h3>
                <Button 
                    variant="primary" 
                    onClick={() => navigateTo('admin-create-post')}
                >
                    <i className="fas fa-plus me-2"></i> Create New Post
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {deleteStatus === 'success' && <Alert variant="success">Post deleted successfully!</Alert>}
            {deleteStatus === 'error' && <Alert variant="danger">Error deleting post.</Alert>}
            
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading posts...</span>
                    </div>
                </div>
            ) : posts.length === 0 ? (
                <Alert variant="info" className="text-center">No blog posts found. Time to create one!</Alert>
            ) : (
                <Table striped bordered hover responsive className="admin-blog-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post._id}>
                                <td>{post.title}</td>
                                <td>{post.category}</td>
                                <td>
                                    <Badge bg={post.isPublished ? "success" : "warning"}>
                                        {post.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </td>
                                <td>{formatDate(post.updatedAt)}</td>
                                <td className="text-nowrap">
                                    <Button 
                                        variant="info" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => navigateTo('blog-detail', { postId: post._id })}
                                    >
                                        <i className="fas fa-eye"></i> View
                                    </Button>
                                    <Button 
                                        variant="warning" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => navigateTo('admin-edit-post', { postId: post._id })}
                                    >
                                        <i className="fas fa-edit"></i> Edit
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleDelete(post._id)}
                                        disabled={deleteStatus === 'deleting'}
                                    >
                                        <i className="fas fa-trash"></i> Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

export default AdminBlogPage;