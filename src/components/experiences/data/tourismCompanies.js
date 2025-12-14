export const tourismCompanies = {
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
    // Add more companies as needed
  ]
};

export const getTypeIcon = (type) => {
  const icons = { hotel: "🏨", travel: "✈️", airline: "🛫", tour: "🚌" };
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