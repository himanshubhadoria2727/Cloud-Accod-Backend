const mongoose = require('mongoose');
const { PropertyView, Favorite, Review, Revenue } = require('../model/analytics.model');
const Property = require('../model/property.model');
const User = require('../model/user.model');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudaccommodation')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Function to generate random number between min and max
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

// Function to generate random date within the last 6 months
const randomDate = (months = 6) => {
  const date = new Date();
  date.setMonth(date.getMonth() - randomNumber(0, months));
  date.setDate(randomNumber(1, 28)); // Avoid invalid dates like Feb 30
  return date;
};

// Seed analytics data
const seedAnalyticsData = async () => {
  try {
    // Clear existing data
    await PropertyView.deleteMany({});
    await Favorite.deleteMany({});
    await Review.deleteMany({});
    await Revenue.deleteMany({});

    console.log('Cleared existing analytics data');

    // Get all properties and users
    const properties = await Property.find();
    const users = await User.find();

    if (properties.length === 0) {
      console.error('No properties found. Please create some properties first.');
      return;
    }

    if (users.length === 0) {
      console.error('No users found. Please create some users first.');
      return;
    }

    console.log(`Found ${properties.length} properties and ${users.length} users`);

    // Seed property views
    const propertyViewPromises = properties.map(async (property) => {
      const viewCount = randomNumber(10, 100);
      return new PropertyView({
        propertyId: property._id,
        viewCount,
        lastViewed: randomDate(1) // Within the last month
      }).save();
    });

    await Promise.all(propertyViewPromises);
    console.log('Property views seeded');

    // Seed favorites
    const favoritePromises = [];
    for (let i = 0; i < 50; i++) {
      const randomUser = users[randomNumber(0, users.length - 1)];
      const randomProperty = properties[randomNumber(0, properties.length - 1)];
      
      // Check if this combination already exists
      const existingFavorite = await Favorite.findOne({
        userId: randomUser._id,
        propertyId: randomProperty._id
      });
      
      if (!existingFavorite) {
        favoritePromises.push(
          new Favorite({
            userId: randomUser._id,
            propertyId: randomProperty._id,
            createdAt: randomDate(3) // Within the last 3 months
          }).save()
        );
      }
    }

    await Promise.all(favoritePromises);
    console.log('Favorites seeded');

    // Seed reviews
    const reviewPromises = [];
    for (let i = 0; i < 100; i++) {
      const randomUser = users[randomNumber(0, users.length - 1)];
      const randomProperty = properties[randomNumber(0, properties.length - 1)];
      
      // Check if this combination already exists
      const existingReview = await Review.findOne({
        userId: randomUser._id,
        propertyId: randomProperty._id
      });
      
      if (!existingReview) {
        const comments = [
          "Great property, loved the amenities!",
          "Nice location, but a bit noisy at night.",
          "Excellent value for money, would recommend.",
          "The property was clean and well-maintained.",
          "Good experience overall, but could use some updates.",
          "Perfect for my needs, will definitely come back.",
          "Loved the neighborhood, very convenient.",
          "The host was very responsive and helpful.",
          "Spacious and comfortable, exceeded expectations.",
          "Good property but had some issues with the plumbing."
        ];
        
        reviewPromises.push(
          new Review({
            userId: randomUser._id,
            propertyId: randomProperty._id,
            rating: randomNumber(3, 5),
            comment: comments[randomNumber(0, comments.length - 1)],
            createdAt: randomDate(6) // Within the last 6 months
          }).save()
        );
      }
    }

    await Promise.all(reviewPromises);
    console.log('Reviews seeded');

    // Seed revenue data
    const revenuePromises = [];
    const transactionTypes = ['booking', 'deposit', 'other'];
    const statuses = ['pending', 'completed', 'failed', 'refunded'];
    const currencies = ['USD', 'INR', 'CAD', 'GBP', 'EUR', 'AUD'];
    
    for (let i = 0; i < 200; i++) {
      const randomUser = users[randomNumber(0, users.length - 1)];
      const randomProperty = properties[randomNumber(0, properties.length - 1)];
      const transactionType = transactionTypes[randomNumber(0, transactionTypes.length - 1)];
      const status = statuses[randomNumber(0, statuses.length - 1)];
      const currency = currencies[randomNumber(0, currencies.length - 1)];
      
      revenuePromises.push(
        new Revenue({
          propertyId: randomProperty._id,
          amount: randomNumber(500, 5000),
          currency,
          transactionType,
          status,
          userId: randomUser._id,
          createdAt: randomDate(6) // Within the last 6 months
        }).save()
      );
    }

    await Promise.all(revenuePromises);
    console.log('Revenue data seeded');

    console.log('Analytics data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding analytics data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAnalyticsData(); 