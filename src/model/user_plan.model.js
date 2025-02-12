const mongoose = require('mongoose')

const user_Plan_schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    plan: {
        type: mongoose.Schema.ObjectId,
        ref: "Plan"
    },
    amount: {
        type: Number,
        required: true,
        ref: "Plan"
    }
}, {
    timestamps: true
})

const Uplan = mongoose.model('Uplan', user_Plan_schema)

module.exports = {
    Uplan
}