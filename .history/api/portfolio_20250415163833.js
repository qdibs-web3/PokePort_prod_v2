const jwt = require('jsonwebtoken');
const axios = require('axios');
const connectDB = require('./db');
const User = require('./models/User');
const { User: MockUser, mockUsers } = require('./mockDb');

// Helper: Mongo connection
const initMongoDB = async () => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      await connectDB();
    } catch (error) {
      console.warn('MongoDB connection failed, using mock data:', error.message);
      process.env.NODE_ENV = 'test';
    }
  }
};

// Helper: JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key');
  } catch {
    return null;
  }
};

// 🔄 Helper: Preload card + set info if authenticated
const preloadUserPortfolio = async (portfolio) => {
  const preloadItems = await Promise.all(
    portfolio.map(async (item) => {
      try {
        const itemId = item.itemId || item.cardId;
        let url = item.isSealed
          ? `https://api.pokemontcg.io/v2/sealed/${itemId}`
          : `https://api.pokemontcg.io/v2/cards/${itemId}`;

        const response = await axios.get(url, {
          headers: {
            'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97',
          },
        });

        return {
          ...response.data.data,
          quantity: item.quantity,
          isSealed: item.isSealed,
          itemId: itemId
        };
      } catch (err) {
        console.warn(`Preload failed for item ${item.itemId || item.cardId}: ${err.message}`);
        return null;
      }
    })
  );
  return preloadItems.filter(Boolean);
};

module.exports = async (req, res) => {
  try {
    await initMongoDB();

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ message: 'Invalid token' });

    const user = process.env.NODE_ENV === 'test'
      ? await MockUser.findById(decoded.userId)
      : await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Handle GET - preload logic added here
    if (req.method === 'GET') {
      const preloadData = await preloadUserPortfolio(user.portfolio);
      return res.status(200).json(preloadData);
    }

    // ✅ POST - Add item
    if (req.method === 'POST') {
      const { itemId, cardId, isSealed = false } = req.body;
      const consistentId = itemId || cardId;
      if (!consistentId) return res.status(400).json({ error: 'Either itemId or cardId is required' });

      const existingIndex = user.portfolio.findIndex(item =>
        (item.itemId === consistentId || item.cardId === consistentId) && item.isSealed === isSealed
      );

      if (existingIndex !== -1) {
        user.portfolio[existingIndex].quantity += 1;
      } else {
        user.portfolio.push({ itemId: consistentId, quantity: 1, isSealed });
      }

      await user.save();
      return res.status(200).json({ message: 'Item added to portfolio' });
    }

    // ✅ PUT - Update item
    if (req.method === 'PUT') {
      const { itemId: updateItemId, quantity, isSealed: updateIsSealed } = req.body;
      const updateIndex = user.portfolio.findIndex(item =>
        (item.itemId === updateItemId || item.cardId === updateItemId) && item.isSealed === updateIsSealed
      );

      if (updateIndex === -1) return res.status(404).json({ message: 'Item not found in portfolio' });

      user.portfolio[updateIndex].quantity = quantity;
      await user.save();
      return res.status(200).json({ message: 'Quantity updated successfully' });
    }

    // ✅ DELETE - Remove item
    if (req.method === 'DELETE') {
      const deleteItemId = req.query.itemId;
      const deleteIsSealed = req.query.isSealed === 'true';

      if (!deleteItemId) return res.status(400).json({ error: 'ItemId is required' });

      user.portfolio = user.portfolio.filter(item =>
        !((item.itemId === deleteItemId || item.cardId === deleteItemId) && item.isSealed === deleteIsSealed)
      );

      await user.save();
      return res.status(200).json({ message: 'Item deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Error in portfolio endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
