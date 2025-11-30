import React, { useState } from 'react';

const HotelSearchHome = ({ onSearch }) => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('NG');
  const [environment, setEnvironment] = useState('sandbox');

  const popularCities = [
    { name: 'Lagos', country: 'NG' },
    { name: 'Abuja', country: 'NG' },
    { name: 'Benin City', country: 'NG' },
    { name: 'London', country: 'UK' },
    { name: 'Paris', country: 'FR' },
    { name: 'New York', country: 'US' },
    { name: 'Dubai', country: 'AE' },
    { name: 'Tokyo', country: 'JP' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city);
    }
  };

  const setPopularCity = (cityName, countryCode) => {
    setCity(cityName);
    setCountry(countryCode);
  };

  return (
    <div className="container-fluid py-4 hotel-search-container">
      <div className="card shadow-lg border-0">
        <div className="card-header bg-orange text-white text-center py-4">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-orange text-white text-center py-4">
              <h1 className="mb-2">🌍 Global Hotel Finder</h1>
              <p className="mb-0">Search and find hotels in any city worldwide</p>
            </div>
            
            <div className="card-body p-4">
              <h2 className="h4 mb-3 text-dark">🔍 Search Hotels Worldwide</h2>
              <p className="text-muted mb-4">Enter any city and country to find available hotels globally</p>
              
              <form onSubmit={handleSearch}>
                <div className="mb-3">
                  <label htmlFor="city" className="form-label fw-semibold">City Name</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lagos, Abuja, Benin City, London, Paris, New York..."
                    required
                  />
                  <div className="form-text">Enter any city name worldwide</div>
                </div>

                <div className="mb-3">
                  <label htmlFor="country" className="form-label fw-semibold">Country Code</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value.toUpperCase())}
                    placeholder="e.g. NG for Nigeria, US for USA, UK for United Kingdom..."
                    required
                  />
                  <div className="form-text">Use 2-letter country codes: NG, GH, KE, ZA, US, UK, FR, etc.</div>
                </div>

                <div className="mb-4">
                  <label htmlFor="environment" className="form-label fw-semibold">Environment</label>
                  <select
                    className="form-select form-select-lg"
                    id="environment"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Real)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-orange btn-lg w-100 py-3">
                  <i className="fas fa-search me-2"></i>
                  Search Hotels Worldwide
                </button>
              </form>

              <div className="mt-5">
                <h3 className="h5 mb-3">🌍 Try These Cities:</h3>
                <div className="d-flex flex-wrap gap-2">
                  {popularCities.map((cityInfo, index) => (
                    <button
                      key={index}
                      type="button"
                      className="btn btn-outline-orange btn-sm"
                      onClick={() => setPopularCity(cityInfo.name, cityInfo.country)}
                    >
                      {cityInfo.name}, {cityInfo.country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchHome;