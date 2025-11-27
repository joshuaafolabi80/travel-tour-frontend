import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HotelGrid from '../components/HotelGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { searchHotels } from '../services/api';

const SearchResultsPage = () => {
  const { city } = useParams();
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalHotels, setTotalHotels] = useState(0);

  const limit = 20; // Load 20 hotels at a time

  // Load initial hotels
  const loadInitialHotels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchHotels(city, limit, 0);
      
      setHotels(data.hotels || []);
      setTotalHotels(data.total || 0);
      setHasMore(data.hasMore || false);
      setOffset(limit);
      
    } catch (err) {
      setError(err.message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [city]);

  // Load more hotels for infinite scroll
  const loadMoreHotels = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const data = await searchHotels(city, limit, offset);
      
      setHotels(prev => [...prev, ...(data.hotels || [])]);
      setHasMore(data.hasMore || false);
      setOffset(prev => prev + limit);
      
    } catch (err) {
      console.error('Error loading more hotels:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [city, loadingMore, hasMore, offset]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      
      // Check if user has scrolled near bottom
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when 100px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreHotels();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreHotels, loadingMore, hasMore]);

  // Reset and load when city changes
  useEffect(() => {
    setHotels([]);
    setOffset(0);
    setHasMore(true);
    loadInitialHotels();
  }, [city, loadInitialHotels]);

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message={`Searching hotels in ${city}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          <i className="bi bi-exclamation-triangle display-4 d-block mb-3"></i>
          <h3>Search Failed</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/hotel-search')}
          >
            Try Another Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header with back button and stats */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button 
          className="btn btn-outline-primary"
          onClick={() => navigate('/hotel-search')}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Search
        </button>
        
        <div className="text-end">
          <h2 className="h4 mb-1">Hotels in {city}</h2>
          <p className="text-muted small mb-0">
            Showing {hotels.length} of {totalHotels}+ hotels
            {hasMore && ' • Scroll to load more'}
          </p>
        </div>
      </div>

      {/* Hotel Grid */}
      <HotelGrid hotels={hotels} city={city} />

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="text-center py-4">
          <LoadingSpinner message="Loading more hotels..." />
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && hotels.length > 0 && (
        <div className="text-center py-5">
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill me-2"></i>
            <strong>All caught up!</strong> You've seen all {hotels.length} hotels in {city}.
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={() => window.scrollTo(0, 0)}
          >
            <i className="bi bi-arrow-up me-2"></i>
            Back to Top
          </button>
        </div>
      )}

      {/* No Results Message */}
      {!loading && hotels.length === 0 && (
        <div className="text-center py-5">
          <i className="bi bi-building-x display-1 text-muted"></i>
          <h3 className="mt-3 text-muted">No hotels found in {city}</h3>
          <p className="text-muted">Try searching for a different city or check the spelling</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/hotel-search')}
          >
            Try Another Search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;