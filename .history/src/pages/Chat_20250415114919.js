import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';
import api from '../utils/api';

const Chat = ({ isLoggedIn }) => {
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
      if (response.status === 200) {
        setMessages(response.data);
      } else {
        console.error('Error fetching messages:', response.status, response.statusText);
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
    if (!newMessage.trim()) return;

    const username = localStorage.getItem('username');
    if (!username) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    const messageData = {
      username,
      content: newMessage.trim(),
    };

    try {
      const response = await api.post('/api/chat', messageData);
      if (response.status === 201) {
        setMessages([...messages, response.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Send error:', error.response?.data || error.message);
    }
  };

  const formatTimestamp = (ts) => {
    const date = new Date(ts);
    return date.toLocaleString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getDateOnly = (ts) => {
    const date = new Date(ts);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
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

  let lastMessageDate = null;

  return (
    <div className="chat-container">
      <h2>🌎 - Global Chat</h2>
      <div className="messages-container">
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.map((msg, idx) => {
            const currentDate = getDateOnly(msg.timestamp);
            const showDateDivider = currentDate !== lastMessageDate;
            lastMessageDate = currentDate;

            return (
              <React.Fragment key={idx}>
                {showDateDivider && (
                  <div className="date-divider">{currentDate}</div>
                )}
                <div
                  className={`message ${msg.username === localStorage.getItem('username') ? 'own-message' : 'other-message'} ${idx % 2 === 0 ? 'even' : 'odd'}`}
                >
                  <div className="message-header">
                    <span className={msg.username === localStorage.getItem('username') ? 'own-username' : 'other-username'}>
                      <strong>{msg.username}</strong>
                    </span>
                    <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} className="bottom-spacer"></div>
      </div>

      <form onSubmit={sendMessage} className="message-form">
        <div className="send-message-container">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="send-input"
          />
          <button type="submit" className="send-btn">Send</button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
