const express = require('express')
const { Authenticateuser } = require('../../middleware/middleware')
const { submitEnquiry,getEnquiries } = require('./enquiry.controller'); // Import the controller

const router = express.Router();

// POST request to submit an enquiry
router.post('/submitEnquiry',Authenticateuser, submitEnquiry);
router.get('/getEnquiries',getEnquiries);

module.exports = router;
