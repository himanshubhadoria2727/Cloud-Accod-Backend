const TwilioDetails = require("../../model/twilio.model");

const updateTwilio = async (req, res) => {
  try {
    const Id = await TwilioDetails.findOne().select("_id");
    console.log(Id);
    const updatedSmtp = await TwilioDetails.findByIdAndUpdate(Id, req.body, {
      new: true,
    });

    if (!updatedSmtp) {
      return res.status(404).json({ error: "Smtp not found" });
    }

    res.json(updatedSmtp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTwilioDetails = async (req, res) => {
  try {
    const twilio = await TwilioDetails.findOne();

    if (!twilio) {
      return res.status(404).json({ error: "twilio not found" });
    }

    res.json({ twilio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  updateTwilio,
  getTwilioDetails,
};
