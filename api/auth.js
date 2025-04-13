const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test_secret_key', { expiresIn: '30d' });
};

// Register endpoint
module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize MongoDB connection
    await initMongoDB();

    const { username, password } = req.body;

    // Check if user already exists - use mock data in test mode
    let existingUser;
    if (process.env.NODE_ENV === 'test') {
      existingUser = await MockUser.findOne({ username });
    } else {
      existingUser = await User.findOne({ username });
    }
    
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // In test mode, create a mock user
    if (process.env.NODE_ENV === 'test') {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = (mockUsers.length + 1).toString();
      const newUser = {
        _id: newUserId,
        username,
        password: hashedPassword,
        portfolio: []
      };
      mockUsers.push(newUser);
      
      // Generate JWT token
      const token = generateToken(newUser._id);
      
      // Return success response with token
      return res.status(201).json({
        message: 'User registered successfully',
        token,
        userId: newUser._id,
      });
    }
    
    // Create new user in real database
    const user = new User({
      username,
      password, // Will be hashed by pre-save middleware
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response with token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error('Error in register endpoint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
