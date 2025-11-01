const mongoose = require('mongoose');
const User = require('../model/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Script to set password for admin user
 * Usage: node src/utility/setAdminPassword.js <email> <password>
 */

const setAdminPassword = async (email, password) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_CONNECTION_STRING);

    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.password = hashedPassword;

    // Ensure user is verified and has admin role
    user.verified = true;
    if (!user.roles || !user.roles.includes('admin')) {
      user.roles = user.roles || [];
      user.roles.push('admin');
    }

    // Save user
    await user.save();

    console.log(`✅ Successfully updated password for admin user "${email}"`);
    console.log('User details:');
    console.log('- Email:', user.email);
    console.log('- Verified:', user.verified);
    console.log('- Roles:', user.roles);
    console.log('\nYou can now login with the new password!');

    process.exit(0);
  } catch (error) {
    console.error('Error setting password:', error);
    process.exit(1);
  }
};

// Get email and password from command line arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node src/utility/setAdminPassword.js <email> <password>');
  console.error('Example: node src/utility/setAdminPassword.js admin@example.com MyNewPassword123');
  process.exit(1);
}

setAdminPassword(email, password);
