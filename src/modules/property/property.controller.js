const Property = require('../../model/property.model');
const { getImageUrl } = require('../../utility/uploadfile'); // Import getImageUrl
const { PropertyView } = require('../../model/analytics.model'); // Import PropertyView model
const { fetchUniversities } = require('../../utility/universities'); // Import university fetch utility

// Add currency mapping
const COUNTRY_TO_CURRENCY = {
    'USA': 'USD',
    'India': 'INR',
    'Canada': 'CAD',
    'UK': 'GBP',
    'EU': 'EUR',
    'Australia': 'AUD'
};

// Function to create a new property
const createProperty = async (req, res) => {
    try {
        const propertyData = req.body; // Get other property data
        const images = req.files ? req.files.map(file => getImageUrl(file.filename)) : []; // Get the URLs of uploaded images if any

        // Add currency based on country
        if (propertyData.country) {
            propertyData.currency = COUNTRY_TO_CURRENCY[propertyData.country] || 'USD';
        }

        // Handle JSON parsed fields from form data
        // Handle nearbyUniversities
        if (propertyData.nearbyUniversities) {
            try {
                propertyData.nearbyUniversities = JSON.parse(propertyData.nearbyUniversities);
            } catch (e) {
                console.error('Error parsing nearbyUniversities:', e);
                propertyData.nearbyUniversities = [];
            }
        }

        // Handle overview object including bedroomDetails
        if (propertyData.overview) {
            try {
                // Ensure overview is parsed to object if it's a string
                if (typeof propertyData.overview === 'string') {
                    propertyData.overview = JSON.parse(propertyData.overview);
                }
                
                // Ensure all required fields are present and converted to proper types
                if (propertyData.overview) {
                    // Convert numeric fields to numbers
                    propertyData.overview.bedrooms = Number(propertyData.overview.bedrooms);
                    propertyData.overview.bathrooms = Number(propertyData.overview.bathrooms);
                    propertyData.overview.squareFeet = Number(propertyData.overview.squareFeet);
                    propertyData.overview.yearOfConstruction = Number(propertyData.overview.yearOfConstruction);
                    
                    // Ensure kitchen is present (could be a string or a number)
                    if (propertyData.overview.kitchen !== undefined) {
                        // Convert to number if possible, otherwise keep as string
                        propertyData.overview.kitchen = !isNaN(propertyData.overview.kitchen) 
                            ? Number(propertyData.overview.kitchen) 
                            : propertyData.overview.kitchen;
                    }
                    
                    // Process bedroom details if present
                    if (propertyData.overview.bedroomDetails && Array.isArray(propertyData.overview.bedroomDetails)) {
                        propertyData.overview.bedroomDetails = propertyData.overview.bedroomDetails.map(bedroom => {
                            // Convert numeric values
                            return {
                                ...bedroom,
                                rent: Number(bedroom.rent),
                                sizeSqFt: Number(bedroom.sizeSqFt),
                                // Convert boolean values
                                furnished: bedroom.furnished === true || bedroom.furnished === "true",
                                privateWashroom: bedroom.privateWashroom === true || bedroom.privateWashroom === "true",
                                sharedWashroom: bedroom.sharedWashroom === true || bedroom.sharedWashroom === "true",
                                sharedKitchen: bedroom.sharedKitchen === true || bedroom.sharedKitchen === "true"
                            };
                        });
                    }
                    
                    // Log the processed overview for debugging
                    console.log("Processed overview:", propertyData.overview);
                }
            } catch (e) {
                console.error('Error processing overview:', e);
                return res.status(400).send({ 
                    error: 'Invalid overview data format. Please check your submission.',
                    details: e.message,
                    receivedOverview: propertyData.overview
                });
            }
        } else {
            return res.status(400).send({ error: 'Overview data is required' });
        }

        // Handle bookingOptions if present
        if (propertyData.bookingOptions) {
            try {
                propertyData.bookingOptions = JSON.parse(propertyData.bookingOptions);
            } catch (e) {
                console.error('Error parsing bookingOptions:', e);
                propertyData.bookingOptions = {};
            }
        }

        // Handle arrays
        if (propertyData.amenities) {
            try {
                propertyData.amenities = JSON.parse(propertyData.amenities);
            } catch (e) {
                console.error('Error parsing amenities:', e);
                propertyData.amenities = [];
            }
        }

        if (propertyData.utilities) {
            try {
                propertyData.utilities = JSON.parse(propertyData.utilities);
            } catch (e) {
                console.error('Error parsing utilities:', e);
                propertyData.utilities = [];
            }
        }

        // Handle boolean conversions
        if (propertyData.instantBooking) {
            propertyData.instantBooking = propertyData.instantBooking === "true";
        }
        
        if (propertyData.bookByEnquiry) {
            propertyData.bookByEnquiry = propertyData.bookByEnquiry === "true";
        }
        
        if (propertyData.onSiteVerification) {
            propertyData.onSiteVerification = propertyData.onSiteVerification === "true";
        }

        const property = new Property({
            ...propertyData,
            images, // Add images to the property data
            verified: false, // Set verified to false by default
        });

        await property.save();
        console.log("Property created successfully");
        res.status(201).send(property);
    } catch (error) {
        console.error("Error creating property:", error);
        res.status(400).send(error);
    }
};

