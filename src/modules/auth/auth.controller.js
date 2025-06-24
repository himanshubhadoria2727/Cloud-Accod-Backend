const OTP = require("../../db/models/otpSchema.model");
const TempOTP = require("../../db/models/tamp.model");
const User = require("../../db/models/user.model");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const {
  GeneratesSignature,
} = require("../middleware/authorization.middleware");
// SMS service no longer needed
// const sendSMS = require("../utility/send-sms");

/**
 * Generates a random OTP of specified length
 * @returns {string} Generated OTP
 */
function generateOTP() {
  const otpLength = 6;
  const otp = Math.floor(100000 + Math.random() * 900000)
    .toString()
    .substring(0, otpLength);
  return otp;
}

/**
 * Configure email transport
 */
const emailTransport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  attachments: [
    {
      filename: 'signature.png',
      path: process.env.EMAIL_SIGNATURE_PATH || 'public/email-assets/signature.png',
      cid: 'signature-logo'
    }
  ]
});

/**
 * Sends verification email with OTP and saves it in the database
 * @param {string} userId - User ID
 * @param {string} email - Email address to send OTP to
 * @param {string} username - User's name for email personalization
 * @returns {Object} Object containing OTP and email sending status
 */
async function sendVerificationEmail(userId, email, username = 'User') {
  const otp = generateOTP();
  
  // Save OTP in temporary storage
  await TempOTP.findOneAndUpdate(
    { userId },
    { userId, otp },
    { upsert: true, new: true }
  );
  
  // Prepare email content
  const mailOptions = {
    from: "noreply@footballadmin.com",
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

/**
 * Register a new user with email, name, password and send verification email
 */
const registerUser = async (req, res) => {
  try {
    const { email, firstname, lastname, password, gender, dob, level, position, foot } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    if (!password) {
      return res.status(400).json({ 
        success: false, 
        error: "Password is required" 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: "User with this email already exists" 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with provided info, mark as not verified
    const newUser = new User({ 
      email,
      firstname, 
      lastname,
      password: hashedPassword,
      gender,
      dob,
      level,
      position,
      foot,
      isActive: false // User needs to verify email
    });
    
    const savedUser = await newUser.save();
    
    // Generate and send verification email
    const { otp, emailSent, error: emailError } = await sendVerificationEmail(
      savedUser._id, 
      email, 
      firstname || 'User'
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email",
        details: emailError
      });
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email for verification code.",
      userId: savedUser._id,
      email: email,
      isActive: false,
      verificationSent: true
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

/**
 * Verify email OTP and mark user as verified
 */
const verifyReset =async(req,res)=>{
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const storedOTPRecord = await TempOTP.findOne({ userId: user._id });

  // Verify OTP (also allow test OTP 2525 for development)
  if (
    (storedOTPRecord && parseInt(otp) === parseInt(storedOTPRecord.otp)) ||
    parseInt(otp) === 2525
  ) {
    // Mark user as verified
    // user.isActive = true;
    // await user.save();
    
    // Generate authentication token
    // const token = GeneratesSignature({
    //   _id: user._id,
    //   email: user.email
    // });

    // Remove the OTP record after verification
    await TempOTP.deleteOne({ userId: user._id });
 

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ message: 'Password has been reset successfully' });
  }
}

const verifyOTP = async (req, res) => {
  const { email, otp: enteredOTP } = req.body;

  try {
    if (!email || !enteredOTP) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and verification code are required" 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const storedOTPRecord = await TempOTP.findOne({ userId: user._id });

    // Verify OTP (also allow test OTP 2525 for development)
    if (
      (storedOTPRecord && parseInt(enteredOTP) === parseInt(storedOTPRecord.otp)) ||
      parseInt(enteredOTP) === 2525
    ) {
      // Mark user as verified
      user.isActive = true;
      await user.save();
      
      // Generate authentication token
      const token = GeneratesSignature({
        _id: user._id,
        email: user.email
      });

      // Remove the OTP record after verification
      await TempOTP.deleteOne({ userId: user._id });

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
        userId: user._id,
        isActive: true,
        token,
        user
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
};

/**
 * Mark user as verified after OTP verification
 */
const verify_update = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Mark user as active/verified
    user.isActive = true;

    await user.save();

    // Generate token for the verified user
    const token = GeneratesSignature({
      _id: user._id,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      isActive: user.isActive,
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
};

/**
 * Resend verification email to user
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Generate and send new verification email
    const { otp, emailSent, error: emailError } = await sendVerificationEmail(
      user._id, 
      email, 
      user.firstname || 'User'
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send verification email",
        details: emailError
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email resent successfully",
      userId: user._id,
      verificationSent: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error" 
    });
  }
};

/**
 * Test email sending functionality
 */
const sendTestEmail = async (req, res) => {
  try {
    const mailOptions = {
      from: "noreply@footballadmin.com",
      to: req.body.email || "test@example.com",
      subject: "Test Email - Football Admin",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from Football Admin.</p>
          <p>If you received this email, the email service is working correctly.</p>
          <p>Best regards,<br>Football Admin Team</p>
        </div>
      `,
    };
    
    const info = await emailTransport.sendMail(mailOptions);
    
    res.json({
      success: true,
      messageId: info.messageId
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send test email"
    });
  }
};

/**
 * Login with email/password and check verification status
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    const user = await User.findOne({ email });
    // Safely check if user has admin role, handling cases where role might not exist
    let isAdmin = user?.role && Array.isArray(user.role) && user.role.length > 0 && user.role[0] === "Admin";

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Check password if provided
    if (password && user.password) {
      // In production, use proper password comparison
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: "Invalid credentials"
        });
      }
    }

    // Check if user is verified
    if (!user.isActive && !isAdmin) {
      // User exists but not verified, send verification email
      const { otp, emailSent, error: emailError } = await sendVerificationEmail(
        user._id, 
        email, 
        user.firstname || 'User'
      );
      
      if (!emailSent) {
        return res.status(500).json({
          success: false,
          error: "Failed to send verification email",
          details: emailError
        });
      }
      
      return res.status(200).json({
        success: true,
        verified: false,
        message: "Account not verified. Verification email sent.",
        userId: user._id,
        verificationSent: true
      });
    }

    // User is verified, generate token and return success
    const token = GeneratesSignature({
      _id: user._id,
      email: user.email
    });

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Login successful",
      token,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error" 
    });
  }
};

// signup function has been consolidated with registerUser



/**
 * Reset password - send OTP to user's email for password reset
 */
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        error: "User with this email does not exist" 
      });
    }
    
    // Generate and send verification email
    const { otp, emailSent, error: emailError } = await sendVerificationEmail(
      existingUser._id, 
      email, 
      existingUser.firstname || 'User'
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send reset password email",
        details: emailError
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset code sent successfully. Please check your email.",
      email: email
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

/**
 * Update password after verification
 * Requires authentication token
 */
const updatePassword = async (req, res) => {
  try {
    console.log('Update password request received:', { body: req.body, user: req.user });
    
    const { password } = req.body;
    
    // Validate required fields
    if (!password) {
      console.log('Password missing in request');
      return res.status(400).json({ 
        success: false, 
        error: "Password is required" 
      });
    }
    
    // Get user ID from the authenticated token
    const userId = req.user.id;
    console.log('User ID from token:', userId);
    
    // Check if user exists
    const existingUser = await User.findById(userId);
    console.log('User found:', existingUser ? 'Yes' : 'No');
    
    if (!existingUser) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }
    
    // Hash the new password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user's password
    console.log('Updating user password...');
    existingUser.password = hashedPassword;
    await existingUser.save();
    console.log('Password updated in database');
    
    // Generate new token for the user
    console.log('Generating new token...');
    const signature = GeneratesSignature({
      _id: existingUser._id,
      email: existingUser.email,
      verified: existingUser.verified
    });
    
    console.log('Sending success response');
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
      token: signature
    });
  } catch (error) {
    console.error("Error in update password:", error);
    console.error("Error stack:", error.stack);
    
    // Send a more detailed error message to help with debugging
    res.status(500).json({ 
      success: false, 
      error: "Internal Server Error",
      message: error.message || "Unknown error occurred",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  verify_update,
  resendOtp,
  sendTestEmail,
  login,
  resetPassword,
  updatePassword,
  verifyReset
};
