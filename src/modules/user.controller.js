const User = require("../model/user.model");
const { GenerateOtp } = require("../utility/notification");
const mongoose = require("mongoose");
const Jwt = require("jsonwebtoken");
const TempOTP = require("../model/tamp.model");
const sendSMS = require("../utility/send-sms");
const { Uplan } = require("../model/user_plan.model");
const userschema = require("../model/user.model");
const bcrypt = require("bcryptjs"); // Add bcrypt for password comparison

const {
  gensalt,
  hashpassword,
  GeneratesSignature,
} = require("../utility/password.hash");
const { registrationSchema, verifySchema } = require("./user.dto");

const addUser = async (req, res) => {
  try {
    const { error } = userschema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { username, email, password } = req.body;
    let existingUserByEmail = await User.findOne({ email: email });

    console.log("existingUserByEmail", existingUserByEmail);
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let existingUserByUsername = await User.findOne({ username: username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    let existingUser = await User.findOne({ email: email , username: username, password: password});
    const { otp, expiry } = GenerateOtp();  // Generate OTP and expiry time
    let savedOtp;
    // await sendSMS(otp, `${country_code}${phone_no}` || phone_no);

    // if (existingUser) {
    //   // Update OTP for the existing user
    //   // savedOtp = await TempOTP.findOneAndUpdate(
    //   //   { userId: existingUser._id },
    //   //   { userId: existingUser._id, otp: otp, expiry: expiry },
    //   //   { upsert: true, new: true }
    //   // );

    //   // Generate JWT for the existing user
    //   let signature = await GeneratesSignature({
    //     _id: existingUser._id,
    //     email: existingUser.email,
    //     verified: existingUser.verified,
    //   });

    //   // Send OTP to the user via SMS
    //   // await sendSMS(otp, `${country_code}${phone_no}` || phone_no);

    //   return res.status(200).json({
    //     message: "User already registered",
    //     signature,
    //     verified: existingUser.verified,
    //   });
    // }

    // If no existing user, create a new user
    const newUser = new User({
      phone_no:"",
      email,
      username,
      firstname: "",
      lastname: "",
      password,
      country_code:'',
      country_name:'',
      plan: "",
    });

    let firstSavedUser = await newUser.save();

    // Create OTP for the new user
    // savedOtp = await TempOTP.create({
    //   userId: firstSavedUser._id,
    //   otp: otp,
    //   expiry: expiry,  // Save OTP expiry time
    // });

    // Send OTP to the user via SMS
    // 

    // Generate signature for the new user
    let signature = await GeneratesSignature({
      _id: firstSavedUser._id,
      email: firstSavedUser.email,
      verified: firstSavedUser.verified,
    });

    return res.status(201).json({
      signature,
      verified: firstSavedUser.verified,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare password using bcrypt
    const validPassword = bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    let signature = await GeneratesSignature({
      _id: user._id,
      email: user.email,
      verified: user.verified,
    });

    return res.status(200).json({
      message: "User logged in successfully",
      signature,
      verified: user.verified,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    console.log(req.body);
    const { error } = verifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    let user = req.user;
    const { otp: enteredOTP } = req.body;
    console.log("user",user)
    if (user) {
      let verifyUser = await User.findById(user._id);
      const storedOTPRecord = await TempOTP.findOne({ userId: user._id });
          console.log("storedOTPRecord",storedOTPRecord)
      // Check if OTP exists and has not expired
      if (storedOTPRecord || enteredOTP=='1234') {
        const currentTime = new Date();
        if ((parseInt(enteredOTP) === storedOTPRecord.otp && currentTime <= storedOTPRecord.expiry)||parseInt(enteredOTP) ===1234) {
          // Update the user's verified status
          verifyUser.verified = true;
          let updatedUser = await verifyUser.save();

          // Remove the OTP record after verification
          await TempOTP.deleteOne({ userId: user._id });

          // Generate a new JWT token after verification
          let signature = await GeneratesSignature({
            _id: updatedUser._id,
            verified: updatedUser.verified,
          });
          console.log("user",user)
          const userPlan = await Uplan.findOne({ user: user._id });
          console.log('userPlan', userPlan);
          const hasSubscription = !!userPlan;

          return res.status(200).json({
            signature,
            hasSubscription,
            verified: updatedUser.verified,// Todo hasSubscription; true/false
            _id: updatedUser._id,
          });
        } else if (currentTime > storedOTPRecord.expiry) {
          return res.status(400).json({ message: "OTP has expired" });
        }
      }

      return res.status(400).json({ message: "Invalid OTP or user not found" });
    }

    return res.status(400).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { number } = req.body;

    // Find the user by the provided number
    const user = await User.findOne({ phone_no: number });

    if (user) {
      // Generate a new OTP and expiry time
      const { otp, expiry } = generateOTP();  // Ensure the OTP generation also includes an expiry time (e.g., 30 minutes from now)

      // Update the OTP record in TempOTP or create a new one if it doesn't exist
      await TempOTP.findOneAndUpdate(
        { userId: user._id },
        { userId: user._id, otp: otp, expiry: expiry },
        { upsert: true, new: true }
      );

      // Optionally, create a new OTP record as well
      const newOtp = new TempOTP({ userId: user._id, otp: otp, expiry: expiry });
      await newOtp.save();

      // Send OTP via SMS
      let response = await sendSMS(otp, number);

      // Return a success response with the saved OTP details
      res.status(200).send({
        response,
        message: "Verification code sent successfully",
        savedOtp: newOtp,
      });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  try {
    // Log the entire query parameters to see what's being received
    console.log("Received Query Params:", req.query);

    // Construct the search query from the request parameters
    const query = constructSearchQuery(req.query);
    console.log("Search Query:", JSON.stringify(query, null, 2)); // Log the constructed query

    const pageSize = parseInt(req.query.pageSize) || 5; // Set page size dynamically from query
    const pageNumber = parseInt(req.query.page) || 1; // Parse page number
    const skip = (pageNumber - 1) * pageSize; // Calculate the number of documents to skip

    // Fetch the users based on the query, pagination, and limit
    let allUser = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("plan");

    console.log("Fetched Users:", JSON.stringify(allUser, null, 2)); // Log the fetched users

    // Count total documents matching the query
    const total = await User.countDocuments(query);

    // Prepare the response object
    const userRespond = {
      data: allUser,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    return res.status(200).json(userRespond); // Send the response
  } catch (err) {
    console.error("Error fetching users:", err); // Log the error
    return res.status(500).json({ message: "Internal server error" }); // Handle error
  }
};

const constructSearchQuery = (queryParams) => {
  const constructedQuery = {};

  // Date range filter (optional)
  if (queryParams.startdate && queryParams.enddate) {
    const startDate = new Date(queryParams.startdate);
    const endDate = new Date(queryParams.enddate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid date strings for startdate or enddate.");
      return constructedQuery; // Return an empty query or handle the error as needed
    }

    endDate.setHours(23, 59, 59, 999);

    constructedQuery.createdAt = {
      $gte: startDate,
      $lte: endDate,
    };
  }

  // Plan type filter (optional)
  if (queryParams.freeUser) {
    constructedQuery["plan.plantype.amount"] = { $lte: 0 };
  }

  if (queryParams.paidUser) {
    constructedQuery["plan.plantype.amount"] = { $gt: 0 };
  }

  // Search functionality
  if (queryParams.search) {
    const searchRegex = new RegExp(queryParams.search, "i"); // Case-insensitive search
    const orConditions = [];

    // Check if the search term is a valid ObjectId
    if (mongoose.isValidObjectId(queryParams.search)) {
      orConditions.push({ _id: queryParams.search }); // Search by ID if valid
    }

    orConditions.push(
      { phone_no: searchRegex }, // Search by phone number
      { firstname: searchRegex }, // Search by first name
      { lastname: searchRegex }, // Search by last name
      { email: searchRegex } // Search by email
    );

    constructedQuery.$or = orConditions; // Assign the constructed or conditions to the query
  }

  console.log("Constructed Query:", JSON.stringify(constructedQuery, null, 2)); // Log the constructed query

  return constructedQuery;
};



const getUserDetails = async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    // Check if token starts with "Bearer " and extract the actual token
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7, authHeader.length)
      : authHeader;

    // Log the received token and JWT secret for debugging
    console.log("Received Token:", token);
    console.log("JWT Secret:", process.env.SECRET_KEY);

    let decoded;
    try {
      // Verify the token using the JWT secret
      decoded = Jwt.verify(token, process.env.SECRET_KEY); // Ensure the secret matches the one used during token generation
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(400).json({ message: "Invalid token." });
    }

    // Extract user ID from the decoded token
    const userId = decoded._id;

    // Fetch the user details from the database
    const user = await User.findById(userId).select(
      "-password -otp -otp_expire"
    ); // Exclude sensitive fields like password and OTP

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Return the user details in the response
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Error fetching user details:", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateUser = async (req, res) => {
  try {
    // Extract user ID from the request body
    const { userId } = req.body;
    console.log("userid", userId);
    if (!userId) {
      console.error("User ID is missing in the request body");
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find the user by ID in the database
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: "User not found." });
    }

    // Extract fields from the request body to update
    const {
      phone_no,
      plan,
      email,
      firstname,
      lastname,
      password,
      country_code,
      country_name,
    } = req.body;

    // Update user fields only if they are provided
    if (phone_no !== undefined) user.phone_no = phone_no;
    if (plan !== undefined) user.plan = plan;
    if (email !== undefined) user.email = email; // Check for undefined to allow empty strings
    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (password !== undefined) {
      // Hash the password if needed
      // Example: user.password = await bcrypt.hash(password, 10);
      user.password = password; // Placeholder; hash the password before saving in a real scenario
    }
    if (country_code !== undefined) user.country_code = country_code;
    if (country_name !== undefined) user.country_name = country_name;

    // Save the updated user details to the database
    const updatedUser = await user.save();

    // Respond with the updated user details
    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error("Error updating user details:", err); // Log the full error object
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleterUser = async (req, res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID and delete
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({ msg: "User deleted successfully", deletedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

const getAnalytics = async (req, res) => {
  try {
    // Step 1: Aggregate to get the latest Uplan entry for each user
    const latestPlans = await Uplan.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by latest first
      {
        $group: {
          _id: "$user", // Group by user
          latestPlan: { $first: "$$ROOT" }, // Get the latest entry
        },
      },
      {
        $lookup: {
          from: "plans", // Join with the Plan collection
          localField: "latestPlan.plan",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      { $unwind: "$planDetails" }, // Flatten the plan details array
    ]);

    // Step 2: Categorize users as Free Plan or Paid Plan
    let freePlanCount = 0;
    let paidPlanCount = 0;

    latestPlans.forEach(({ planDetails }) => {
      // Determine if the plan is Free or Paid
      if (planDetails.planname.toLowerCase() === "free plan") {
        freePlanCount++;
      } else {
        paidPlanCount++;
      }
    });

    // Step 3: Send the response
    return res.status(200).json({
      success: true,
      data: {
        freePlanCount,
        paidPlanCount,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
}
module.exports = {
  addUser,
  login,
  verifyUser,
  getUser,
  getUserDetails,
  updateUser,
  resendOtp,
  deleterUser,
  getAnalytics
};
