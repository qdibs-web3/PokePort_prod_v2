const mongoose = require('mongoose');
const Chat = require('./models/Chat');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Migration function to set default channel for existing messages
const migrateExistingMessages = async () => {
  try {
    const chat = await Chat.findOne();
    if (chat) {
      let needsMigration = false;
      
      // Check if any messages don't have a channel field
      chat.messages.forEach(msg => {
        if (!msg.channel) {
          msg.channel = 'global';
          needsMigration = true;
        }
      });
      
      // Save if migration was needed
      if (needsMigration) {
        await chat.save();
        console.log('Migration completed: Added default channel to existing messages');
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
};

module.exports = async (req, res) => {
  await connectDB();
  
  // Run migration for existing messages
  await migrateExistingMessages();

  if (req.method === 'GET') {
    try {
      // Get channel from query parameter, default to 'global'
      const channel = req.query.channel || 'global';
      
      let chat = await Chat.findOne();
      if (!chat) {
        chat = new Chat({ messages: [] });
        await chat.save();
      }
      
      // Filter messages by channel
      const filteredMessages = chat.messages.filter(msg => 
        msg.channel === channel || !msg.channel
      );
      
      return res.status(200).json(filteredMessages);
    } catch (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { username, content, channel = 'global' } = req.body;

      console.log('Incoming data:', req.body);  // Log incoming data

      if (!username || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (content.length > 320) {
        return res.status(400).json({ error: 'Message too long' });
      }

      let chat = await Chat.findOne();

      if (!chat) {
        chat = new Chat({ messages: [] });
      }

      const newMessage = {
        username,  // Use username instead of userId
        content,
        timestamp: new Date(),
        imageUrl: null,
        channel  // Add channel to the message
      };

      // Add the new message to the messages array
      chat.messages.push(newMessage);

      // Save the chat document with the new message
      await chat.save();

      // Respond with the new message after saving it to the database
      return res.status(201).json(newMessage);
    } catch (err) {
      console.error('POST error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
