const mongoose = require('mongoose');

const overviewSchema = new mongoose.Schema({
    bedrooms: {
        type: Number,
        required: true,
    },
    bathrooms: {
        type: Number,
        required: true,
    },
    squareFeet: {
        type: Number,
        required: true,
    },
    kitchen: {
        type: String, // You can change this to a more specific type if needed
        required: true,
    },
    yearOfConstruction: {
        type: Number,
        required: true,
    },
    roomType: {
        type: String,
        enum: ['private', 'shared'],
        default: 'private',
        required: true,
    },
    kitchenType: {
        type: String,
        enum: ['private', 'shared'],
        default: 'private',
        required: true,
    },
    bathroomType: {
        type: String,
        enum: ['private', 'shared'],
        default: 'private',
        required: true,
    },
});

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    securityDeposit: {
        type: Number,
        required: true,
        default: 0,
    },
    currency: {
        type: String,
        enum: ['USD', 'INR', 'CAD', 'GBP', 'EUR', 'AUD'],
        default: 'USD',
        required: true,
    },
    country: {
        type: String,
        enum: ['USA', 'India', 'Canada', 'UK', 'EU', 'Australia'],
        required: true,
    },
    latitude: {
        type: Number,
        required: true, // Required for location
    },
    longitude: {
        type: Number,
        required: true, // Required for location
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'commercial', 'land'],
        required: true,
    },
    amenities: {
        type: [String],
        required: false,
    },
    utilities: {
        type: [String],
        required: false,
    },
    overview: {
        type: overviewSchema,
        required: true,
    },
    rentDetails: {
        type: String, // You can change this to a more specific type if needed
        required: true, // Required to provide rent details
    },
    termsOfStay: {
        type: String, // You can change this to a more specific type if needed
        required: true, // Required to provide terms of stay
    },
    location: {
        type: String,
        required: true, 
    },
    city: {
        type: String,
        required: false,
    },
    locality: {
        type: String,
        required: false,
    },
    images: {
        type: [String], 
        required: false, 
    },
    verified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    minimumStayDuration: {
        type: String,
        enum: ['Less than 6 months', '6-12 months', '1 year+'],
        required: true
    },
    availableFrom: {
        type: String,
        enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        required: true
    },
    nearbyUniversities: {
        type: [String],
        default: []
    }
});

// Middleware to update the updatedAt field before saving
propertySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
