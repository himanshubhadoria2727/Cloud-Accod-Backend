const Joi = require('joi');
const Enquiry = require('../../model/enquiry.model'); // Import the Enquiry model

// Validation schema for the enquiry form
const enquirySchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().email().required(),
  message: Joi.string().required().min(10),
});

const submitEnquiry = async (req, res) => {
  try {
    // Validate the incoming request data
    const { error } = enquirySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Create a new enquiry record
    const newEnquiry = new Enquiry({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    });

    // Save the enquiry to the database
    await newEnquiry.save();

    // Return success response
    res.status(201).json({
      message: 'Enquiry submitted successfully!',
      enquiry: newEnquiry,
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ error: 'An error occurred while submitting your enquiry.' });
  }
};
const getEnquiries = async (req, res) => {
    try {
      // Fetch all enquiries (you can add pagination, sorting, etc. if needed)
      const enquiries = await Enquiry.find().sort({ createdAt: -1 }); // Sort by latest created
  
      // Return the list of enquiries
      res.status(200).json({
        message: 'Enquiries fetched successfully!',
        enquiries: enquiries,
      });
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      res.status(500).json({ error: 'An error occurred while fetching enquiries.' });
    }
  };

module.exports = { submitEnquiry,getEnquiries };
