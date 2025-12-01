// src/components/hotel-search/HotelDetailPage.jsx (FULL UPDATE - Ensure you replace your existing content)

import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaMapMarkerAlt, FaStar, FaCheckCircle, FaDollarSign, FaCalendarAlt, FaUsers } from 'react-icons/fa';

const BACKEND_URL = "https://travel-tour-hotel-backend.onrender.com";
const DETAILS_ROUTE = "/api/hotel-search/hotel-full-details";
const RATES_ROUTE = "/api/hotel-search/hotel-rates";

/**
 * @param {object} props
 * @param {function(string): void} props.navigateTo - Function to change the current page in App.jsx.
 * @param {string} props.hotelId - The ID of the hotel to display.
 * @param {string} props.environment - The environment (e.g., 'production').
 * @param {string} props.checkInDate - Check-in date from search criteria.
 * @param {string} props.checkOutDate - Check-out date from search criteria.
 * @param {number} props.adults - Number of adults from search criteria.
 */
const HotelDetailPage = ({ navigateTo, hotelId, environment, checkInDate, checkOutDate, adults }) => {
    const [hotel, setHotel] = useState(null);
    const [rates, setRates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ratesLoading, setRatesLoading] = useState(false);
    const [error, setError] = useState(null);
    const [rateError, setRateError] = useState(null);
    
    // Use dates/adults from App.jsx state as initial values
    const [checkIn, setCheckIn] = useState(checkInDate || '');
    const [checkOut, setCheckOut] = useState(checkOutDate || '');
    const [numAdults, setNumAdults] = useState(adults || 1);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchHotelDetails = async () => {
            if (!hotelId || !environment) {
                setError("Missing Hotel ID or Environment.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                // 1. FETCH HOTEL DETAILS (using your confirmed GET route)
                const detailsUrl = new URL(BACKEND_URL + DETAILS_ROUTE);
                detailsUrl.searchParams.append('hotelId', hotelId);
                detailsUrl.searchParams.append('environment', environment);

                const response = await fetch(detailsUrl.toString(), { method: 'GET' });
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! Status: ${response.status}`);
                }
                
                if (data.success && data.hotel) {
                    setHotel(data.hotel);
                    
                    // If dates were provided in the initial search, fetch rates immediately
                    if (checkInDate && checkOutDate) {
                        fetchRates(checkInDate, checkOutDate, adults);
                    } else {
                        setRatesLoading(false); // No automatic rates search if dates are missing
                    }
                } else {
                    throw new Error(data.message || "Hotel details not found.");
                }

            } catch (e) {
                console.error("Error fetching hotel details:", e);
                setError(`Failed to load hotel details. Error: ${e.message}`);
            } finally {
                setLoading(false);
            }
        };

        // Only run on mount or when hotelId/environment changes
        fetchHotelDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hotelId, environment]); // Removed checkInDate, checkOutDate, adults to prevent excessive fetches

    const fetchRates = async (inDate, outDate, numAdults) => {
        setRatesLoading(true);
        setRateError(null);
        setRates(null);
        
        try {
            // 2. FETCH HOTEL RATES (using your confirmed GET route)
            const ratesUrl = new URL(BACKEND_URL + RATES_ROUTE);
            ratesUrl.searchParams.append('hotelId', hotelId);
            ratesUrl.searchParams.append('checkin', inDate);
            ratesUrl.searchParams.append('checkout', outDate);
            ratesUrl.searchParams.append('adults', numAdults);
            ratesUrl.searchParams.append('environment', environment);
            
            const response = await fetch(ratesUrl.toString(), { method: 'GET' });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! Status: ${response.status}`);
            }
            
            if (data.success && Array.isArray(data.rates) && data.rates.length > 0) {
                // Find and display the cheapest rate
                const cheapestRate = data.rates.sort((a, b) => 
                    (a.rate?.total || Infinity) - (b.rate?.total || Infinity)
                )[0];
                setRates(cheapestRate);
            } else {
                setRateError("No rates found for the selected dates and occupancy.");
            }
            
        } catch (e) {
            console.error("Error fetching rates:", e);
            setRateError(`Could not fetch rates. Error: ${e.message}`);
        } finally {
            setRatesLoading(false);
        }
    };

    const handleRateSearch = (e) => {
        e.preventDefault();
        fetchRates(checkIn, checkOut, numAdults);
    };

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
                    <span className="visually-hidden">Loading hotel details...</span>
                </div>
                <p className="mt-3">Loading Hotel ID: **{hotelId}**...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="alert alert-danger text-center m-5">
                <h4>Error Loading Details 😥</h4>
                <p>{error}</p>
                <button 
                    className="btn btn-primary" 
                    onClick={() => navigateTo('hotel-search')}
                >
                    Start New Search
                </button>
            </div>
        );
    }

    if (!hotel) return <div className="alert alert-warning text-center m-5">Hotel not found.</div>;

    // --- Image Gallery Logic ---
    // Get all images from the data structure
    const allImages = hotel.hotelImages || hotel.images || [];
    // We only want the first 4 or 5 images, including the main one
    const displayImages = allImages.slice(0, 4); 
    const mainImage = displayImages[0]?.url || 'https://via.placeholder.com/800x500/ccc/888?text=Hotel+Image';
    
    const amenityList = hotel.amenities || [];

    return (
        <div className="hotel-detail-container p-4">
            <button 
                className="btn btn-outline-secondary mb-4" 
                onClick={() => navigateTo('hotel-search-results')}
            >
                <FaChevronLeft /> Back to Results
            </button>

            <div className="card shadow-lg">
                {/* --- UPDATED: Image Gallery with Thumbnails --- */}
                <div className="hotel-gallery mb-4">
                    {/* Main Image */}
                    <img 
                        src={mainImage} 
                        className="img-fluid rounded-top mb-2" 
                        alt={hotel.name} 
                        style={{height: '400px', width: '100%', objectFit: 'cover'}}
                    />
                    
                    {/* Thumbnail Row (for 2 or 3 additional images) */}
                    {displayImages.length > 1 && (
                        <div className="row g-2">
                            {displayImages.slice(1).map((img, index) => (
                                <div key={index} className="col-4">
                                    <img 
                                        src={img.url} 
                                        className="img-fluid rounded-3 thumbnail-image" 
                                        alt={`${hotel.name} view ${index + 2}`} 
                                        style={{height: '100px', width: '100%', objectFit: 'cover'}}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="card-body p-4 p-lg-5">
                    <h1 className="card-title fw-bold text-dark-blue">{hotel.name}</h1>
                    <p className="text-muted d-flex align-items-center mb-3">
                        <FaMapMarkerAlt className="me-2 text-danger" /> 
                        {hotel.address || hotel.city}
                    </p>

                    <div className="d-flex align-items-center mb-4">
                        <div className="me-4">{renderRating(hotel.rating)}</div>
                        <span className="text-secondary">
                            ({hotel.reviewsCount || 0} Reviews)
                        </span>
                    </div>
                    
                    <hr />

                    {/* --- RATES AND BOOKING SECTION --- */}
                    <h3 className="mb-3 text-primary-dark">Check Availability & Rates</h3>
                    <form onSubmit={handleRateSearch} className="mb-4 p-3 border rounded bg-light">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label"><FaCalendarAlt /> Check-in</label>
                                <input type="date" className="form-control" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label"><FaCalendarAlt /> Check-out</label>
                                <input type="date" className="form-control" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label"><FaUsers /> Adults</label>
                                <input type="number" className="form-control" min="1" value={numAdults} onChange={(e) => setNumAdults(parseInt(e.target.value))} required />
                            </div>
                            <div className="col-md-4">
                                <button type="submit" className="btn btn-warning w-100" disabled={ratesLoading}>
                                    {ratesLoading ? 'Searching...' : 'Check Rates'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {rateError && <div className="alert alert-danger">{rateError}</div>}
                    {rates && (
                        <div className="alert alert-success mt-3 p-4">
                            <h4 className="alert-heading fw-bold">Cheapest Rate Found!</h4>
                            <p className="mb-1">
                                <FaDollarSign /> Total Price: **{rates.rate.total.toFixed(2)} {rates.rate.currency}**
                            </p>
                            <p className="mb-1">
                                **Room Type:** {rates.room.name}
                            </p>
                            <p className="mb-1">
                                **Cancellation:** {rates.rate.cancellationPolicy.description || 'Check policy'}
                            </p>
                            <button className="btn btn-lg btn-primary fw-bold mt-2">
                                Proceed to Pre-book
                            </button>
                        </div>
                    )}
                    {/* --- END RATES SECTION --- */}

                    <hr className="my-4" />

                    <h3 className="mb-3 text-primary-dark">Description</h3>
                    <p className="card-text mb-4">{hotel.description || 'No detailed description available.'}</p>
                    
                    <h3 className="mb-3 text-primary-dark">Key Amenities</h3>
                    <div className="row">
                        {amenityList.length > 0 ? (
                            amenityList.map((amenity, index) => (
                                <div key={index} className="col-6 col-md-4 mb-2">
                                    <p className="d-flex align-items-center m-0">
                                        <FaCheckCircle className="me-2 text-success" />
                                        {amenity}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="col-12 text-muted">No amenities listed.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HotelDetailPage;