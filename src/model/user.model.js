const mongoose = require('mongoose');


const userschema = new mongoose.Schema({
    phone_no: {
        type: String,
        required: false,
    },
    email: {
        type: String,
    },
    username: {
        type: String,
        trim: true,
    },
    firstname: {
        type: String,
        trim: true,
    },
    lastname: {
        type: String,
        trim: true,
    },
    password: {
        type: String,
    },
    country_code: {
        type: String,
        required: false,
    },
    country_name: {
        type: String,
        required: false,
    },
    otp: {
        type: String
    },
    otp_expire: {
        type: Date
    },
    verified: {
        type: Boolean
    },
    
    plan: {
        type: String
    },

    roles: [{
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }]

}, {
    timestamps: true,
});







const User = mongoose.model('User', userschema);


module.exports = User
