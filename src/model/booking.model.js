const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    // Personal Information
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    nationality: {
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
    // Address Information
    address: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    // Booking Dates
    leaseStart: {
      type: Date,
      required: true,
    },
    leaseEnd: {
      type: Date,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    moveOutDate: {
      type: Date,
    },
    country: {
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
    // University Information
    universityName: {
      type: String,
    },
    courseName: {
      type: String,
    },
    universityAddress: {
      type: String,
    },
    enrollmentStatus: {
      type: String,
    },
    // Medical Information
    hasMedicalConditions: {
      type: Boolean,
      default: false,
    },
    medicalDetails: {
      type: String,
    },
    // Property Information
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
    // Pricing Information
    price: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    securityDepositPaid: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      required: true,
      default: 'inr'
    },
    // Bedroom details
    bedroomName: {
      type: String,
      default: null,
    },
    bedroomStatus: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available'
    },
    // Payment related fields
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    lastMonthPayment: {
      type: Number,
      default: 0,
    },
    lastMonthPaymentPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;