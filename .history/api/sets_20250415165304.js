const axios = require('axios');

// Sets API endpoint for fetching series
module.exports = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if we're fetching a specific series or all sets
    const { q } = req.query;
    
    // Build the API URL
    let apiUrl = 'https://api.pokemontcg.io/v2/sets';
    if (q) {
      // Fix the query format for series
      if (q.startsWith('series.id:')) {
        const seriesName = q.split(':')[1];
        apiUrl += `?q=series:${seriesName}`;
      } else {
        apiUrl += `?q=${q}`;
      }
    }

    console.log('Fetching from Pokemon TCG API:', apiUrl);

    // Make request to Pokemon TCG API
    const response = await axios.get(apiUrl, {
      headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97' },
    });

    // For the series endpoint, extract unique series names
    if (!q) {
      // Return in the format the frontend expects
      return res.status(200).json({
        data: response.data.data
      });
    }

    // Return the data
    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error in sets endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
