const axios = require('axios');

const API_ENDPOINTS = {
    HIPO: 'http://universities.hipolabs.com/search',
    WORLD_UNIS: 'http://universities.freeapi.app/v1/unis', // Example API
    COLLEGE_API: 'https://api.collegescorecard.ed.gov/v1/schools', // US Colleges API
};

/**
 * Fetch universities from multiple public APIs based on country and city.
 * 
 * @param {string} country - Country name to filter universities.
 * @param {string} city - City name to filter universities.
 * @returns {Promise<Array>} - Array of universities.
 */
const fetchUniversities = async (country = null, city = null) => {
    try {
        console.log(`Fetching universities from multiple sources...`);

        // Fetch from all available APIs in parallel
        const [hipoResults, worldUnisResults, usCollegesResults] = await Promise.allSettled([
            fetchFromHipo(country, city),
            fetchFromWorldUnis(country, city),
            fetchFromUSColleges(country, city)
        ]);

        // Combine results from all sources
        let universities = [
            ...(hipoResults.status === 'fulfilled' ? hipoResults.value : []),
            ...(worldUnisResults.status === 'fulfilled' ? worldUnisResults.value : []),
            ...(usCollegesResults.status === 'fulfilled' ? usCollegesResults.value : [])
        ];

        // Remove duplicates based on name and domain
        universities = removeDuplicates(universities);

        console.log(`Combined total of ${universities.length} unique universities found`);

        return formatUniversities(universities);
    } catch (error) {
        console.error('Error fetching universities:', error.message);
        return [];
    }
};

const fetchFromHipo = async (country, city) => {
    try {
        console.log(`fetchFromHipo called with country: ${country || 'null'}, city: ${city || 'null'}`);

        const params = {};
        if (country) params.country = country;
        if (city) params.name = city;

        const response = await axios.get(API_ENDPOINTS.HIPO, {
            params,
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        return response.data || [];
    } catch (error) {
        console.error('Error fetching from Hipo API:', error.message);
        return [];
    }
};

const fetchFromWorldUnis = async (country, city) => {
    try {
        const params = {};
        if (country) params.country = country;

        const response = await axios.get(API_ENDPOINTS.WORLD_UNIS, {
            params,
            timeout: 15000,
        });

        let universities = response.data?.universities || [];

        if (city) {
            universities = enhancedCityFilter(universities, city);
        }

        return universities;
    } catch (error) {
        console.error('Error fetching from World Unis API:', error.message);
        return [];
    }
};

const fetchFromUSColleges = async (country, city) => {
    try {
        if (!['us', 'usa', 'united states'].includes(country?.toLowerCase())) {
            return [];
        }

        const params = {
            api_key: process.env.COLLEGE_SCORECARD_API_KEY,
            per_page: 100,
            fields: 'school.name,school.city,school.state,school.school_url,school.domains'
        };

        if (city) params['school.city'] = city;

        const response = await axios.get(API_ENDPOINTS.COLLEGE_API, {
            params,
            timeout: 15000,
        });

        return response.data?.results || [];
    } catch (error) {
        console.error('Error fetching from US Colleges API:', error.message);
        return [];
    }
};

const removeDuplicates = (universities) => {
    const seen = new Set();
    return universities.filter(uni => {
        const key = `${normalizeName(uni.name)}-${uni.domain?.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const normalizeName = (name) => name.toLowerCase().replace(/university of |college of /gi, '').trim();

const enhancedCityFilter = (universities, city) => {
    const cityName = city.toLowerCase().trim();
    return universities.filter(uni => {
        const uniName = uni.name.toLowerCase();
        const uniCity = uni.city?.toLowerCase();
        const uniDomain = uni.domains?.[0]?.toLowerCase();

        return uniCity === cityName ||
               uniName.includes(cityName) ||
               uniDomain?.includes(cityName.replace(/\s+/g, ''));
    });
};

const formatUniversities = (universities) => {
    return universities.map(uni => ({
        name: uni.name,
        country: uni.country,
        website: uni.web_pages?.[0] || uni['school.school_url'] || '',
        domain: uni.domains?.[0] || uni['school.domains']?.[0] || ''
    }));
};

module.exports = {
    fetchUniversities
};
