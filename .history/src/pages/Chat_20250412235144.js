import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';
import api from '../utils/api';

const Chat = ({ user, isLoggedIn }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Scroll to bottom whenever messages change
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
      } else {
        console.error('Failed to fetch messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert('You must be logged in to send messages');
      return;
    }
    
    if ((!newMessage || newMessage.trim() === '') && !image) {
      return; // Don't send empty messages
    }
    
    try {
      // First handle image upload if there is one
      let imageUrl = null;
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('userId', user._id);
        formData.append('username', user.username);
        
        const imageResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
        } else {
          console.error('Failed to upload image:', imageResponse.status);
          return;
        }
      }
      
      // Then send the message with or without image URL
      const messageData = {
        userId: user._id || '123456789012345678901234', // Fallback for testing
        username: user.username || 'testuser', // Fallback for testing
        content: newMessage.trim(),
        imageUrl
      };
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (response.ok) {
        // Add the new message to the state
        const newMessageData = await response.json();
        setMessages([...messages, newMessageData]);
        setNewMessage('');
        setImage(null);
        setImagePreview(null);
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (!isLoggedIn) {
    return (
      <div className="chat-container not-logged-in">
        <h2>Chat</h2>
        <p>Please log in to participate in the chat.</p>
        <Link to="/login" className="login-button">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <h2>Global Chat</h2>
      
      <div className="messages-container">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : messages.length === 0 ? (
          <p className="no-messages">No messages yet. Be the first to say something!</p>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.username === (user?.username || '') ? 'own-message' : 'other-message'}`}
            >
              <div className="message-header">
                <Link to={`/portfolio?user=${message.username}`} className="username-link">
                  {message.username}
                </Link>
                <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className="message-content">
                {message.content}
                {message.imageUrl && (
                  <div className="message-image-container">
                    <img src={message.imageUrl} alt="Shared in chat" className="message-image" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={sendMessage}>
        <div className="message-input-container">
          <textarea
            className="message-input"
            value={newMessage}
            onChange={handleMessageChange}
            placeholder="Type your message (max 320 characters)..."
            maxLength={320}
          />
          
          {imagePreview && (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button type="button" className="remove-image-btn" onClick={removeImage}>×</button>
            </div>
          )}
          
          <div className="message-actions">
            <label className="image-upload-label">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageChange}
                className="image-upload-input"
              />
              📷
            </label>
            <button type="submit" className="send-button" disabled={!newMessage.trim() && !image}>
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Chat;
