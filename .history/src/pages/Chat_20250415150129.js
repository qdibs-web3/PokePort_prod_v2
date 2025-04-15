import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';
import api from '../utils/api';

const Chat = ({ isLoggedIn }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeChannel, setActiveChannel] = useState('global');
  const [showChannels, setShowChannels] = useState(window.innerWidth > 768);
  const [unreadCounts, setUnreadCounts] = useState({
    global: 0,
    pokemon: 0,
    trading: 0
  });
  const messagesEndRef = useRef(null);

  // Channel definitions
  const channels = [
    { id: 'global', name: 'Global Chat', emoji: '🌎' },
    { id: 'pokemon', name: 'Pokemon Chat', emoji: '🐾' },
    { id: 'trading', name: 'Trading Chat', emoji: '💱' }
  ];

  useEffect(() => {
    fetchMessages();
    
    // Handle window resize for responsive design
    const handleResize = () => {
      setShowChannels(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchMessages();
    // Reset unread count for active channel
    setUnreadCounts(prev => ({
      ...prev,
      [activeChannel]: 0
    }));
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
    
    // Update unread counts for non-active channels
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.channel !== activeChannel) {
        setUnreadCounts(prev => ({
          ...prev,
          [lastMessage.channel]: prev[lastMessage.channel] + 1
        }));
      }
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chat?channel=${activeChannel}`);
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
      channel: activeChannel
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

  const handleChannelChange = (channelId) => {
    setActiveChannel(channelId);
    // On mobile, hide channels after selection
    if (window.innerWidth <= 768) {
      setShowChannels(false);
    }
  };

  const toggleChannels = () => {
    setShowChannels(!showChannels);
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

  // Find active channel object
  const activeChannelObj = channels.find(c => c.id === activeChannel);

  let lastMessageDate = null;

  return (
    <div className="chat-container">
      <h2>{activeChannelObj?.emoji} - {activeChannelObj?.name}</h2>
      
      {/* Mobile toggle button */}
      <button className="mobile-toggle" onClick={toggleChannels}>
        {showChannels ? 'Hide Channels' : 'Show Channels'}
      </button>
      
      <div className="chat-layout">
        {/* Chat channels sidebar */}
        <div className={`chat-channels ${showChannels ? 'visible' : ''}`}>
          {channels.map(channel => (
            <div 
              key={channel.id}
              className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
              onClick={() => handleChannelChange(channel.id)}
            >
              <div className="channel-name">
                <span>{channel.emoji}</span>
                <span>{channel.name}</span>
              </div>
              {unreadCounts[channel.id] > 0 && channel.id !== activeChannel && (
                <div className="unread-indicator">
                  {unreadCounts[channel.id]}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Main chat content */}
        <div className="chat-content">
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
                placeholder={`Type your message in ${activeChannelObj?.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="send-input"
              />
              <button type="submit" className="send-btn">Send</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
