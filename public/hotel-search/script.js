// travel-tour-frontend/public/hotel-search/script.js

// --- Global State Variables ---
let currentPage = 0;
let currentCity = '';
let currentCountry = '';
let currentEnvironment = 'sandbox';
let allHotels = []; // Store all hotels for filtering
let filteredHotels = []; // Store filtered hotels
let isFiltering = false;
let isLoadingMore = false;
let selectedHotelId = null;

// --- Utility Functions ---

function getBaseUrl() {
    return 'https://travel-tour-academy-backend.onrender.com';
}

function generateStarRating(rating) {
    const numericRating = Math.max(1, Math.min(5, parseFloat(rating) || 4.0));
    const fullStars = Math.floor(numericRating);
    return '⭐'.repeat(fullStars);
}

function handleImageError(imgElement) {
    console.log(`❌ Hotel image failed to load`);
    // Use a clean SVG placeholder
    imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFM0U0RTUiLz48cGF0aCBkPSJNMjAwIDE0NUMtMzAuNzMzNCAyNTAuNTE3IDE2MC4yNjcgMzYwLjUxNyAyMDQgMjY0QzIyMS43MyAyMzMuMTggMjgwLjMgMjIyLjM3IDI1OC41IDE5MC41QzIyMC43IDEyMy43IDI5MC41IDE0Ni42NyAxOTggNjguNzMzNEMxNDYuNTcgLTQ4LjI2NjYgMjI4LjQ0IDE0Mi42MjggMTU5LjUgMjI0LjVDOTAuNTYgMzA2LjM3MiA1MjMuMzEgMjYyLjEzIDQwMCAxNDUiIHN0cm9rZT0iI0NlQjVEMSIgc3Ryb2tlLXdpZHRoPSIyMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';
    imgElement.onerror = null; // Prevent infinite loop
}

function showError(message, targetId = "error-message") {
    const errorDiv = document.getElementById(targetId);
    if (!errorDiv) return;
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <div>
                <h3>Operation Failed</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    errorDiv.style.display = "block";
}

function hideError(targetId = "error-message") {
    const errorDiv = document.getElementById(targetId);
    if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.innerHTML = "";
    }
}

function showLoader(text, targetId = "loader") {
    const loaderDiv = document.getElementById(targetId);
    const loaderText = document.getElementById(targetId === "loader" ? "loader-text" : "searching-city");
    if (loaderDiv) {
        if (loaderText) loaderText.textContent = text;
        loaderDiv.style.display = "flex";
    }
}

function hideLoader(targetId = "loader") {
    const loaderDiv = document.getElementById(targetId);
    if (loaderDiv) {
        loaderDiv.style.display = "none";
    }
}


// --- Hotel Search Logic (index.html) ---

