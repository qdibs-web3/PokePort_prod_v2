const mongoose = require('mongoose');

// Define message schema
const messageSchema = new mongoose.Schema({
  username: {
    type: String, // Use 'username' instead of 'userId'
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 320
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    default: null
  },
  channel: {
    type: String,
    enum: ['global', 'pokemon', 'trading'],
    default: 'global',
    required: true
  }
});

// Define chat schema with an array of messages
const chatSchema = new mongoose.Schema({
  messages: [messageSchema]
});

// Export the Chat model, using the cached model if it exists
module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
