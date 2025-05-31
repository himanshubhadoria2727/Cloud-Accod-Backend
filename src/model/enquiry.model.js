const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
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
      required: true,
      enum: ['male', 'female', 'other'],
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
    address: {
      type: String,
      required: true,
    },
    addressLine2: String,
    country: {
      type: String,
      required: true,
    },
    stateProvince: {
      type: String,
      required: true,
    },

    // Accommodation Details
    leaseDuration: {
      type: String,
      required: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    moveOutDate: Date,

    // University Details
    universityName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    universityAddress: {
      type: String,
      required: true,
    },
    enrollmentStatus: {
      type: String,
      required: true,
      enum: ['enrolled', 'accepted', 'graduated', 'other'],
    },

    // Medical Information
    hasMedicalConditions: {
      type: Boolean,
      default: false,
    },
    medicalDetails: String,

    // Property Information
    propertyId: {
      type: String,
      required: true,
    },
    bedroomId: String,
    bedroomName: String,
    price: Number,
    currency: String,

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Enquiry = mongoose.model('Enquiry', enquirySchema);
module.exports = Enquiry;
