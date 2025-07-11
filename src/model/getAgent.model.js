const mongoose = require('mongoose');
const getAgentSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    moveInDate: {
        type: Date,
        required: true
    },
    universityName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const getAgentModel = mongoose.model('getAgent', getAgentSchema);

module.exports = getAgentModel;