const axios = require('axios');
const mongoose = require('mongoose');
const Cache = require('../models/Cache'); // Adjust path as needed

// Connect to MongoDB (if not already connected in your app)
const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Connect to MongoDB
    await connectDB();
    
    // Check if we have cached data
    const cacheKey = 'sealed_products';
    let cache = await Cache.findOne({ key: cacheKey });
    
    // If cache exists and is valid, return cached data
    if (cache) {
      console.log('Returning cached sealed products data');
      return res.status(200).json({ 
        data: cache.data, 
        totalCount: cache.totalCount 
      });
    }
    
    // If no cache, fetch from Pokemon TCG API
    console.log('No cache found, fetching from Pokemon TCG API');
    
    const pageSize = 250;
    let page = 1;
    let allItems = [];
    let totalCount = 0;

    do {
      const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;
      console.log(`Fetching sealed page ${page}...`) ;

      const response = await axios.get(apiUrl, {
        headers: {
          'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97',
        },
      });

      const { data, totalCount: count } = response.data;

      if (page === 1) {
        totalCount = count;
      }

      allItems = [...allItems, ...data];
      page++;
    } while (allItems.length < totalCount);

    // Store in cache
    cache = new Cache({
      key: cacheKey,
      data: allItems,
      totalCount: totalCount
    });
    
    await cache.save();
    console.log(`Cached ${totalCount} sealed items`);

    // Return the data
    return res.status(200).json({ 
      data: allItems, 
      totalCount: totalCount 
    });
    
  } catch (err) {
    console.error('Error in sealed endpoint:', err.message);
    
    // If error occurs during caching, try to return direct data
    try {
      const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=1&pageSize=250`;
      const response = await axios.get(apiUrl, {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
      }) ;
      
      return res.status(200).json(response.data);
    } catch (fallbackErr) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
};
