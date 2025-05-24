// Check if Stripe secret key is available
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
  throw new Error('Stripe secret key is required');
}

// Initialize Stripe with error handling
let stripe;
try {
  stripe = require('stripe')(STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Specify the latest API version
  });

  // Test the connection
  stripe.paymentMethods.list({ 
    limit: 1 
  }, {
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
    }
  })
    .then(() => console.log('Stripe connection successful'))
    .catch(err => console.error('Stripe connection test failed:', err.message));
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
  throw error;
}

const Booking = require('../../model/booking.model');
const Property = require('../../model/property.model');

// Create a payment intent
const createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) {
      console.error('Stripe not initialized');
      return res.status(500).json({ 
        error: 'Stripe Configuration Error', 
        message: 'Stripe is not properly initialized'
      });
    }

    const { amount, currency = 'inr' } = req.body;
    
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Create new payment intent with minimal metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        // Only store essential payment-related metadata
        amount: amount.toString(),
        currency: currency.toLowerCase()
      }
    });

    console.log('Created payment intent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    });
    
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Payment Intent Creation Failed',
      message: error.message
    });
  }
};

// Confirm payment success
const confirmPayment = async (req, res) => {
  try {
    console.log('Starting payment confirmation with payload:', req.body);
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      console.error('Payment confirmation failed: No paymentIntentId provided');
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    if (!stripe) {
      console.error('Payment confirmation failed: Stripe not initialized');
      return res.status(500).json({ 
        error: 'Stripe Configuration Error', 
        message: 'Stripe is not properly initialized'
      });
    }

    try {
      // Validate payment intent ID format
      if (!paymentIntentId.startsWith('pi_')) {
        console.error('Invalid payment intent ID format:', paymentIntentId);
        return res.status(400).json({ 
          error: 'Invalid Payment Intent ID',
          message: 'The provided payment intent ID is not valid'
        });
      }

      console.log('Retrieving payment intent from Stripe:', paymentIntentId);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log('Payment intent retrieved:', {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata
      });

      if (!paymentIntent) {
        console.error('Payment intent not found:', paymentIntentId);
        return res.status(404).json({
          error: 'Payment Not Found',
          message: 'The payment could not be found'
        });
      }

      if (paymentIntent.status === 'succeeded') {
        res.status(200).json({
          success: true,
          paymentIntent: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata
          }
        });
      } else {
        console.error('Payment not successful:', paymentIntent.status);
        res.status(400).json({ 
          error: 'Payment not successful', 
          status: paymentIntent.status,
          message: `Payment status is ${paymentIntent.status}`
        });
      }
    } catch (stripeError) {
      console.error('Stripe operation failed:', stripeError);
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(404).json({
          error: 'Payment Not Found',
          message: 'The payment intent could not be found. It may have expired or been cancelled.',
          details: stripeError.message
        });
      }
      throw stripeError;
    }
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    res.status(500).json({ 
      error: 'Payment Confirmation Failed',
      message: error.message,
      details: error.stack
    });
  }
};

// Handle Stripe webhook events
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    // Add more event handlers as needed
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// Helper function to handle successful payments
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    console.log('Payment successful:', paymentIntent.id);
    // Here you can add any payment-specific logic if needed
    // But no booking creation logic
  } catch (error) {
    console.error('Error handling successful payment webhook:', error);
  }
};

// Helper function to handle failed payments
const handleFailedPayment = async (paymentIntent) => {
  try {
    console.log('Payment failed:', paymentIntent.id);
    // Here you can add any payment-specific logic if needed
  } catch (error) {
    console.error('Error handling failed payment webhook:', error);
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({
      paymentStatus: booking.paymentStatus,
      paymentIntentId: booking.paymentIntentId,
      paymentAmount: booking.paymentAmount,
      paymentDate: booking.paymentDate,
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'An error occurred while getting payment status' });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentStatus,
};