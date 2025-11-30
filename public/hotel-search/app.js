// client/app.js

// Global variables
let currentPage = 0;
let currentCity = '';
let currentCountry = '';
let currentEnvironment = '';
let isLoadingMore = false;
let allHotels = []; // Store all hotels for filtering
let filteredHotels = []; // Store filtered hotels
let isFiltering = false; // Track if we're filtering

// Global City-Based Hotel Search
async function searchHotels(resetPage = true) {
    const city = document.getElementById("city").value.trim();
    const country = document.getElementById("country").value.trim().toUpperCase();
    const environment = document.getElementById("environment").value;

    // Validate inputs
    if (!city) {
        showError("Please enter a city name");
        return;
    }

    if (!country) {
        showError("Please enter a country code (e.g., NG for Nigeria, US for USA)");
        return;
    }

    // Reset pagination if it's a new search
    if (resetPage) {
        currentPage = 0;
        currentCity = city;
        currentCountry = country;
        currentEnvironment = environment;
        allHotels = []; // Clear previous hotels
        filteredHotels = []; // Clear filtered hotels
        document.getElementById("hotel-search-filter").value = ""; // Clear filter
        document.getElementById("hotel-search-filter-container").style.display = "none"; // Hide filter initially
        isFiltering = false; // Reset filtering state
    }

    // Show loader
    document.getElementById("loader").style.display = "flex";
    document.getElementById("searching-city").textContent = `${city}, ${country}`;
    
    // Clear previous results only if it's a new search
    if (resetPage) {
        document.getElementById("hotels").innerHTML = "";
        document.getElementById("results-header").innerHTML = "";
        document.getElementById("error-message").style.display = "none";
        document.getElementById("load-more-container").style.display = "none";
    }

    console.log(`🔍 Searching hotels in ${city}, ${country}, page ${currentPage}...`);

    try {
        const response = await fetch(
            `http://localhost:3000/search-hotels?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&environment=${environment}&page=${currentPage}`
        );
        
        const data = await response.json();

        // Hide loader
        document.getElementById("loader").style.display = "none";
        isLoadingMore = false;

        if (!data.success) {
            showError(data.message || `No hotels found in ${city}, ${country}. Try checking the spelling or try a nearby major city.`);
            return;
        }

        if (!data.hotels || data.hotels.length === 0) {
            if (resetPage) {
                showError(`No hotels found in ${city}, ${country}. Try checking the spelling or try a nearby major city.`);
            } else {
                document.getElementById("load-more-container").style.display = "none";
            }
            return;
        }

        console.log(`📸 Found ${data.hotels.length} hotels in ${city}, ${country}`);

        // Store all hotels for filtering - ONLY if not currently filtering
        if (!isFiltering) {
            if (resetPage) {
                allHotels = data.hotels;
                filteredHotels = data.hotels;
            } else {
                allHotels = [...allHotels, ...data.hotels];
                filteredHotels = allHotels;
            }
        }

        // Show search filter if we have hotels and not filtering
        if (allHotels.length > 0 && !isFiltering) {
            document.getElementById("hotel-search-filter-container").style.display = "block";
            updateFilterStats();
        }

        // Display results - show filtered results if filtering, otherwise show all
        const hotelsToDisplay = isFiltering ? filteredHotels : data.hotels;
        
        if (resetPage) {
            displaySearchResults(hotelsToDisplay, data.searchInfo);
        } else {
            appendSearchResults(hotelsToDisplay, data.searchInfo);
        }

        // Show load more button if there might be more results AND not filtering
        if (data.searchInfo.hasMore && !isFiltering) {
            document.getElementById("load-more-container").style.display = "block";
        } else {
            document.getElementById("load-more-container").style.display = "none";
        }

    } catch (error) {
        console.error("❌ Error fetching hotels:", error);
        document.getElementById("loader").style.display = "none";
        isLoadingMore = false;
        showError("Failed to search for hotels. Please check your connection and try again.");
    }
}

