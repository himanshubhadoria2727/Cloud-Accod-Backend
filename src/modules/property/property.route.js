const express = require('express');
const router = express.Router();
const propertyController = require('./property.controller');
const { upload } = require('../../utility/uploadfile'); // Destructure the upload object

// Debug middleware to log form fields and files
function debugRequest(req, res, next) {
    console.log('Request body keys:', Object.keys(req.body));
    
    if (req.files && req.files.length > 0) {
        console.log('Files received:', req.files.map(f => ({
            fieldname: f.fieldname,
            originalname: f.originalname,
            size: f.size
        })));
    } else {
        console.log('No files received');
    }
    
    next();
}

// Enhanced middleware to handle form data including possible WebKit boundaries
function parseOverview(req, res, next) {
    // Check for boundary strings that might be included accidentally
    Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string' && 
            (req.body[key].includes('WebKitFormBoundary') || 
             req.body[key].includes('----'))) {
            console.log(`Found form boundary in field: ${key}. Attempting to clean.`);
            // Try to extract content after Content-Disposition line
            const matches = req.body[key].match(/Content-Disposition:.*?name="data"[\r\n]+([\s\S]+)/i);
            if (matches && matches[1]) {
                req.body[key] = matches[1].trim();
                console.log(`Cleaned field ${key}`);
            }
        }
    });

    // Parse JSON fields
    if (typeof req.body.overview === 'string') {
        try {
            req.body.overview = JSON.parse(req.body.overview);
        } catch (error) {
            console.error('Error parsing overview:', error);
            return res.status(400).send({ error: 'Invalid overview format' });
        }
    }
    
    next();
}

// Use multer.any() instead of fields to accept any field name
const propertyUpload = upload.any();

// Route to create a new property with image uploads
router.post('/', propertyUpload, debugRequest, parseOverview, propertyController.createProperty);

// Route to get all properties
router.get('/', propertyController.getAllProperties);

// Route to get universities by location (city/country)
router.get('/universities', propertyController.getUniversitiesByLocation);

// Route to get standard locality options
router.get('/localities', (req, res) => {
    const standardLocalities = [
        'Downtown',
        'North',
        'East',
        'West',
        'South',
        'Suburbs',
        'Midtown',
        'Central',
        'Business District',
        'Residential Area'
    ];
    
    res.status(200).send({ localities: standardLocalities });
});

// Route to edit a property
router.put('/:id', propertyUpload, debugRequest, parseOverview, propertyController.editProperty);

// Route to delete a property
router.delete('/:id', propertyController.deleteProperty);

// Health check endpoint
router.get('/health-check', (req, res) => {
    res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;