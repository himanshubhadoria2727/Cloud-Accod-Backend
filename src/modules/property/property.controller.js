const Property = require('../../model/property.model');
const { getImageUrl } = require('../../utility/uploadfile'); // Import getImageUrl
const { PropertyView } = require('../../model/analytics.model'); // Import PropertyView model

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

        // Ensure arrays are properly handled
        if (propertyData.utilities && !Array.isArray(propertyData.utilities)) {
            propertyData.utilities = [propertyData.utilities];
        }
        
        if (propertyData.amenities && !Array.isArray(propertyData.amenities)) {
            propertyData.amenities = [propertyData.amenities];
        }

        const property = new Property({
            ...propertyData,
            images, // Add images to the property data
        });

        await property.save();
        console.log("Property created successfully");
        res.status(201).send(property);
    } catch (error) {
        console.error("Error creating property", error);
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
            sortBy
        } = req.query;

        // If id is provided, use findById to get single property
        if (id) {
            try {
                const property = await Property.findById(id);
                
                // Record property view if property exists
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

        // Build the search criteria
        const searchCriteria = {};
        if (title) {
            searchCriteria.title = { $regex: title, $options: 'i' };
        }
        if (city) {
            searchCriteria.city = { $regex: city, $options: 'i' };
        }
        if (type) {
            searchCriteria.type = type;
        }
        if (country) {
            searchCriteria.country = country;
        }
        if (minPrice || maxPrice) {
            searchCriteria.price = {};
            if (minPrice) {
                searchCriteria.price.$gte = Number(minPrice);
            }
            if (maxPrice) {
                searchCriteria.price.$lte = Number(maxPrice);
            }
        }
        if (university) {
            searchCriteria.nearbyUniversities = { $elemMatch: { $regex: university, $options: 'i' } };
        }
        if (locality) {
            searchCriteria.locality = { $regex: locality, $options: 'i' };
        }
        if (moveInMonth && moveInMonth.length > 0) {
            const monthsArray = typeof moveInMonth === 'string' ? [moveInMonth] : moveInMonth;
            searchCriteria.availableFrom = { $in: monthsArray };
        }
        if (stayDuration) {
            searchCriteria.minimumStayDuration = stayDuration;
        }
        if (roomType && roomType.length > 0) {
            const types = typeof roomType === 'string' ? [roomType] : roomType;
            searchCriteria['overview.roomType'] = { $in: types };
        }
        if (bathroomType && bathroomType.length > 0) {
            const types = typeof bathroomType === 'string' ? [bathroomType] : bathroomType;
            searchCriteria['overview.bathroomType'] = { $in: types };
        }
        if (kitchenType && kitchenType.length > 0) {
            const types = typeof kitchenType === 'string' ? [kitchenType] : kitchenType;
            searchCriteria['overview.kitchenType'] = { $in: types };
        }

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
                default:
                    sortOptions.createdAt = -1;
            }
        }

        const properties = await Property.find(searchCriteria).sort(sortOptions);
        res.status(200).send(properties);
    } catch (error) {
        res.status(500).send(error);
    }
};

// Function to edit a property
const editProperty = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'price', 'latitude', 'longitude', 'type', 'amenities', 'overview', 'rentDetails', 'termsOfStay', 'images', 'city', 'country', 'verified', 'locality', 'securityDeposit', 'utilities', 'availableFrom', 'minimumStayDuration'];
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

        // Initialize a fresh array for images
        let allImages = [];

        // Check if images are provided in the payload (URLs)
        if (req.body.images && Array.isArray(req.body.images)) {
            // Add only valid URLs to the allImages array
            allImages = req.body.images.filter(url => url.startsWith('http://') || url.startsWith('https://'));
        }

        // Handle image uploads (binary)
        if (req.files && req.files.length > 0) {
            const uploadedImageUrls = req.files.map((file) => {
                // Generate URL for each uploaded file
                return `${req.protocol}://${req.get('host')}/media/${file.filename}`;
            });
            // Add uploaded image URLs to the allImages array
            allImages = [...allImages, ...uploadedImageUrls];
        }

        // Override the images array with the new payload
        property.images = [...new Set(allImages)]; // Ensure uniqueness

        // Update other fields
        updates.forEach((update) => {
            if (allowedUpdates.includes(update) && update !== 'images') {
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

// Export all functions at the bottom
module.exports = {
    createProperty,
    getAllProperties,
    editProperty,
    deleteProperty,
};