// Hotel Search Filter Function - FIXED
function filterHotels() {
    const searchTerm = document.getElementById("hotel-search-filter").value.toLowerCase().trim();
    
    // Set filtering state
    isFiltering = searchTerm !== '';
    
    if (searchTerm === '') {
        // If no search term, show all hotels
        filteredHotels = allHotels;
        document.getElementById("load-more-container").style.display = "block";
    } else {
        // Filter hotels based on search term
        filteredHotels = allHotels.filter(hotel => {
            const hotelName = hotel.name?.toLowerCase() || '';
            const hotelAddress = hotel.address?.toLowerCase() || '';
            const hotelCity = hotel.city?.toLowerCase() || '';
            const hotelDescription = hotel.description?.toLowerCase() || '';
            
            return hotelName.includes(searchTerm) || 
                   hotelAddress.includes(searchTerm) || 
                   hotelCity.includes(searchTerm) ||
                   hotelDescription.includes(searchTerm);
        });
        
        // Hide load more when filtering
        document.getElementById("load-more-container").style.display = "none";
    }
    
    // Update display with filtered results ONLY
    const searchInfo = {
        city: currentCity,
        country: currentCountry,
        totalHotels: filteredHotels.length
    };
    
    document.getElementById("hotels").innerHTML = "";
    displaySearchResults(filteredHotels, searchInfo);
    updateFilterStats();
}

function updateFilterStats() {
    const filterStats = document.getElementById("filter-stats");
    const searchTerm = document.getElementById("hotel-search-filter").value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filterStats.innerHTML = `Showing all ${allHotels.length} hotels`;
    } else {
        filterStats.innerHTML = `Showing ${filteredHotels.length} of ${allHotels.length} hotels matching "${searchTerm}"`;
    }
}

function displaySearchResults(hotels, searchInfo) {
    const resultsHeader = document.getElementById("results-header");
    const hotelsGrid = document.getElementById("hotels");

    // Show results header
    const isFiltered = isFiltering || filteredHotels.length !== allHotels.length;
    
    resultsHeader.innerHTML = `
        <div class="results-header-content">
            <h2>🏨 Found ${hotels.length} Hotels in ${searchInfo.city}, ${searchInfo.country}</h2>
            <p class="results-subtitle">${isFiltered ? 'Filtered results' : 'All hotels shown with real images'}</p>
            ${searchInfo.hasMore && !isFiltering ? '<p class="results-more">💡 Scroll down to load more hotels</p>' : ''}
        </div>
    `;

    // Display hotels with REAL images
    if (hotels.length === 0) {
        hotelsGrid.innerHTML = `
            <div class="no-results">
                <h3>🔍 No hotels found</h3>
                <p>Try adjusting your search criteria or filter</p>
            </div>
        `;
    } else {
        hotelsGrid.innerHTML = hotels.map(hotel => createHotelCard(hotel, searchInfo)).join('');
    }

    // Show results section
    document.getElementById("search-results").style.display = "block";
}

function appendSearchResults(hotels, searchInfo) {
    const hotelsGrid = document.getElementById("hotels");
    hotelsGrid.innerHTML += hotels.map(hotel => createHotelCard(hotel, searchInfo)).join('');
}

