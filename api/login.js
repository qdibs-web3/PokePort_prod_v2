const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require('./db');
const User = require('./models/User');
const { User: MockUser } = require('./mockDb');

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

// Login endpoint
module.exports = async (req, res) => {
  // At the beginning of your login.js handler
  console.log('Login request body:', req.body);

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize MongoDB connection
    await initMongoDB();

    const { username, password } = req.body;

    // Find user by username - use mock data in test mode
    let user;
    if (process.env.NODE_ENV === 'test') {
      user = await MockUser.findOne({ username });
    } else {
      user = await User.findOne({ username });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response with token
    res.status(200).json({
      message: 'Login successful',
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error('Error in login endpoint:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
