import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HotelSearchHome = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // <-- FIX 1: Initialize navigate

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // <-- FIX 2: Use navigate for client-side routing
      navigate(`/hotel-search/${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container py-5">
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold text-dark mb-4">🌍 Find Hotels Worldwide</h1>
          <p className="lead text-muted mb-4">Discover hotels in any city across the globe</p>
        </div>
        
        <form onSubmit={handleSearch}>
          <div className="input-group input-group-lg shadow">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Enter any city (e.g., Paris, Tokyo, New York...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary px-4" type="submit">
              Search Hotels
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HotelSearchHome;