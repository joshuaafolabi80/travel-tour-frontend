import React, { useState } from 'react';
import {
    Container, Card, Form, Button, Row, Col,
    Alert, Spinner, Modal
} from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCheck, FaDashboard } from 'react-icons/fa';
import blogApi from '../../services/blogApi';
import '../../App.css';

const ContactForm = ({ navigateTo, userEmail = '', userName = '' }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: userEmail || '',
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
    const [submittedName, setSubmittedName] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const interestsOptions = [
        'Travel Writing', 'Tourism Industry', 'Hotel Management', 'Adventure Travel',
        'Cultural Tourism', 'Sustainable Tourism', 'Food & Travel', 'Luxury Travel',
        'Budget Travel', 'Family Travel'
    ];

    const hearAboutOptions = [
        'Google Search', 'Social Media', 'Friend/Family', 
        'Blog/Article', 'Newsletter', 'Other'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
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
        
        if (loading) return;
        
        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Please fill in all required fields (*)');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await blogApi.post('/contact/submit', formData);
            
            if (response.data.success) {
                setSubmittedName(formData.firstName);
                setShowSuccessModal(true);
                setSuccess(true);
                
                // Reset form
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: userEmail || '',
                    phone: '',
                    address: '',
                    interests: [],
                    experience: '',
                    message: '',
                    hearAboutUs: ''
                });
                
            } else {
                setError(response.data.message || 'Submission failed');
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError('Failed to submit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        if (userEmail) {
            navigateTo('user-submissions'); // Go to dashboard if logged in
        } else {
            navigateTo('blog-list-page'); // Go to blog if not logged in
        }
    };

    return (
        <Container className="py-5">
            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <FaCheck className="me-2" />
                        Submission Successful!
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <div className="mb-3">
                        <FaCheck size={48} className="text-success" />
                    </div>
                    <h5 className="mb-3">Thank You, {submittedName}!</h5>
                    <p className="mb-3">
                        Your "Write for Us" submission has been received successfully.
                    </p>
                    <p className="mb-3">
                        You can track the status of your submission in your dashboard.
                    </p>
                    <Button 
                        variant="success" 
                        onClick={handleCloseSuccessModal}
                        className="w-100"
                    >
                        <FaDashboard className="me-2" />
                        {userEmail ? 'Go to My Dashboard' : 'Back to Blog'}
                    </Button>
                </Modal.Body>
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
                            {error && (
                                <Alert variant="danger" dismissible onClose={() => setError('')}>
                                    <strong>Error:</strong> {error}
                                </Alert>
                            )}
                            
                            {userEmail && (
                                <Alert variant="info" className="mb-4">
                                    <strong>Note:</strong> You're submitting as {userEmail}. 
                                    You can track this submission in your dashboard.
                                </Alert>
                            )}
                            
                            <Form onSubmit={handleSubmit}>
                                <h5 className="mb-4 text-primary">
                                    <FaUser className="me-2" />
                                    Personal Information
                                </h5>
                                
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group>
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
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
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
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Row className="mb-4">
                                    <Col md={6}>
                                        <Form.Group>
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
                                                disabled={loading || !!userEmail}
                                            />
                                            {userEmail && (
                                                <Form.Text className="text-muted">
                                                    You cannot change your registered email
                                                </Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>
                                                <FaPhone className="me-2" />
                                                Phone Number (Optional)
                                            </Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+234 123 456 7890"
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        <FaMapMarkerAlt className="me-2" />
                                        Address (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Your city, state, country"
                                        disabled={loading}
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
                                                    disabled={loading}
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
                                        disabled={loading}
                                    />
                                    <Form.Text className="text-muted">
                                        This helps us match you with suitable topics
                                    </Form.Text>
                                </Form.Group>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">
                                        Additional Message (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Any additional information you'd like to share..."
                                        rows={3}
                                        disabled={loading}
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
                                        disabled={loading}
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
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => navigateTo('blog-list-page')}
                                            disabled={loading}
                                            className="flex-grow-1"
                                        >
                                            Back to Blog
                                        </Button>
                                        
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="lg"
                                            disabled={loading}
                                            className="px-5 flex-grow-1"
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
                                    <strong>Important:</strong> Your submission will be saved in your dashboard.
                                    Admin will review and respond within 3-5 business days.
                                </p>
                                <p className="mb-0">
                                    You'll receive real-time notifications when admin responds.
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