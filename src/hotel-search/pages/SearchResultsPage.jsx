import React, { useState, useEffect, useCallback } from 'react';
import HotelGrid from '../components/HotelGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { searchHotels } from '../services/api';

const SearchResultsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Get city from URL
  const getCityFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/hotel-search\/(.+)/);
    return match ? decodeURIComponent(match[1]) : '';
  };

  const city = getCityFromUrl();

  // Load hotels
  const loadHotels = useCallback(async (reset = false) => {
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
    window.location.href = '/hotel-search';
  };

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message={`Searching hotels in ${city}...`} />
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
      
      <HotelGrid hotels={hotels} city={city} />
      
      {loadingMore && <LoadingSpinner message="Loading more hotels..." />}
    </div>
  );
};

export default SearchResultsPage;