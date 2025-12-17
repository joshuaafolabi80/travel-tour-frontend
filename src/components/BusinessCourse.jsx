// src/components/BusinessCourse.jsx
import React, { useState } from 'react';

const BusinessCourse = ({ navigateTo }) => {
  const [activeTab, setActiveTab] = useState(null);

  // Handle tab click to navigate to respective components
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'courses' && navigateTo) {
      navigateTo('masterclass-courses');
    } else if (tab === 'videos' && navigateTo) {
      navigateTo('masterclass-videos');
    }
  };

  // Handle back navigation from MasterclassCourses or MasterclassVideos
  const handleBackToBusinessCourse = () => {
    setActiveTab(null);
    if (navigateTo) {
      navigateTo('business-course');
    }
  };

  // Navigate to Contact Us page
  const navigateToContactUs = () => {
    if (navigateTo) {
      navigateTo('contact-us');
    }
  };

  // If activeTab is set, we're in either MasterclassCourses or MasterclassVideos
  if (activeTab === 'courses' || activeTab === 'videos') {
    return null; // Navigation will be handled by the parent App component
  }

  return (
    <div className="business-course" style={{ 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
      minHeight: '100vh' 
    }}>
      <div className="container-fluid py-4">
        {/* Header Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card text-white bg-gradient-warning border-0 shadow-lg">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-briefcase fa-4x mb-3 text-dark"></i>
                  <h1 className="display-4 fw-bold mb-3 text-dark">
                    Welcome to the Conclave Academy Business Course
                  </h1>
                  <div className="row justify-content-center">
                    <div className="col-lg-8">
                      <p className="lead mb-0 text-dark opacity-75" style={{ fontSize: '1.25rem' }}>
                        Our dedicated industry professionals and experts have these archives of videos and written courses on Travels, Hotels, Tourism and Tour, that will make learning fun and engaging.
                        <br />
                        <strong>Click any of the tabs below to get started!</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="row g-4">
                  <div className="col-md-6">
                    <div 
                      className="card tab-card border-0 shadow-lg h-100 cursor-pointer"
                      onClick={() => handleTabClick('courses')}
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                        border: '3px solid #ffc107'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(255, 193, 7, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body text-center p-5">
                        <div className="icon-wrapper mb-4">
                          <i className="fas fa-crown fa-4x text-warning"></i>
                        </div>
                        <h2 className="card-title fw-bold text-dark mb-3">
                          Masterclass Courses
                        </h2>
                        <p className="card-text text-muted mb-4">
                          Access premium written courses with rich formatting, images and comprehensive content designed by industry experts.
                        </p>
                        <div className="features-list mb-4 text-start">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>Rich content with images</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>Interactive question sets</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>Certificate upon completion</span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-warning btn-lg w-100"
                          onClick={() => handleTabClick('courses')}
                        >
                          <i className="fas fa-arrow-right me-2"></i>
                          Explore Courses
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div 
                      className="card tab-card border-0 shadow-lg h-100 cursor-pointer"
                      onClick={() => handleTabClick('videos')}
                      style={{ 
                        transition: 'all 0.3s ease',
                        background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                        border: '3px solid #ffc107'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(255, 193, 7, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                      }}
                    >
                      <div className="card-body text-center p-5">
                        <div className="icon-wrapper mb-4">
                          <i className="fas fa-video fa-4x text-warning"></i>
                        </div>
                        <h2 className="card-title fw-bold text-dark mb-3">
                          Masterclass Videos
                        </h2>
                        <p className="card-text text-muted mb-4">
                          Watch exclusive video tutorials, interviews with industry leaders, and practical demonstrations from travel, hotel and tourism experts.
                        </p>
                        <div className="features-list mb-4 text-start">
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>High-quality video content</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>Expert-led tutorials</span>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            <span>Downloadable resources</span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-warning btn-lg w-100"
                          onClick={() => handleTabClick('videos')}
                        >
                          <i className="fas fa-arrow-right me-2"></i>
                          Watch Videos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Get Certified Section */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="rounded-rectangle" style={{
              backgroundColor: '#ff6b35',
              borderRadius: '20px',
              padding: '30px',
              position: 'relative',
              boxShadow: '0 10px 30px rgba(255, 107, 53, 0.3)',
              minHeight: '150px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="text-white fw-bold mb-3" style={{ fontSize: '2rem' }}>
                    <i className="fas fa-award me-3"></i>
                    Get Certified!
                  </h3>
                  <p className="text-white mb-0" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    Complete our Business Courses and earn a recognized certification in Travel, Hotel and Tourism Management.
                    Boost your career with industry-recognized credentials.
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <button className="btn btn-light btn-lg px-4 py-3" style={{
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                  }}>
                    <i className="fas fa-rocket me-2"></i>
                    Start Certification
                  </button>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '30px',
                fontSize: '4rem',
                opacity: 0.2,
                color: 'white'
              }}>
                <i className="fas fa-certificate"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section - UPDATED WITH CLICKABLE CAREER SUPPORT */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                      backgroundColor: '#ffc107',
                      width: '80px',
                      height: '80px'
                    }}>
                      <i className="fas fa-graduation-cap fa-2x text-dark"></i>
                    </div>
                    <h5 className="mt-3 fw-bold">Expert Instructors</h5>
                    <p className="text-muted">Learn from industry professionals with years of experience</p>
                  </div>
                  <div className="col-md-4 text-center mb-4 mb-md-0">
                    <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                      backgroundColor: '#ffc107',
                      width: '80px',
                      height: '80px'
                    }}>
                      <i className="fas fa-laptop fa-2x text-dark"></i>
                    </div>
                    <h5 className="mt-3 fw-bold">Flexible Learning</h5>
                    <p className="text-muted">Access courses anytime, anywhere at your own pace</p>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center" style={{
                      backgroundColor: '#ffc107',
                      width: '80px',
                      height: '80px'
                    }}>
                      <i className="fas fa-handshake fa-2x text-dark"></i>
                    </div>
                    <h5 className="mt-3 fw-bold">Career Support</h5>
                    <p 
                      className="text-muted" 
                      style={{ cursor: 'pointer' }}
                      onClick={navigateToContactUs}
                    >
                      Get <span className="text-primary fw-semibold" style={{ textDecoration: 'underline' }}>guidance and support</span> for your career in travels, hotels, tourism and tours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
        
        .tab-card:hover {
          border-color: #ff8c00 !important;
        }
        
        .icon-wrapper {
          transition: transform 0.3s ease;
        }
        
        .tab-card:hover .icon-wrapper {
          transform: scale(1.1);
        }
        
        .features-list span {
          color: #495057;
        }
        
        .rounded-rectangle {
          position: relative;
          overflow: hidden;
        }
        
        .rounded-rectangle::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
        }
        
        /* Hover effect for the clickable text */
        .text-primary:hover {
          color: #0d6efd !important;
          text-decoration: underline !important;
        }
      `}</style>
    </div>
  );
};

export default BusinessCourse;