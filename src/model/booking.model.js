const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: /.+\@.+\..+/,
    },
    phone: {
      type: String,
      required: true,
    },
    rentalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    moveInMonth: {
      type: String,
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking; 