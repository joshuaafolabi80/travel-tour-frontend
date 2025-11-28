// travel-tour-frontend/src/hotel-search/components/HotelCard.jsx

import React from 'react'
import { useNavigate } from 'react-router-dom'

const HotelCard = ({ hotel }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/hotel/${hotel.id}`)
  }

  const formatAddress = (address) => {
    if (!address) return 'Address not available'
    const parts = [address.street, address.city, address.country].filter(Boolean)
    return parts.join(', ') || 'Address not available'
  }

  const renderStars = (stars) => {
    if (!stars) return null
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  return (
    <div 
      className="card h-100 shadow-sm hotel-card" 
      onClick={handleClick}
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <img 
        src={hotel.image} 
        className="card-img-top" 
        alt={hotel.name}
        style={{ height: '200px', objectFit: 'cover' }}
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/300x200/6c757d/ffffff?text=No+Image'
        }}
      />
      
      <div className="card-body d-flex flex-column">
        <h5 className="card-title text-truncate">{hotel.name}</h5>
        
        {hotel.details.stars && (
          <div className="mb-2">
            <small className="text-warning">{renderStars(hotel.details.stars)}</small>
            <small className="text-muted ms-1">({hotel.details.stars} stars)</small>
          </div>
        )}
        
        <p className="card-text text-muted small flex-grow-1">
          <i className="bi bi-geo-alt me-1"></i>
          {formatAddress(hotel.address)}
        </p>
        
        {hotel.contact.phone && (
          <p className="card-text small mb-1">
            <i className="bi bi-telephone me-1"></i>
            {hotel.contact.phone}
          </p>
        )}
        
        <div className="mt-auto pt-2">
          <small className="text-primary">
            Click for details <i className="bi bi-arrow-right"></i>
          </small>
        </div>
      </div>
    </div>
  )
}

export default HotelCard