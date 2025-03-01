const { PropertyView, Favorite, Review, Revenue } = require('../../model/analytics.model');
const Property = require('../../model/property.model');
const User = require('../../model/user.model');
const mongoose = require('mongoose');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get date range from query params or use default (last 30 days)
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate);
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days if no start date

        // Get total properties count
        const totalProperties = await Property.countDocuments();
        
        // Get total views count
        const totalViews = await PropertyView.aggregate([
            { $group: { _id: null, total: { $sum: "$viewCount" } } }
        ]);
        
        // Get total reviews count
        const totalReviews = await Review.countDocuments();
        
        // Get total favorites count
        const totalFavorites = await Favorite.countDocuments();

        // Prepare response
        const stats = {
            totalProperties: totalProperties || 0,
            totalViews: totalViews.length > 0 ? totalViews[0].total : 0,
            totalReviews: totalReviews || 0,
            totalFavorites: totalFavorites || 0
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Failed to get dashboard statistics', error: error.message });
    }
};

// Get revenue data for chart
const getRevenueData = async (req, res) => {
    try {
        // Get date range from query params or use default (last 6 months)
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 6); // Default to 6 months if no start date

        // Get monthly revenue data
        const revenueData = await Revenue.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalAmount: { $sum: "$amount" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Format the data for chart display
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = {
            labels: [],
            data: []
        };

        // Fill in missing months with zero values
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
            
            // Find if we have data for this month
            const monthData = revenueData.find(item => 
                item._id.year === year && item._id.month === month
            );
            
            // Add to formatted data
            formattedData.labels.push(months[month - 1]);
            formattedData.data.push(monthData ? monthData.totalAmount : 0);
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        res.status(200).json(formattedData);
    } catch (error) {
        console.error('Error getting revenue data:', error);
        res.status(500).json({ message: 'Failed to get revenue data', error: error.message });
    }
};

// Get recent messages (reviews/enquiries)
const getRecentMessages = async (req, res) => {
    try {
        // Get recent reviews
        const recentReviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'firstname lastname username')
            .populate('propertyId', 'title');

        // Format the messages
        const messages = recentReviews.map(review => ({
            name: review.userId ? `${review.userId.firstname || ''} ${review.userId.lastname || ''}`.trim() || review.userId.username : 'Anonymous',
            propertyId: review.propertyId ? review.propertyId.title : 'Unknown Property',
            message: review.comment,
            time: new Date(review.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error getting recent messages:', error);
        res.status(500).json({ message: 'Failed to get recent messages', error: error.message });
    }
};

// Get recent transactions
const getRecentTransactions = async (req, res) => {
    try {
        // Get recent transactions
        const recentTransactions = await Revenue.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'firstname lastname username')
            .populate('propertyId', 'title');

        // Format the transactions
        const transactions = recentTransactions.map((transaction, index) => ({
            key: index + 1,
            id: transaction.userId ? 
                `${transaction.userId.firstname || ''} ${transaction.userId.lastname || ''}`.trim() || 
                transaction.userId.username : 'Anonymous',
            status: transaction.status,
            payment: '****-****-****', // Masked for privacy
            date: new Date(transaction.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
            amount: `${transaction.currency} ${transaction.amount}`,
            property: transaction.propertyId ? transaction.propertyId.title : 'Unknown Property'
        }));

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error getting recent transactions:', error);
        res.status(500).json({ message: 'Failed to get recent transactions', error: error.message });
    }
};

// Record a property view
const recordPropertyView = async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Find existing view record or create new one
        let propertyView = await PropertyView.findOne({ propertyId });
        
        if (propertyView) {
            // Update existing record
            propertyView.viewCount += 1;
            propertyView.lastViewed = new Date();
            await propertyView.save();
        } else {
            // Create new record
            propertyView = new PropertyView({ propertyId });
            await propertyView.save();
        }
        
        res.status(200).json({ message: 'View recorded successfully' });
    } catch (error) {
        console.error('Error recording property view:', error);
        res.status(500).json({ message: 'Failed to record property view', error: error.message });
    }
};

// Toggle favorite status for a property
const toggleFavorite = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user._id; // Assuming user is authenticated
        
        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Check if already favorited
        const existingFavorite = await Favorite.findOne({ userId, propertyId });
        
        if (existingFavorite) {
            // Remove from favorites
            await Favorite.findByIdAndDelete(existingFavorite._id);
            res.status(200).json({ message: 'Property removed from favorites', isFavorite: false });
        } else {
            // Add to favorites
            const favorite = new Favorite({ userId, propertyId });
            await favorite.save();
            res.status(200).json({ message: 'Property added to favorites', isFavorite: true });
        }
    } catch (error) {
        console.error('Error toggling favorite status:', error);
        res.status(500).json({ message: 'Failed to toggle favorite status', error: error.message });
    }
};

// Add a review for a property
const addReview = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id; // Assuming user is authenticated
        
        // Validate input
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }
        
        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Create review
        const review = new Review({
            userId,
            propertyId,
            rating,
            comment
        });
        
        await review.save();
        res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Failed to add review', error: error.message });
    }
};

// Record a transaction
const recordTransaction = async (req, res) => {
    try {
        const { propertyId, amount, currency, transactionType, status, userId } = req.body;
        
        // Validate input
        if (!propertyId || !amount || !currency || !transactionType) {
            return res.status(400).json({ message: 'PropertyId, amount, currency, and transactionType are required' });
        }
        
        // Check if property exists
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        // Create transaction record
        const revenue = new Revenue({
            propertyId,
            amount,
            currency,
            transactionType,
            status: status || 'pending',
            userId: userId || null
        });
        
        await revenue.save();
        res.status(201).json({ message: 'Transaction recorded successfully', revenue });
    } catch (error) {
        console.error('Error recording transaction:', error);
        res.status(500).json({ message: 'Failed to record transaction', error: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueData,
    getRecentMessages,
    getRecentTransactions,
    recordPropertyView,
    toggleFavorite,
    addReview,
    recordTransaction
}; 