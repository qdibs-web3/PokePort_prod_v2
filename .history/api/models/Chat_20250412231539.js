const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  username: { 
    type: String, 
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
  }
});

const chatSchema = new mongoose.Schema({
  messages: [messageSchema]
});

// Check if the model already exists to prevent model overwrite errors in serverless environment
module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
