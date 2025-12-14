import axios from 'axios';

// ✅ UPDATED: Use Vite environment variable
const API_URL = import.meta.env.VITE_EXPERIENCES_API_URL || 'http://localhost:5002/api';

const experienceApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Request interceptor for logging
experienceApi.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
experienceApi.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    // Enhanced error handling
    if (error.response) {
      // Server responded with error status
      const serverError = error.response.data?.error || 'Server error';
      const enhancedError = new Error(serverError);
      enhancedError.status = error.response.status;
      enhancedError.data = error.response.data;
      return Promise.reject(enhancedError);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

/**
 * Get all experiences with pagination and filters
 * @param {Object} params - Query parameters
 * @returns {Promise} Axios response
 */
export const getExperiences = (params = {}) => {
  const defaultParams = {
    page: 1,
    limit: 12,
    sort: '-createdAt'
  };
  
  return experienceApi.get('/experiences', { 
    params: { ...defaultParams, ...params } 
  });
};

/**
 * Get single experience by ID
 * @param {string} id - Experience ID
 * @returns {Promise} Axios response
 */
export const getExperienceById = (id) => {
  if (!id) {
    return Promise.reject(new Error('Experience ID is required'));
  }
  return experienceApi.get(`/experiences/${id}`);
};

/**
 * Submit a new experience
 * @param {Object} data - Experience data
 * @returns {Promise} Axios response
 */
export const submitExperience = (data) => {
  // Validate required fields
  const requiredFields = ['title', 'type', 'duration', 'location', 'description', 'user.name', 'user.role'];
  const missingFields = requiredFields.filter(field => {
    const parts = field.split('.');
    let value = data;
    for (const part of parts) {
      value = value?.[part];
    }
    return !value;
  });

  if (missingFields.length > 0) {
    return Promise.reject(new Error(`Missing required fields: ${missingFields.join(', ')}`));
  }

  // Process skillsLearned if it's a string
  const processedData = { ...data };
  if (typeof processedData.skillsLearned === 'string') {
    processedData.skillsLearned = processedData.skillsLearned
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  return experienceApi.post('/experiences', processedData);
};

/**
 * Like an experience
 * @param {string} id - Experience ID
 * @returns {Promise} Axios response
 */
export const likeExperience = (id) => {
  if (!id) {
    return Promise.reject(new Error('Experience ID is required'));
  }
  return experienceApi.put(`/experiences/${id}/like`);
};

/**
 * Search experiences
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise} Axios response
 */
export const searchExperiences = (query, options = {}) => {
  return experienceApi.get('/experiences', {
    params: {
      search: query,
      ...options
    }
  });
};

/**
 * Get experience statistics
 * @returns {Promise} Axios response
 */
export const getExperienceStats = () => {
  return experienceApi.get('/experiences/stats');
};

export default experienceApi;