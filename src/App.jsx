// travel-tour-frontend/src/App.jsx - COMPLETE INTEGRATED VERSION
import React, { useState, useEffect } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { jwtDecode } from 'jwt-decode';
import api from './services/api';
import LoginRegister from './LoginRegister';
import DestinationsPage from './destinations/DestinationsPage';
import DestinationOverview from './destinations/DestinationOverview';
import FullCourseContent from './destinations/FullCourseContent';
import QuizPlatform from './components/QuizPlatform';
import QuizScores from './components/QuizScores';
import AdminQuizCompleted from './components/AdminQuizCompleted';
import GeneralCourses from './components/GeneralCourses';
import MasterclassCourses from './components/MasterclassCourses';
import CourseAndRemarks from './components/CourseAndRemarks';
import AdminCourseCompleted from './components/AdminCourseCompleted';
import ContactUs from './components/ContactUs';
import MessageFromStudents from './components/MessageFromStudents';
import MessageFromAdmin from './components/MessageFromAdmin';
import AdminStudents from './components/AdminStudents';
import AdminMessageStudents from './components/AdminMessageStudents';
import AdminManageCourses from './components/AdminManageCourses';
import GeneralCourseQuestions from './components/GeneralCourseQuestions';
import MasterclassCourseQuestions from './components/MasterclassCourseQuestions';
import QuizAttempt from './components/QuizAttempt';
// 🎯 UPDATED: Google Meet Community Components
import AdminCommunityTab from './components/AdminCommunityTab';
import UserCommunityTab from './components/UserCommunityTab';
// 🚨 ADDED: Video Components
import VideoCourses from './components/VideoCourses';
import MasterclassVideos from './components/MasterclassVideos';
import AdminVideoCourses from './components/AdminVideoCourses';
// 🏨 ADDED: Hotel Components
import HotelSearchHome from './hotel-search/pages/HomePage';
import HotelSearchResults from './hotel-search/pages/SearchResultsPage';
import HotelDetailPage from './hotel-search/pages/HotelDetailPage';
import './App.css';

