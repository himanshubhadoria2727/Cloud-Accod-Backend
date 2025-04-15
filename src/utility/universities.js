const axios = require('axios');

const API_ENDPOINTS = {
    GOOGLE_PLACES: 'https://maps.googleapis.com/maps/api/place/textsearch/json'
};

const API_KEY = GOOGLE_PLACES_API_KEY; // Replace with your actual Google Places API key

/**
 * Fetch universities from Google Places API based on country and city.
 * 
 * @param {string} country - Country name to filter universities.
 * @param {string} city - City name to filter universities.
 * @returns {Promise<Array>} - Array of universities.
 */
const fetchUniversities = async (country = null, city = null) => {
    try {
        console.log(`Fetching educational institutions from Google Places API...`);
        
        // Fetch both universities and colleges in parallel
        const [universities, colleges] = await Promise.all([
            fetchFromGooglePlaces(formatSearchQuery('university', city, country)),
            fetchFromGooglePlaces(formatSearchQuery('college', city, country))
        ]);
        
        // Combine and remove duplicates
        const combined = removeDuplicates([...universities, ...colleges]);
        
        console.log(`Found ${combined.length} unique educational institutions`);
        return combined;
    } catch (error) {
        console.error('Error fetching educational institutions:', error.message);
        return [];
    }
};

const fetchFromGooglePlaces = async (searchQuery) => {
    try {
        const response = await axios.get(API_ENDPOINTS.GOOGLE_PLACES, {
            params: {
                query: searchQuery,
                type: 'university',
                key: API_KEY
            },
            timeout: 15000
        });

        return formatUniversities(response.data.results);
    } catch (error) {
        console.error('Error fetching from Google Places API:', error.message);
        return [];
    }
};

const formatSearchQuery = (type, city, country) => {
    let query = type;
    if (city) query = `${query} in ${city}`;
    if (country) query = `${query}, ${country}`;
    return query;
};

const formatUniversities = (places) => {
    return places.map(place => ({
        name: place.name,
        country: extractCountry(place.formatted_address),
        website: '',  // Google Places basic API doesn't provide website
        domain: '',   // No domain info available from basic Places API
        address: place.formatted_address,
        rating: place.rating,
        location: place.geometry.location
    }));
};

const extractCountry = (address) => {
    const parts = address.split(',');
    return parts[parts.length - 1].trim();
};

const removeDuplicates = (places) => {
    const seen = new Set();
    return places.filter(place => {
        const normalizedName = place.name.toLowerCase().trim();
        if (seen.has(normalizedName)) return false;
        seen.add(normalizedName);
        return true;
    });
};

module.exports = {
    fetchUniversities
};
