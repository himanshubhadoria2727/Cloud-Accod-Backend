const mongoose = require("mongoose");

const tempOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  otp: {
    type: Number,  // Storing the OTP as a number
    required: true,
  },
  expiry: {
    type: Date,  // Store the expiry time as a Date object
    required: true,
  },
});

const TempOTP = mongoose.model("TempOTP", tempOTPSchema);

module.exports = TempOTP;
