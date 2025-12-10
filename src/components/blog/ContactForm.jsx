// travel-tour-frontend/src/components/blog/ContactForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Container, Card, Form, Button, Row, Col,
    Alert, Spinner, Modal
} from 'react-bootstrap';
import { FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStar, FaCheck, FaTimes } from 'react-icons/fa';
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
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    
    // Refs for API cancellation
    const notificationControllerRef = useRef(null);
    const formControllerRef = useRef(null);
    const timeoutRef = useRef(null);

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

    // Cleanup function
    const cleanupRequests = () => {
        // Cancel any pending notification API request
        if (notificationControllerRef.current) {
            notificationControllerRef.current.abort('Form submission in progress');
            notificationControllerRef.current = null;
        }
        
        // Cancel form submission if in progress
        if (formControllerRef.current) {
            formControllerRef.current.abort();
            formControllerRef.current = null;
        }
        
        // Clear any timeouts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // Clear any notification fetching intervals
        if (window.notificationTimer) {
            clearInterval(window.notificationTimer);
            window.notificationTimer = null;
        }
    };

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            cleanupRequests();
        };
    }, []);

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

    const showNotificationDialog = (type, message) => {
        setNotification({
            show: true,
            type,
            message
        });
        
        // Auto-hide success notifications after 5 seconds
        if (type === 'success') {
            timeoutRef.current = setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 5000);
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
        
        // 1. CANCEL any ongoing notification API calls
        cleanupRequests();
        
        // 2. SET global flag to stop notification fetching
        window.isFormSubmitting = true;
        
        // 3. Create AbortController for this form submission
        formControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
            if (formControllerRef.current) {
                formControllerRef.current.abort('Request timeout');
            }
        }, 120000);
        
        try {
            // Prepare form data
            const submissionData = { ...formData };
            
            // Send to backend API with cancellation support
            const response = await blogApi.post('/contact/submit', submissionData, {
                timeout: 120000,
                signal: formControllerRef.current.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (response.data.success) {
                // Show success modal
                setSuccess(true);
                setShowModal(true);
                
                // Also show notification dialog
                showNotificationDialog(
                    'success',
                    'Your submission was successful! We\'ll review it soon.'
                );
                
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
                const errorMsg = response.data.message || 'Failed to submit form. Please try again.';
                setError(errorMsg);
                showNotificationDialog('error', errorMsg);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            
            let errorMessage = 'Failed to submit form. Please try again.';
            
            // Handle different error types
            if (err.code === 'ECONNABORTED' || err.name === 'AbortError') {
                errorMessage = 'Request timeout. Please check your connection and try again.';
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (err.message?.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            console.error('Submission error:', err);
            setError(errorMessage);
            showNotificationDialog('error', errorMessage);
            
        } finally {
            setLoading(false);
            
            // Re-enable notification fetching after delay
            timeoutRef.current = setTimeout(() => {
                window.isFormSubmitting = false;
                console.log('Notification fetching re-enabled');
            }, 15000); // 15 seconds delay
            
            // Clean up controller
            if (formControllerRef.current) {
                formControllerRef.current = null;
            }
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigateTo('blog-list-page');
    };

    const closeNotification = () => {
        setNotification({ show: false, type: '', message: '' });
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    // CSS for mobile button spacing - Add to your App.css or inline
    const mobileButtonStyles = `
        @media (max-width: 768px) {
            .form-buttons-container {
                display: flex;
                flex-direction: column;
                gap: 15px !important;
                margin-top: 20px;
            }
            
            .form-buttons-container button {
                width: 100% !important;
                padding: 12px 20px !important;
                font-size: 16px !important;
                margin: 0 !important;
            }
        }
        
        .notification-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .notification-dialog {
            background: white;
            border-radius: 12px;
            padding: 25px;
            min-width: 300px;
            max-width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            text-align: center;
        }
        
        .notification-dialog.success {
            border-top: 5px solid #4CAF50;
        }
        
        .notification-dialog.error {
            border-top: 5px solid #f44336;
        }
        
        .notification-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .notification-dialog.success .notification-icon {
            color: #4CAF50;
        }
        
        .notification-dialog.error .notification-icon {
            color: #f44336;
        }
        
        .notification-message {
            margin: 15px 0;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
        }
        
        .notification-close {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 15px;
            transition: background 0.3s;
        }
        
        .notification-close:hover {
            background: #0056b3;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    return (
        <>
            {/* Add inline styles for notification and mobile fixes */}
            <style>{mobileButtonStyles}</style>
            
            {/* Notification Dialog */}
            {notification.show && (
                <div className="notification-dialog-overlay">
                    <div className={`notification-dialog ${notification.type}`}>
                        <div className="notification-icon">
                            {notification.type === 'success' ? '✓' : '✗'}
                        </div>
                        <p className="notification-message">{notification.message}</p>
                        <button className="notification-close" onClick={closeNotification}>
                            OK
                        </button>
                    </div>
                </div>
            )}
            
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                                    disabled={loading}
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
                                            Additional Message
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
                                        {/* Mobile Button Fix Container */}
                                        <div className="form-buttons-container d-flex justify-content-between align-items-center">
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => navigateTo('blog-list-page')}
                                                disabled={loading}
                                                className="me-2"
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
        </>
    );
};

export default ContactForm;