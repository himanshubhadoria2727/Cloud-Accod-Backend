const mongoose = require("mongoose");

const twilioSchema = new mongoose.Schema({
  accountSid: {
    type: String,
  },
  authToken: {
    type: String,
  },
  mobileNumber: {
    type: String,
  },
});

const TwilioDetails = mongoose.model("twilio_details", twilioSchema);

module.exports = TwilioDetails;