// Function to get all properties with optional search queries
const getAllProperties = async (req, res) => {
    try {
        const { 
            id, 
            title, 
            city, 
            type, 
            minPrice, 
            maxPrice, 
            country,
            university,
            locality,
            moveInMonth,
            stayDuration,
            roomType,
            bathroomType,
            kitchenType,
            sortBy,
            verified,
            search
        } = req.query;

        // If id is provided, use findById to get single property
        if (id) {
            try {
                const property = await Property.findById(id);
                
                if (property) {
                    try {
                        let propertyView = await PropertyView.findOne({ propertyId: id });
                        
                        if (propertyView) {
                            propertyView.viewCount += 1;
                            propertyView.lastViewed = new Date();
                            await propertyView.save();
                        } else {
                            propertyView = new PropertyView({ propertyId: id });
                            await propertyView.save();
                        }
                    } catch (viewError) {
                        console.error("Error recording property view", viewError);
                    }
                }
                
                return res.status(200).send(property ? [property] : []);
            } catch (error) {
                return res.status(400).send({ message: "Invalid ID format" });
            }
        }

        // Build search criteria with improved logic
        const searchCriteria = {};
        const andConditions = [];

        // Enhanced search functionality - searches across title, universities, cities, and localities
        if (search) {
            console.log('Generic search term:', search);
            
            // Create flexible regex patterns for common typos (especially for city names)
            const searchPatterns = [
                search, // Original input
                search.replace(/(.)\1+/g, '$1'), // Remove duplicate letters (toronro -> torono)
                search.replace(/ro/g, 'r'), // Handle ro->r substitutions
                search.replace(/r/g, 'ro'), // Handle r->ro substitutions
                search.replace(/o/g, 'on'), // Handle o->on substitutions (tor -> toron)
                search.replace(/on/g, 'o'), // Handle on->o substitutions
            ];
            
            // Remove duplicates and empty strings
            const uniquePatterns = [...new Set(searchPatterns)].filter(p => p.length > 0);
            
            const searchOrConditions = [];
            
            // For each pattern, search across all relevant fields
            uniquePatterns.forEach(pattern => {
                const regexPattern = new RegExp(pattern, 'i');
                
                searchOrConditions.push(
                    // Search in property title
                    { title: { $regex: regexPattern } },
                    // Search in nearby universities array
                    { nearbyUniversities: { $elemMatch: { $regex: regexPattern } } },
                    // Fallback for string-based university search
                    { nearbyUniversities: { $regex: regexPattern } },
                    // Search in description
                    { description: { $regex: regexPattern } },
                    // Search in city field
                    { city: { $regex: regexPattern } },
                    // Search in locality field
                    { locality: { $regex: regexPattern } }
                );
            });
            
            andConditions.push({
                $or: searchOrConditions
            });
        }
        
        // Individual filters
        if (title) {
            andConditions.push({
                title: { $regex: title, $options: 'i' }
            });
        }
        
        // Handle separate city parameter (if provided)
        if (city) {
            console.log('City search term:', city);
            andConditions.push({
                $or: [
                    { city: { $regex: new RegExp(city, 'i') } },
                    { locality: { $regex: new RegExp(city, 'i') } }
                ]
            });
        }
        
        if (type) {
            andConditions.push({ type: type });
        }
        
        if (country) {
            andConditions.push({ country: country });
        }
        
        if (minPrice || maxPrice) {
            const priceCondition = {};
            if (minPrice) {
                priceCondition.$gte = Number(minPrice);
            }
            if (maxPrice) {
                priceCondition.$lte = Number(maxPrice);
            }
            andConditions.push({ price: priceCondition });
        }
        
        if (university) {
            console.log('Searching for specific university:', university);
            andConditions.push({
                $or: [
                    { nearbyUniversities: { $elemMatch: { $regex: new RegExp(university, 'i') } } },
                    { nearbyUniversities: { $regex: new RegExp(university, 'i') } }
                ]
            });
        }
        
        if (locality) {
            andConditions.push({
                locality: { $regex: locality, $options: 'i' }
            });
        }
        
        if (moveInMonth && moveInMonth.length > 0) {
            const monthsArray = typeof moveInMonth === 'string' ? [moveInMonth] : moveInMonth;
            andConditions.push({ availableFrom: { $in: monthsArray } });
        }
        
        if (stayDuration) {
            andConditions.push({ minimumStayDuration: stayDuration });
        }
        
        if (roomType && roomType.length > 0) {
            const types = typeof roomType === 'string' ? [roomType] : roomType;
            andConditions.push({ 'overview.roomType': { $in: types } });
        }
        
        if (bathroomType && bathroomType.length > 0) {
            const types = typeof bathroomType === 'string' ? [bathroomType] : bathroomType;
            andConditions.push({ 'overview.bathroomType': { $in: types } });
        }
        
        if (kitchenType && kitchenType.length > 0) {
            const types = typeof kitchenType === 'string' ? [kitchenType] : kitchenType;
            andConditions.push({ 'overview.kitchenType': { $in: types } });
        }

        // Add verified filter
        if (verified) {
            andConditions.push({ verified: verified === 'true' });
        }

        // Combine all conditions
        if (andConditions.length > 0) {
            searchCriteria.$and = andConditions;
        }

        console.log('Final search criteria:', JSON.stringify(searchCriteria, null, 2));

        // Handle sorting
        let sortOptions = {};
        if (sortBy) {
            switch (sortBy) {
                case 'Price: Low to High':
                    sortOptions.price = 1;
                    break;
                case 'Price: High to Low':
                    sortOptions.price = -1;
                    break;
                case 'Newest Listings':
                    sortOptions.createdAt = -1;
                    break;
                case 'Relevance':
                    sortOptions.createdAt = -1;
                    break;
                default:
                    sortOptions.createdAt = -1;
            }
        } else {
            sortOptions.createdAt = -1;
        }

        const properties = await Property.find(searchCriteria).sort(sortOptions);
        res.status(200).send(properties);
    } catch (error) {
        console.error('Error in getAllProperties:', error);
        res.status(500).send({ message: 'Internal server error', error: error.message });
    }
};
// Function to edit a property
const editProperty = async (req, res) => {
    const updates = Object.keys(req.body);
    
    const allowedUpdates = [
        'title', 'description', 'price', 'latitude', 'longitude', 
        'type', 'amenities', 'overview', 'rentDetails', 'termsOfStay', 
        'cancellationPolicy', 'images', 'city', 'country', 'verified', 'locality', 
        'securityDeposit', 'utilities', 'availableFrom', 'existingImages',
        'minimumStayDuration', 'nearbyUniversities', 'location',
        'bedroomDetails', 'bookingOptions', 'instantBooking', 'bookByEnquiry',
    ];

    console.log("city", req.body.city);

    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).send({ error: 'Property not found' });
        }

        // Update currency if country is being updated
        if (req.body.country) {
            property.currency = COUNTRY_TO_CURRENCY[req.body.country] || 'USD';
        }

        // Handle nearbyUniversities specifically
        if (req.body.nearbyUniversities) {
            try {
                property.nearbyUniversities = JSON.parse(req.body.nearbyUniversities);
            } catch (e) {
                console.error('Error parsing nearbyUniversities:', e);
                property.nearbyUniversities = [];
            }
        }

        // Handle overview specifically if it's a JSON string
        if (req.body.overview) {
            try {
                // Try to parse the overview
                let parsedOverview;
                try {
                    if (typeof req.body.overview === 'string') {
                        parsedOverview = JSON.parse(req.body.overview);
                    } else {
                        parsedOverview = req.body.overview;
                    }
                } catch (parseError) {
                    console.error('Error parsing overview as JSON:', parseError);
                    return res.status(400).send({ error: 'Invalid overview format' });
                }
                
                // Validate that all required fields are present
                // Check for kitchen value - should accept "0" as a valid value
                if (!parsedOverview.bedrooms && parsedOverview.bedrooms !== 0 || 
                    !parsedOverview.bathrooms && parsedOverview.bathrooms !== 0 || 
                    !parsedOverview.squareFeet && parsedOverview.squareFeet !== 0 || 
                    (parsedOverview.kitchen === undefined || parsedOverview.kitchen === null) ||  // Allow "0" as valid
                    !parsedOverview.yearOfConstruction && parsedOverview.yearOfConstruction !== 0) {
                    return res.status(400).send({ 
                        error: 'Missing required overview fields',
                        message: 'Overview must include bedrooms, bathrooms, squareFeet, kitchen, and yearOfConstruction',
                        receivedValues: {
                            bedrooms: parsedOverview.bedrooms,
                            bathrooms: parsedOverview.bathrooms,
                            squareFeet: parsedOverview.squareFeet,
                            kitchen: parsedOverview.kitchen,
                            yearOfConstruction: parsedOverview.yearOfConstruction
                        }
                    });
                }
                
                // Convert numeric fields to numbers
                parsedOverview.bedrooms = Number(parsedOverview.bedrooms);
                parsedOverview.bathrooms = Number(parsedOverview.bathrooms);
                parsedOverview.squareFeet = Number(parsedOverview.squareFeet);
                parsedOverview.yearOfConstruction = Number(parsedOverview.yearOfConstruction);
                
                // Handle kitchen field (could be string or number)
                if (parsedOverview.kitchen !== undefined) {
                    // Convert to number if possible, otherwise keep as string
                    parsedOverview.kitchen = !isNaN(parsedOverview.kitchen) 
                        ? Number(parsedOverview.kitchen) 
                        : parsedOverview.kitchen;
                }
                
                // Process bedroom details if present
                if (parsedOverview.bedroomDetails && Array.isArray(parsedOverview.bedroomDetails)) {
                    parsedOverview.bedroomDetails = parsedOverview.bedroomDetails.map(bedroom => {
                        // Convert numeric values
                        return {
                            ...bedroom,
                            rent: Number(bedroom.rent),
                            sizeSqFt: Number(bedroom.sizeSqFt),
                            // Convert boolean values
                            furnished: bedroom.furnished === true || bedroom.furnished === "true",
                            privateWashroom: bedroom.privateWashroom === true || bedroom.privateWashroom === "true",
                            sharedWashroom: bedroom.sharedWashroom === true || bedroom.sharedWashroom === "true",
                            sharedKitchen: bedroom.sharedKitchen === true || bedroom.sharedKitchen === "true"
                        };
                    });
                }
                
                // Update the property overview with the parsed data
                property.overview = parsedOverview;
                
                console.log("Updated overview:", property.overview);
            } catch (e) {
                console.error('Error processing overview:', e);
                return res.status(400).send({ error: 'Failed to process overview', details: e.message });
            }
        }

        // Handle bookingOptions if it's a JSON string
        if (req.body.bookingOptions) {
            try {
                property.bookingOptions = JSON.parse(req.body.bookingOptions);
            } catch (e) {
                console.error('Error parsing bookingOptions:', e);
            }
        }

        // Initialize a fresh array for main property images
        let allImages = [];

        // First, check if existingImages were provided in the request
        if (req.body.existingImages) {
            // Handle both single string and array of strings cases
            const existingImages = Array.isArray(req.body.existingImages) 
                ? req.body.existingImages 
                : [req.body.existingImages];
            
            // Add existing images to allImages array
            allImages = [...allImages, ...existingImages];
        } else if (!req.files || req.files.length === 0) {
            // If no new images are uploaded and no existingImages provided, 
            // keep the current images to prevent data loss
            allImages = property.images;
        }
          
        // Check if new images are provided in the payload (URLs)
        if (req.body.images && Array.isArray(req.body.images)) {
            // Add only valid URLs to the allImages array
            const validUrls = req.body.images.filter(url => url && (url.startsWith('http://') || url.startsWith('https://')));
            allImages = [...allImages, ...validUrls];
        }
          
        // Process uploaded property images
        if (req.files && req.files.length > 0) {
            console.log(`Processing ${req.files.length} files`);
            
            // All files are now uploaded with the same fieldname 'images'
            // We determine bedroom images using metadata fields
            
            // Create a map of image indices to bedroom indices
            const bedroomImageMap = {};
            Object.keys(req.body).forEach(key => {
                if (key.startsWith('bedroom_image_index_')) {
                    const imageIndex = parseInt(key.replace('bedroom_image_index_', ''));
                    const bedroomIndex = parseInt(req.body[key]);
                    bedroomImageMap[imageIndex] = bedroomIndex;
                }
            });
            
            console.log('Bedroom image mapping:', bedroomImageMap);
            
            // Track which images are for bedrooms vs. the main property
            const propertyImageUrls = [];
            const bedroomImagesByIndex = {};
            
            // Process each file
            req.files.forEach((file, fileIndex) => {
                const imageUrl = getImageUrl(file.filename);
                
                // Check if this image belongs to a bedroom
                if (bedroomImageMap.hasOwnProperty(fileIndex)) {
                    const roomIndex = bedroomImageMap[fileIndex];
                    
                    if (!bedroomImagesByIndex[roomIndex]) {
                        bedroomImagesByIndex[roomIndex] = [];
                    }
                    
                    // Add image URL to the array for this bedroom
                    bedroomImagesByIndex[roomIndex].push(imageUrl);
                } else {
                    // This is a main property image
                    propertyImageUrls.push(imageUrl);
                }
            });
            
            // Add property image URLs to allImages array
            allImages = [...allImages, ...propertyImageUrls];
            
            // Now allImages contains main property images
            property.images = [...new Set(allImages)]; // Ensure uniqueness

            // Process bedroom images - add them to their respective bedrooms
            Object.keys(bedroomImagesByIndex).forEach(roomIndexStr => {
                const roomIndex = parseInt(roomIndexStr);
                const newBedroomImages = bedroomImagesByIndex[roomIndex];
                
                // Make sure this bedroom exists in overview.bedroomDetails
                if (roomIndex < property.overview.bedroomDetails.length) {
                    // Get existing images or initialize empty array
                    const existingImages = property.overview.bedroomDetails[roomIndex].images || [];
                    
                    // Add new images to existing ones
                    property.overview.bedroomDetails[roomIndex].images = [
                        ...existingImages,
                        ...newBedroomImages
                    ];
                }
            });
        } else {
            // If no new images uploaded, set property images to allImages (which may include existing images)
            property.images = [...new Set(allImages)]; // Ensure uniqueness
        }

        // Handle arrays if they're strings
        if (req.body.amenities) {
            try {
                property.amenities = JSON.parse(req.body.amenities);
            } catch (e) {
                console.error('Error parsing amenities:', e);
                property.amenities = [];
            }
        }

        if (req.body.utilities) {
            try {
                property.utilities = JSON.parse(req.body.utilities);
            } catch (e) {
                console.error('Error parsing utilities:', e);
                property.utilities = [];
            }
        }

        // Update other fields
        updates.forEach((update) => {
            if (allowedUpdates.includes(update) && 
                update !== 'images' && 
                update !== 'existingImages' && 
                update !== 'overview' &&
                update !== 'nearbyUniversities' &&
                update !== 'amenities' &&
                update !== 'utilities' &&
                update !== 'bookingOptions' &&
                update !== 'bedroomDetails') {
                property[update] = req.body[update];
            }
        });

        // Save the updated property
        await property.save();
        res.status(200).send(property);
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: 'Failed to update property', details: error.message });
    }
};

