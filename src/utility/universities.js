const axios = require('axios');

/**
 * Fetch universities from the public API based on country
 * Based on Hipo's University Domains List API
 * 
 * @param {string} country - Country name to filter universities
 * @param {string} city - Optional city name to filter universities further
 * @returns {Promise<Array>} - Array of universities
 */
const fetchUniversities = async (country, city = null) => {
    try {
        // Base URL for the universities API
        const baseUrl = 'https://universities.hipolabs.com/search';
        
        // Prepare query parameters - only search by country
        const params = { country };
        
        console.log(`Fetching universities for country: ${country}, city: ${city || 'N/A'}`);
        
        // Make the API call
        const response = await axios.get(baseUrl, { 
            params,
            timeout: 15000, // 15-second timeout
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        // Get all universities for the country
        let universities = response.data || [];
        
        console.log(`Found ${universities.length} universities in ${country}`);
        
        // If no universities found for the country, return an empty array
        if (universities.length === 0) {
            console.log(`No universities found for country: ${country}`);
            return getHardcodedUniversities(city, country);
        }
        
        // If city is provided, filter universities that might be in that city
        if (city && city.trim() !== '') {
            const lowerCityName = city.toLowerCase().trim();
            
            // First, check if we have special handling for this city
            const citySpecificResults = getCitySpecificUniversities(lowerCityName, country, universities);
            if (citySpecificResults.length > 0) {
                console.log(`Using city-specific filtering for ${city}, found ${citySpecificResults.length} universities`);
                return citySpecificResults;
            }
            
            // More flexible filtering to catch more universities in the city
            const strictFilteredUniversities = universities.filter(uni => {
                const uniName = uni.name.toLowerCase();
                const uniDomain = uni.domains[0]?.toLowerCase() || '';
                const uniWebPage = uni.web_pages[0]?.toLowerCase() || '';
                
                // Match by city name in university name or domain or web page
                return uniName.includes(lowerCityName) || 
                       uniDomain.includes(lowerCityName) || 
                       uniWebPage.includes(lowerCityName);
            });
            
            if (strictFilteredUniversities.length > 0) {
                console.log(`Found ${strictFilteredUniversities.length} universities using strict city filtering`);
                return formatUniversities(strictFilteredUniversities);
            }
            
            // If no results with strict filtering, try broader approach with keywords
            console.log(`No results with strict filtering for ${city}, trying broader search...`);
            
            // Try to map common cities to known universities
            const cityToUniversityMap = {
                'toronto': ['toronto', 'ryerson', 'york'],
                'vancouver': ['british columbia', 'simon fraser', 'vancouver'],
                'montreal': ['mcgill', 'montreal', 'concordia'],
                'ottawa': ['ottawa', 'carleton'],
                'waterloo': ['waterloo', 'wilfrid laurier'],
                'calgary': ['calgary'],
                'new york': ['new york', 'nyu', 'columbia', 'fordham', 'pace'],
                'boston': ['boston', 'harvard', 'mit', 'northeastern'],
                'chicago': ['chicago', 'northwestern', 'loyola', 'depaul'],
                'los angeles': ['los angeles', 'ucla', 'usc', 'caltech', 'pepperdine'],
                'san francisco': ['san francisco', 'berkeley', 'stanford', 'ucsf'],
                'washington': ['washington', 'georgetown', 'gwu', 'american'],
                'philadelphia': ['philadelphia', 'penn', 'drexel', 'temple'],
                'london': ['london', 'imperial', 'ucl', 'kings college', 'lse'],
                'manchester': ['manchester', 'salford'],
                'birmingham': ['birmingham', 'aston'],
                'edinburgh': ['edinburgh', 'napier'],
                'dublin': ['dublin', 'trinity college', 'ucd'],
                'mumbai': ['mumbai', 'bombay'],
                'delhi': ['delhi', 'iit delhi'],
                'bangalore': ['bangalore', 'bengaluru', 'iisc'],
                'sydney': ['sydney', 'unsw', 'uts'],
                'melbourne': ['melbourne', 'monash', 'rmit'],
                'brisbane': ['brisbane', 'queensland'],
                // Add more mappings as needed
            };
            
            // Try to find universities using city keywords
            const matchTerms = cityToUniversityMap[lowerCityName] || [lowerCityName];
            const termMatchedUniversities = response.data.filter(uni => {
                const uniName = uni.name.toLowerCase();
                return matchTerms.some(term => uniName.includes(term));
            });
            
            if (termMatchedUniversities.length > 0) {
                console.log(`Found ${termMatchedUniversities.length} universities using keyword matching`);
                return formatUniversities(termMatchedUniversities);
            }
            
            // If still no results, try partial word matching (for cases like "San" matching "San Francisco State")
            const words = lowerCityName.split(/\s+/);
            if (words.length > 0) {
                const wordMatchedUniversities = response.data.filter(uni => {
                    const uniName = uni.name.toLowerCase();
                    return words.some(word => 
                        word.length > 2 && uniName.includes(word) // Only use words with more than 2 characters
                    );
                });
                
                if (wordMatchedUniversities.length > 0) {
                    console.log(`Found ${wordMatchedUniversities.length} universities using word fragment matching`);
                    return formatUniversities(wordMatchedUniversities);
                }
            }
            
            // If still no results, fallback to hardcoded data or return empty array
            return getHardcodedUniversities(city, country);
        }
        
        // If no city specified, return all universities for the country
        return formatUniversities(universities);
    } catch (error) {
        console.error('Error fetching universities:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            console.error('No response received');
        }
        
        // Fallback to hardcoded data
        return getHardcodedUniversities(city, country);
    }
};

/**
 * Format universities to a consistent structure
 * @param {Array} universities - Raw university data
 * @returns {Array} - Formatted university data
 */
const formatUniversities = (universities) => {
    return universities.map(uni => ({
        name: uni.name,
        country: uni.country,
        website: uni.web_pages[0] || '',
        domain: uni.domains[0] || ''
    }));
};

/**
 * Get city-specific universities using custom filtering logic
 * @param {string} city - Lowercase city name
 * @param {string} country - Country name
 * @param {Array} universities - All universities in the country
 * @returns {Array} - Formatted university data
 */
const getCitySpecificUniversities = (city, country, universities) => {
    // Special handling for Toronto
    if (city === 'toronto' && country === 'Canada') {
        const torontoKeywords = [
            'university of toronto', 
            'ryerson', 
            'york university',
            'toronto',
            'tmu',
            'ocad',
            'humber'
        ];
        
        const torontoUniversities = universities.filter(uni => {
            const uniName = uni.name.toLowerCase();
            const uniDomain = uni.domains[0]?.toLowerCase() || '';
            const uniWebPage = uni.web_pages[0]?.toLowerCase() || '';
            
            return torontoKeywords.some(term => 
                uniName.includes(term) || 
                uniDomain.includes(term) || 
                uniWebPage.includes(term)
            );
        });
        
        if (torontoUniversities.length > 0) {
            return formatUniversities(torontoUniversities);
        }
    }
    
    // Can add more cities with specific logic here
    
    return []; // No city-specific handling found or no matches
};

/**
 * Get hardcoded universities for common cities when API fails
 * @param {string} city - City name
 * @param {string} country - Country name
 * @returns {Array} - Hardcoded university data
 */
const getHardcodedUniversities = (city, country) => {
    if (!city || !country) return [];
    
    const cityKey = city.toLowerCase().trim();
    const countryKey = country.toLowerCase().trim();
    
    // Hardcoded data for Toronto, Canada
    if (cityKey === 'toronto' && (countryKey === 'canada' || countryKey === 'ca')) {
        console.log('Using hardcoded data for Toronto, Canada');
        return [
            { name: 'University of Toronto', country: 'Canada', website: 'https://www.utoronto.ca', domain: 'utoronto.ca' },
            { name: 'Toronto Metropolitan University', country: 'Canada', website: 'https://www.torontomu.ca', domain: 'torontomu.ca' },
            { name: 'York University', country: 'Canada', website: 'https://www.yorku.ca', domain: 'yorku.ca' },
            { name: 'OCAD University', country: 'Canada', website: 'https://www.ocadu.ca', domain: 'ocadu.ca' },
            { name: 'Humber College', country: 'Canada', website: 'https://www.humber.ca', domain: 'humber.ca' },
            { name: 'Seneca College', country: 'Canada', website: 'https://www.senecacollege.ca', domain: 'senecacollege.ca' },
            { name: 'George Brown College', country: 'Canada', website: 'https://www.georgebrown.ca', domain: 'georgebrown.ca' }
        ];
    }
    
    // New York, USA
    if ((cityKey === 'new york' || cityKey === 'nyc') && (countryKey === 'usa' || countryKey === 'us')) {
        console.log('Using hardcoded data for New York, USA');
        return [
            { name: 'New York University', country: 'USA', website: 'https://www.nyu.edu', domain: 'nyu.edu' },
            { name: 'Columbia University', country: 'USA', website: 'https://www.columbia.edu', domain: 'columbia.edu' },
            { name: 'Fordham University', country: 'USA', website: 'https://www.fordham.edu', domain: 'fordham.edu' },
            { name: 'The City University of New York', country: 'USA', website: 'https://www.cuny.edu', domain: 'cuny.edu' },
            { name: 'Pace University', country: 'USA', website: 'https://www.pace.edu', domain: 'pace.edu' },
            { name: 'The New School', country: 'USA', website: 'https://www.newschool.edu', domain: 'newschool.edu' }
        ];
    }
    
    // London, UK
    if (cityKey === 'london' && (countryKey === 'uk' || countryKey === 'united kingdom')) {
        console.log('Using hardcoded data for London, UK');
        return [
            { name: 'Imperial College London', country: 'UK', website: 'https://www.imperial.ac.uk', domain: 'imperial.ac.uk' },
            { name: 'University College London', country: 'UK', website: 'https://www.ucl.ac.uk', domain: 'ucl.ac.uk' },
            { name: 'King\'s College London', country: 'UK', website: 'https://www.kcl.ac.uk', domain: 'kcl.ac.uk' },
            { name: 'London School of Economics', country: 'UK', website: 'https://www.lse.ac.uk', domain: 'lse.ac.uk' },
            { name: 'Queen Mary University of London', country: 'UK', website: 'https://www.qmul.ac.uk', domain: 'qmul.ac.uk' }
        ];
    }
    
    // Delhi, India
    if (cityKey === 'delhi' && countryKey === 'india') {
        console.log('Using hardcoded data for Delhi, India');
        return [
            { name: 'University of Delhi', country: 'India', website: 'https://www.du.ac.in', domain: 'du.ac.in' },
            { name: 'Indian Institute of Technology Delhi', country: 'India', website: 'https://www.iitd.ac.in', domain: 'iitd.ac.in' },
            { name: 'Jawaharlal Nehru University', country: 'India', website: 'https://www.jnu.ac.in', domain: 'jnu.ac.in' },
            { name: 'Jamia Millia Islamia', country: 'India', website: 'https://www.jmi.ac.in', domain: 'jmi.ac.in' },
            { name: 'Delhi Technological University', country: 'India', website: 'https://www.dtu.ac.in', domain: 'dtu.ac.in' }
        ];
    }
    
    // Add more hardcoded data for other common cities as needed
    
    console.log(`No hardcoded data available for ${city}, ${country}`);
    return [];
};

module.exports = {
    fetchUniversities
}; 