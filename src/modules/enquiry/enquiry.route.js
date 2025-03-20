const express = require('express')
const { Authenticateuser } = require('../../middleware/middleware')
const { submitEnquiry,getEnquiries, deleteEnquiry } = require('./enquiry.controller'); // Import the controller

const router = express.Router();

// POST request to submit an enquiry
router.post('/submitEnquiry',Authenticateuser, submitEnquiry);
router.get('/getEnquiries',getEnquiries);
router.delete('/:id',Authenticateuser, deleteEnquiry);

module.exports = router;
