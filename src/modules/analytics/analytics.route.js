const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { Authenticateuser } = require('../../middleware/middleware')

// Dashboard analytics routes
router.get('/dashboard-stats', analyticsController.getDashboardStats);
router.get('/revenue-data', analyticsController.getRevenueData);
router.get('/recent-messages', analyticsController.getRecentMessages);
router.get('/recent-transactions', analyticsController.getRecentTransactions);

// User interaction routes (these typically require authentication)
router.post('/property-view/:propertyId', analyticsController.recordPropertyView);
router.post('/favorite/:propertyId', Authenticateuser, analyticsController.toggleFavorite);
router.post('/review/:propertyId', Authenticateuser, analyticsController.addReview);
router.post('/transaction', Authenticateuser, analyticsController.recordTransaction);

// Review management routes
router.get('/reviews', analyticsController.getAllReviews);
router.get('/reviews/property/:propertyId', analyticsController.getPropertyReviews);
router.put('/reviews/:reviewId', Authenticateuser, analyticsController.updateReview);
router.delete('/reviews/:reviewId', Authenticateuser, analyticsController.deleteReview);

module.exports = router; 