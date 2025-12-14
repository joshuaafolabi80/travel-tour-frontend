import React, { useState } from 'react';
import { Container, Card, Button, Modal, Alert, Row, Col } from 'react-bootstrap';
import ExperienceForm from './ExperienceForm';
import ExperienceList from './ExperienceList';
import socketService from '../../utils/socketService';

const TraditionalExperience = () => {
  const [showForm, setShowForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmitExperience = async (experienceData) => {
    try {
      // Socket notification
      const socket = socketService.connect();
      socketService.emitExperienceSubmitted(experienceData);
      
      setFormSubmitted(true);
      setShowForm(false);
      
      setTimeout(() => setFormSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting experience:', error);
    }
  };

  return (
    <Container className="py-4">
      {/* Success Alert */}
      {formSubmitted && (
        <Alert variant="success" dismissible onClose={() => setFormSubmitted(false)} className="mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-check-circle me-3 fs-4"></i>
            <div>
              <h6 className="mb-1">Experience Submitted Successfully!</h6>
              <p className="mb-0">Your story is now visible to all users.</p>
            </div>
          </div>
        </Alert>
      )}

      {/* Header & CTA */}
      <Card className="mb-5 border-0 shadow-sm bg-primary bg-opacity-10">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h5 className="mb-2">Share Your Tourism Experience</h5>
              <p className="text-muted mb-0">
                Help other students learn from your real-world experiences. 
                Share internships, jobs, or volunteer work in tourism.
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => setShowForm(true)}
                className="w-100 w-md-auto"
              >
                <i className="fas fa-pen-alt me-2"></i>
                Share Your Story
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* How It Works */}
      <Row className="mb-5 g-4">
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-4">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 mb-3 d-inline-flex">
                <i className="fas fa-pen fa-2x text-info"></i>
              </div>
              <h5 className="mb-2">1. Share</h5>
              <p className="text-muted small">
                Tell us about your tourism experience
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-4">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 mb-3 d-inline-flex">
                <i className="fas fa-database fa-2x text-success"></i>
              </div>
              <h5 className="mb-2">2. Save</h5>
              <p className="text-muted small">
                Stored in MongoDB for all users to see
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-4">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 mb-3 d-inline-flex">
                <i className="fas fa-users fa-2x text-warning"></i>
              </div>
              <h5 className="mb-2">3. Inspire</h5>
              <p className="text-muted small">
                Help fellow students learn from you
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Experiences List from MongoDB */}
      <ExperienceList />

      {/* Form Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} size="lg" centered scrollable>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>
            <i className="fas fa-pen-alt me-2"></i>
            Share Your Experience
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <ExperienceForm 
            onSubmit={handleSubmitExperience}
            onCancel={() => setShowForm(false)}
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default TraditionalExperience;