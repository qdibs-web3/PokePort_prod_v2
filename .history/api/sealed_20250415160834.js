const axios = require('axios');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const pageSize = 250;
    let page = 1;
    let allItems = [];
    let totalCount = 0;

    do {
      const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;

      console.log(`Fetching page ${page}...`);

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

    return res.status(200).json({ data: allItems, totalCount });
  } catch (err) {
    console.error('Error in sealed endpoint:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
};
