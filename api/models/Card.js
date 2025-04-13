const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true }, // Unique card ID (e.g., "svp-85")
  name: { type: String, required: true }, // Card name
  images: {
    small: { type: String, required: true }, // URL to the small image
    large: { type: String, required: true }, // URL to the large image
  },
  cardmarket: {
    prices: {
      trendPrice: { type: Number }, // Market price
    },
  },
  number: { type: String, required: true }, // Set number
  set: {
    name: { type: String, required: true }, // Set name
  },
});

// Check if the model already exists to prevent model overwrite errors in serverless environment
module.exports = mongoose.models.Card || mongoose.model('Card', cardSchema);
