const mongoose = require('mongoose');

// Schema for property views
const propertyViewSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    viewCount: {
        type: Number,
        default: 1
    },
    lastViewed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Schema for user favorites
const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    }
}, {
    timestamps: true
});

// Schema for property reviews
const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Schema for revenue tracking
const revenueSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['booking', 'deposit', 'refund', 'other'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Create models
const PropertyView = mongoose.model('PropertyView', propertyViewSchema);
const Favorite = mongoose.model('Favorite', favoriteSchema);
const Review = mongoose.model('Review', reviewSchema);
const Revenue = mongoose.model('Revenue', revenueSchema);

module.exports = {
    PropertyView,
    Favorite,
    Review,
    Revenue
}; 