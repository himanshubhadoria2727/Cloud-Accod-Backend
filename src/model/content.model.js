const mongoose = require('mongoose')

const contentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    bannerImage: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    phone_no: {
        type: String,
        required: false  // Set to false if it's optional
    },
    email: {
        type: String,
        required: false,
        match: /.+\@.+\..+/  // Optional regex for basic email validation
    }
},
    {
        timestamps: true
    }
)

const Content = mongoose.model('Content', contentSchema)

module.exports = Content

