import React from 'react';

const HotelSearchResults = ({ city, navigateTo }) => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <button 
              className="btn btn-outline-orange"
              onClick={() => navigateTo('hotel-search')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Search
            </button>
            <h2 className="mb-0">Hotels in {city}</h2>
          </div>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Hotel search results will be displayed here. The actual implementation 
            would connect to the hotel search backend API.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchResults;