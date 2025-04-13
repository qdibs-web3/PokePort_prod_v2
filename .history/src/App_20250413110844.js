import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Explore from './pages/Explore';
import Navbar from './components/Navbar';
import Cards from './pages/Cards';
import AuthForm from './components/AuthForm';
import Sets from './pages/Sets';
import Home from './pages/Home';
import Portfolio from './pages/Portfolio';
import Chat from './pages/Chat';
import './App.css';

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); // State to store the logged-in user
  const navigate = useNavigate();

  // Check if user is logged in (check for token)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Assuming you have an endpoint that returns user data based on the token
      // You can fetch user info if needed, or you can store it in localStorage
      // For example:
      const userData = JSON.parse(localStorage.getItem('user')) || null;
      setUser(userData);
    }
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData); // Set the logged-in user
    localStorage.setItem('token', 'your-token-here'); // Store the token in localStorage
    localStorage.setItem('user', JSON.stringify(userData)); // Store user data in localStorage
    navigate('/portfolio'); // Redirect to the portfolio page after successful login
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null); // Clear the user data
    navigate('/'); // Redirect to home after logout
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/sets/:series" element={<Sets />} />
        <Route path="/cards/:setId" element={<Cards />} />
        <Route path="/login" element={<AuthForm onLogin={handleLogin} />} />
        <Route
          path="/portfolio"
          element={<Portfolio isLoggedIn={isLoggedIn} user={user} />} // Pass props to Portfolio
        />
        <Route
          path="/chat"
          element={<Chat isLoggedIn={isLoggedIn} user={user} />} // Pass props to Chat
        />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
