const Joi = require('joi');
const Booking = require('../../model/booking.model');
const Property = require('../../model/property.model');

// Validation schema for the booking form
const bookingSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  rentalDays: Joi.number().required().min(1),
  moveInMonth: Joi.string().required(),
  propertyId: Joi.string().required(),
  price: Joi.number().required(),
  bedroomName: Joi.string().allow(null, ''),
  selectedBedroomName: Joi.string().allow(null, ''),
});

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Validate the incoming request data
    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if the property exists
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Create a new booking record
    const newBooking = new Booking({
      userId: req.body.userId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      rentalDays: req.body.rentalDays,
      moveInMonth: req.body.moveInMonth,
      propertyId: req.body.propertyId,
      price: req.body.price,
      bedroomName: req.body.bedroomName || req.body.selectedBedroomName || null,
      bedroomStatus: 'reserved', // Set initial status as reserved
    });

    // Save the booking to the database
    await newBooking.save();

    // Return success response
    res.status(201).json({
      message: 'Booking created successfully!',
      booking: newBooking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'An error occurred while creating your booking.' });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    console.log('Fetching bookings...');
    // Fetch all bookings with more detailed property details
    const bookings = await Booking.find()
      .populate({
        path: 'propertyId',
        select: 'title location price images' // Add any other fields you need
      })
      .sort({ createdAt: -1 });

    console.log('Fetched bookings:', bookings.length);

    if (!bookings || bookings.length === 0) {
      console.log('No bookings found');
    }

    // Return the list of bookings
    res.status(200).json({
      message: 'Bookings fetched successfully!',
      bookings: bookings,
    });
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching bookings.',
      details: error.message 
    });
  }
};

// Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('propertyId', 'title location price');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking fetched successfully!',
      booking: booking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'An error occurred while fetching the booking.' });
  }
};

// Get bookings for a specific user
const getUserBookings = async (req, res) => {
  try {
    // Extract userId from URL parameter
    const { id: userId } = req.params;
    console.log('Request URL userId:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch bookings with propertyId populated
    const bookings = await Booking.find({ userId: userId })
      .populate({
        path: 'propertyId',
        select: 'title location price images currency'
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for user ${userId}`);

    // Always return a 200 status, with empty array if no bookings
    res.status(200).json({
      message: bookings.length ? 'User bookings fetched successfully!' : 'No bookings found',
      bookings: bookings
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching user bookings.',
      details: error.message 
    });
  }
};

// Get bookings for a specific property
const getPropertyBookings = async (req, res) => {
  try {
    // Extract propertyId from URL parameter
    const { id: propertyId } = req.params;
    console.log('Request URL propertyId:', propertyId);

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    // Fetch bookings for the property
    const bookings = await Booking.find({ propertyId: propertyId })
      .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for property ${propertyId}`);

    // Always return a 200 status, with empty array if no bookings
    res.status(200).json({
      message: bookings.length ? 'Property bookings fetched successfully!' : 'No bookings found for this property',
      bookings: bookings
    });

  } catch (error) {
    console.error('Error fetching property bookings:', error);
    res.status(500).json({ 
      error: 'An error occurred while fetching property bookings.',
      details: error.message 
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking status updated successfully!',
      booking: booking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'An error occurred while updating the booking status.' });
  }
};

// Delete a booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking deleted successfully!',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'An error occurred while deleting the booking.' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  getUserBookings,
  getPropertyBookings,
  updateBookingStatus,
  deleteBooking,
};