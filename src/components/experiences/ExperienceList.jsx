import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Pagination, Alert, Dropdown, Spinner, Modal } from 'react-bootstrap';
import { getExperiences, likeExperience, viewExperience, checkIfLiked } from '../../services/experienceApi';
import socketService from '../../utils/socketService';
import { getTypeIcon, getTypeColor } from './data/tourismCompanies';

const ExperienceList = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userLikes, setUserLikes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  const itemsPerPage = 9;

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

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
      
      // Check which experiences user has liked
      if (currentUser) {
        const likesMap = {};
        for (const exp of response.data.data) {
          try {
            const likeCheck = await checkIfLiked(exp._id, currentUser.id || currentUser.email);
            likesMap[exp._id] = likeCheck.data.liked;
          } catch (error) {
            console.log('Error checking like status:', error);
            likesMap[exp._id] = false;
          }
        }
        setUserLikes(likesMap);
      }
      
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
    
    if (socketService && typeof socketService.onNewExperience === 'function') {
      const handleNewExperience = (data) => {
        fetchExperiences();
      };

      const handleLikeUpdate = (data) => {
        setExperiences(prev => prev.map(exp => 
          exp._id === data.experienceId ? { ...exp, likes: data.newLikeCount } : exp
        ));
        
        if (data.userId === (currentUser?.id || currentUser?.email)) {
          setUserLikes(prev => ({
            ...prev,
            [data.experienceId]: data.liked
          }));
        }
      };

      socketService.onNewExperience(handleNewExperience);
      socketService.onLikeUpdated(handleLikeUpdate);

      return () => {
        if (socketService.removeListener) {
          socketService.removeListener('new-experience', handleNewExperience);
          socketService.removeListener('experience-like-updated', handleLikeUpdate);
        }
      };
    }
  }, [currentPage, filterType, sortBy, currentUser]);

  const handleLike = async (experienceId, currentLikes) => {
    if (!currentUser) {
      alert('Please log in to like experiences');
      return;
    }
    
    const userId = currentUser.id || currentUser.email;
    const currentlyLiked = userLikes[experienceId] || false;
    const newLikeCount = currentlyLiked ? currentLikes - 1 : currentLikes + 1;
    
    // Optimistic update
    setExperiences(prev => prev.map(exp => 
      exp._id === experienceId ? { ...exp, likes: newLikeCount } : exp
    ));
    
    setUserLikes(prev => ({
      ...prev,
      [experienceId]: !currentlyLiked
    }));
    
    try {
      const response = await likeExperience(experienceId, userId);
      
      if (response.data.likes !== newLikeCount) {
        setExperiences(prev => prev.map(exp => 
          exp._id === experienceId ? { ...exp, likes: response.data.likes } : exp
        ));
        setUserLikes(prev => ({
          ...prev,
          [experienceId]: response.data.liked
        }));
      }
      
      socketService.emitExperienceLiked(experienceId, response.data.likes, userId, response.data.liked);
      
    } catch (error) {
      console.error('Error liking experience:', error);
      // Revert on error
      setExperiences(prev => prev.map(exp => 
        exp._id === experienceId ? { ...exp, likes: currentLikes } : exp
      ));
      setUserLikes(prev => ({
        ...prev,
        [experienceId]: currentlyLiked
      }));
    }
  };

  const handleViewExperience = async (experience) => {
    try {
      setSelectedExperience(experience);
      setShowDetailModal(true);
      
      const response = await viewExperience(experience._id);
      setExperiences(prev => prev.map(exp => 
        exp._id === experience._id ? { ...exp, views: response.data.views } : exp
      ));
      
      socketService.emitExperienceViewed(experience._id);
      
    } catch (error) {
      console.error('Error viewing experience:', error);
      setSelectedExperience(experience);
      setShowDetailModal(true);
    }
  };

  const formatSkillsForDisplay = (skills) => {
    if (!skills || !Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      return skill.replace(/^[•\-\*]\s*/, '').trim();
    });
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
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3">
            <div>
              <h5 className="mb-0 text-center w-100">Real Student/User Experiences</h5>
              <p className="text-muted mb-0 small text-center w-100">
                Live from MongoDB database • {experiences.length} experiences loaded
                {currentUser && ` • Logged in as: ${currentUser.name || currentUser.email}`}
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
            {experiences.map(experience => {
              const formattedSkills = formatSkillsForDisplay(experience.skillsLearned);
              const isLikedByUser = userLikes[experience._id] || false;
              
              return (
                <Col key={experience._id} xs={12} md={6} lg={4}>
                  <Card className="h-100 shadow-sm hover-lift">
                    <Card.Header className={`bg-${getTypeColor(experience.type)} bg-opacity-10 border-0 text-center`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg={getTypeColor(experience.type)}>
                          {getTypeIcon(experience.type)} {experience.type.charAt(0).toUpperCase() + experience.type.slice(1)}
                        </Badge>
                        <small className="text-muted">
                          <i className="far fa-calendar me-1"></i>
                          {new Date(experience.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </Card.Header>
                    
                    <Card.Body>
                      <h6 className="mb-2 text-center">
                        <strong>{experience.title}</strong>
                      </h6>
                      
                      <div className="text-muted small mb-3 text-center">
                        <div className="mb-1">
                          <i className="fas fa-clock me-1"></i>
                          {experience.duration}
                          <span className="mx-2">•</span>
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {experience.location}
                        </div>
                      </div>
                      
                      <p className="small mb-3" style={{ textAlign: 'justify', lineHeight: '1.6' }}>
                        {experience.description.substring(0, 120)}...
                      </p>
                      
                      {formattedSkills.length > 0 && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">
                            <strong>Skills Learned:</strong>
                          </small>
                          <ul className="mb-0 ps-3" style={{ fontSize: '0.85rem' }}>
                            {formattedSkills.slice(0, 3).map((skill, index) => (
                              <li key={index} className="mb-1" style={{ textAlign: 'justify' }}>
                                {skill}
                              </li>
                            ))}
                            {formattedSkills.length > 3 && (
                              <li className="text-muted fst-italic">
                                +{formattedSkills.length - 3} more skills...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-center mt-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewExperience(experience)}
                          className="px-4"
                        >
                          <i className="fas fa-book-reader me-2"></i>
                          Read Full Story
                        </Button>
                      </div>
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
                            className={`p-0 me-3 ${isLikedByUser ? 'text-danger' : 'text-secondary'}`}
                            title={isLikedByUser ? 'Unlike this story' : 'Like this story'}
                          >
                            <i className={`fas fa-heart me-1`}></i>
                            {experience.likes}
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => handleViewExperience(experience)}
                            className="text-info p-0"
                            title="View full story"
                          >
                            <i className="fas fa-eye me-1"></i>
                            {experience.views}
                          </Button>
                        </div>
                      </div>
                    </Card.Footer>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Modal 
            show={showDetailModal} 
            onHide={() => setShowDetailModal(false)} 
            size="lg"
            centered
            scrollable
          >
            <Modal.Header closeButton className={`bg-${selectedExperience ? getTypeColor(selectedExperience.type) : 'primary'} bg-opacity-10`}>
              <Modal.Title>
                <span className="me-2">{selectedExperience ? getTypeIcon(selectedExperience.type) : ''}</span>
                {selectedExperience?.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedExperience && (
                <div>
                  <div className="text-center mb-4">
                    <Badge bg={getTypeColor(selectedExperience.type)} className="me-2">
                      {selectedExperience.type.charAt(0).toUpperCase() + selectedExperience.type.slice(1)}
                    </Badge>
                    <Badge bg="secondary" className="me-2">
                      <i className="fas fa-clock me-1"></i>
                      {selectedExperience.duration}
                    </Badge>
                    <Badge bg="secondary">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      {selectedExperience.location}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h6 className="text-primary mb-2">Experience Description</h6>
                    <p className="text-justify" style={{ lineHeight: '1.8' }}>
                      {selectedExperience.description}
                    </p>
                  </div>
                  
                  {selectedExperience.skillsLearned && selectedExperience.skillsLearned.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-primary mb-2">Skills Learned</h6>
                      <ul className="mb-0 ps-4" style={{ lineHeight: '1.8' }}>
                        {formatSkillsForDisplay(selectedExperience.skillsLearned).map((skill, index) => (
                          <li key={index} className="mb-2">
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedExperience.challenges && (
                    <div className="mb-4">
                      <h6 className="text-primary mb-2">Challenges Faced</h6>
                      <p className="text-justify" style={{ lineHeight: '1.8' }}>
                        {selectedExperience.challenges}
                      </p>
                    </div>
                  )}
                  
                  {selectedExperience.advice && (
                    <div className="mb-4">
                      <h6 className="text-primary mb-2">Advice for Others</h6>
                      <p className="text-justify" style={{ lineHeight: '1.8' }}>
                        {selectedExperience.advice}
                      </p>
                    </div>
                  )}
                  
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Shared by:</h6>
                          <p className="mb-0">
                            <i className="fas fa-user me-2"></i>
                            {selectedExperience.isAnonymous ? 'Anonymous' : selectedExperience.user.name}
                            <span className="mx-2">•</span>
                            {selectedExperience.user.role}
                          </p>
                          {selectedExperience.user.email && !selectedExperience.isAnonymous && (
                            <small className="text-muted">
                              <i className="fas fa-envelope me-1"></i>
                              {selectedExperience.user.email}
                            </small>
                          )}
                        </div>
                        <div className="text-end">
                          <small className="text-muted d-block">
                            <i className="far fa-calendar me-1"></i>
                            {new Date(selectedExperience.createdAt).toLocaleDateString()}
                          </small>
                          <small className="text-muted d-block">
                            <i className="fas fa-eye me-1"></i> {selectedExperience.views} views
                            <span className="mx-2">•</span>
                            <i className="fas fa-heart me-1"></i> {selectedExperience.likes} likes
                          </small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              {currentUser && (
                <Button 
                  variant={userLikes[selectedExperience?._id] ? "danger" : "primary"}
                  onClick={() => {
                    if (selectedExperience) {
                      handleLike(selectedExperience._id, selectedExperience.likes);
                    }
                  }}
                >
                  <i className={`fas fa-heart me-2`}></i>
                  {userLikes[selectedExperience?._id] ? 'Unlike Story' : 'Like Story'}
                </Button>
              )}
            </Modal.Footer>
          </Modal>

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