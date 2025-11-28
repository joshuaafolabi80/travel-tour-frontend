// travel-tour-frontend/src/hotel-search/components/HotelGrid.jsx

import React from 'react';
import HotelCard from './HotelCard';

const HotelGrid = ({ hotels, city }) => {
  if (!hotels || hotels.length === 0) {
    return null; // Handled in parent component
  }

  return (
    <div>
      <div className="row g-4">
        {hotels.map((hotel, index) => (
          <div key={`${hotel.id}-${index}`} className="col-sm-6 col-lg-4 col-xl-3">
            <HotelCard hotel={hotel} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelGrid;