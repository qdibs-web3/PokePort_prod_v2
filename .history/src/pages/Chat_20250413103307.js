import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';
import api from '../utils/api';

const Chat = ({ user, isLoggedIn }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/chat');
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      alert('Login required');
      return;
    }

    if (!newMessage.trim()) return;

    try {
      const messageData = {
        userId: user._id,
        username: user.username,
        content: newMessage.trim(),
      };

      const response = await api.post('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        const newMsg = await response.json();
        setMessages([...messages, newMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleTimeString();
  };

  if (!isLoggedIn) {
    return (
      <div className="chat-container not-logged-in">
        <h2>Chat</h2>
        <p>Please log in to chat.</p>
        <Link to="/login" className="login-button">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <h2>Global Chat</h2>
      <div className="messages-container">
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="message">
              <strong>{msg.username}:</strong> {msg.content}
              <div className="timestamp">{formatTimestamp(msg.timestamp)}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef}></div>
      </div>
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
