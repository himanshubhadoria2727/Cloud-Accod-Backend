const mongoose = require('mongoose');

const planschema = new mongoose.Schema({
    planname: {
        type: String,
        required: true

    },

    description: {
        type: String,
        required: true
    },
    plantype: {
        type: [{
            country: {
                type: String
            },
            amount: {
                type: Number
            }
        }]
    },
    makeAt: {
        type: Date,
        default: Date.now().t
    },
    // hierarchyLevel: {
    //     type: Number,
    //     required: true,
    //     unique: true
    // },
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category', // Reference to the Category model
        }
    ],
    subCategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subcategory', // Reference to the Category model
        }
    ],
}, {
    timestamps: true,
});


const Plan = mongoose.model('Plan', planschema);

module.exports = Plan;
