const express = require('express');
const { Authenticateuser } = require('../../middleware/middleware');
const {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentStatus,
} = require('./payment.controller');

const router = express.Router();

// Create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Confirm payment
router.post('/confirm-payment', confirmPayment);

// Get payment status
router.get('/status/:bookingId', getPaymentStatus);

// Handle Stripe webhook
// Note: Stripe webhooks should be raw body, not JSON parsed
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router; 