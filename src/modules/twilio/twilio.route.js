const express = require("express");
const { Authenticateuser } = require('../../middleware/middleware')
const { updateTwilio, getTwilioDetails } = require("./twilio.controller");

const router = express.Router();

router.post("/update-twilio", Authenticateuser, updateTwilio);
router.get("/twilio", Authenticateuser, getTwilioDetails);

module.exports = router;