// Reusable Slider Component for both Splash Screen and Home Page
const HeroSlider = ({ images, texts, staticTitle, onLastSlide, onNextClick, isHomepage = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handleNextClickInternal = () => {
    if (currentIndex === images.length - 1) {
      if (onNextClick) {
        onNextClick();
      }
    } else {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }
  };

  return (
    <div className={`hero-slider-section ${isHomepage ? 'homepage-slider' : ''}`}>
      <TransitionGroup className="carousel-wrapper">
        <CSSTransition
          key={currentIndex}
          timeout={1000}
          classNames="slide-bg"
        >
          <div
            className="carousel-image"
            style={{ backgroundImage: `url(${images[currentIndex]})` }}
          >
            <div className="carousel-overlay">
              <p className="carousel-text">{texts[currentIndex]}</p>
              {staticTitle && (
                <h2 className="carousel-title">{staticTitle}</h2>
              )}
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>
      {onLastSlide && (
        <div className="splash-controls">
          <div className="splash-indicators">
            {images.map((_, index) => (
              <span
                key={index}
                className={`splash-indicator ${
                  currentIndex === index ? 'active' : ''
                }`}
              ></span>
            ))}
          </div>
          <button
            onClick={handleNextClickInternal}
            className="splash-button primary-button"
          >
            {currentIndex === images.length - 1 ? 'START' : 'NEXT'}
          </button>
        </div>
      )}
    </div>
  );
};

const splashImages = [
  "/images/travelling_and_tour_1.jpg",
  "/images/travelling_and_tour_2.jpg",
  "/images/travelling_and_tour_3.jpg",
  "/images/travelling_and_tour_4.jpg",
  "/images/travelling_and_tour_5.jpg"
];

const splashTexts = [
  "Variety of learning modules among destinations, sightseeing attractions, business skills and much more",
  "FREE LIVE Trainings organized by industry experts, from the comfort of your office/ home.",
  "Audio-Visual tutorials and introductory videos will make your learning experience par excellence",
  "Explore personalized learning paths designed to fit your unique travel and tourism career goals.",
  "Connect with a vibrant community of travel enthusiasts and industry professionals."
];

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userData, setUserData] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [hotelSearchCity, setHotelSearchCity] = useState('');
  
  const [notificationCounts, setNotificationCounts] = useState({
    quizScores: 0,
    courseRemarks: 0,
    generalCourses: 0,
    masterclassCourses: 0,
    importantInfo: 0,
    adminMessages: 0,
    quizCompleted: 0,
    courseCompleted: 0,
    manageCourses: 0,
    messagesFromStudents: 0,
    videoCourses: 0,
    generalVideos: 0,
    masterclassVideos: 0
  });

  const validateToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return decoded;
    } catch (error) {
      return null;
    }
  };

  const fetchNotificationCounts = async () => {
    if (!isLoggedIn || !userData) return;
    
    try {
      const response = await api.get('/courses/notification-counts');
      
      if (response.data.success) {
        const clearedNotifications = JSON.parse(localStorage.getItem('clearedNotifications') || '{}');
        const currentTime = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        const updatedCounts = { ...response.data.counts };

        // 🚨 ADDED: Fetch video counts for both students and admin
        try {
          const videoCountsResponse = await api.get('/videos/count');
          if (videoCountsResponse.data.success) {
            updatedCounts.generalVideos = videoCountsResponse.data.generalVideos || 0;
            updatedCounts.masterclassVideos = videoCountsResponse.data.masterclassVideos || 0;
            updatedCounts.videoCourses = updatedCounts.generalVideos + updatedCounts.masterclassVideos;
          }
        } catch (videoError) {
          console.error('Error fetching video counts:', videoError);
          updatedCounts.generalVideos = 0;
          updatedCounts.masterclassVideos = 0;
          updatedCounts.videoCourses = 0;
        }

        if (userRole === 'student') {
          try {
            updatedCounts.generalCourses = response.data.generalCourses || 0;
            updatedCounts.masterclassCourses = response.data.masterclassCourses || 0;
            
            const messagesResponse = await api.get('/notifications/admin-messages/' + userData.id);
            if (messagesResponse.data.success) {
              updatedCounts.adminMessages = messagesResponse.data.unreadCount || 0;
            }
          } catch (courseError) {
            console.error('Error fetching course notifications:', courseError);
            updatedCounts.generalCourses = 0;
            updatedCounts.masterclassCourses = 0;
            updatedCounts.adminMessages = 0;
          }
        }

        if (userRole === 'admin') {
          try {
            const messagesResponse = await api.get('/admin/messages/count');
            if (messagesResponse.data.success) {
              updatedCounts.messagesFromStudents = messagesResponse.data.unreadCount || 0;
            }
          } catch (error) {
            console.error('Error fetching admin message count:', error);
            updatedCounts.messagesFromStudents = 0;
          }
        }
        
        Object.keys(clearedNotifications).forEach(key => {
          if (currentTime - clearedNotifications[key] < oneHour) {
            updatedCounts[key] = 0;
          }
        });
        
        setNotificationCounts(updatedCounts);
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      setNotificationCounts({
        quizScores: 0,
        courseRemarks: 0,
        generalCourses: 0,
        masterclassCourses: 0,
        importantInfo: 0,
        adminMessages: 0,
        quizCompleted: 0,
        courseCompleted: 0,
        messagesFromStudents: 0,
        videoCourses: 0,
        generalVideos: 0,
        masterclassVideos: 0
      });
    }
  };

  const clearNotification = (notificationType) => {
    setNotificationCounts(prev => ({
      ...prev,
      [notificationType]: 0
    }));
    
    const clearedNotifications = JSON.parse(localStorage.getItem('clearedNotifications') || '{}');
    clearedNotifications[notificationType] = Date.now();
    localStorage.setItem('clearedNotifications', JSON.stringify(clearedNotifications));
  };

  const markNotificationsAsRead = async (notificationType) => {
    try {
      if (notificationType === 'quizScores' && userData) {
        await api.put('/notifications/mark-read', { 
          type: 'quiz_completed',
          userId: userData.name || userData.userName || userData.email
        });
      } else if (notificationType === 'quizCompleted' && userRole === 'admin') {
        await api.put('/quiz/results/mark-read-admin');
        fetchNotificationCounts();
      } else if (notificationType === 'adminMessages' && userRole === 'student') {
        await api.put('/notifications/mark-admin-messages-read');
      } else if (notificationType === 'messagesFromStudents' && userRole === 'admin') {
        await api.put('/notifications/mark-admin-messages-read');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleMenuClick = (item) => {
    console.log('🔄 Menu clicked:', item.name);
    
    if (item.notificationKey && item.notification > 0) {
      clearNotification(item.notificationKey);
      markNotificationsAsRead(item.notificationKey);
    }
    
    if (item.action) {
      item.action();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = validateToken(token);
      if (decoded) {
        setIsLoggedIn(true);
        setUserRole(decoded.role);
        setUserData(decoded);
        setShowSplash(false);
        fetchNotificationCounts();
        
        if (decoded.role === 'admin') {
          setCurrentPage('admin-students');
        } else {
          setCurrentPage('home');
        }
      } else {
        localStorage.removeItem('authToken');
        setShowSplash(true);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isLoggedIn) {
      fetchNotificationCounts();
      interval = setInterval(fetchNotificationCounts, 30000);
    }
    return () => clearInterval(interval);
  }, [isLoggedIn, userData, userRole]);

  // 🚨 ADDED: Listen for video count updates
  useEffect(() => {
    const handleVideoCountsUpdate = () => {
      fetchNotificationCounts();
    };

    window.addEventListener('videoCountsUpdated', handleVideoCountsUpdate);
    
    return () => {
      window.removeEventListener('videoCountsUpdated', handleVideoCountsUpdate);
    };
  }, []);

  const handleStartClick = () => {
    setShowSplash(false);
  };

  const handleSkipClick = () => {
    setShowSplash(false);
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setAuthToken(token);
        setUserData(user);

        setAlert({ type: 'success', message: 'Login successful! Redirecting...' });
        
        setTimeout(() => {
          setIsLoggedIn(true);
          setUserRole(user.role);
          fetchNotificationCounts();
          
          if (user.role === 'admin') {
            setCurrentPage('admin-students');
          } else {
            setCurrentPage('home');
          }
          setAlert({ type: '', message: '' });
        }, 2000);

      }
    } catch (error) {
      console.error('Login error:', error);
      setAlert({ type: 'error', message: 'Login failed. Please check your credentials.' });
      setTimeout(() => setAlert({ type: '', message: '' }), 5000);
    }
  };

  const handleRegister = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setAuthToken(token);
        setUserData(user);

        setAlert({ type: 'success', message: 'Registration successful! Redirecting...' });
        
        setTimeout(() => {
          setIsLoggedIn(true);
          setUserRole(user.role);
          fetchNotificationCounts();
          
          if (user.role === 'admin') {
            setCurrentPage('admin-students');
          } else {
            setCurrentPage('home');
          }
          setAlert({ type: '', message: '' });
        }, 2000);

      }
    } catch (error) {
      console.error('Registration error:', error);
      setAlert({ type: 'error', message: 'Registration failed. Please try again.' });
      setTimeout(() => setAlert({ type: '', message: '' }), 5000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setAuthToken(null);
    setUserData(null);
    setIsLoggedIn(false);
    setUserRole('');
    setCurrentPage('home');
    setShowMenu(false);
    setShowSplash(true); 
  };

  // FIXED: Enhanced destination selection with better error handling
  const handleSelectDestination = async (destinationId) => {
    console.log('📍 Selecting destination:', destinationId);
    setCurrentPage('loading');
    
    try {
      // Try the new route first for better destination lookup
      const response = await api.get(`/courses/destination/${destinationId}`);
      
      if (response.data.success && response.data.course) {
        console.log('✅ Course found via destination route:', response.data.course.name);
        setSelectedCourse(response.data.course);
        setCurrentPage('destination-overview');
      } else {
        console.log('❌ Course not found in response');
        setAlert({ type: 'error', message: 'Could not find course details.' });
        setCurrentPage('destinations');
      }
    } catch (error) {
      console.error('❌ Error with destination route, trying fallback:', error);
      
      // Fallback to the original route
      try {
        const fallbackResponse = await api.get(`/courses/${destinationId}`);
        
        if (fallbackResponse.data.success && fallbackResponse.data.course) {
          console.log('✅ Course found via fallback route:', fallbackResponse.data.course.name);
          setSelectedCourse(fallbackResponse.data.course);
          setCurrentPage('destination-overview');
        } else {
          throw new Error('Course not found in fallback response');
        }
      } catch (fallbackError) {
        console.error('❌ Both routes failed:', fallbackError);
        
        // More specific error handling
        if (fallbackError.response?.status === 404) {
          setAlert({ type: 'error', message: `Course "${destinationId}" not found. Please try another destination.` });
        } else if (fallbackError.response?.status === 500) {
          setAlert({ type: 'error', message: 'Server error while fetching course. Please try again.' });
        } else {
          setAlert({ type: 'error', message: 'Failed to fetch course data. Please check your connection.' });
        }
        
        setCurrentPage('destinations');
      }
    }
  };

  // FIXED: Enhanced start course function
  const handleStartCourse = () => {
    if (selectedCourse) {
      console.log('🚀 Starting course:', selectedCourse.name);
      setCurrentPage('full-course-content');
    } else {
      console.error('❌ No course selected to start');
      setAlert({ type: 'error', message: 'No course selected. Please select a course first.' });
      setCurrentPage('destinations');
    }
  };

  const handleQuizComplete = () => {
    setCurrentPage('quiz-scores');
  };

  const handleTakeQuiz = () => {
    setCurrentPage('quiz-platform');
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const navigateTo = (page) => {
    console.log('📍 Navigating to:', page);
    setCurrentPage(page);
    setShowMenu(false);
  };

  // FIXED: Hotel search navigation function
  const handleHotelSearch = (city) => {
    console.log('🏨 Hotel search for:', city);
    setHotelSearchCity(city);
    setCurrentPage('hotel-search-results');
  };

  const renderNotificationBadge = (count) => {
    if (count > 0) {
      return (
        <span className="notification-badge">
          {count > 99 ? '99+' : count}
        </span>
      );
    }
    return null;
  };

  const userMenuItems = [
    { 
      name: "Quiz and Score", 
      icon: "fa-solid fa-chart-line",
      notificationKey: 'quizScores',
      notification: notificationCounts.quizScores,
      action: () => navigateTo('quiz-scores')
    },
    { 
      name: "Course and Remarks", 
      icon: "fa-solid fa-graduation-cap",
      notificationKey: 'courseRemarks',
      notification: notificationCounts.courseRemarks,
      action: () => navigateTo('course-remarks')
    },
    { 
      name: "General Courses", 
      icon: "fa-solid fa-book",
      notificationKey: 'generalCourses',
      notification: notificationCounts.generalCourses,
      action: () => navigateTo('general-courses')
    },
    { 
      name: "Masterclass Courses", 
      icon: "fa-solid fa-crown",
      notificationKey: 'masterclassCourses',
      notification: notificationCounts.masterclassCourses,
      action: () => navigateTo('masterclass-courses')
    },
    // 🚨 UPDATED: Video Courses with superscript count
    { 
      name: "Video Courses", 
      icon: "fas fa-video",
      notificationKey: 'videoCourses',
      notification: notificationCounts.videoCourses,
      action: () => navigateTo('video-courses')
    },
    { 
      name: "Important Information", 
      icon: "fa-solid fa-info-circle",
      notificationKey: 'importantInfo',
      notification: notificationCounts.importantInfo,
      action: () => navigateTo('important-information')
    },
    { 
      name: "Message from Admin", 
      icon: "fa-solid fa-envelope",
      notificationKey: 'adminMessages',
      notification: notificationCounts.adminMessages,
      action: () => navigateTo('admin-messages')
    },
    { 
      name: "Contact Us", 
      icon: "fa-solid fa-phone",
      action: () => navigateTo('contact-us')
    },
    // 🎯 UPDATED: Community with Google Meet
    { 
      name: "Community", 
      icon: "fa-solid fa-users",
      action: () => navigateTo('community')
    },
    { 
      name: "Rate and Share our App", 
      icon: "fa-solid fa-share-alt",
      action: () => navigateTo('rate-share')
    },
    { 
      name: "Logout", 
      icon: "fa-solid fa-sign-out-alt", 
      action: handleLogout
    },
  ];

  const adminMenuItems = [
    { 
      name: "Registered Students", 
      icon: "fa-solid fa-user-graduate",
      action: () => navigateTo('admin-students')
    },
    { 
      name: "Message your Students", 
      icon: "fa-solid fa-comments",
      action: () => navigateTo('admin-message-students')
    },
    { 
      name: "Messages from Students", 
      icon: "fa-solid fa-inbox",
      notificationKey: 'messagesFromStudents',
      notification: notificationCounts.messagesFromStudents,
      action: () => navigateTo('admin-messages-from-students')
    },
    { 
      name: "Quiz Completed", 
      icon: "fa-solid fa-tasks",
      notificationKey: 'quizCompleted',
      notification: notificationCounts.quizCompleted,
      action: () => navigateTo('admin-quiz-completed')
    },
    { 
      name: "Course Completed", 
      icon: "fa-solid fa-certificate",
      notificationKey: 'courseCompleted',
      notification: notificationCounts.courseCompleted,
      action: () => navigateTo('admin-course-completed')
    },
    { 
      name: "Manage my Courses", 
      icon: "fa-solid fa-cog",
      notificationKey: 'manageCourses',
      notification: notificationCounts.manageCourses,
      action: () => navigateTo('admin-manage-courses')
    },
    // 🚨 UPDATED: Video Courses for admin with total video count
    { 
      name: "Video Courses", 
      icon: "fas fa-video",
      notificationKey: 'videoCourses',
      notification: notificationCounts.videoCourses,
      action: () => navigateTo('admin-video-courses')
    },
    { 
      name: "Send Information", 
      icon: "fa-solid fa-bullhorn",
      action: () => navigateTo('admin-send-information')
    },
    // 🎯 UPDATED: Community with Google Meet for Admin
    { 
      name: "Community", 
      icon: "fa-solid fa-users",
      action: () => navigateTo('admin-community')
    },
    { 
      name: "Logout", 
      icon: "fa-solid fa-sign-out-alt", 
      action: handleLogout
    },
  ];

  const getMenuItems = () => {
    if (userRole === 'admin') {
      return adminMenuItems;
    }
    return userMenuItems;
  };

  const HomePage = () => {
    return (
      <div className="home-page-container">
        <div className="homepage-hero">
          <HeroSlider
            images={splashImages}
            texts={splashTexts}
            staticTitle="The Conclave Academy"
            isHomepage={true}
          />
          <div className="hero-content">
            <h2 className="hero-subtitle"></h2>
            <button className="hero-cta-button">
              Get Certified Today!
            </button>
          </div>
        </div>
        
        {/* UPDATED: Bootstrap Grid Navigation with larger fonts */}
        <div className="navigation-grid-container">
          <div className="container-fluid">
            <div className="row g-2">
              <div className="col-4">
                <div className="nav-grid-item" onClick={() => navigateTo('destinations')}>
                  <i className="fas fa-umbrella-beach nav-icon"></i>
                  <span className="nav-text">Destinations</span>
                </div>
              </div>
              <div className="col-4">
                <div className="nav-grid-item" onClick={() => navigateTo('hotel-search')}>
                  <i className="fas fa-hotel nav-icon"></i>
                  <span className="nav-text">Hotels</span>
                </div>
              </div>
              <div className="col-4">
                <div className="nav-grid-item">
                  <i className="fas fa-coffee nav-icon"></i>
                  <span className="nav-text">Experiences</span>
                </div>
              </div>
              <div className="col-4">
                <div className="nav-grid-item">
                  <i className="fas fa-briefcase nav-icon"></i>
                  <span className="nav-text">Business Course</span>
                </div>
              </div>
              <div className="col-4">
                <div className="nav-grid-item">
                  <i className="fas fa-blog nav-icon"></i>
                  <span className="nav-text">Blog</span>
                </div>
              </div>
              <div className="col-4">
                <div className="nav-grid-item" onClick={() => navigateTo('community')}>
                  <i className="fas fa-video nav-icon"></i>
                  <span className="nav-text">Online Webinar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <section className="packages-section">
          <h3 className="packages-title">Explore Travel Packages ✈️</h3>
          <p className="packages-description">
            Discover exciting travel packages that your students can learn to sell and earn commissions!
            From exotic destinations to unique experiences, we've got something for everyone.
          </p>
          <button className="packages-button primary-button">
            View Packages
          </button>
        </section>
      </div>
    );
  };

  const LoadingPage = () => (
    <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

      {showSplash ? (
        <div className="splash-screen-wrapper">
          <div className="splash-content">
            <HeroSlider
              images={splashImages}
              texts={splashTexts}
              onLastSlide={true}
              onNextClick={handleStartClick}
            />
            <div className="splash-skip-container">
              <button onClick={handleSkipClick} className="splash-skip-button">
                SKIP
              </button>
            </div>
          </div>
        </div>
      ) : isLoggedIn ? (
        <div className="main-app-content">
          {/* FIXED HEADER WITH MULTI-ROW NAVIGATION */}
          <header className="app-header">
            <div className="header-logo-container">
              <img 
                src="https://res.cloudinary.com/dnc3s4u7q/image/upload/v1760389693/conclave_logo_ygplob.jpg" 
                alt="The Conclave Academy Logo" 
                className="header-logo" 
              />
            </div>
            <button className="hamburger-menu-icon" onClick={toggleMenu}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="desktop-nav">
              {getMenuItems().map((item) => (
                <button 
                  key={item.name} 
                  className="desktop-nav-item" 
                  onClick={() => handleMenuClick(item)}
                  style={{position: 'relative'}}
                >
                  <i className={item.icon}></i>
                  <span>{item.name}</span>
                  {item.notification !== undefined && renderNotificationBadge(item.notification)}
                </button>
              ))}
            </div>
            <div className="header-right-spacer"></div>
          </header>
          <CSSTransition
            in={showMenu}
            timeout={300}
            classNames="menu"
            unmountOnExit
          >
            <div className="mobile-dropdown-menu">
              <div className="mobile-menu-header">
                <button className="mobile-menu-close" onClick={toggleMenu}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="mobile-menu-title-container">
                <h1 className="mobile-menu-title">
                  The Conclave Academy
                </h1>
              </div>
              <div className="mobile-menu-scroll-container">
                <ul className="mobile-menu-list">
                  {getMenuItems().map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => handleMenuClick(item)}
                        className="mobile-menu-item"
                        style={{position: 'relative'}}
                      >
                        <i className={item.icon}></i>
                        <span>{item.name}</span>
                        {item.notification !== undefined && renderNotificationBadge(item.notification)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CSSTransition>
          <main className="main-content-area">
            {/* SIMPLE STATE-BASED PAGE RENDERING */}
            {currentPage === 'home' && <HomePage />}
            {currentPage === 'destinations' && <DestinationsPage onSelectDestination={handleSelectDestination} />}
            {currentPage === 'destination-overview' && selectedCourse && (
              <DestinationOverview course={selectedCourse} onStartCourse={handleStartCourse} />
            )}
            {currentPage === 'full-course-content' && selectedCourse && (
              <FullCourseContent course={selectedCourse} onTakeQuiz={handleTakeQuiz} />
            )}
            {currentPage === 'quiz-platform' && selectedCourse && (
              <QuizPlatform 
                course={selectedCourse} 
                onQuizComplete={handleQuizComplete}
              />
            )}
            
            {/* 🚨 ADDED: Course Question Quiz Routes */}
            {currentPage === 'general-quiz-attempt' && <QuizAttempt navigateTo={navigateTo} />}
            {currentPage === 'masterclass-quiz-attempt' && <QuizAttempt navigateTo={navigateTo} />}
            
            {currentPage === 'quiz-scores' && <QuizScores />}
            
            {/* User Pages */}
            {currentPage === 'general-courses' && <GeneralCourses navigateTo={navigateTo} />}
            {currentPage === 'masterclass-courses' && <MasterclassCourses navigateTo={navigateTo} />}
            {/* 🚨 ADDED: Video Pages */}
            {currentPage === 'video-courses' && <VideoCourses navigateTo={navigateTo} />}
            {currentPage === 'masterclass-videos' && <MasterclassVideos navigateTo={navigateTo} />}
            {currentPage === 'course-remarks' && <CourseAndRemarks />}
            {currentPage === 'contact-us' && <ContactUs />}
            {currentPage === 'admin-messages' && <MessageFromAdmin />}
            {currentPage === 'general-course-questions' && <GeneralCourseQuestions navigateTo={navigateTo} />}
            {currentPage === 'masterclass-course-questions' && <MasterclassCourseQuestions navigateTo={navigateTo} />}
            
            {/* Admin Pages */}
            {currentPage === 'admin-students' && <AdminStudents />}
            {currentPage === 'admin-message-students' && <AdminMessageStudents />}
            {currentPage === 'admin-quiz-completed' && <AdminQuizCompleted />}
            {currentPage === 'admin-course-completed' && <AdminCourseCompleted />}
            {currentPage === 'admin-messages-from-students' && <MessageFromStudents />}
            {currentPage === 'admin-manage-courses' && <AdminManageCourses />}
            {currentPage === 'admin-video-courses' && <AdminVideoCourses navigateTo={navigateTo} />}
            
            {/* 🎯 Community Pages with Google Meet */}
            {currentPage === 'community' && userRole === 'admin' && <AdminCommunityTab />}
            {currentPage === 'community' && userRole !== 'admin' && <UserCommunityTab />}
            {currentPage === 'admin-community' && <AdminCommunityTab />}
            
            {/* 🏨 Hotel Search Pages (State-Based Routing) */}
            {currentPage === 'hotel-search' && (
              <HotelSearchHome onSearch={handleHotelSearch} />
            )}
            {currentPage === 'hotel-search-results' && (
              <HotelSearchResults 
                city={hotelSearchCity} 
                navigateTo={navigateTo} // PASSING navigateTo for the back button
              />
            )}
            {currentPage === 'hotel-details' && <HotelDetailPage navigateTo={navigateTo} />}
            
            {/* Placeholder Pages */}
            {currentPage === 'important-information' && (
              <div className="container py-4">
                <h2>Important Information</h2>
                <p>Content coming soon...</p>
              </div>
            )}
            {currentPage === 'rate-share' && (
              <div className="container py-4">
                <h2>Rate and Share</h2>
                <p>Rating and sharing features coming soon...</p>
              </div>
            )}
            {currentPage === 'admin-send-information' && (
              <div className="container py-4">
                <h2>Send Information</h2>
                <p>Admin information sending features coming soon...</p>
              </div>
            )}
            
            {currentPage === 'loading' && <LoadingPage />}
          </main>
          <footer className="app-footer">
            &copy; {new Date().getFullYear()} The Conclave Academy. All rights reserved.
          </footer>
        </div>
      ) : (
        <div className="login-overlay">
          {alert.message && (
            <div className={`alert-bar ${alert.type}`}>
              {alert.message}
            </div>
          )}
          <LoginRegister onLogin={handleLogin} onRegister={handleRegister} />
        </div>
      )}
    </div>
  );
};

export default App;