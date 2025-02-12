
const mongoose = require('mongoose')

const subcategorySchema = new mongoose.Schema({
    subCategory: {
        type: String,

    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    }

},
    {
        timestamps: true
    }
)

const Subcategory = mongoose.model('Subcategory', subcategorySchema)

module.exports = Subcategory

