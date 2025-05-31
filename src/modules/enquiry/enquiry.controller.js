const Joi = require('joi');
const Enquiry = require('../../model/enquiry.model'); // Import the Enquiry model

// Validation schema for the enquiry form
const enquirySchema = Joi.object({
  // Personal Information
  name: Joi.string().required().min(3).max(50),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  nationality: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
  addressLine2: Joi.string().allow(''),
  country: Joi.string().required(),
  stateProvince: Joi.string().required(),

  // Accommodation Details
  leaseDuration: Joi.string().required(),
  moveInDate: Joi.date().required(),
  moveOutDate: Joi.date().allow(null),

  // University Details
  universityName: Joi.string().required(),
  courseName: Joi.string().required(),
  universityAddress: Joi.string().required(),
  enrollmentStatus: Joi.string().valid('enrolled', 'accepted', 'graduated', 'other').required(),

  // Medical Information
  hasMedicalConditions: Joi.boolean().default(false),
  medicalDetails: Joi.string().allow(''),

  // Property Information
  propertyId: Joi.string().required(),
  bedroomId: Joi.string().allow(''),
  bedroomName: Joi.string().allow(''),
  price: Joi.number(),
  currency: Joi.string(),
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
      ...req.body,
      status: 'pending',
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
    const { propertyId, status } = req.query;
    let query = {};

    // Add filters if provided
    if (propertyId) {
      query.propertyId = propertyId;
    }
    if (status) {
      query.status = status;
    }

    // Fetch enquiries with filters
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .populate('propertyId', 'title location images'); // Populate property details if needed

    res.status(200).json({
      message: 'Enquiries fetched successfully!',
      enquiries: enquiries,
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'An error occurred while fetching enquiries.' });
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id)
      .populate('propertyId', 'title location images');

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.status(200).json({
      message: 'Enquiry fetched successfully!',
      enquiry: enquiry,
    });
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ error: 'An error occurred while fetching the enquiry.' });
  }
};

const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.status(200).json({
      message: 'Enquiry status updated successfully!',
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({ error: 'An error occurred while updating the enquiry status.' });
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.status(200).json({
      message: 'Enquiry deleted successfully!',
      enquiry: deletedEnquiry,
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: 'An error occurred while deleting the enquiry.' });
  }
};

module.exports = {
  submitEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  deleteEnquiry,
};

