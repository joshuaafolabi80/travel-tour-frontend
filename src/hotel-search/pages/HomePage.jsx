import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBox from '../components/SearchBox';

const HotelSearchHome = () => {
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/hotel-search/${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8">
            <div className="text-center mb-5">
              <h1 className="display-4 fw-bold text-dark mb-4">
                🌍 Find Hotels Worldwide
              </h1>
              <p className="lead text-muted mb-4 fs-5">
                Discover thousands of hotels in any city across the globe with infinite scrolling
              </p>
            </div>
            
            {/* Search Box */}
            <SearchBox onSearch={handleSearch} />
          </div>
        </div>
        
        {/* Features Section */}
        <div className="row mt-5 pt-5">
          <div className="col-md-4 text-center mb-4">
            <i className="bi bi-globe display-4 text-primary mb-3"></i>
            <h5>Global Coverage</h5>
            <p className="text-muted">Hotels from every corner of the world</p>
          </div>
          <div className="col-md-4 text-center mb-4">
            <i className="bi bi-infinity display-4 text-primary mb-3"></i>
            <h5>Infinite Scroll</h5>
            <p className="text-muted">Keep scrolling to discover more hotels</p>
          </div>
          <div className="col-md-4 text-center mb-4">
            <i className="bi bi-lightning-charge display-4 text-primary mb-3"></i>
            <h5>Instant Search</h5>
            <p className="text-muted">Find hotels in any city within seconds</p>
          </div>
        </div>

        {/* Popular Cities */}
        <div className="row mt-5">
          <div className="col-12">
            <h4 className="text-center mb-4">Try Popular Cities</h4>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {['Paris', 'London', 'New York', 'Tokyo', 'Dubai', 'Lagos', 'Sydney', 'Berlin'].map(city => (
                <button
                  key={city}
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleSearch(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelSearchHome;