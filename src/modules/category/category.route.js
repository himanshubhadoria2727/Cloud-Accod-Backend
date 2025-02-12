const express = require('express');
const { Authenticateuser } = require('../../middleware/middleware');
const { upload } = require('../../utility/uploadfile');
const { addCategory, getAllCategory, getS3Category, getS3Subcategories } = require('./category.controller');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: API endpoints for managing categories
 */

/**
 * @swagger
 * /categories/addCategory:
 *   post:
 *     summary: Add a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file associated with the category
 *               name:
 *                 type: string
 *                 description: The name of the category
 *                 example: 'Electronics'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The category ID
 *                 name:
 *                   type: string
 *                   description: The name of the category
 *                 image:
 *                   type: string
 *                   description: The URL of the uploaded image
 *       400:
 *         description: Invalid input
 */
router.post('/addCategory', addCategory);

/**
 * @swagger
 * /categories/getCategory:
 *   get:
 *     summary: Retrieve all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get('/getCategory', getAllCategory);
router.get('/getS3Category', getS3Category);
router.get('/sub3categories/:categoryName', getS3Subcategories);
module.exports = router;
