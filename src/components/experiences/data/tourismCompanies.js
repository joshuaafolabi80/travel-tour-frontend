// tourismCompanies.js - REAL companies with DIRECT links (no iframes)
// tourismCompanies.js - Updated with verified URLs (as of Nov 2024)
export const tourismCompanies = {
  // 🏨 HOTELS & RESORTS
  hotel: [
    {
      id: 1,
      name: "Marriott International",
      type: "hotel",
      country: "Global",
      website: "https://www.marriott.com/",
      careerPage: "https://careers.marriott.com/marriott/search-jobs",
      description: "World's largest hotel chain with 30+ brands, offering global opportunities.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Marriott_Logo.svg/2560px-Marriott_Logo.svg.png",
      verified: true,
      opportunities: ["Internships", "Management Training", "Front Desk", "Food & Beverage", "Revenue Management"],
      lastUpdated: "2024-11-22"
    },
    {
      id: 2,
      name: "Hilton Worldwide",
      type: "hotel",
      country: "Global",
      website: "https://www.hilton.com/",
      careerPage: "https://jobs.hilton.com/us/en",
      description: "Leading global hospitality company managing 18 world-class brands.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Hilton_Hotels_%26_Resorts_logo.svg/2560px-Hilton_Hotels_%26_Resorts_logo.svg.png",
      verified: true,
      opportunities: ["Graduate Programs", "Hotel Operations", "Sales & Marketing", "Culinary", "Engineering"],
      lastUpdated: "2024-11-22"
    },
    {
      id: 3,
      name: "Transcorp Hilton Abuja",
      type: "hotel",
      country: "Nigeria",
      website: "https://www.hilton.com/en/hotels/abjhitw-transcorp-hilton-abuja/",
      careerPage: "https://jobs.hilton.com/us/en/location/nigeria/24678/24678/125",
      description: "5-star luxury hotel in Nigeria's capital, managed by Hilton Worldwide.",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/Transcorp_Hilton_Abuja_logo.png/220px-Transcorp_Hilton_Abuja_logo.png",
      verified: true,
      opportunities: ["Front Office", "Housekeeping", "Kitchen", "Event Management", "Guest Relations"],
      lastUpdated: "2024-11-22"
    }
  ],

  // ✈️ TRAVEL AGENCIES
  travel: [
    {
      id: 4,
      name: "Wakanow",
      type: "travel",
      country: "Nigeria",
      website: "https://www.wakanow.com/",
      careerPage: "https://www.wakanow.com/ng/careers/",
      description: "Leading online travel agency in West Africa for flights, hotels, and packages.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Wakanow_logo.svg/1280px-Wakanow_logo.svg.png",
      verified: true,
      opportunities: ["Travel Consultant", "Customer Service", "Marketing", "IT", "Business Development"],
      lastUpdated: "2024-11-22"
    },
    {
      id: 5,
      name: "Travelstart Nigeria",
      type: "travel",
      country: "Nigeria",
      website: "https://www.travelstart.com.ng/",
      careerPage: "https://www.travelstart.com.ng/about/careers",
      description: "Online travel booking platform for flights, hotels, and car rentals across Africa.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Travelstart_Logo.svg/1280px-Travelstart_Logo.svg.png",
      verified: true,
      opportunities: ["Sales Executive", "Operations", "Digital Marketing", "Finance", "Product Management"],
      lastUpdated: "2024-11-22"
    }
  ],

  // 🛫 AIRLINES
  airline: [
    {
      id: 6,
      name: "Air Peace",
      type: "airline",
      country: "Nigeria",
      website: "https://flyairpeace.com/",
      careerPage: "https://flyairpeace.com/careers/",
      description: "Nigeria's largest airline with extensive domestic and regional flight network.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Air_Peace_Logo.svg/1280px-Air_Peace_Logo.svg.png",
      verified: true,
      opportunities: ["Cabin Crew", "Ground Staff", "Pilot Training", "Engineering", "Flight Operations"],
      lastUpdated: "2024-11-22"
    },
    {
      id: 7,
      name: "Arik Air",
      type: "airline",
      country: "Nigeria",
      website: "https://arikair.com/",
      careerPage: "https://arikair.com/careers/",
      description: "Major Nigerian airline serving domestic, regional, and international destinations.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Arik_Air_Logo.svg/1280px-Arik_Air_Logo.svg.png",
      verified: true,
      opportunities: ["Flight Operations", "Maintenance", "Customer Service", "Cargo", "Aviation Security"],
      lastUpdated: "2024-11-22"
    }
  ],

  // 🚌 TOUR OPERATORS
  tour: [
    {
      id: 8,
      name: "Travel Counselors Nigeria",
      type: "tour",
      country: "Nigeria",
      website: "https://travelcounsellors.com.ng/",
      careerPage: "https://travelcounsellors.com.ng/careers",
      description: "Travel management company offering personalized tour planning and advisory services.",
      logo: "https://travelcounsellors.com.ng/wp-content/uploads/2021/11/travel-counsellors-logo-2021.png",
      verified: true,
      opportunities: ["Tour Guide", "Travel Planning", "Client Relations", "Destination Expert", "Sales"],
      lastUpdated: "2024-11-22"
    },
    {
      id: 9,
      name: "TravelBeta",
      type: "tour",
      country: "Nigeria",
      website: "https://travelbeta.com/",
      careerPage: "https://travelbeta.com/careers",
      description: "Flight and hotel booking platform with a focus on African travel markets.",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/TravelBeta_Logo.png/1280px-TravelBeta_Logo.png",
      verified: true,
      opportunities: ["Business Development", "Technology", "Customer Support", "Partnerships", "Operations"],
      lastUpdated: "2024-11-22"
    }
  ]
};

// ✅ Helper functions - ALL functions must be exported
export const getTypeIcon = (type) => {
  const icons = {
    hotel: "🏨",
    travel: "✈️",
    airline: "🛫",
    tour: "🚌"
  };
  return icons[type] || "🏢";
};

export const getTypeName = (type) => {
  const names = {
    hotel: "Hotels & Resorts",
    travel: "Travel Agencies",
    airline: "Airlines",
    tour: "Tour Operators"
  };
  return names[type] || "Company";
};

// ✅ Added missing getTypeColor function
export const getTypeColor = (type) => {
  const colors = {
    hotel: "primary",
    travel: "success",
    airline: "info",
    tour: "warning"
  };
  return colors[type] || "secondary";
};