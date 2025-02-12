const Subcategory = require("../../model/subcategory.model")


const addSubCategory = async (req, res) => {
    try {
        const { subCategory, category } = req.body


        let savedsubCategory = await Subcategory.create({
            subCategory: subCategory,
            category: category,

        })
        return res.status(200).json({
            "message": "subcategory will be added",
            savedsubCategory
        })

    } catch (err) {
        console.error(err);
        return res.status(500).json({ "message": 'Internal Server Error' });

    }
}
const getsubCategory = async (req, res) => {
    try {
        let subcategory = await Subcategory.find({}).populate('category')
        return res.status(200).json(subcategory)
    } catch (err) {
        console.error(err);
        return res.status(500).json({ "message": 'Internal Server Error' });

    }
}
const deletedSubCategory = async (req, res) => {
    try {
        const { id } = req.params
        let deletedSubcategory = await Subcategory.findByIdAndDelete(id)
        return res.json({
            deletedSubcategory,
            "message": "subCategory will be deleted"


        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ "message": 'Internal Server Error' });
    }
}

module.exports = {
    addSubCategory, deletedSubCategory, getsubCategory
}