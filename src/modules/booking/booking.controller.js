const Joi = require("joi");
const Booking = require("../../model/booking.model");
const Property = require("../../model/property.model");

// Validation schema for the booking form
const bookingSchema = Joi.object({
  // Personal Information
  userId: Joi.string().required(),
  name: Joi.string().required().min(3).max(50),
  dateOfBirth: Joi.date().required(),
  gender: Joi.string().valid("male", "female", "other").required(),
  nationality: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),

  // Address Information
  address: Joi.string().required(),
  addressLine2: Joi.string().allow("", null),

  // Booking Dates
  leaseStart: Joi.date().required(),
  leaseEnd: Joi.date().allow(null),
  moveInDate: Joi.date().required(),
  moveOutDate: Joi.date().allow(null),
  rentalDays: Joi.number().required().min(1),
  moveInMonth: Joi.string().required(),
  leaseDuration: Joi.string().required(),
  status: Joi.string().valid("pending", "confirmed", "cancelled").default("pending"),
  // University Information
  universityName: Joi.string().allow("", null),
  courseName: Joi.string().allow("", null),
  universityAddress: Joi.string().allow("", null),
  enrollmentStatus: Joi.string().allow("", null),

  // Medical Information
  hasMedicalConditions: Joi.boolean().default(false),
  medicalDetails: Joi.string().allow("", null),

  // Property Information
  propertyId: Joi.string().required(),
  bedroomId: Joi.string().allow(null, ""),
  price: Joi.number().required(),
  currency: Joi.string().default("inr"),
  country: Joi.string().required(),
  stateProvince: Joi.string().allow("", null),
  bedroomName: Joi.string().allow(null, ""),
  selectedBedroomName: Joi.string().allow(null, ""),
  // bedroomStatus: Joi.string().valid("booked", "available").default("available"),
  
  // Payment Information
  paymentIntentId: Joi.string().allow(null, ""),
  paymentStatus: Joi.string().valid("pending", "processing", "completed", "failed", "refunded").default("pending"),
  paymentMethod: Joi.string().allow(null, ""),
  paymentAmount: Joi.number().default(0),
  paymentDate: Joi.date().allow(null),
  stripeCustomerId: Joi.string().allow(null, ""),
  securityDeposit: Joi.number().default(0),
  lastMonthPayment: Joi.number().default(0),
});

