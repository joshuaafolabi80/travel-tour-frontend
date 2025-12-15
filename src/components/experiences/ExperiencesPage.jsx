import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import WorkplaceExperience from './WorkplaceExperience';
import TraditionalExperience from './TraditionalExperience';
import RealTimeAlert from './RealTimeAlert';
import socketService from '../../utils/socketService';

const ExperiencesPage = ({ navigateTo }) => {
  const [activeSection, setActiveSection] = useState('workplace');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to socket when component mounts
    const socket = socketService.connect();
    
    // Listen for new experiences
    socketService.onNewExperience((data) => {
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socketService.removeListener('new-experience');
    };
  }, []);

  return (
    <Container className="py-4 experiences-page">
      {/* Real-time Alert Component */}
      <RealTimeAlert />
      
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold mb-3">
          <span className="text-primary">🎯</span> Welcome to the Conclave Jobs and Experiences Hub.
        </h1>
        <p className="lead text-muted mb-4">
          Explore job opportunities and share real experiences from the Travels, Hotels, Tourism and Tours industries.
        </p>
      </div>

      {/* Section Selector */}
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={10} lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Row className="align-items-center text-center">
                <Col md={6} className="mb-4 mb-md-0">
                  <div className="mb-3">
                    <div className="bg-primary text-white rounded-circle p-4 d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '80px', height: '80px' }}>
                      <i className="fas fa-building fa-2x"></i>
                    </div>
                  </div>
                  <h5 className="mb-2">🏢 Workplace Experiences</h5>
                  <p className="text-muted small mb-3">
                    Find job opportunities from leading Travels, Hotels, Tourism and Tours companies
                  </p>
                  <Button 
                    variant={activeSection === 'workplace' ? "primary" : "outline-primary"}
                    onClick={() => setActiveSection('workplace')}
                    className="w-100"
                  >
                    {activeSection === 'workplace' ? '✓ Currently Viewing' : 'Explore Jobs'}
                  </Button>
                </Col>
                
                <Col md={6}>
                  <div className="mb-3">
                    <div className="bg-warning text-white rounded-circle p-4 d-inline-flex align-items-center justify-content-center" 
                         style={{ width: '80px', height: '80px' }}>
                      <i className="fas fa-users fa-2x"></i>
                    </div>
                  </div>
                  <h5 className="mb-2">📖 Traditional Experiences</h5>
                  <p className="text-muted small mb-3">
                    Share and learn from student stories
                    {unreadCount > 0 && (
                      <Badge bg="danger" className="ms-2">
                        {unreadCount} new
                      </Badge>
                    )}
                  </p>
                  <Button 
                    variant={activeSection === 'traditional' ? "warning" : "outline-warning"}
                    onClick={() => {
                      setActiveSection('traditional');
                      setUnreadCount(0);
                    }}
                    className="w-100"
                  >
                    {activeSection === 'traditional' ? '✓ Currently Viewing' : 'View Stories'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Active Section */}
      {activeSection === 'workplace' ? (
        <WorkplaceExperience />
      ) : (
        <TraditionalExperience />
      )}

      {/* Footer Note */}
      <Alert variant="light" className="mt-5 text-center">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div className="mb-3 mb-md-0">
            <h6 className="mb-2">Need career guidance?</h6>
            <p className="text-muted mb-0 small">
              Contact our career counseling team for personalized advice
            </p>
          </div>
          <Button 
            variant="outline-primary"
            onClick={() => navigateTo('contact-us')}
          >
            <i className="fas fa-comments me-2"></i>
            Get Career Advice
          </Button>
        </div>
      </Alert>
    </Container>
  );
};

export default ExperiencesPage;