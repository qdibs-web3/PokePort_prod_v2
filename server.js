// This file is used to test the serverless functions locally
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Import serverless functions
const authHandler = require('./api/auth');
const loginHandler = require('./api/login');
const portfolioHandler = require('./api/portfolio');
const cardsHandler = require('./api/cards');
const setsHandler = require('./api/sets');
const chatHandler = require('./api/chat');

const app = express();

// Middleware
// Configure CORS to allow requests from both localhost:3000 and production domain
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://poke-port-prod-v1.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Add this near the top of server.js
app.use((req, res, next)  => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Convert serverless functions to Express routes
const serverlessToExpress = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// API routes
app.post('/api/auth', serverlessToExpress(authHandler));
app.post('/api/login', serverlessToExpress(loginHandler));
app.all('/api/portfolio', serverlessToExpress(portfolioHandler));
app.all('/api/portfolio/:itemId', serverlessToExpress(portfolioHandler));
app.get('/api/cards', serverlessToExpress(cardsHandler));
app.get('/api/sets', serverlessToExpress(setsHandler));
app.get('/api/sealed', serverlessToExpress(require('./api/sealed')));
app.all('/api/chat', serverlessToExpress(chatHandler));
app.post('/api/chat/upload', serverlessToExpress(chatHandler.upload));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
