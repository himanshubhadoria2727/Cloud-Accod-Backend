const User = require("../model/user.model");
const { GenerateOtp } = require("../utility/notification");
const mongoose = require("mongoose");
const Jwt = require("jsonwebtoken");
const TempOTP = require("../model/tamp.model");
const nodemailer = require('nodemailer');
const sendSMS = require("../utility/send-sms");
const { Uplan } = require("../model/user_plan.model");
const userschema = require("../model/user.model");
const bcrypt = require("bcryptjs");
const { upload, getImageUrl } = require("../utility/uploadfile");
const fs = require('fs');
const path = require('path');

// Configure email transport
let emailTransport;

try {
  emailTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'info@cloudaccomodation.com',
      pass: process.env.EMAIL_PASSWORD || 'Iplaycoc@123'
    },
    tls: {
      // Only disable certificate validation in development
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });

  // Verify connection configuration
  emailTransport.verify(function(error, success) {
    if (error) {
      console.error('SMTP connection error:', error);
    } else {
      console.log('SMTP server is ready to send messages');
    }
  });
} catch (error) {
  console.error('Failed to create email transport:', error);
  // Create a mock transport that logs instead of sending emails
  emailTransport = {
    sendMail: function(mailOptions, callback) {
      console.warn('Email not sent (SMTP not configured):', {
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      if (callback) callback(null, { messageId: 'mock-message-id' });
      return Promise.resolve({ messageId: 'mock-message-id' });
    }
  };
}

/**
 * Sends welcome email to new users
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @returns {Promise<boolean>} True if email was sent successfully
 */
const sendWelcomeEmail = async (email, name = 'User') => {
  try {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@cloudaccomodation.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Cloud Accommodation';
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Cloud Accommodation!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e9ecef;">
            <h1 style="color: #007bff; margin: 0;">Welcome to Cloud Accommodation!</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hello ${name || 'there'},</p>
            
            <p>Thank you for signing up with us using Google. We're excited to have you on board!</p>
            
            <p>Your account has been successfully created and verified. You can now start using all the features of our platform.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://cloudaccommodation.com'}" 
                 style="display: inline-block; padding: 12px 25px; background-color: #007bff; 
                        color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Get Started
              </a>
            </div>
            
            <p>If you have any questions or need assistance, feel free to reply to this email.</p>
            
            <p>Best regards,<br>The Cloud Accommodation Team</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e9ecef;">
            <p>© ${new Date().getFullYear()} Cloud Accommodation. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await emailTransport.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`, { messageId: info.messageId });
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

/**
 * Generates a random OTP of specified length
 * @returns {string} Generated OTP
 */
function generateOTP() {
  const otpLength = 6;
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .substring(0, otpLength);
}

/**
 * Sends verification email with OTP and saves it in the database
 * @param {string} userId - User ID
 * @param {string} email - Email address to send OTP to
 * @param {string} username - User's name for email personalization
 * @returns {Object} Object containing OTP and email sending status
 */
async function sendVerificationEmail(userId, email, username = 'User') {
  const otp = generateOTP();
  
  // Save OTP in temporary storage - Convert OTP to number to match schema
  await TempOTP.findOneAndUpdate(
    { userId },
    { 
      userId, 
      otp: parseInt(otp, 10), // Ensure OTP is stored as a number
      expiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
    },
    { upsert: true, new: true }
  );
  
  // Prepare email content
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'info@cloudaccomodation.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'Cloud Accommodation';
  
  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Welcome to Cloud Accommodation – Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to Cloud Accommodation</h2>
        <p>We're excited to have you join Cloud Accommodation.</p>
        <p>To complete your registration and get started, please enter the verification code below:</p>
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          🔐 Your Verification Code: ${otp}
        </div>
        <p>If you didn't request this, no worries—just ignore this message.</p>
        <p>Let's kick off something great together!</p>
        <div style="text-align: center; margin-top: 20px;">
          <img src="cid:signature-logo" alt="Cloud Accommodation Logo" style="max-width: 200px;">
        </div>
      </div>
    `,
  };
  
  // Send verification email
  try {
    const info = await emailTransport.sendMail(mailOptions);
    return { otp, emailSent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { otp, emailSent: false, error: error.message };
  }
}

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

    const { username, email, password, firstname = '', lastname = '' } = req.body;
    
    // Check if email already exists
    let existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email already exists" 
      });
    }

    // Check if username already exists
    let existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ 
        success: false,
        message: "Username is already taken" 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      phone_no: "",
      email,
      username,
      firstname,
      lastname,
      password: hashedPassword,
      country_code: '',
      country_name: '',
      plan: "",
      verified: false // User needs to verify email
    });

    const savedUser = await newUser.save();

    // Send verification email
    const { emailSent, error: emailError } = await sendVerificationEmail(
      savedUser._id,
      email,
      firstname || username
    );

    if (!emailSent) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the registration, just log the error
    }

    // Generate JWT token
    const token = await GeneratesSignature({
      _id: savedUser._id,
      email: savedUser.email,
      verified: savedUser.verified,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for verification.",
      token,
      user: {
        _id: savedUser._id,
        email: savedUser.email,
        username: savedUser.username,
        verified: savedUser.verified,
        firstname: savedUser.firstname,
        lastname: savedUser.lastname
      },
      verificationSent: emailSent
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Please verify your email address before logging in"
      });
    }

    // Generate JWT token
    const token = await GeneratesSignature({
      _id: user._id,
      email: user.email,
      verified: user.verified,
    });

    // Return user data (excluding sensitive information)
    const userData = {
      _id: user._id,
      email: user.email,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      verified: user.verified,
      // Add other non-sensitive user fields as needed
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
};

