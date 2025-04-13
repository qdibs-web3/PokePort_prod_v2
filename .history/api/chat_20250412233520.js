const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Chat = require('./models/Chat');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'chat-image-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Main chat handler function
const chatHandler = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Find or create the chat document
      let chat = await Chat.findOne();
      if (!chat) {
        chat = new Chat({ messages: [] });
        await chat.save();
      }
      
      res.status(200).json(chat.messages);
    } 
    else if (req.method === 'POST') {
      // Handle text-only message
      if (!req.body.image) {
        const { userId, username, content } = req.body;
        
        if (!userId || !username || !content) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (content.length > 320) {
          return res.status(400).json({ error: 'Message content exceeds 320 character limit' });
        }
        
        // Find or create the chat document
        let chat = await Chat.findOne();
        if (!chat) {
          chat = new Chat({ messages: [] });
        }
        
        // Add new message
        chat.messages.push({
          userId,
          username,
          content,
          timestamp: new Date(),
          imageUrl: null
        });
        
        await chat.save();
        res.status(201).json(chat.messages[chat.messages.length - 1]);
      } 
      // Handle image upload (this will be handled by the frontend)
      else {
        res.status(400).json({ error: 'Image uploads should use the /api/chat/upload endpoint' });
      }
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Image upload handler function
const uploadHandler = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // This would be handled by multer middleware in a full Express setup
    // For serverless, we'd need to use a different approach or service for file uploads
    
    // For demonstration, we'll just return a success message
    // In a real implementation, this would save the file and return the URL
    res.status(200).json({ 
      message: 'Image upload endpoint. In production, this would handle file uploads.',
      imageUrl: '/uploads/sample-image.jpg' // This would be the actual saved image path
    });
  } catch (error) {
    console.error('Error in image upload:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export the handlers properly
module.exports = chatHandler;
module.exports.upload = uploadHandler;
