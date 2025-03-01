const express = require('express');
const router = express.Router();
const propertyController = require('./property.controller');
const { upload } = require('../../utility/uploadfile'); // Destructure the upload object
function parseOverview(req, res, next) {
    if (typeof req.body.overview === 'string') {
        try {
            req.body.overview = JSON.parse(req.body.overview);
        } catch (error) {
            return res.status(400).send({ error: 'Invalid overview format' });
        }
    }
    next();
}
// Route to create a new property with image uploads
router.post('/', upload.array('images', 10),parseOverview, propertyController.createProperty); // Allow multiple images (up to 10)

// Route to get all properties
router.get('/', propertyController.getAllProperties);

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
router.put('/:id', upload.array('images', 10),parseOverview, propertyController.editProperty); // Allow image uploads for editing

// Route to delete a property
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;