import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom'; // <-- REMOVED
import HotelGrid from '../components/HotelGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { searchHotels } from '../services/api';

// Accept city and navigateTo props from App.jsx
const SearchResultsPage = ({ city, navigateTo }) => { 
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // const navigate = useNavigate(); // <-- REMOVED

  // The city variable is now available directly from props, no need for getCityFromUrl()

  // Load hotels
  const loadHotels = useCallback(async (reset = false) => {
    // Ensure a city is provided before searching
    if (!city) {
      setLoading(false);
      setError("No search city provided.");
      return;
    }

    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      
      setError(null);
      const data = await searchHotels(city, 20, reset ? 0 : offset);
      
      if (reset) {
        setHotels(data.hotels || []);
      } else {
        setHotels(prev => [...prev, ...(data.hotels || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setOffset(reset ? 20 : offset + 20);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [city, offset]);

  // Load initial hotels
  useEffect(() => {
    if (city) {
      loadHotels(true);
    }
  }, [city]);

  // Handle back to search
  const handleBack = () => {
    // FIXED: Using prop function for navigation
    navigateTo('hotel-search'); 
  };

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message={`Searching hotels in ${city || 'unknown city'}...`} />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button className="btn btn-outline-primary mb-4" onClick={handleBack}>
        ← Back to Search
      </button>
      
      <h2 className="mb-4">Hotels in {city}</h2>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <HotelGrid hotels={hotels} city={city} navigateTo={navigateTo} />
      
      {loadingMore && <LoadingSpinner message="Loading more hotels..." />}
    </div>
  );
};

export default SearchResultsPage;