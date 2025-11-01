const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { Authenticateuser, AuthenticateAdmin } = require('../../middleware/middleware')

// Dashboard analytics routes (Admin only)
router.get('/dashboard-stats', AuthenticateAdmin, analyticsController.getDashboardStats);
router.get('/revenue-data', AuthenticateAdmin, analyticsController.getRevenueData);
router.get('/recent-messages', AuthenticateAdmin, analyticsController.getRecentMessages);
router.get('/recent-transactions', AuthenticateAdmin, analyticsController.getRecentTransactions);

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