const axios = require('axios');

// Cards API endpoint
module.exports = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract query parameters
    const { q, page = 1, pageSize = 250 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    // Build the API URL
    let apiUrl;
    
    // Special handling for sealed products
    if (q === 'supertype:sealed') {
      apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;
    } 
    // Special handling for set.id queries
    else if (q.startsWith('set.id:')) {
      const setId = q.split(':')[1];
      apiUrl = `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`;
    }
    // Default handling for other queries
    else {
      apiUrl = `https://api.pokemontcg.io/v2/cards?q=${q}&page=${page}&pageSize=${pageSize}`;
    }
    
    console.log('Fetching from Pokemon TCG API:', apiUrl);

    // Make request to Pokemon TCG API
    const response = await axios.get(apiUrl, {
      headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
    });

    // Return the data
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error in cards endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
