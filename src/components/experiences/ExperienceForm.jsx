import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Card, Badge, FloatingLabel } from 'react-bootstrap';
import { getTypeIcon, getTypeColor } from './data/tourismCompanies';
import { submitExperience } from '../../services/experienceApi';
import socketService from '../../utils/socketService';

const ExperienceForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'hotel',
    duration: '',
    location: '',
    description: '',
    skillsLearned: '',
    challenges: '',
    advice: '',
    user: {
      name: '',
      role: '',
      email: ''
    },
    isAnonymous: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Submit to MongoDB via API
      const response = await submitExperience(formData);
      
      // Emit real-time notification
      socketService.emitExperienceSubmitted(response.data.data);
      
      // Show success
      if (onSubmit) {
        onSubmit(response.data.data);
      }
      
      // Reset form
      setTimeout(() => {
        setFormData({
          title: '', type: 'hotel', duration: '', location: '',
          description: '', skillsLearned: '', challenges: '', advice: '',
          user: { name: '', role: '', email: '' }, isAnonymous: false
        });
      }, 1000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const experienceTypes = [
    { value: 'hotel', label: '🏨 Hotel Experience' },
    { value: 'travel', label: '✈️ Travel Agency Experience' },
    { value: 'airline', label: '🛫 Airline Experience' },
    { value: 'tour', label: '🚌 Tour Operation Experience' },
    { value: 'event', label: '🎪 Tourism Event Experience' },
    { value: 'other', label: '📝 Other Experience' }
  ];

  return (
    <Card className="border-0">
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Row className="g-3 mb-4">
            <Col md={12}>
              <FloatingLabel label="Experience Title*" className="mb-3">
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., '3-month internship at Transcorp Hilton'"
                  required
                />
              </FloatingLabel>
            </Col>
            
            <Col md={6}>
              <FloatingLabel label="Experience Type*" className="mb-3">
                <Form.Select name="type" value={formData.type} onChange={handleChange} required>
                  {experienceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </FloatingLabel>
            </Col>
            
            <Col md={6}>
              <FloatingLabel label="Duration*" className="mb-3">
                <Form.Control
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., '2 weeks', '6 months'"
                  required
                />
              </FloatingLabel>
            </Col>
            
            <Col md={12}>
              <FloatingLabel label="Location*" className="mb-3">
                <Form.Control
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., 'Lagos, Nigeria'"
                  required
                />
              </FloatingLabel>
            </Col>
          </Row>

          {/* Experience Details */}
          <div className="mb-4">
            <h6 className="mb-3 border-bottom pb-2">Your Experience Story</h6>
            
            <FloatingLabel label="Detailed Description*" className="mb-3">
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ height: '150px' }}
                required
              />
            </FloatingLabel>
            
            <FloatingLabel label="Skills Learned*" className="mb-3">
              <Form.Control
                type="text"
                name="skillsLearned"
                value={formData.skillsLearned}
                onChange={handleChange}
                placeholder="e.g., 'Customer service, tour guiding, reservation systems'"
                required
              />
            </FloatingLabel>
            
            <Row className="g-3">
              <Col md={6}>
                <FloatingLabel label="Challenges Faced" className="mb-3">
                  <Form.Control
                    as="textarea"
                    name="challenges"
                    value={formData.challenges}
                    onChange={handleChange}
                    style={{ height: '100px' }}
                  />
                </FloatingLabel>
              </Col>
              
              <Col md={6}>
                <FloatingLabel label="Advice for Others" className="mb-3">
                  <Form.Control
                    as="textarea"
                    name="advice"
                    value={formData.advice}
                    onChange={handleChange}
                    style={{ height: '100px' }}
                  />
                </FloatingLabel>
              </Col>
            </Row>
          </div>

          {/* User Info */}
          <div className="mb-4">
            <h6 className="mb-3 border-bottom pb-2">Your Information</h6>
            
            <Row className="g-3">
              <Col md={6}>
                <FloatingLabel label="Your Name*" className="mb-3">
                  <Form.Control
                    type="text"
                    name="user.name"
                    value={formData.user.name}
                    onChange={handleChange}
                    required
                  />
                </FloatingLabel>
              </Col>
              
              <Col md={6}>
                <FloatingLabel label="Your Role*" className="mb-3">
                  <Form.Control
                    type="text"
                    name="user.role"
                    value={formData.user.role}
                    onChange={handleChange}
                    placeholder="e.g., 'Hospitality Student'"
                    required
                  />
                </FloatingLabel>
              </Col>
            </Row>
            
            <Form.Check
              type="checkbox"
              id="isAnonymous"
              label="Show as anonymous (your name will not be displayed)"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="mb-3"
            />
          </div>

          {/* Submit Buttons */}
          <div className="d-flex justify-content-between">
            {onCancel && (
              <Button variant="outline-secondary" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Saving to Database...
                </>
              ) : (
                <>
                  <i className="fas fa-database me-2"></i>
                  Save to MongoDB
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ExperienceForm;