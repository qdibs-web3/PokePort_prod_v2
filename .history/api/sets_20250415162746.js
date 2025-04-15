const axios = require('axios');

let cachedSets = null;
let loading = false;

async function preloadSets() {
  if (cachedSets || loading) return;

  loading = true;

  try {
    const apiUrl = 'https://api.pokemontcg.io/v2/sets';

    console.log('Preloading sets from Pokemon TCG API...');

    const response = await axios.get(apiUrl, {
      headers: {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97',
      },
    });

    cachedSets = response.data.data;

    console.log(`Preloaded ${cachedSets.length} sets.`);
  } catch (err) {
    console.error('Error preloading sets:', err.message);
  } finally {
    loading = false;
  }
}

// Preload sets on cold start
preloadSets();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;

  // If no query, return cached sets
  if (!q) {
    if (!cachedSets) {
      return res.status(503).json({ error: 'Sets data is loading, try again shortly.' });
    }

    return res.status(200).json({ data: cachedSets });
  }

  // If there's a query, do a live fetch based on the `q` param
  try {
    let apiUrl = 'https://api.pokemontcg.io/v2/sets';

    if (q.startsWith('series.id:')) {
      const seriesName = q.split(':')[1];
      apiUrl += `?q=series:${seriesName}`;
    } else {
      apiUrl += `?q=${q}`;
    }

    console.log('Fetching filtered sets from API:', apiUrl);

    const response = await axios.get(apiUrl, {
      headers: {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY || 'bc87df93-85ee-40cf-888b-0661bc732f97',
      },
    });

    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Error in sets endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
