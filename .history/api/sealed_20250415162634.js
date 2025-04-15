const axios = require('axios');

let cachedSealedData = null;
let cachedTotalCount = 0;
let loading = false;

async function preloadSealedData() {
  if (cachedSealedData || loading) return; // prevent refetch if it's already loaded or loading

  loading = true;

  const pageSize = 250;
  let page = 1;
  let allItems = [];
  let totalCount = 0;

  try {
    do {
      const apiUrl = `https://api.pokemontcg.io/v2/sealed?page=${page}&pageSize=${pageSize}`;
      console.log(`Preloading sealed page ${page}...`);

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

    cachedSealedData = allItems;
    cachedTotalCount = totalCount;

    console.log(`Preloaded ${totalCount} sealed items.`);
  } catch (error) {
    console.error('Preloading sealed sets failed:', error.message);
  } finally {
    loading = false;
  }
}

// Preload once on cold start
preloadSealedData();

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!cachedSealedData) {
    return res.status(503).json({ error: 'Sealed data is loading, try again shortly.' });
  }

  return res.status(200).json({ data: cachedSealedData, totalCount: cachedTotalCount });
};
