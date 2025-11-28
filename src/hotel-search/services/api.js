// travel-tour-frontend/src/hotel-search/services/api.js


import axios from 'axios';

// Use separate hotel service URL
const HOTEL_API_BASE_URL = process.env.REACT_APP_HOTEL_API_URL || 'https://travel-tour-hotel-backend.onrender.com/api/hotel-search';

// Search hotels by city with pagination
export const searchHotels = async (city, limit = 20, offset = 0) => {
  try {
    const response = await axios.get(`${HOTEL_API_BASE_URL}/search`, {
      params: { city, limit, offset }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Hotel search service unavailable');
  }
};

// Get hotel by ID
export const getHotelById = async (hotelId) => {
  try {
    const response = await axios.get(`${HOTEL_API_BASE_URL}/hotels/${hotelId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Hotel details service unavailable');
  }
};

// Health check
export const checkHotelServiceHealth = async () => {
  try {
    const response = await axios.get(`${HOTEL_API_BASE_URL}/health`);
    return response.data;
  } catch (error) {
    throw new Error('Hotel search service is down');
  }
};