function createHotelCard(hotel, searchInfo) {
    let hotelImageUrl = '';
    let imageCount = 0;

    // USE REAL HOTEL IMAGES - same as hotel-details page
    if (hotel.images && hotel.images.length > 0) {
        const firstImage = hotel.images[0];
        hotelImageUrl = firstImage.url || firstImage;
        imageCount = hotel.images.length;
    }

    // If no images available, show a placeholder WITHOUT Unsplash
    if (!hotelImageUrl) {
        hotelImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDE3NVYxNzVIMTI1VjEyNVoiIGZpbGw9IiNEN0Q4REEiLz4KPHBhdGggZD0iTTE4Ny41IDEyNUgyNzVWMTc1SDE4Ny41VjEyNVoiIGZpbGw9IiNEN0Q4REEiLz4KPHBhdGggZD0iTTEyNSAxODcuNUgyNzVWMjM3LjVIMTI1VjE4Ny41WiIgZmlsbD0iI0Q3RDhEQSIvPgo8L3N2Zz4K';
    }

    return `
        <div class="hotel-card" onclick="viewHotelDetails('${hotel.id}', '${searchInfo.city}', '${searchInfo.country}')">
            <div class="hotel-image">
                <img src="${hotelImageUrl}" 
                     alt="${hotel.name}" 
                     loading="lazy"
                     onerror="handleImageError(this)">
                ${imageCount > 1 ? `<div class="image-count">📸 ${imageCount} photos</div>` : ''}
            </div>
            <div class="hotel-info">
                <h3 class="hotel-name">${hotel.name}</h3>
                <p class="hotel-address">📍 ${hotel.address || `${hotel.city}, ${hotel.country}`}</p>
                <div class="hotel-rating">
                    ${generateStarRating(hotel.rating)}
                    <span class="rating-text">${hotel.rating}/5</span>
                </div>
                <div class="hotel-amenities">
                    ${(hotel.amenities || []).slice(0, 3).map(amenity => 
                        `<span class="amenity-tag">${amenity}</span>`
                    ).join('')}
                    ${hotel.amenities && hotel.amenities.length > 3 ? `<span class="amenity-tag">+${hotel.amenities.length - 3} more</span>` : ''}
                </div>
                <p class="hotel-description">${hotel.description || 'A wonderful hotel offering great amenities and services.'}</p>
                <button class="view-rates-btn">View Rooms & Prices →</button>
            </div>
        </div>
    `;
}

function handleImageError(imgElement) {
    console.log(`❌ Hotel image failed to load`);
    // Use SVG placeholder instead of Unsplash
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDE3NVYxNzVIMTI1VjEyNVoiIGZpbGw9IiNEN0Q4REEiLz4KPHBhdGggZD0iTTE4Ny41IDEyNUgyNzVWMTc1SDE4Ny41VjEyNVoiIGZpbGw9IiNEN0Q4REEiLz4KPHBhdGggZD0iTTEyNSAxODcuNUgyNzVWMjM3LjVIMTI1VjE4Ny41WiIgZmlsbD0iI0Q3RDhEQSIvPgo8L3N2Zz4K';
}

function loadMoreHotels() {
    if (isLoadingMore || isFiltering) return;
    
    isLoadingMore = true;
    currentPage++;
    
    document.getElementById("load-more-btn").disabled = true;
    document.getElementById("load-more-btn").innerHTML = '<span class="btn-icon">⏳</span> Loading more hotels...';
    
    searchHotels(false);
}

function generateStarRating(rating) {
    const numericRating = Math.max(1, Math.min(5, parseFloat(rating) || 4.0));
    const fullStars = Math.floor(numericRating);
    return '⭐'.repeat(fullStars);
}

async function viewHotelDetails(hotelId, city, country) {
    console.log(`🏨 Loading details for hotel: ${hotelId}`);
    
    const environment = document.getElementById("environment").value;
    window.location.href = `hotel-details.html?hotelId=${hotelId}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&environment=${environment}`;
}

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <div>
                <h3>Search Failed</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    errorDiv.style.display = "block";
}

// Enhanced city suggestions
function setCity(cityName) {
    document.getElementById('city').value = cityName;
    document.getElementById('city').focus();
}

// Handle Enter key press
document.getElementById('city').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchHotels(true);
    }
});

document.getElementById('country').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchHotels(true);
    }
});

// Handle filter input
document.getElementById('hotel-search-filter').addEventListener('input', filterHotels);

// Focus on city input when page loads
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('city').focus();
});

// Infinite scroll functionality - DISABLE when filtering
let scrollTimeout;
window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(function() {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer.style.display === 'block' && !isLoadingMore && !isFiltering) {
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight - 100;
            
            if (scrollPosition >= pageHeight) {
                loadMoreHotels();
            }
        }
    }, 100);
});