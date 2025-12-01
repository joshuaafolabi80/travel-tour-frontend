// src/components/hotel-search/HomePage.jsx - Updated to include Country and Dates

import React, { useState } from 'react';
import { FaSearch, FaCalendarAlt, FaUsers, FaGlobe } from 'react-icons/fa';

/**
 * @param {object} props
 * @param {function(object): void} props.onSearch - Function to call when the search button is clicked. 
 * Passes an object: { city, country, checkInDate, checkOutDate, guests, environment }
 */
const HotelSearchHome = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('US'); // Default to US, can be changed by user
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [alertMessage, setAlertMessage] = useState('');
  const environment = 'production'; // Hardcoded for live environment

  const handleSubmit = (e) => {
    e.preventDefault();
    setAlertMessage('');

    if (!city.trim() || !country.trim()) {
      setAlertMessage('Please enter both a destination city and a country code (e.g., US, FR, UK).');
      return;
    }
    
    // Pass the complete search object back to App.jsx
    onSearch({ 
      city: city.trim(), 
      country: country.trim(),
      checkInDate, 
      checkOutDate, 
      guests,
      environment
    });
  };

  return (
    <div className="hotel-search-home-container p-4">
      <header className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary-dark">Find Your Perfect Stay 🛌</h1>
        <p className="lead text-secondary">Search over millions of hotels worldwide and book instantly.</p>
      </header>
      
      {alertMessage && (
        <div className="alert alert-danger text-center">{alertMessage}</div>
      )}

      <form onSubmit={handleSubmit} className="hotel-search-form bg-white shadow-lg p-4 p-md-5 rounded-4 border">
        <div className="row g-3">
          {/* Destination City Input */}
          <div className="col-12 col-md-6 col-lg-3">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light-blue"><FaSearch /></span>
              <input
                type="text"
                className="form-control"
                placeholder="City (e.g., Paris)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
          </div>
          
          {/* Country Input */}
          <div className="col-12 col-md-6 col-lg-2">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light-blue"><FaGlobe /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Country Code (e.g., FR)"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                maxLength="2"
                required
              />
            </div>
          </div>

          {/* Check-in Date Input */}
          <div className="col-12 col-md-6 col-lg-2">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light-blue"><FaCalendarAlt /></span>
              <input
                type="date"
                className="form-control"
                title="Check-in Date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Check-out Date Input */}
          <div className="col-12 col-md-6 col-lg-2">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light-blue"><FaCalendarAlt /></span>
              <input
                type="date"
                className="form-control"
                title="Check-out Date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          {/* Guests Input */}
          <div className="col-12 col-md-6 col-lg-1">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-light-blue"><FaUsers /></span>
              <input
                type="number"
                className="form-control"
                placeholder="1"
                min="1"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="col-12 col-lg-2">
            <button type="submit" className="btn btn-primary btn-lg w-100 search-btn">
              <span className="d-lg-inline">Search Hotels</span>
              <span className="d-inline d-lg-none"><FaSearch /></span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HotelSearchHome;