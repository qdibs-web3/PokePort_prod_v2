const mongoose = require('mongoose');
const Chat = require('./models/Chat');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  return mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = async (req, res) => {
  await connectDB();

  if (req.method === 'GET') {
    try {
      let chat = await Chat.findOne();
      if (!chat) {
        chat = new Chat({ messages: [] });
        await chat.save();
      }
      return res.status(200).json(chat.messages);
    } catch (err) {
      console.error('GET error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, username, content } = req.body;

      if (!userId || !username || !content) {
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
        userId,
        username,
        content,
        timestamp: new Date(),
        imageUrl: null
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
