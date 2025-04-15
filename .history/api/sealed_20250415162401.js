const axios = require('axios');

let cachedSealedData = null;
let cachedTotalCount = 0;

// Function to preload sealed sets once
async function preloadSealedData() {
  const pageSize = 250;
  let page = 1;
  let allItems = [];
  let totalCount = 0;

  try {
    do {
      const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;
      console.log(`Preloading page ${page}...`);

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

    // Cache the data
    cachedSealedData = allItems;
    cachedTotalCount = totalCount;

    console.log(`Preloading complete: ${cachedTotalCount} items loaded.`);
  } catch (error) {
    console.error('Error during preloading sealed sets:', error.message);
  }
}

// Immediately preload at startup
preloadSealedData();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!cachedSealedData || cachedSealedData.length === 0) {
    return res.status(503).json({ error: 'Sealed data not yet loaded' });
  }

  return res.status(200).json({ data: cachedSealedData, totalCount: cachedTotalCount });
};
