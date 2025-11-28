// travel-tour-frontend/src/hotel-search/components/SearchBox.jsx

import React, { useState } from 'react';

const SearchBox = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && onSearch) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12">
        <form onSubmit={handleSearch}>
          <div className="input-group input-group-lg shadow-lg rounded-pill">
            <input
              type="text"
              className="form-control form-control-lg border-0 rounded-pill"
              placeholder="Enter any city worldwide (e.g., Paris, Tokyo, New York, Lagos...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '25px' }}
            />
            <button 
              className="btn btn-primary px-4 rounded-pill" 
              type="submit"
              disabled={!searchTerm.trim()}
              style={{ marginLeft: '10px' }}
            >
              <i className="bi bi-search me-2"></i>
              Search Hotels
            </button>
          </div>
        </form>
        <div className="text-center mt-3">
          <small className="text-muted">
            Search any city worldwide • Infinite scroll • Completely free
          </small>
        </div>
      </div>
    </div>
  );
};

export default SearchBox;