import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Pagination, Alert, Dropdown, Spinner } from 'react-bootstrap';
import { getExperiences, likeExperience } from '../../services/experienceApi';
import socketService from '../../utils/socketService';
import { getTypeIcon, getTypeColor } from './data/tourismCompanies';

const ExperienceList = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');
  const itemsPerPage = 9;

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        type: filterType === 'all' ? undefined : filterType,
        sort: sortBy,
        limit: itemsPerPage
      };
      
      const response = await getExperiences(params);
      setExperiences(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
    
    // ✅ FIXED: Check if socketService has the method
    if (socketService && typeof socketService.onNewExperience === 'function') {
      // Listen for new experiences via Socket.IO
      const handleNewExperience = (data) => {
        console.log('New experience received:', data);
        fetchExperiences(); // Refresh list
      };

      const handleLikeUpdate = (data) => {
        setExperiences(prev => prev.map(exp => 
          exp._id === data.experienceId ? { ...exp, likes: data.newLikeCount } : exp
        ));
      };

      socketService.onNewExperience(handleNewExperience);
      socketService.onLikeUpdated(handleLikeUpdate);

      return () => {
        if (socketService.removeListener) {
          socketService.removeListener('new-experience', handleNewExperience);
          socketService.removeListener('experience-like-updated', handleLikeUpdate);
        }
      };
    } else {
      console.error('❌ socketService.onNewExperience is not a function');
      console.log('socketService object:', socketService);
    }
  }, [currentPage, filterType, sortBy]);

  const handleLike = async (experienceId, currentLikes) => {
    try {
      const response = await likeExperience(experienceId);
      const newLikeCount = response.data.likes;
      
      // Update local state
      setExperiences(prev => prev.map(exp => 
        exp._id === experienceId ? { ...exp, likes: newLikeCount } : exp
      ));
      
      // Emit real-time update
      socketService.emitExperienceLiked(experienceId, newLikeCount);
    } catch (error) {
      console.error('Error liking experience:', error);
    }
  };

  const experienceTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'hotel', label: '🏨 Hotels' },
    { value: 'travel', label: '✈️ Travel' },
    { value: 'airline', label: '🛫 Airlines' },
    { value: 'tour', label: '🚌 Tours' },
    { value: 'event', label: '🎪 Events' },
    { value: 'other', label: '📝 Other' }
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading experiences from database...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div>
              <h5 className="mb-0 text-center w-100">Real Student/User Experiences</h5>
              <p className="text-muted mb-0 small text-center w-100">
                Live from MongoDB database • {experiences.length} experiences loaded
              </p>
            </div>
            <div className="mt-2 mt-md-0">
              <Badge bg="info" className="me-2">
                <i className="fas fa-database me-1"></i>
                Live Database
              </Badge>
            </div>
          </div>

          <Row className="g-3">
            <Col md={6}>
              <select 
                className="form-select"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {experienceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </Col>
            
            <Col md={6}>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  <i className="fas fa-sort me-2"></i>
                  Sort: {sortBy === '-createdAt' ? 'Newest First' : 'Most Popular'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setSortBy('-createdAt')}>
                    <i className="fas fa-clock me-2"></i> Newest First
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy('-likes')}>
                    <i className="fas fa-heart me-2"></i> Most Liked
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy('-views')}>
                    <i className="fas fa-eye me-2"></i> Most Viewed
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Experiences Grid */}
      {experiences.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <div className="display-1 mb-3">📝</div>
          <h5>No experiences yet</h5>
          <p className="text-muted">
            Be the first to share your travel, hotel, tourism and tour experience!
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </Alert>
      ) : (
        <>
          <Row className="g-4 mb-4">
            {experiences.map(experience => (
              <Col key={experience._id} xs={12} md={6} lg={4}>
                <Card className="h-100 shadow-sm hover-lift">
                  <Card.Header className={`bg-${getTypeColor(experience.type)} bg-opacity-10 border-0 text-center`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge bg={getTypeColor(experience.type)} className="">
                        {getTypeIcon(experience.type)} {experience.type.charAt(0).toUpperCase() + experience.type.slice(1)}
                      </Badge>
                      <small className="text-muted">
                        <i className="far fa-calendar me-1"></i>
                        {new Date(experience.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Experience Title - Centered */}
                    <h6 className="mb-2 text-center">
                      <strong>{experience.title}</strong>
                    </h6>
                    
                    {/* Duration & Location - Centered */}
                    <div className="text-muted small mb-3 text-center">
                      <div className="mb-1">
                        <i className="fas fa-clock me-1"></i>
                        {experience.duration}
                        <span className="mx-2">•</span>
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {experience.location}
                      </div>
                    </div>
                    
                    {/* Experience Description - Justified */}
                    <p className="small mb-3" style={{ textAlign: 'justify', lineHeight: '1.6' }}>
                      {experience.description.substring(0, 120)}...
                    </p>
                    
                    {/* Skills Learned - Justified */}
                    <div className="mb-3">
                      <small className="text-muted" style={{ textAlign: 'justify' }}>
                        <strong>Skills:</strong> {experience.skillsLearned?.join(', ')}
                      </small>
                    </div>
                    
                    {/* Challenges Faced - Justified */}
                    {experience.challenges && (
                      <div className="mb-3">
                        <small className="text-muted" style={{ textAlign: 'justify' }}>
                          <strong>Challenge:</strong> {experience.challenges.substring(0, 80)}...
                        </small>
                      </div>
                    )}
                  </Card.Body>
                  
                  <Card.Footer className="bg-white border-top-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <small className="text-muted text-center w-100 d-block">
                          <i className="fas fa-user me-1"></i>
                          {experience.isAnonymous ? 'Anonymous' : experience.user.name}
                          <span className="mx-2">•</span>
                          {experience.user.role}
                        </small>
                      </div>
                      
                      <div className="d-flex align-items-center">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => handleLike(experience._id, experience.likes)}
                          className="text-danger p-0 me-3"
                        >
                          <i className="fas fa-heart me-1"></i>
                          {experience.likes}
                        </Button>
                        <small className="text-muted">
                          <i className="fas fa-eye me-1"></i>
                          {experience.views}
                        </small>
                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} />
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (pageNum === 1 || pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return (
                      <Pagination.Item
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Pagination.Item>
                    );
                  }
                  return null;
                })}
                
                <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExperienceList;