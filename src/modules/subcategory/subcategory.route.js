const express = require('express')
const { Authenticateuser } = require('../../middleware/middleware')
const { addSubCategory, getsubCategory, deletedSubCategory } = require('./subcategory.controller')

const router = express.Router()


router.post('/add_subCategory', Authenticateuser, addSubCategory)
router.get('/get_subCategory', Authenticateuser, getsubCategory)
router.delete('/del_subCategory/:id', Authenticateuser, deletedSubCategory)




module.exports = router