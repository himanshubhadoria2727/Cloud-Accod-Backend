const mongoose = require('mongoose');

const bedroomDetailSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rent: {
        type: Number,
        required: true
    },
    sizeSqFt: {
        type: Number,
        required: true
    },
    furnished: {
        type: Boolean,
        default: false
    },
    privateWashroom: {
        type: Boolean,
        default: false
    },
    sharedWashroom: {
        type: Boolean,
        default: false
    },
    sharedKitchen: {
        type: Boolean,
        default: false
    },
    images: {
        type: [String],
        default: []
    },
    availableFrom: {
        type: String,
        enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        required: false
    },
    lease: {
        type: String,
        enum: ['Month-to-Month', '6-Month', '1-Year'],
        required: false
    },
    moveInDate: {
        type: Date,
        required: false
    },
    note: {
        type: String,
        required: false
    },    leaseTerms: {
        type: String,
        required: false
    },
    floor: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['available', 'booked'],
        default: 'available'
    }
});

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
    bedroomDetails: {
        type: [bedroomDetailSchema],
        default: []
    }
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
        required: false, // Required for location
    },
    longitude: {
        type: Number,
        required: false, // Required for location
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
    cancellationPolicy: {
        type: String,
        required: true,
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
    onSiteVerification: {
        type: Boolean,
        default: false
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
        enum: [
            'Month-to-Month', 
            'Jan to Mar', 'Jan to Jun', 'Jan to Sep', 'Jan to Dec',
            'Feb to Apr', 'Feb to Jul', 'Feb to Oct', 'Feb to Dec',
            'Mar to May', 'Mar to Aug', 'Mar to Nov', 'Mar to Dec',
            'Apr to Jun', 'Apr to Sep', 'Apr to Dec',
            'May to Jul', 'May to Oct', 'May to Dec',
            'Jun to Aug', 'Jun to Nov', 'Jun to Dec',
            'Jul to Sep', 'Jul to Dec',
            'Aug to Oct', 'Aug to Dec',
            'Sep to Nov', 'Sep to Dec',
            'Oct to Dec',
            'Nov to Dec',
            'Less than 6 months', 
            '6-12 months', 
            '1 year+'
        ],
        required: true
    },
    availableFrom: {
        type: String,
        enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        required: true
    },
    nearbyUniversities: {
        type: [String],
        default: [],
        set: function(universities) {
            if (typeof universities === 'string') {
                try {
                    return JSON.parse(universities);
                } catch (e) {
                    console.error('Error parsing nearbyUniversities:', e);
                    return Array.isArray(universities) ? universities : [universities];
                }
            }
            return Array.isArray(universities) ? universities : [];
        },
        get: function(universities) {
            return Array.isArray(universities) ? universities : [];
        }
    },
    bookingOptions: {
        allowSecurityDeposit: {
            type: Boolean,
            default: false
        },
        allowFirstRent: {
            type: Boolean,
            default: false
        },
        allowFirstAndLastRent: {
            type: Boolean,
            default: false
        }
    },
    instantBooking: {
        type: Boolean,
        default: false
    },
    bookByEnquiry: {
        type: Boolean,
        default: false
    }
});

// Middleware to update the updatedAt field before saving
propertySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Property = mongoose.model('Property', propertySchema);

module.exports = Property;