// Function to delete a property
const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndDelete(req.params.id);
        if (!property) {
            return res.status(404).send();
        }
        res.send(property);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Function to fetch universities by city and country
const getUniversitiesByLocation = async (req, res) => {
    try {
        const { city, country } = req.query;
        
        console.log(`Received request for universities in ${city || 'any city'}${country ? ', ' + country : ''}`);
        
        // IMPORTANT: The fetchUniversities function expects (country, city) parameters
        // This was the issue - we were passing parameters in the wrong order
        const universities = await fetchUniversities(country, city);
        
        // If no universities found, return a message with 404 status
        if (!universities || universities.length === 0) {
            console.log(`No universities found for ${city || 'any city'}${country ? ', ' + country : ''}`);
            return res.status(404).json({ 
                message: 'No universities found for the selected location.',
                query: { city, country }
            });
        }
        
        // Log results for debugging
        console.log(`Returning ${universities.length} universities for ${city || 'any city'}${country ? ', ' + country : ''}`);
        
        // Return universities with 200 status
        res.status(200).json(universities);
    } catch (error) {
        console.error('Error in getUniversitiesByLocation controller:', error);
        // Return a proper error message
        res.status(500).json({ 
            message: 'Error retrieving universities', 
            error: error.message 
        });
    }
};

// Export all functions at the bottom
module.exports = {
    createProperty,
    getAllProperties,
    editProperty,
    deleteProperty,
    getUniversitiesByLocation,
};


