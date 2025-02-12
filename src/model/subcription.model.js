const mongoose = require('mongodb')



const subcriptionschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    stripeCustomerId: {
        type: String,

    },
    stripeSubscriptionId: {
        type: String
    },
    stripePriceId: {
        type: String
    },
    stripeCurrentPeriodEnd: {
        type: Date
    }



}, {
    timestamps: true
})


const Subcription = mongoose.model('Subcription', subcriptionschema);


module.exports = Subcription
