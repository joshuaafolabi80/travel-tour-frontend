// travel-tour-frontend/src/hotel-search/components/LoadingSpinner.jsx

import React from 'react';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fs-5">{message}</p>
    </div>
  );
};

export default LoadingSpinner;