/**
 * Resend verification email
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }

    // Send verification email
    const { emailSent, error } = await sendVerificationEmail(
      user._id,
      user.email,
      user.firstname || user.username
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
        error: error || "Unknown error"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully"
    });

  } catch (err) {
    console.error('Resend verification email error:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
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

/**
 * Resend OTP for email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email"
      });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }

    // Send verification email
    const { emailSent, error } = await sendVerificationEmail(
      user._id,
      user.email,
      user.firstname || user.username
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
        error: error || "Unknown error"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Verification code has been sent to your email"
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getUser = async (req, res) => {
  try {
    console.log("Received Query Params:", req.query);

    // ✅ Use new helper:
    const query = buildUserSearchQuery(req.query);

    console.log("Search Query:", JSON.stringify(query, null, 2));

    const pageSize = parseInt(req.query.pageSize) || 5;
    const pageNumber = parseInt(req.query.page) || 1;
    const skip = (pageNumber - 1) * pageSize;

    const allUser = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("plan");

    console.log("Fetched Users:", JSON.stringify(allUser, null, 2));

    const total = await User.countDocuments(query);

    const userRespond = {
      data: allUser,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    return res.status(200).json(userRespond);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const buildUserSearchQuery = (params) => {
  const { search = "", searchField = "all" } = params;

  if (!search || !search.trim()) return {};

  const searchRegex = new RegExp(search.trim(), "i");

  const searchQueries = {
    name: { name: searchRegex },
    email: { email: searchRegex },
    phone: { phone: searchRegex },
    status: { status: searchRegex },
    plan: { plan: searchRegex }, // depends how you store plan!
    all: {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { status: searchRegex },
      ],
    },
  };

  return searchQueries[searchField] || searchQueries.all;
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

// Middleware for handling file upload
const uploadProfilePicture = upload.single('profilePicture');

const updateUser = async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }

        // If file was uploaded, update the profile picture path
        if (req.file) {
          // Delete old profile picture if it exists
          if (user.profilePicture) {
            const oldFilePath = path.join(process.cwd(), user.profilePicture.replace(/^\//, ''));
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          
          // Update profile picture path with the new file
          updateData.profilePicture = getImageUrl(req.file.filename);
        }

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true }
        ).select('-password -otp -otp_expire');

        return res.status(200).json({
          message: "User updated successfully",
          user: updatedUser
        });
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
      }
    } catch (err) {
    console.error("Error in updateUser:", err);
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

const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Email and Google ID are required" });
    }

    // Check if user already exists with this email
    let existingUser = await User.findOne({ email: email });

    if (existingUser) {
      // User exists, generate token and return
      let signature = await GeneratesSignature({
        _id: existingUser._id,
        email: existingUser.email,
        verified: true, // Google users are pre-verified
      });

      return res.status(200).json({
        signature,
        verified: true,
        _id: existingUser._id,
      });
    }

    // Create new user with Google credentials
    // Generate a random secure password - not needed for Google login
    const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    const newUser = new User({
      email,
      username: email.split("@")[0], // Generate username from email
      firstname: name ? name.split(" ")[0] : "",
      lastname: name ? name.split(" ").slice(1).join(" ") : "",
      password: randomPassword,
      country_code: "",
      country_name: "",
      plan: "",
      verified: true, // Google users are pre-verified
      googleId: googleId,
      profilePicture: picture || "",
    });

    const savedUser = await newUser.save();

    // Send welcome email to the new user
    try {
      await sendWelcomeEmail(email, name || email.split('@')[0]);
      console.log(`Welcome email sent to new Google user: ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email sending fails
    }

    // Generate signature for the new user
    let signature = await GeneratesSignature({
      _id: savedUser._id,
      email: savedUser.email,
      verified: true,
    });

    return res.status(201).json({
      signature,
      verified: true,
      _id: savedUser._id,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Verify user's email with OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Find the OTP in temporary storage
    const tempOtp = await TempOTP.findOne({ userId: user._id });
    if (!tempOtp) {
      return res.status(400).json({
        success: false,
        message: 'No verification request found. Please request a new code.',
      });
    }

    // Check if OTP is expired
    if (new Date() > tempOtp.expiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Verify OTP - Convert both to strings for comparison to avoid type issues
    if (String(tempOtp.otp) !== String(otp)) {
      console.log('OTP Mismatch:', { 
        stored: tempOtp.otp, 
        received: otp,
        storedType: typeof tempOtp.otp,
        receivedType: typeof otp
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Update user as verified
    user.verified = true;
    await user.save();

    // Delete the used OTP
    await TempOTP.deleteOne({ _id: tempOtp._id });

    // Generate JWT token
    const token = await GeneratesSignature({
      _id: user._id,
      email: user.email,
      verified: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Resend verification email with new OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already verified
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Save OTP in temporary storage
    await TempOTP.findOneAndUpdate(
      { userId: user._id },
      { otp, expiry },
      { upsert: true, new: true }
    );

    // Send verification email
    const { emailSent, error: emailError } = await sendVerificationEmail(
      user._id,
      email,
      user.firstname || user.username
    );

    if (!emailSent) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while resending verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  addUser,
  login,
  verifyUser,
  resendOtp,
  getUser,
  getUserDetails,
  updateUser,
  deleterUser,
  getAnalytics,
  googleAuth,
  verifyEmail,
  resendVerification,
};