// Create a new booking
const createBooking = async (req, res) => {
  try {
    // Validate the incoming request data
    const { error } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Log the incoming request body for debugging
    console.log(
      "Creating booking with data:",
      JSON.stringify(req.body, null, 2)
    );

    // Check if the property exists
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Update bedroom status if bedroomId is provided
    if (req.body.bedroomId) {
      // Find the bedroom in the bedroomDetails array
      const bedroom = property.overview.bedroomDetails.find(
        (bedroom) => bedroom._id.toString() === req.body.bedroomId.toString()
      );
      
      if (bedroom) {
        // Mark the bedroom as booked
        bedroom.status = 'booked';
        await property.save();
        console.log(`Bedroom ${req.body.bedroomId} marked as booked`);
      } else {
        return res.status(404).json({ error: "Bedroom not found in the property" });
      }
    }

    // Create a new booking record with all details
    const newBooking = new Booking({
      // Personal Information
      userId: req.body.userId,
      name: req.body.name,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      nationality: req.body.nationality,
      email: req.body.email,
      phone: req.body.phone,

      // Address Information
      address: req.body.address,
      addressLine2: req.body.addressLine2,

      // Booking Dates
      leaseStart: req.body.leaseStart,
      leaseEnd: req.body.leaseEnd,
      moveInDate: req.body.moveInDate,
      moveOutDate: req.body.moveOutDate,
      rentalDays: req.body.rentalDays,
      moveInMonth: req.body.moveInMonth,
      leaseDuration: req.body.leaseDuration,
      status: req.body.status || "pending",

      // University Information
      universityName: req.body.universityName,
      courseName: req.body.courseName,
      universityAddress: req.body.universityAddress,
      enrollmentStatus: req.body.enrollmentStatus,
      country: req.body.country,
      stateProvince: req.body.stateProvince,

      // Medical Information
      hasMedicalConditions: req.body.hasMedicalConditions,
      medicalDetails: req.body.medicalDetails,

      // Property Information
      propertyId: req.body.propertyId,
      bedroomId: req.body.bedroomId,
      price: req.body.price,
      securityDeposit: req.body.securityDeposit || 0,
      securityDepositPaid: req.body.securityDeposit > 0,
      lastMonthPayment: req.body.lastMonthPayment || 0,
      lastMonthPaymentPaid: req.body.lastMonthPayment > 0,
      currency: req.body.currency || "inr",
      bedroomName: req.body.bedroomName || req.body.selectedBedroomName || null,
      // bedroomStatus: "booked",

      // Payment Information
      paymentIntentId: req.body.paymentIntentId,
      paymentStatus: req.body.paymentIntentId ? "completed" : "pending",
      paymentMethod: req.body.paymentMethod,
      paymentAmount: req.body.paymentAmount || req.body.price,
      paymentDate: req.body.paymentIntentId ? new Date() : null,
      stripeCustomerId: req.body.stripeCustomerId,
    });

    // Log the booking being created
    console.log(
      "Saving new booking with bedroom name:",
      newBooking.bedroomName
    );

    // Save the booking to the database
    await newBooking.save();

    // Return success response
    res.status(201).json({
      message: "Booking created successfully!",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating your booking." });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    console.log("Fetching bookings...");
    // Fetch all bookings with more detailed property details
    const bookings = await Booking.find()
      .populate({
        path: "propertyId",
        select: "title location price images", // Add any other fields you need
      })
      .sort({ createdAt: -1 });

    console.log("Fetched bookings:", bookings.length);

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found");
    }

    // Return the list of bookings
    res.status(200).json({
      message: "Bookings fetched successfully!",
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      error: "An error occurred while fetching bookings.",
      details: error.message,
    });
  }
};

// Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      "propertyId",
      "title location price"
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking fetched successfully!",
      booking: booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the booking." });
  }
};

// Get bookings for a specific user
const getUserBookings = async (req, res) => {
  try {
    // Extract userId from URL parameter
    const { id: userId } = req.params;
    console.log("Request URL userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch bookings with propertyId populated
    const bookings = await Booking.find({ userId: userId })
      .populate({
        path: "propertyId",
        select: "title location price images currency",
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for user ${userId}`);

    // Always return a 200 status, with empty array if no bookings
    res.status(200).json({
      message: bookings.length
        ? "User bookings fetched successfully!"
        : "No bookings found",
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      error: "An error occurred while fetching user bookings.",
      details: error.message,
    });
  }
};

// Get bookings for a specific property
const getPropertyBookings = async (req, res) => {
  try {
    // Extract propertyId from URL parameter
    const { id: propertyId } = req.params;
    console.log("Request URL propertyId:", propertyId);

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    // Fetch bookings for the property
    const bookings = await Booking.find({ propertyId: propertyId }).sort({
      createdAt: -1,
    });

    console.log(`Found ${bookings.length} bookings for property ${propertyId}`);

    // Always return a 200 status, with empty array if no bookings
    res.status(200).json({
      message: bookings.length
        ? "Property bookings fetched successfully!"
        : "No bookings found for this property",
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error fetching property bookings:", error);
    res.status(500).json({
      error: "An error occurred while fetching property bookings.",
      details: error.message,
    });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking status updated successfully!",
      booking: booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the booking status." });
  }
};

// Delete a booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the booking." });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  getUserBookings,
  getPropertyBookings,
  updateBookingStatus,
  deleteBooking,
};
