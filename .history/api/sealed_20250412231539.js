const axios = require('axios');

// Sealed products API endpoint
module.exports = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract query parameters
    const { page = 1, pageSize = 250 } = req.query;
    
    // Build the API URL for sealed products
    const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;
    
    console.log('Fetching from Pokemon TCG API:', apiUrl);

    // Make request to Pokemon TCG API
    const response = await axios.get(apiUrl, {
      headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
    });

    // Return the data
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error in sealed endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
