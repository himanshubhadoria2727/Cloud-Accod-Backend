const GetAgent = require("../../model/getAgent.model");
const { validationResult } = require("express-validator");
const { body } = require("express-validator");

const validateGetAgentForm = [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('nationality')
      .trim()
      .notEmpty()
      .withMessage('Nationality is required'),
    
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Country code is required'),
    //   .matches(/^\+\d{1,4}$/)
    //   .withMessage('Country code must be in format +1, +44, etc.'),
    
    body('mobileNumber')
      .trim()
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^\d{8,15}$/)
      .withMessage('Mobile number must be 8-15 digits'),
    
    body('moveInDate')
      .notEmpty()
      .withMessage('Move in date is required')
      .isISO8601()
      .withMessage('Please provide a valid date')
      .custom((value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          throw new Error('Move in date cannot be in the past');
        }
        return true;
      }),
    
    body('universityName')
      .trim()
      .notEmpty()
      .withMessage('University name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('University name must be between 2 and 200 characters')
  ];

const createAgentRequest = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      fullName,
      email,
      nationality,
      code,
      mobileNumber,
      moveInDate,
      universityName
    } = req.body;

    // Combine country code and mobile number
    const fullMobileNumber = `${code}${mobileNumber}`;

    // Create agent request object
    const agentRequest = {
      fullName,
      email: email.toLowerCase(),
      nationality,
      mobileNumber: fullMobileNumber,
      moveInDate: new Date(moveInDate),
      universityName,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const newAgentRequest = new GetAgent(agentRequest);
    const savedRequest = await newAgentRequest.save();

    // Send success response with the saved data
    res.status(201).json({
      success: true,
      message: 'Agent request submitted successfully! We will assign you a personal housing expert shortly.',
      data: {
        id: savedRequest._id,
        fullName: savedRequest.fullName,
        email: savedRequest.email,
        status: savedRequest.status,
        submittedAt: savedRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating agent request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get all agent requests with optional filtering
const getAllAgentRequests = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search = "", 
      searchField = "all" 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Base filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // 👉 Use your helper function here!
    const searchQuery = buildAgentRequestSearchQuery(search, searchField);

    // Merge searchQuery into filter
    Object.assign(filter, searchQuery);

    // Fetch from DB
    const requests = await GetAgent.find(filter)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);
    
    const totalRequests = await GetAgent.countDocuments(filter);
    const totalPages = Math.ceil(totalRequests / limitNum);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRequests,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Error fetching agent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};



const buildAgentRequestSearchQuery = (search, searchField) => {
  if (!search || !search.trim()) return {};

  const searchRegex = new RegExp(search.trim(), 'i');
  
  const searchQueries = {
    fullName: { fullName: searchRegex },
    email: { email: searchRegex },
    nationality: { nationality: searchRegex },
    mobileNumber: { mobileNumber: searchRegex },
    universityName: { universityName: searchRegex },
    status: { status: searchRegex },
    all: {
      $or: [
        { fullName: searchRegex },
        { email: searchRegex },
        { nationality: searchRegex },
        { mobileNumber: searchRegex },
        { universityName: searchRegex },
        { status: searchRegex }
      ]
    }
  };

  return searchQueries[searchField] || searchQueries.all;
};

// Get agent request by ID
const getAgentRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch from database
    const request = await GetAgent.findById(id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Agent request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error fetching agent request:', error);
    
    // Handle invalid ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent request ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Update agent request status
const updateAgentRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, agentId } = req.body;

    // Validate status
    if (!['pending', 'assigned', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, assigned, or completed'
      });
    }

    // Prepare update object
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (agentId) {
      updateData.agentId = agentId;
    }

    // Update in database
    const updatedRequest = await GetAgent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Agent request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agent request status updated successfully',
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error updating agent request:', error);
    
    // Handle invalid ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent request ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Delete agent request
const deleteAgentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete from database
    const deletedRequest = await GetAgent.findByIdAndDelete(id);
    
    if (!deletedRequest) {
      return res.status(404).json({
        success: false,
        message: 'Agent request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agent request deleted successfully',
      data: {
        id: deletedRequest._id,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error deleting agent request:', error);
    
    // Handle invalid ObjectId error
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent request ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

module.exports = {
  validateGetAgentForm,
  createAgentRequest,
  getAllAgentRequests,
  getAgentRequestById,
  updateAgentRequestStatus,
  deleteAgentRequest
};