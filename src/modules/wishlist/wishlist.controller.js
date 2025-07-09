const Wishlist = require('./wishlist.model');

const addToWishlist = async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    
    // Check if already exists to avoid duplicates
    const existingItem = await Wishlist.findOne({ userId, propertyId });
    if (existingItem) {
      return res.status(409).json({ message: "Property already in wishlist" });
    }
    
    const newWishlistItem = new Wishlist({ userId, propertyId });
    await newWishlistItem.save();
    res.status(201).json({ message: "Property added to wishlist", item: newWishlistItem });
  } catch (error) {
    res.status(500).json({ message: "Failed to add property to wishlist", error: error.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    
    const deletedItem = await Wishlist.findOneAndDelete({ userId, propertyId });
    if (!deletedItem) {
      return res.status(404).json({ message: "Property not found in wishlist" });
    }
    
    res.status(200).json({ message: "Property removed from wishlist" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove property from wishlist", error: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params; 
    
    // Get wishlist with minimal property info
    const wishlist = await Wishlist.find({ userId })
      .populate('propertyId', 'title price images location city country beds baths area verified rating reviewsCount')
      .select('propertyId createdAt')
      .lean(); // Use lean for better performance
    
    // Clean up the response structure
    const cleanWishlist = wishlist.map(item => ({
      property: item.propertyId,
      addedAt: item.createdAt
    }));
    
    res.status(200).json(cleanWishlist);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve wishlist", error: error.message });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
};