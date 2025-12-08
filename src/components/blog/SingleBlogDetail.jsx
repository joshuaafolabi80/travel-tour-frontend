import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';
import '../../App.css';

const SingleBlogDetail = ({ navigate, postId }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to format date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
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
                // Use the user route to ensure only published posts are visible
                const response = await api.get(`/user/blog/posts/${postId}`); 
                if (response.data.success && response.data.post) {
                    setPost(response.data.post);
                } else {
                    setError('Blog post not found or not yet published.');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to fetch blog post content.');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    const handleBackClick = () => {
        // Use the navigate prop (which is your navigateTo function) 
        // to go back to the user blog list.
        navigate('blog-list-page');
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p>Loading post...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
                <Button variant="secondary" onClick={handleBackClick}>
                    <i className="fas fa-arrow-left me-2"></i> Go Back
                </Button>
            </Container>
        );
    }

    if (!post) {
        return <div className="text-center py-5">No post data to display.</div>;
    }

    return (
        <Container className="py-4 blog-detail-page">
            <div className="d-flex justify-content-start mb-4">
                <Button variant="outline-secondary" onClick={handleBackClick}>
                    <i className="fas fa-arrow-left me-2"></i> Back to Blog
                </Button>
            </div>

            <article>
                <header className="text-center mb-5">
                    <h1 className="display-4 fw-bold">{post.title}</h1>
                    <p className="text-muted lead">
                        By Admin | Published on {formatDate(post.updatedAt)} | Category: {post.category}
                    </p>
                </header>

                {post.imageUrl && (
                    <div className="text-center mb-5">
                        <img 
                            src={post.imageUrl} 
                            alt={post.title} 
                            className="img-fluid rounded shadow-sm detail-image"
                            style={{ maxHeight: '400px', width: 'auto' }}
                        />
                    </div>
                )}
                
                <section className="blog-content mx-auto" style={{ maxWidth: '800px' }}>
                    {/* Render the rich content securely */}
                    <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </section>
            </article>

            <div className="my-5 pt-3 border-top">
                <Button variant="primary" onClick={handleBackClick}>
                    <i className="fas fa-list-alt me-2"></i> View More Posts
                </Button>
            </div>
        </Container>
    );
};

export default SingleBlogDetail;