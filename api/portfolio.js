const jwt = require('jsonwebtoken');
const axios = require('axios');
const connectDB = require('./db');
const User = require('./models/User');
const { User: MockUser, mockUsers } = require('./mockDb');

// Helper function to initialize MongoDB connection
const initMongoDB = async () => {
  // Skip MongoDB connection in test mode
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
    } catch (error) {
      console.warn('MongoDB connection failed, using mock data:', error.message);
      process.env.NODE_ENV = 'test'; // Switch to test mode if connection fails
    }
  }
};

// Helper function to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
  } catch (err) {
    return null;
  }
};

// Portfolio management endpoint
module.exports = async (req, res) => {
  try {
    // Initialize MongoDB connection
    await initMongoDB();

    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find user by ID - use mock data in test mode
    let user;
    if (process.env.NODE_ENV === 'test') {
      user = await MockUser.findById(decoded.userId);
    } else {
      user = await User.findById(decoded.userId);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        // Fetch the details for each item in the user's portfolio
        const portfolioItems = await Promise.all(
          user.portfolio.map(async (item) => {
            try {
              const itemId = item.itemId || item.cardId; // Handle both formats
              let response;
              if (item.isSealed) {
                response = await axios.get(`https://api.pokemontcg.io/v2/sealed/${itemId}`, {
                  headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
                });
              } else {
                response = await axios.get(`https://api.pokemontcg.io/v2/cards/${itemId}`, {
                  headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
                });
              }
              return { 
                ...response.data.data, 
                quantity: item.quantity, 
                isSealed: item.isSealed,
                itemId: itemId // Ensure consistent id field in response
              };
            } catch (err) {
              console.warn(`Item not found: ${item.itemId || item.cardId}`);
              return null;
            }
          })
        );
        // Filter out any null values
        const filteredPortfolioItems = portfolioItems.filter((item) => item !== null);
        return res.status(200).json(filteredPortfolioItems);

      case 'POST':
        // Add item to portfolio
        const { itemId, cardId, isSealed = false } = req.body;
        
        // Use itemId if provided, otherwise fall back to cardId
        const consistentId = itemId || cardId;
        if (!consistentId) {
          return res.status(400).json({ error: 'Either itemId or cardId is required' });
        }
        
        // Check if the item already exists in the portfolio
        const itemIndex = user.portfolio.findIndex(item => 
          (item.itemId === consistentId || item.cardId === consistentId) && 
          item.isSealed === isSealed
        );
        
        if (itemIndex !== -1) {
          // If the item exists, increment the quantity
          user.portfolio[itemIndex].quantity += 1;
        } else {
          // If the item doesn't exist, add it with quantity 1
          user.portfolio.push({ 
            itemId: consistentId, 
            quantity: 1, 
            isSealed 
          });
        }
        
        await user.save();
        return res.status(200).json({ message: 'Item added to portfolio' });

      case 'PUT':
        // Update item quantity
        const { itemId: updateItemId, quantity, isSealed: updateIsSealed } = req.body;
        
        // Find the item (matching both ID and sealed status)
        const updateItemIndex = user.portfolio.findIndex(item => 
          (item.itemId === updateItemId || item.cardId === updateItemId) && 
          item.isSealed === updateIsSealed
        );
        
        if (updateItemIndex === -1) {
          return res.status(404).json({ message: 'Item not found in portfolio' });
        }
        
        // Update quantity
        user.portfolio[updateItemIndex].quantity = quantity;
        await user.save();
        return res.status(200).json({ message: 'Quantity updated successfully' });

      case 'DELETE':
        // Delete item from portfolio
        const deleteItemId = req.query.itemId;
        const deleteIsSealed = req.query.isSealed === 'true';
        
        if (!deleteItemId) {
          return res.status(400).json({ error: 'ItemId is required' });
        }
        
        // Remove item matching both ID and sealed status
        user.portfolio = user.portfolio.filter(item => 
          !((item.itemId === deleteItemId || item.cardId === deleteItemId) && 
          item.isSealed === deleteIsSealed)
        );
        
        await user.save();
        return res.status(200).json({ message: 'Item deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Error in portfolio endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
