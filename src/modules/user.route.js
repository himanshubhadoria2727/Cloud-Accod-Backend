const express = require('express');
const { Authenticateuser } = require('../middleware/middleware');
const { addUser, verifyUser, login, getUser, getUserDetails,resendOtp,getAnalytics, updateUser,deleterUser, googleAuth } = require('./user.controller');
const {getMySubscriptionPlans,updateMySubscription} = require('./mySubscription/mySubscription.controller');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for managing users
 */

/**
 * @swagger
 * /users/getUser:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/getUser', getUser);

/**
 * @swagger
 * /users/getUserDetails:
 *   get:
 *     summary: Retrieve details of a specific user
 *     tags: [Users]
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: ID of the user to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Details of the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
router.get('/getUserDetails', getUserDetails);

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email of the user
 *               password:
 *                 type: string
 *                 description: The password for the user account
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', addUser);

/**
 * @swagger
 * /users/updateUser:
 *   post:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to update
 *               name:
 *                 type: string
 *                 description: The updated name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The updated email of the user
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/updateUser', updateUser);
router.post('/resendOtp', resendOtp);

/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Verify user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user to verify
 *               verificationCode:
 *                 type: string
 *                 description: Verification code
 *     responses:
 *       200:
 *         description: User verified successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/verify',Authenticateuser, verifyUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /users/google-auth:
 *   post:
 *     summary: Google authentication
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The email from Google
 *               name:
 *                 type: string
 *                 description: The user's name from Google
 *               googleId:
 *                 type: string
 *                 description: The Google ID
 *               picture:
 *                 type: string
 *                 description: URL to the user's profile picture
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid input
 */
router.post('/google-auth', googleAuth);

router.get('/analytics', getAnalytics);

router.delete('/delete/:id', Authenticateuser, deleterUser);

router.get('/mySubscription',Authenticateuser, getMySubscriptionPlans);
router.put('/mySubscription', Authenticateuser, updateMySubscription);


module.exports = router;
