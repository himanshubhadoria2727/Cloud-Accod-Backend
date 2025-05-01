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

    const { amount, bookingDetails } = req.body;
    const currency = bookingDetails.currency?.toLowerCase() || 'inr';
    
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Create new payment intent with proper currency handling
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingDetails: JSON.stringify(bookingDetails)
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
        console.log('Payment succeeded, processing booking...');
        // Parse booking details from metadata
        let bookingDetails;
        try {
          bookingDetails = JSON.parse(paymentIntent.metadata.bookingDetails);
          console.log('Parsed booking details:', bookingDetails);
        } catch (parseError) {
          console.error('Failed to parse booking details:', parseError);
          throw new Error('Invalid booking details format in payment metadata');
        }
        
        // Validate required booking details
        if (!bookingDetails.propertyId || !bookingDetails.userId) {
          console.error('Missing required booking details:', bookingDetails);
          throw new Error('Missing required booking details');
        }

        // Create new booking with all required fields
        const newBooking = new Booking({
          userId: bookingDetails.userId,
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone,
          rentalDays: bookingDetails.rentalDays,
          moveInMonth: bookingDetails.moveInMonth,
          propertyId: bookingDetails.propertyId,
          price: bookingDetails.price,
          currency: bookingDetails.currency || 'inr', // Add currency
          securityDeposit: bookingDetails.securityDeposit || 0,
          securityDepositPaid: bookingDetails.securityDeposit > 0,
          lastMonthPayment: bookingDetails.lastMonthPayment || 0,
          lastMonthPaymentPaid: bookingDetails.lastMonthPayment > 0,
          paymentIntentId,
          paymentStatus: 'completed',
          status: 'confirmed',
          bedroomName: bookingDetails.bedroomName || bookingDetails.selectedBedroomName || null,
          bedroomStatus: 'reserved',
          createdAt: new Date(),
          paymentDate: new Date()
        });

        console.log('Attempting to save booking:', newBooking);
        const savedBooking = await newBooking.save();
        console.log('Booking saved successfully:', savedBooking._id);

        // Update property availability
        console.log('Updating property availability:', bookingDetails.propertyId);
        const property = await Property.findById(bookingDetails.propertyId);
        if (!property) {
          console.error('Property not found:', bookingDetails.propertyId);
          throw new Error('Property not found');
        }

        property.isAvailable = false;
        property.currentBookingId = savedBooking._id;
        await property.save();
        console.log('Property availability updated successfully');

        res.status(200).json({
          success: true,
          booking: savedBooking
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
    console.log('Handling successful payment:', paymentIntent.id);
    
    // Check if booking already exists for this payment
    const existingBooking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
    if (existingBooking) {
      console.log('Booking already exists for this payment:', existingBooking._id);
      return; // Don't create duplicate bookings
    }

    // Extract booking details from metadata
    if (!paymentIntent.metadata.bookingDetails) {
      console.error('No booking details found in metadata');
      return;
    }

    const bookingDetails = JSON.parse(paymentIntent.metadata.bookingDetails);
    
    // Create new booking
    const newBooking = new Booking({
      userId: bookingDetails.userId,
      name: bookingDetails.name,
      email: bookingDetails.email,
      phone: bookingDetails.phone,
      rentalDays: bookingDetails.rentalDays,
      moveInMonth: bookingDetails.moveInMonth,
      propertyId: bookingDetails.propertyId,
      price: bookingDetails.price,
      currency: bookingDetails.currency || 'inr',
      securityDeposit: bookingDetails.securityDeposit || 0,
      securityDepositPaid: bookingDetails.securityDeposit > 0,
      lastMonthPayment: bookingDetails.lastMonthPayment || 0,
      lastMonthPaymentPaid: bookingDetails.lastMonthPayment > 0,
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'completed',
      status: 'confirmed',
      bedroomName: bookingDetails.bedroomName || bookingDetails.selectedBedroomName || null,
      bedroomStatus: 'reserved',
      createdAt: new Date(),
      paymentDate: new Date()
    });

    const savedBooking = await newBooking.save();
    console.log('New booking created via webhook:', savedBooking._id);

    // Update property availability if needed
    if (bookingDetails.propertyId) {
      const property = await Property.findById(bookingDetails.propertyId);
      if (property) {
        property.isAvailable = false;
        property.currentBookingId = savedBooking._id;
        await property.save();
        console.log('Property availability updated via webhook');
      }
    }
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