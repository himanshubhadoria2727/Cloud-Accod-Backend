const mongoose = require('mongoose');
const User = require('../model/user.model');
require('dotenv').config();

/**
 * Script to set admin role for a user
 * Usage: node src/utility/setAdmin.js <email>
 */

const setAdminRole = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    // Check if user already has admin role
    if (user.roles && user.roles.includes('admin')) {
      console.log(`User "${email}" already has admin role.`);
      process.exit(0);
    }

    // Add admin role
    if (!user.roles) {
      user.roles = [];
    }

    if (!user.roles.includes('admin')) {
      user.roles.push('admin');
    }

    // Save user
    await user.save();

    console.log(`Successfully added admin role to user "${email}"`);
    console.log('User roles:', user.roles);

    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Usage: node src/utility/setAdmin.js <email>');
  console.error('Example: node src/utility/setAdmin.js admin@example.com');
  process.exit(1);
}

setAdminRole(email);
