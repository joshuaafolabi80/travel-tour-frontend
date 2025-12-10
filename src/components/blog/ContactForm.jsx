// travel-tour-frontend/src/components/blog/ContactForm.jsx
import React, { useState } from 'react';
import {
    Container, Card, Form, Button, Row, Col,
    Alert, Spinner, Modal
} from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStar, FaCheck } from 'react-icons/fa';
import blogApi from '../../services/blogApi';
import '../../App.css';

const ContactForm = ({ navigateTo }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        interests: [],
        experience: '',
        message: '',
        hearAboutUs: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const interestsOptions = [
        'Travel Writing',
        'Tourism Industry',
        'Hotel Management',
        'Adventure Travel',
        'Cultural Tourism',
        'Sustainable Tourism',
        'Food & Travel',
        'Luxury Travel',
        'Budget Travel',
        'Family Travel'
    ];

    const hearAboutOptions = [
        'Google Search',
        'Social Media',
        'Friend/Family',
        'Blog/Article',
        'Newsletter',
        'Other'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            // Handle interests checkboxes
            const currentInterests = [...formData.interests];
            if (checked) {
                currentInterests.push(value);
            } else {
                const index = currentInterests.indexOf(value);
                if (index > -1) {
                    currentInterests.splice(index, 1);
                }
            }
            setFormData(prev => ({
                ...prev,
                interests: currentInterests
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Please fill in all required fields (*)');
            setLoading(false);
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }
        
        try {
            // Send to backend API
            const response = await blogApi.post('/contact/submit', formData);
            
            if (response.data.success) {
                // Show success modal
                setSuccess(true);
                setShowModal(true);
                
                // Reset form
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    address: '',
                    interests: [],
                    experience: '',
                    message: '',
                    hearAboutUs: ''
                });
            } else {
                setError(response.data.message || 'Failed to submit form. Please try again.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            if (err.response?.status === 500) {
                setError('Server error. Please try again later.');
            } else {
                setError('Failed to submit form. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigateTo('blog-list-page');
    };

    return (
        <Container className="py-5">
            {/* Success Modal */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FaCheck className="me-2" />
                        Submission Successful!
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center py-3">
                        <div className="mb-3">
                            <div className="success-icon mx-auto">
                                <FaStar size={48} className="text-success" />
                            </div>
                        </div>
                        <h5 className="mb-3">Thank You, {formData.firstName}!</h5>
                        <p className="mb-2">
                            Your submission has been received successfully.
                        </p>
                        <p className="mb-2">
                            A copy has been sent to your email: <strong>{formData.email}</strong>
                        </p>
                        <p className="mb-0">
                            Our team will review your information and contact you 
                            via email or SMS within 3-5 business days.
                        </p>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={handleCloseModal}>
                        Continue to Blog
                    </Button>
                </Modal.Footer>
            </Modal>

            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="shadow-lg border-0">
                        <Card.Header className="bg-primary text-white py-4">
                            <div className="text-center">
                                <h2 className="mb-2">
                                    <FaPaperPlane className="me-3" />
                                    Write for Us
                                </h2>
                                <p className="mb-0">
                                    Share your travel stories and tourism expertise with our community
                                </p>
                            </div>
                        </Card.Header>
                        
                        <Card.Body className="p-4 p-md-5">
                            {/* Error Alert */}
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError('')}>
                                    <strong>Error:</strong> {error}
                                </Alert>
                            )}
                            
                            <Form onSubmit={handleSubmit}>
                                <h5 className="mb-4 text-primary">
                                    <FaUser className="me-2" />
                                    Personal Information
                                </h5>
                                
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                First Name <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                placeholder="Enter your first name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                Last Name <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                placeholder="Enter your last name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                <FaEnvelope className="me-2" />
                                                Email Address <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="your.email@example.com"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>
                                                <FaPhone className="me-2" />
                                                Phone Number
                                            </Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+234 123 456 7890"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        <FaMapMarkerAlt className="me-2" />
                                        Address
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Your city, state, country"
                                    />
                                </Form.Group>
                                
                                <hr className="my-4" />
                                
                                <h5 className="mb-4 text-primary">
                                    Your Interests & Experience
                                </h5>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold mb-3">
                                        What topics are you interested in writing about? (Select all that apply)
                                    </Form.Label>
                                    <Row>
                                        {interestsOptions.map((interest, index) => (
                                            <Col md={6} key={index}>
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`interest-${index}`}
                                                    label={interest}
                                                    value={interest}
                                                    checked={formData.interests.includes(interest)}
                                                    onChange={handleChange}
                                                    className="mb-2"
                                                />
                                            </Col>
                                        ))}
                                    </Row>
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Tell us about your travel/tourism experience
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        placeholder="Share your background, expertise, or writing experience..."
                                        rows={4}
                                    />
                                    <Form.Text className="text-muted">
                                        This helps us match you with suitable topics
                                    </Form.Text>
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Additional Message
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Any additional information you'd like to share..."
                                        rows={3}
                                    />
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        How did you hear about us?
                                    </Form.Label>
                                    <Form.Select
                                        name="hearAboutUs"
                                        value={formData.hearAboutUs}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select an option</option>
                                        {hearAboutOptions.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                
                                <div className="mt-5 pt-3 border-top">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => navigateTo('blog-list-page')}
                                            disabled={loading}
                                        >
                                            Back to Blog
                                        </Button>
                                        
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            disabled={loading}
                                            className="px-5"
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner
                                                        animation="border"
                                                        size="sm"
                                                        className="me-2"
                                                    />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPaperPlane className="me-2" />
                                                    Submit Application
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Form>
                        </Card.Body>
                        
                        <Card.Footer className="bg-light py-3">
                            <div className="text-center text-muted small">
                                <p className="mb-1">
                                    <strong>Note:</strong> Your information will be sent to joshuaafolabi80@gmail.com
                                </p>
                                <p className="mb-0">
                                    Expected response time: 3-5 business days
                                </p>
                            </div>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ContactForm;