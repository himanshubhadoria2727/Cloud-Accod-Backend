const Property = require('../../model/property.model');
const { getImageUrl } = require('../../utility/uploadfile'); // Import getImageUrl

// Function to create a new property
const createProperty = async (req, res) => {
    try {
        const propertyData = req.body; // Get other property data
        const images = req.files ? req.files.map(file => getImageUrl(file.filename)) : []; // Get the URLs of uploaded images if any

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
        const { id, title, city, type, minPrice, maxPrice } = req.query;  // Changed from _id to id

        // If id is provided, use findById to get single property
        if (id) {
            try {
                const property = await Property.findById(id);
                return res.status(200).send(property ? [property] : []);
            } catch (error) {
                return res.status(400).send({ message: "Invalid ID format" });
            }
        }

        // Build the search criteria for other filters
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
        if (minPrice || maxPrice) {
            searchCriteria.price = {};
            if (minPrice) {
                searchCriteria.price.$gte = Number(minPrice);
            }
            if (maxPrice) {
                searchCriteria.price.$lte = Number(maxPrice);
            }
        }

        const properties = await Property.find(searchCriteria);
        res.status(200).send(properties);
    } catch (error) {
        res.status(500).send(error);
    }
};
// Function to edit a property
const editProperty = async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'description', 'price', 'latitude', 'longitude', 'type', 'amenities', 'overview', 'rentDetails', 'termsOfStay', 'images', 'city','verified'];
    console.log("city", req.body.city);

    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).send({ error: 'Property not found' });
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
