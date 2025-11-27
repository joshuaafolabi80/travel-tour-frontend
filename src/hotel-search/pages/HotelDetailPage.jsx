import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { getHotelById } from '../services/api'

const HotelDetailPage = () => {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true)
        const data = await getHotelById(hotelId)
        setHotel(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchHotel()
    }
  }, [hotelId])

  if (loading) {
    return (
      <div className="container py-5">
        <LoadingSpinner message="Loading hotel details..." />
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          <i className="bi bi-building-x display-4 d-block mb-3"></i>
          <h3>Hotel Not Found</h3>
          <p>{error || 'The requested hotel could not be found.'}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const formatAddress = (address) => {
    if (!address) return 'Address not available'
    const parts = [
      address.street,
      address.housenumber,
      address.city,
      address.postcode,
      address.country
    ].filter(Boolean)
    return parts.join(', ') || 'Address not available'
  }

  const renderStars = (stars) => {
    if (!stars) return null
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars)
  }

  const renderAmenities = (amenities) => {
    const amenityList = []
    if (amenities.wifi) amenityList.push('Free WiFi')
    if (amenities.parking) amenityList.push('Parking')
    if (amenities.pool) amenityList.push('Swimming Pool')
    if (amenities.restaurant) amenityList.push('Restaurant')
    if (amenities.air_conditioning) amenityList.push('Air Conditioning')
    
    return amenityList.length > 0 ? amenityList : ['Basic amenities available']
  }

  return (
    <div className="container py-5">
      <button 
        className="btn btn-outline-primary mb-4"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back to Results
      </button>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <img 
              src={hotel.image} 
              className="card-img-top" 
              alt={hotel.name}
              style={{ height: '400px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x400/6c757d/ffffff?text=No+Image+Available'
              }}
            />
            
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h1 className="card-title h2 mb-2">{hotel.name}</h1>
                  {hotel.details.stars && (
                    <div className="mb-3">
                      <span className="text-warning h5">
                        {renderStars(hotel.details.stars)}
                      </span>
                      <span className="text-muted ms-2">
                        {hotel.details.stars}-star hotel
                      </span>
                    </div>
                  )}
                </div>
                <small className="text-muted">
                  Image source: {hotel.imageSource}
                </small>
              </div>

              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="mb-3">
                    <i className="bi bi-geo-alt text-primary me-2"></i>
                    Location
                  </h5>
                  <p className="text-muted">{formatAddress(hotel.address)}</p>
                </div>
                
                <div className="col-md-6">
                  <h5 className="mb-3">
                    <i className="bi bi-telephone text-primary me-2"></i>
                    Contact
                  </h5>
                  <p className="text-muted">
                    {hotel.contact.phone || 'Not available'}
                  </p>
                  {hotel.contact.website && (
                    <p>
                      <a 
                        href={hotel.contact.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-decoration-none"
                      >
                        <i className="bi bi-globe me-1"></i>
                        Visit Website
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="mb-3">
                  <i className="bi bi-star text-primary me-2"></i>
                  Amenities
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  {renderAmenities(hotel.amenities).map((amenity, index) => (
                    <span key={index} className="badge bg-light text-dark border">
                      ✅ {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {hotel.details.operator && (
                <div className="mb-3">
                  <strong>Operator:</strong> {hotel.details.operator}
                </div>
              )}

              {hotel.details.rooms && (
                <div className="mb-3">
                  <strong>Rooms:</strong> {hotel.details.rooms}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Hotel Information</h5>
              
              <div className="mb-3">
                <small className="text-muted">Hotel ID</small>
                <p className="mb-0">{hotel.id}</p>
              </div>
              
              <div className="mb-3">
                <small className="text-muted">Coordinates</small>
                <p className="mb-0">
                  {hotel.latitude?.toFixed(6)}, {hotel.longitude?.toFixed(6)}
                </p>
              </div>
              
              <div className="mb-3">
                <small className="text-muted">Data Source</small>
                <p className="mb-0">OpenStreetMap + Wikipedia</p>
              </div>
              
              <div className="mt-4">
                <button className="btn btn-outline-primary w-100 mb-2">
                  <i className="bi bi-share me-2"></i>
                  Share Hotel
                </button>
                <button className="btn btn-outline-secondary w-100">
                  <i className="bi bi-bookmark me-2"></i>
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelDetailPage