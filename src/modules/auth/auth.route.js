// const express = require("express");
// const {
//   registerUser,
//   verifyOTP,
//   verify_update,
//   resendOtp,
//   sendTestEmail,
//   login,
//   resetPassword,
//   updatePassword,
//   verifyReset
// } = require("./auth.controller");
// const { authMiddleware } = require("../middleware/authorization.middleware");
// const router = express.Router();

// // Authentication routes with email verification
// router.post("/register", registerUser);      // Register with email, name, and password
// router.post("/verify", verifyOTP); 
// router.post('/verify-reset',verifyReset)          // Verify email with OTP
// router.post("/verify-and-update", verify_update); // Update profile after verification
// router.post("/resend-verification", resendOtp); // Resend verification email
// router.post("/test-email", sendTestEmail);   // Test email sending
// router.post("/login", login);                // Login with email and password
// router.post("/reset-password", resetPassword);  // Reset password - send OTP to email
// router.post("/update-password", authMiddleware, updatePassword); // Update password after verification - secured with token

// module.exports = router;
