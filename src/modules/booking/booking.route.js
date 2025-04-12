const express = require('express');
const { Authenticateuser } = require('../../middleware/middleware');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getUserBookings,
} = require('./booking.controller');

const router = express.Router();

// Create a new booking
router.post('/create', createBooking);

// Get all bookings
router.get('/all', Authenticateuser, getBookings);

// Update the user bookings route to use the authenticated user
router.get('/user/:id', Authenticateuser, getUserBookings);

// Get a single booking by ID
router.get('/:id', Authenticateuser, getBookingById);

// Update booking status
router.put('/:id/status', Authenticateuser, updateBookingStatus);

// Delete a booking
router.delete('/:id', Authenticateuser, deleteBooking);

module.exports = router;