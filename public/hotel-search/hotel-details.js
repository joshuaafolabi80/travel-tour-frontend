// travel-tour-frontend/public/hotel-search/hotel-details.js

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get('hotelId');
const city = urlParams.get('city');
const country = urlParams.get('country');
const environment = urlParams.get('environment');

// Load hotel details when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (hotelId) {
        loadHotelDetails();
    } else {
        showError("No hotel ID provided");
    }
});

async function loadHotelDetails() {
    showLoader("Loading hotel details...");
    
    try {
        const response = await fetch(
            `http://localhost:3000/hotel-full-details?hotelId=${hotelId}&environment=${environment}`
        );
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || "Failed to load hotel details");
        }
        
        displayHotelDetails(data.hotel);
        hideLoader();
        
    } catch (error) {
        console.error("❌ Error loading hotel details:", error);
        hideLoader();
        showError("Failed to load hotel details: " + error.message);
    }
}

function displayHotelDetails(hotel) {
    // Update basic hotel info
    const hotelHeader = document.getElementById('hotel-basic-info');
    hotelHeader.innerHTML = `
        <h1>${hotel.name}</h1>
        <p class="hotel-address">📍 ${hotel.address || `${hotel.city}, ${hotel.country}`}</p>
        <div class="hotel-rating">
            ${generateStarRating(hotel.rating)}
            <span class="rating-text">${hotel.rating}/5</span>
        </div>
        <p class="hotel-description">${hotel.description || 'A wonderful hotel offering great amenities and services.'}</p>
    `;
    
    // Display hotel images
    const hotelGallery = document.getElementById('hotel-gallery');
    const images = hotel.hotelImages || [];
    
    if (images.length === 0) {
        hotelGallery.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p>No images available for this hotel</p>
            </div>
        `;
    } else {
        // Show up to 5 images in a gallery layout
        const mainImage = images[0];
        const otherImages = images.slice(1, 5);
        
        let galleryHTML = `
            <div class="main-image">
                <img src="${mainImage.url}" alt="${hotel.name}" class="gallery-image" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
            </div>
        `;
        
        otherImages.forEach((image, index) => {
            galleryHTML += `
                <div class="side-image">
                    <img src="${image.url}" alt="${hotel.name}" class="gallery-image" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                </div>
            `;
        });
        
        hotelGallery.innerHTML = galleryHTML;
    }
}

async function searchHotelRates() {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const adults = document.getElementById('adults').value;
    
    if (!checkin || !checkout) {
        showError("Please select both check-in and check-out dates");
        return;
    }
    
    showLoader("Searching for available rooms...");
    
    try {
        const response = await fetch(
            `http://localhost:3000/hotel-rates?hotelId=${hotelId}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&environment=${environment}`
        );
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || "No rates available");
        }
        
        displayHotelRates(data.rates);
        hideLoader();
        
    } catch (error) {
        console.error("❌ Error loading hotel rates:", error);
        hideLoader();
        showError("No rooms available for the selected dates. Please try different dates.");
    }
}

function displayHotelRates(rates) {
    const ratesContainer = document.getElementById('rates-container');
    
    if (!rates || rates.length === 0) {
        ratesContainer.innerHTML = `
            <div class="no-rates">
                <h3>😔 No Rooms Available</h3>
                <p>No rooms available for the selected dates. Please try different dates or check back later.</p>
            </div>
        `;
        return;
    }
    
    let ratesHTML = '';
    
    rates.forEach(hotelRate => {
        hotelRate.roomTypes.forEach(roomType => {
            roomType.rates.forEach(rate => {
                const totalAmount = rate.retailRate.total[0].amount;
                const currency = rate.retailRate.total[0].currency;
                const originalAmount = rate.retailRate.suggestedSellingPrice[0].amount;
                
                ratesHTML += `
                    <div class="rate-card">
                        <div class="rate-header">
                            <div>
                                <h3>${rate.name}</h3>
                                <p>${roomType.name}</p>
                                <p>Board: ${rate.boardName}</p>
                                <p class="${rate.cancellationPolicies.refundableTag === 'RFN' ? 'refundable' : 'non-refundable'}">
                                    ${rate.cancellationPolicies.refundableTag === 'RFN' ? '🔄 Refundable' : '❌ Non-refundable'}
                                </p>
                            </div>
                            <div class="rate-price">
                                <s>${originalAmount} ${currency}</s>
                                <div>${totalAmount} ${currency}</div>
                                <small>per night</small>
                            </div>
                        </div>
                        <button class="view-rates-btn" onclick="proceedToBooking('${roomType.offerId}')">
                            Book Now
                        </button>
                    </div>
                `;
            });
        });
    });
    
    ratesContainer.innerHTML = ratesHTML;
}

function generateStarRating(rating) {
    const numericRating = Math.max(1, Math.min(5, parseFloat(rating) || 4.0));
    const fullStars = Math.floor(numericRating);
    
    return '⭐'.repeat(fullStars);
}

function showLoader(text = "Loading...") {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loader-text').textContent = text;
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById("error-message");
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <div>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    errorDiv.style.display = "block";
}

// Add your existing proceedToBooking and payment functions here
async function proceedToBooking(rateId) {
    console.log("Proceeding to booking for rate ID:", rateId);
    
    // Your existing booking logic here
    const guestFirstName = prompt("Enter your first name:");
    const guestLastName = prompt("Enter your last name:");
    const guestEmail = prompt("Enter your email:");
    
    if (!guestFirstName || !guestLastName || !guestEmail) {
        alert("Please fill in all guest details");
        return;
    }
    
    showLoader("Processing booking...");
    
    try {
        const bodyData = {
            environment,
            rateId
        };
        
        const prebookResponse = await fetch(`http://localhost:3000/prebook`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
        });
        
        const prebookData = await prebookResponse.json();
        
        if (!prebookData.success) {
            throw new Error("Prebook failed");
        }
        
        initializePaymentForm(
            prebookData.success.data.secretKey,
            prebookData.success.data.prebookId,
            prebookData.success.data.transactionId,
            guestFirstName,
            guestLastName,
            guestEmail
        );
        
    } catch (error) {
        console.error("Error in booking process:", error);
        hideLoader();
        showError("Booking failed: " + error.message);
    }
}

function initializePaymentForm(clientSecret, prebookId, transactionId, guestFirstName, guestLastName, guestEmail) {
    const publicKey = environment === "sandbox" ? "sandbox" : "live";
    
    liteAPIConfig = {
        publicKey: publicKey,
        appearance: {
            theme: "flat",
        },
        options: {
            business: {
                name: "Africa Hotel Finder",
            },
        },
        targetElement: "#pe",
        secretKey: `${clientSecret}`,
        returnUrl: `http://localhost:3000/book/?prebookId=${prebookId}&transactionId=${transactionId}&guestFirstName=${encodeURIComponent(guestFirstName)}&guestLastName=${encodeURIComponent(guestLastName)}&guestEmail=${encodeURIComponent(guestEmail)}&environment=${encodeURIComponent(environment)}`,
    };
    liteAPIPayment = new LiteAPIPayment(liteAPIConfig);
    liteAPIPayment.handlePayment();
}