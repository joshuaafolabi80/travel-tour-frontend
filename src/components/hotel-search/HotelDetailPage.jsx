import React from 'react';

const HotelDetailPage = ({ navigateTo }) => {
  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <button 
            className="btn btn-outline-orange mb-4"
            onClick={() => navigateTo('hotel-search-results')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Results
          </button>
          
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Hotel details page would show comprehensive information about the selected hotel, 
            including images, amenities, room rates, and booking options.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailPage;