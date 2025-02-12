const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    CategoryName: {
        type: String,
        required: true
    },
    // CategoryImage: {
    //     type: String,
    //     required: true
    // },
    Bol: [
        {
            name: {
                type: String,
                required: true
            }
        }
    ]
    // plans: [
    //     {
    //         type: String,
    //         ref: 'Plan' 
    //     }
    // ]
}, {
    timestamps: true
})
const Category = mongoose.model('Category', categorySchema)
module.exports = Category