const Joi = require('joi');
const Booking = require('../../model/booking.model');
const Property = require('../../model/property.model');

// Validation schema for the booking form
const bookingSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  rentalDays: Joi.number().required().min(1),
  moveInMonth: Joi.string().required(),
  propertyId: Joi.string().required(),
  price: Joi.number().required(),
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
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      rentalDays: req.body.rentalDays,
      moveInMonth: req.body.moveInMonth,
      propertyId: req.body.propertyId,
      price: req.body.price,
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
    // Fetch all bookings with property details
    const bookings = await Booking.find()
      .populate('propertyId', 'title location price')
      .sort({ createdAt: -1 });

    // Return the list of bookings
    res.status(200).json({
      message: 'Bookings fetched successfully!',
      bookings: bookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'An error occurred while fetching bookings.' });
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
  updateBookingStatus,
  deleteBooking,
}; 