// Check if Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Check if the key is a placeholder
if (process.env.STRIPE_SECRET_KEY === 'REPLACE_WITH_YOUR_ACTUAL_STRIPE_SECRET_KEY') {
  console.error('STRIPE_SECRET_KEY is still set to the placeholder value. Please replace it with your actual Stripe secret key.');
}

// Log the first few characters of the key for debugging (don't log the full key for security)
console.log('Stripe Secret Key (first 8 chars):', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...' : 'undefined');

// Initialize Stripe with error handling
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // Test the connection
  stripe.paymentMethods.list({ limit: 1 })
    .then(() => console.log('Stripe connection successful'))
    .catch(err => console.error('Stripe connection test failed:', err.message));
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

const Booking = require('../../model/booking.model');
const Property = require('../../model/property.model');

// Create a payment intent
const createPaymentIntent = async (req, res) => {
  try {
    // Check if Stripe is properly initialized
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe Configuration Error', 
        message: 'Stripe is not properly initialized'
      });
    }

    const { bookingDetails } = req.body;
    
    if (!bookingDetails) {
      return res.status(400).json({ error: 'Booking details are required' });
    }

    // Calculate the amount in cents
    const amount = Math.round(bookingDetails.price * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: bookingDetails?.currency,
      metadata: {
        bookingDetails: JSON.stringify(bookingDetails)
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

// Confirm payment success
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    // Retrieve the payment intent from Stripe to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if the payment was successful
    if (paymentIntent.status === 'succeeded') {
      // Create the booking from the metadata
      const bookingDetails = JSON.parse(paymentIntent.metadata.bookingDetails);
      
      const newBooking = new Booking({
        ...bookingDetails,
        paymentIntentId,
        paymentStatus: 'completed',
        status: 'confirmed'
      });

      await newBooking.save();

      res.status(200).json({
        success: true,
        booking: newBooking
      });
    } else {
      res.status(400).json({ error: 'Payment was not successful' });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'An error occurred while confirming payment' });
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
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    booking.paymentStatus = 'completed';
    booking.status = 'confirmed';
    booking.paymentMethod = paymentIntent.payment_method_types[0];
    booking.paymentDate = new Date();
    
    if (paymentIntent.customer) {
      booking.stripeCustomerId = paymentIntent.customer;
    }
    
    await booking.save();
  } catch (error) {
    console.error('Error handling successful payment webhook:', error);
  }
};

// Helper function to handle failed payments
const handleFailedPayment = async (paymentIntent) => {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    booking.paymentStatus = 'failed';
    await booking.save();
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