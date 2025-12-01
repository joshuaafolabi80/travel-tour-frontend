// src/components/hotel-search/SearchResultsPage.jsx (FULL UPDATE - Ensure you replace your existing content)

import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaStar, FaChevronLeft, FaDollarSign, FaWifi, FaInfoCircle } from 'react-icons/fa';

const BACKEND_URL = "https://travel-tour-hotel-backend.onrender.com";
const SEARCH_ROUTE = "/api/hotel-search/search-hotels";

/**
 * @param {object} props
 * @param {object} props.searchCriteria - The search criteria object: { city, country, environment, ... }
 * @param {function(string, object): void} props.navigateTo - Function to change the current page in App.jsx.
 */
const HotelSearchResults = ({ searchCriteria, navigateTo }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { city, country, environment } = searchCriteria;

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      
      if (!city || !country) {
        setError("Missing city or country code. Please go back to search and fill them.");
        setLoading(false);
        return;
      }

      // Construct the URL with query parameters for the GET request
      const url = new URL(BACKEND_URL + SEARCH_ROUTE);
      url.searchParams.append('city', city);
      url.searchParams.append('country', country);
      // Ensure environment is passed, defaulting to production if missing
      url.searchParams.append('environment', environment || 'production'); 
      url.searchParams.append('page', 0); 

      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();

        if (!response.ok) {
            // Check for non-200 status errors (e.g., 400, 500)
            throw new Error(data.message || `HTTP error! Status: ${response.status}`);
        }
        
        if (data.success && Array.isArray(data.hotels)) {
          setResults(data.hotels);
        } else if (!data.success && data.message.includes('No hotels found')) {
          setResults([]);
        } else {
          // Handle unexpected successful response format
          setError(data.message || 'Received unexpected data format from the server.');
          setResults([]);
        }
        
      } catch (e) {
        console.error("Error fetching hotel data:", e);
        setError(`Failed to fetch hotels. Error: ${e.message}. Please verify the search terms.`);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [city, country, environment]); 

  const renderRating = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const starIcons = [];
    for (let i = 0; i < 5; i++) {
      starIcons.push(
        <FaStar 
          key={i} 
          className={i < fullStars ? 'text-warning' : 'text-muted'} 
        />
      );
    }
    return <span className="d-flex align-items-center">{starIcons} ({rating || 'N/A'})</span>;
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading hotels...</span>
        </div>
        <p className="mt-3">Searching for hotels in **{city}, {country}**...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center m-5">
        <h4>Error: Could not load results 😔</h4>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigateTo('hotel-search')}
        >
          Try a New Search
        </button>
      </div>
    );
  }

  return (
    <div className="hotel-results-container p-4">
      <div className="d-flex align-items-center mb-4">
        <button 
          className="btn btn-outline-secondary me-3" 
          onClick={() => navigateTo('hotel-search')}
        >
          <FaChevronLeft /> Back to Search
        </button>
        <h2>
          Hotels in **{city}, {country}** <small className="text-muted ms-3">({results.length} results)</small>
        </h2>
      </div>

      <div className="row g-4">
        {results.length > 0 ? (
          results.map(hotel => (
            <div key={hotel.id} className="col-12">
              <div 
                className="card shadow-sm hotel-card clickable" 
                // Navigate, passing hotel ID and environment to App.jsx state
                onClick={() => navigateTo('hotel-details', { hotelId: hotel.id, environment })}
              >
                <div className="row g-0">
                  <div className="col-md-4 hotel-image-wrapper">
                    <img 
                      src={hotel.images?.[0]?.url || 'https://via.placeholder.com/600x400/ccc/888?text=No+Image'} 
                      className="img-fluid rounded-start hotel-image" 
                      alt={hotel.name} 
                    />
                  </div>
                  <div className="col-md-8">
                    <div className="card-body">
                      <h5 className="card-title fw-bold text-primary">{hotel.name}</h5>
                      <p className="card-text text-muted mb-2 d-flex align-items-center">
                        <FaMapMarkerAlt className="me-2 text-danger" /> 
                        {hotel.address || hotel.city}
                      </p>
                      
                      <div className="d-flex gap-3 mb-3 text-secondary">
                          {hotel.amenities?.includes('WiFi') && <span title="Free Wi-Fi"><FaWifi /></span>}
                          <span title="Price not yet available" className='text-warning'><FaDollarSign /> N/A</span>
                          <span title="Check for more details"><FaInfoCircle /></span>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="rating-area">
                          {renderRating(hotel.rating)}
                        </div>
                      </div>
                      <button 
                        className="btn btn-sm btn-primary mt-3" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          navigateTo('hotel-details', { hotelId: hotel.id, environment });
                        }}
                      >
                        View Details & Rates
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info text-center">
              Sorry, no hotels found in **{city}, {country}**. Try changing your country code or city name.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelSearchResults;