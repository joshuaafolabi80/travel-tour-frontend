// tourismCompanies.js - REAL companies with DIRECT links (no iframes)
export const tourismCompanies = {
  // 🏨 HOTELS & RESORTS
  hotels: [
    {
      id: 1,
      name: "Marriott International",
      type: "hotel",
      country: "Global",
      website: "https://jobs.marriott.com/",
      careerPage: "https://jobs.marriott.com/marriott/search/?q=&locationsearch=Nigeria",
      description: "World's largest hotel chain with 30+ brands",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Marriott_International_logo_2019.svg/300px-Marriott_International_logo_2019.svg.png",
      verified: true,
      opportunities: ["Internships", "Management Training", "Front Desk", "Food & Beverage"],
      lastUpdated: "2024-01-15"
    },
    {
      id: 2,
      name: "Hilton Worldwide",
      type: "hotel",
      country: "Global",
      website: "https://jobs.hilton.com/",
      careerPage: "https://jobs.hilton.com/",
      description: "Leading global hospitality company",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Hilton_Hotels_%26_Resorts_logo.svg/300px-Hilton_Hotels_%26_Resorts_logo.svg.png",
      verified: true,
      opportunities: ["Graduate Programs", "Hotel Operations", "Sales & Marketing", "Culinary"],
      lastUpdated: "2024-01-10"
    },
    {
      id: 3,
      name: "Transcorp Hilton Abuja",
      type: "hotel",
      country: "Nigeria",
      website: "https://transcorphilton.com/careers",
      careerPage: "https://transcorphilton.com/careers",
      description: "5-star luxury hotel in Nigeria's capital",
      logo: "https://transcorphilton.com/wp-content/uploads/2021/08/transcorp-hilton-logo.png",
      verified: true,
      opportunities: ["Front Office", "Housekeeping", "Kitchen", "Event Management"],
      lastUpdated: "2024-01-05"
    }
  ],

  // ✈️ TRAVEL AGENCIES
  travel: [
    {
      id: 4,
      name: "Wakanow",
      type: "travel",
      country: "Nigeria",
      website: "https://wakanow.com/careers",
      careerPage: "https://wakanow.com/careers",
      description: "Leading online travel agency in West Africa",
      logo: "https://wakanow.com/assets/images/logo.svg",
      verified: true,
      opportunities: ["Travel Consultant", "Customer Service", "Marketing", "IT"],
      lastUpdated: "2024-01-12"
    },
    {
      id: 5,
      name: "Travelstart Nigeria",
      type: "travel",
      country: "Nigeria",
      website: "https://www.travelstart.com.ng/careers",
      careerPage: "https://www.travelstart.com.ng/careers",
      description: "Online travel booking platform",
      verified: true,
      opportunities: ["Sales Executive", "Operations", "Digital Marketing", "Finance"],
      lastUpdated: "2024-01-08"
    }
  ],

  // 🛫 AIRLINES
  airlines: [
    {
      id: 6,
      name: "Air Peace",
      type: "airline",
      country: "Nigeria",
      website: "https://flyairpeace.com/careers/",
      careerPage: "https://flyairpeace.com/careers/",
      description: "Nigeria's largest airline",
      logo: "https://flyairpeace.com/wp-content/uploads/2020/01/AP-Logo-3.png",
      verified: true,
      opportunities: ["Cabin Crew", "Ground Staff", "Pilot Training", "Engineering"],
      lastUpdated: "2024-01-14"
    },
    {
      id: 7,
      name: "Arik Air",
      type: "airline",
      country: "Nigeria",
      website: "https://arikair.com/careers",
      careerPage: "https://arikair.com/careers",
      description: "West Africa's largest carrier",
      verified: true,
      opportunities: ["Flight Operations", "Maintenance", "Customer Service", "Cargo"],
      lastUpdated: "2024-01-09"
    }
  ],

  // 🚌 TOUR OPERATORS
  tours: [
    {
      id: 8,
      name: "Travel Counselors Nigeria",
      type: "tour",
      country: "Nigeria",
      website: "https://travelcounsellors.com.ng/careers",
      careerPage: "https://travelcounsellors.com.ng/careers",
      description: "Travel management company",
      verified: true,
      opportunities: ["Tour Guide", "Travel Planning", "Client Relations", "Destination Expert"],
      lastUpdated: "2024-01-07"
    },
    {
      id: 9,
      name: "TravelBeta",
      type: "tour",
      country: "Nigeria",
      website: "https://travelbeta.com/careers",
      careerPage: "https://travelbeta.com/careers",
      description: "Flight and hotel booking platform",
      verified: true,
      opportunities: ["Business Development", "Technology", "Customer Support", "Partnerships"],
      lastUpdated: "2024-01-11"
    }
  ]
};

// ✅ FIXED: Helper functions - ALL functions must be exported
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

// ✅ FIXED: Added missing getTypeColor function
export const getTypeColor = (type) => {
  const colors = {
    hotel: "primary",
    travel: "success",
    airline: "info",
    tour: "warning"
  };
  return colors[type] || "secondary";
};