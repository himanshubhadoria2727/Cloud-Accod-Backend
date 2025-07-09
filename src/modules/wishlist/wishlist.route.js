const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('./wishlist.controller');

router.post('/add', addToWishlist);
router.delete('/remove', removeFromWishlist);
router.get('/:userId', getWishlist);

module.exports = router;
