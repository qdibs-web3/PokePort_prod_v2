// models/Cache.js
const mongoose = require('mongoose');

const CacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  totalCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: cache expires after 24 hours (in seconds)
  }
});

module.exports = mongoose.model('Cache', CacheSchema);
