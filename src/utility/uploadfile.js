const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
require('dotenv').config(); // Load environment variables

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'media');
    },
    filename: function (req, file, cb) {
        console.log(file, req.body);
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

app.use('/media', express.static(path.join(__dirname, 'media')));

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

const getImageUrl = (filename) => {
    return `${process.env.API_BASE_URL}/media/${filename}`;
};

module.exports = {
    upload,
    getImageUrl
}