async function searchHotels(resetPage = true) {
    const city = document.getElementById("city").value.trim();
    const country = document.getElementById("country").value.trim().toUpperCase();
    const environment = document.getElementById("environment").value;

    // 1. Input Validation
    if (!city || !country) {
        showError("Please enter both a City Name and a 2-letter Country Code.");
        return;
    }
    hideError();

    // 2. State Reset
    if (resetPage) {
        currentPage = 0;
        currentCity = city;
        currentCountry = country;
        currentEnvironment = environment;
        allHotels = [];
        filteredHotels = [];
        isFiltering = false;
        document.getElementById("hotel-search-filter").value = "";
        document.getElementById("hotels").innerHTML = "";
        document.getElementById("results-header").innerHTML = "";
        document.getElementById("hotel-search-filter-container").style.display = "none";
    }

    // 3. UI Update (Loading)
    showLoader(`hotels in ${city}, ${country}...`, "searching-city");
    document.getElementById("load-more-container").style.display = "none";
    document.getElementById("search-button").disabled = true;

    try {
        const url = `${getBaseUrl()}/api/search-hotels?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&environment=${environment}&page=${currentPage}`;
        console.log(`🔍 Searching hotels: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication failed. Hotel search is now public - please refresh and try again.");
            }
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        // 4. Handle Response
        hideLoader();
        isLoadingMore = false;
        document.getElementById("search-button").disabled = false;
        
        if (!data.success) {
            showError(data.message || `No hotels found in ${city}, ${country}.`);
            return;
        }

        if (!data.hotels || data.hotels.length === 0) {
            if (resetPage) showError(`No hotels found in ${city}, ${country}.`);
            return;
        }

        // 5. Store/Update Hotels
        if (!isFiltering) {
            if (resetPage) {
                allHotels = data.hotels;
            } else {
                allHotels.push(...data.hotels);
            }
            filteredHotels = allHotels;
        }

        // 6. Display Results
        const hotelsToDisplay = isFiltering ? filteredHotels : data.hotels;
        if (resetPage) {
            displaySearchResults(hotelsToDisplay, data.searchInfo);
        } else {
            appendSearchResults(hotelsToDisplay);
        }

        // 7. Filter Bar Update
        if (allHotels.length > 0) {
            document.getElementById("hotel-search-filter-container").style.display = "flex";
            updateFilterStats();
        }

        // 8. Load More Button Update
        if (data.searchInfo.hasMore && !isFiltering) {
            document.getElementById("load-more-container").style.display = "block";
            document.getElementById("load-more-btn").disabled = false;
        }

    } catch (error) {
        console.error("❌ Error fetching hotels:", error);
        hideLoader();
        isLoadingMore = false;
        document.getElementById("search-button").disabled = false;
        showError(error.message || "Failed to connect to the server. Please check your network or backend service.");
    }
}

function displaySearchResults(hotels, searchInfo) {
    const resultsHeader = document.getElementById("results-header");
    const hotelsGrid = document.getElementById("hotels");
    const isFiltered = isFiltering || filteredHotels.length !== allHotels.length;
    
    document.getElementById("search-results").style.display = "block";
    
    resultsHeader.innerHTML = `
        <div class="results-header-content">
            <h2>🏨 Found ${hotels.length} Hotels in ${searchInfo.city}, ${searchInfo.country}</h2>
            <p class="results-subtitle">${isFiltered ? 'Filtered results' : 'Scroll to load more'}</p>
        </div>
    `;

    if (hotels.length === 0) {
        hotelsGrid.innerHTML = `<div class="no-results"><h3>🔍 No hotels found</h3><p>Try adjusting your search criteria or filter.</p></div>`;
    } else {
        hotelsGrid.innerHTML = hotels.map(hotel => createHotelCard(hotel)).join('');
    }
}

function appendSearchResults(hotels) {
    const hotelsGrid = document.getElementById("hotels");
    hotelsGrid.innerHTML += hotels.map(hotel => createHotelCard(hotel)).join('');
}

function createHotelCard(hotel) {
    let hotelImageUrl = hotel.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNFM0U0RTUiLz48cGF0aCBkPSJNMjAwIDE0NUMtMzAuNzMzNCAyNTAuNTE3IDE2MC4yNjcgMzYwLjUxNyAyMDQgMjY0QzIyMS43MyAyMzMuMTggMjgwLjMgMjIyLjM3IDI1OC41IDE5MC41QzIyMC43IDEyMy43IDI5MC41IDE0Ni42NyAxOTggNjguNzMzNEMxNDYuNTcgLTQ4LjI2NjYgMjI4LjQ0IDE0Mi42MjggMTU5LjUgMjI0LjVDOTAuNTYgMzA2LjM3MiA1MjMuMzEgMjYyLjEzIDQwMCAxNDUiIHN0cm9rZT0iI0NlQjVEMSIgc3Ryb2tlLXdpZHRoPSIyMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+';
    const imageCount = hotel.images?.length || 0;
    const amenities = (hotel.amenities || []).slice(0, 3);

    return `
        <div class="hotel-card" onclick="viewHotelDetails('${hotel.id}', '${currentCity}', '${currentCountry}')">
            <div class="hotel-card__image-container">
                <img src="${hotelImageUrl}" 
                     alt="${hotel.name}" 
                     loading="lazy"
                     onerror="handleImageError(this)"
                     class="hotel-card__image">
                ${imageCount > 1 ? `<div class="hotel-card__image-count">📸 ${imageCount}</div>` : ''}
            </div>
            <div class="hotel-card__info">
                <h3 class="hotel-card__name">${hotel.name}</h3>
                <p class="hotel-card__address">📍 ${hotel.address || `${hotel.city}, ${hotel.country}`}</p>
                <div class="hotel-card__rating">
                    ${generateStarRating(hotel.rating)}
                    <span class="rating-text">${hotel.rating || '4.0'}/5</span>
                </div>
                <div class="hotel-card__amenities">
                    ${amenities.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
                    ${hotel.amenities && hotel.amenities.length > 3 ? `<span class="amenity-tag amenity-tag--more">+${hotel.amenities.length - 3}</span>` : ''}
                </div>
                <button class="button button--view-rates">View Rooms & Prices →</button>
            </div>
        </div>
    `;
}

function filterHotels() {
    const searchTerm = document.getElementById("hotel-search-filter").value.toLowerCase().trim();
    
    isFiltering = searchTerm !== '';
    
    if (searchTerm === '') {
        filteredHotels = allHotels;
        document.getElementById("load-more-container").style.display = "block";
    } else {
        filteredHotels = allHotels.filter(hotel => {
            const searchFields = [hotel.name, hotel.address, hotel.city, hotel.description].map(f => (f || '').toLowerCase());
            return searchFields.some(field => field.includes(searchTerm));
        });
        
        // Hide load more when filtering
        document.getElementById("load-more-container").style.display = "none";
    }
    
    const searchInfo = { city: currentCity, country: currentCountry, totalHotels: filteredHotels.length };
    
    document.getElementById("hotels").innerHTML = "";
    displaySearchResults(filteredHotels, searchInfo);
    updateFilterStats();
}

function updateFilterStats() {
    const filterStats = document.getElementById("filter-stats");
    const searchTerm = document.getElementById("hotel-search-filter").value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filterStats.innerHTML = `Showing all **${allHotels.length}** hotels.`;
    } else {
        filterStats.innerHTML = `Showing **${filteredHotels.length}** of ${allHotels.length} hotels matching "**${searchTerm}**"`;
    }
}

function loadMoreHotels() {
    if (isLoadingMore || isFiltering) return;
    
    isLoadingMore = true;
    currentPage++;
    
    document.getElementById("load-more-btn").disabled = true;
    document.getElementById("load-more-btn").innerHTML = '<span class="button__icon">⏳</span> Loading more hotels...';
    
    searchHotels(false);
}

function viewHotelDetails(hotelId, city, country) {
    console.log(`🏨 Loading details for hotel: ${hotelId}`);
    const environment = document.getElementById("environment")?.value || currentEnvironment;
    window.location.href = `hotel-details.html?hotelId=${hotelId}&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&environment=${environment}`;
}

// --- Hotel Details Logic (hotel-details.html) ---

function initializeDetailsPage() {
    const params = new URLSearchParams(window.location.search);
    selectedHotelId = params.get('hotelId');
    currentCity = params.get('city');
    currentCountry = params.get('country');
    currentEnvironment = params.get('environment');

    if (!selectedHotelId) {
        showError("Hotel ID not found in URL. Returning to search.", "error-message");
        setTimeout(() => window.location.href = 'index.html', 3000);
        return;
    }

    // Set default dates for the rate search
    const today = new Date();
    const checkin = new Date(today);
    const checkout = new Date(today);
    checkout.setDate(today.getDate() + 1); // Tomorrow

    const formatDate = (date) => date.toISOString().split('T')[0];
    document.getElementById('checkin').value = formatDate(checkin);
    document.getElementById('checkout').value = formatDate(checkout);

    fetchHotelDetails(selectedHotelId);
}

async function fetchHotelDetails(hotelId) {
    showLoader("Loading hotel details...", "loader-text");
    hideError("error-message");

    try {
        const url = `${getBaseUrl()}/api/get-hotel-details?hotelId=${hotelId}&environment=${currentEnvironment}`;
        console.log(`🔍 Fetching hotel details: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication failed. Hotel details are now public - please refresh and try again.");
            }
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        hideLoader();

        if (!data.success || !data.hotel) {
            showError(data.message || "Failed to load hotel details.");
            return;
        }

        renderHotelDetails(data.hotel);
        // Automatically search rates on load using default dates
        searchHotelRates(true);

    } catch (error) {
        console.error("❌ Error fetching hotel details:", error);
        hideLoader();
        showError(error.message || "Failed to fetch hotel details. Please check your connection.");
    }
}

function renderHotelDetails(hotel) {
    // 1. Header Info
    const headerInfo = document.getElementById('hotel-basic-info');
    headerInfo.innerHTML = `
        <h1 class="hotel-details__name">${hotel.name}</h1>
        <p class="hotel-details__address">📍 ${hotel.address || `${hotel.city}, ${hotel.country}`}</p>
        <div class="hotel-details__rating">
            ${generateStarRating(hotel.rating)}
            <span class="rating-text">${hotel.rating || '4.0'}/5 Star Rating</span>
        </div>
    `;

    // 2. Description & Amenities
    document.getElementById('hotel-long-description').textContent = hotel.description || 'No detailed description available.';
    const amenitiesList = document.getElementById('hotel-amenities-list');
    if (hotel.amenities && hotel.amenities.length > 0) {
        amenitiesList.innerHTML = `
            <h3>Top Amenities</h3>
            <ul>
                ${hotel.amenities.slice(0, 10).map(a => `<li>${a}</li>`).join('')}
            </ul>
        `;
    } else {
        amenitiesList.innerHTML = `<p>No amenities listed.</p>`;
    }

    // 3. Image Gallery
    const gallery = document.getElementById('hotel-gallery');
    gallery.innerHTML = '';
    
    if (hotel.images && hotel.images.length > 0) {
        const mainImage = hotel.images[0].url;
        const subImages = hotel.images.slice(1, 4).map(img => img.url);

        gallery.innerHTML = `
            <div class="main-image">
                <img src="${mainImage}" alt="${hotel.name} - Main Image" class="gallery-image">
            </div>
            ${subImages.map(img => `
                <div class="sub-image">
                    <img src="${img}" alt="${hotel.name} - Gallery Image" class="gallery-image">
                </div>
            `).join('')}
             ${hotel.images.length > 4 ? `<div class="sub-image gallery-more-overlay"><p>+${hotel.images.length - 4} More Photos</p></div>` : ''}
        `;
    } else {
        gallery.innerHTML = `<div class="no-results" style="grid-column: 1 / -1;">No image gallery available.</div>`;
    }
}

async function searchHotelRates(isInitial = false) {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const adults = document.getElementById('adults').value;
    const ratesContainer = document.getElementById('rates-container');
    const loaderText = isInitial ? "Checking default rates..." : "Searching for rooms...";
    
    ratesContainer.innerHTML = '';
    showLoader(loaderText, "loader-text");
    hideError("error-message");

    try {
        const url = `${getBaseUrl()}/api/get-hotel-rates?hotelId=${selectedHotelId}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&environment=${currentEnvironment}`;
        console.log(`🔍 Fetching hotel rates: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Authentication failed. Hotel rates are now public - please refresh and try again.");
            }
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();

        hideLoader();

        if (!data.success || !data.rates || data.rates.length === 0) {
            ratesContainer.innerHTML = `<div class="no-rates"><h3>No Rooms Available</h3><p>${data.message || 'No rooms matched your search criteria. Try different dates or occupancy.'}</p></div>`;
            return;
        }

        renderHotelRates(data.rates);

    } catch (error) {
        console.error("❌ Error fetching rates:", error);
        hideLoader();
        showError(error.message || "Failed to fetch rates. Please check your connection.", "error-message");
    }
}

function renderHotelRates(rates) {
    const ratesContainer = document.getElementById('rates-container');
    ratesContainer.innerHTML = rates.map(rate => createRateCard(rate)).join('');
}

function createRateCard(rate) {
    return `
        <div class="rate-card">
            <div class="rate-header">
                <h4 class="rate-room-type">${rate.roomType} (${rate.boardType || 'Room Only'})</h4>
                <div class="rate-price">${rate.currency} ${rate.totalPrice.toFixed(2)}</div>
            </div>
            <p class="rate-description">${rate.description || 'Standard room with excellent value.'}</p>
            <div class="rate-details">
                <span class="rate-cancellation">${rate.isRefundable ? '✅ Free Cancellation' : '❌ Non-Refundable'}</span>
                <span class="rate-supplier">Supplied by: **${rate.supplier || 'LiteAPI'}**</span>
            </div>
            <button class="button button--book" onclick="startBooking('${rate.rateId}', '${rate.hotelId}')">Book Now →</button>
        </div>
    `;
}

function startBooking(rateId, hotelId) {
    alert(`Booking functionality would be implemented here for rate: ${rateId} at hotel: ${hotelId}`);
    // In a real implementation, this would redirect to a booking page or open a booking modal
}

// --- Initialization & Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we are on and initialize
    if (document.querySelector('.page-container')) {
        // index.html
        document.getElementById('hotel-search-filter').addEventListener('input', filterHotels);
        document.getElementById('city').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchHotels(true); });
        document.getElementById('country').addEventListener('keypress', (e) => { if (e.key === 'Enter') searchHotels(true); });
        
        // City tag clicks
        document.querySelectorAll('.city-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                document.getElementById('city').value = this.dataset.city;
                document.getElementById('country').value = this.dataset.country;
                searchHotels(true);
            });
        });

        // Infinite Scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const loadMoreContainer = document.getElementById('load-more-container');
                if (loadMoreContainer && loadMoreContainer.style.display === 'block' && !isLoadingMore && !isFiltering) {
                    const scrollPosition = window.innerHeight + window.scrollY;
                    const pageHeight = document.documentElement.scrollHeight - 200; // 200px from bottom
                    
                    if (scrollPosition >= pageHeight) {
                        loadMoreHotels();
                    }
                }
            }, 100);
        });

    } else if (document.querySelector('.hotel-details-container')) {
        // hotel-details.html
        initializeDetailsPage();
        
        // Add event listeners for hotel details page
        document.getElementById('search-rates-btn')?.addEventListener('click', () => searchHotelRates(false));
        document.getElementById('back-to-search')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});