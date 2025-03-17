const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../../model/booking.model');

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const bookingDetails = JSON.parse(paymentIntent.metadata.bookingDetails);

    try {
      // Create the booking
      const newBooking = new Booking({
        ...bookingDetails,
        paymentIntentId: paymentIntent.id,
        paymentStatus: 'completed',
        status: 'confirmed'
      });

      await newBooking.save();
      console.log('Booking created successfully:', newBooking._id);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  res.json({ received: true });
};

module.exports = { handleWebhook };