const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
      minlength: 10,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

const Enquiry = mongoose.model('Enquiry', enquirySchema);
module.exports = Enquiry;
