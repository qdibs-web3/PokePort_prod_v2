import React, { useState } from 'react';
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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // 🔄 Load token and user from localStorage on first mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user'); // optional if you're storing user info
    if (token) {
      setIsLoggedIn(true);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('token', userData.token); // store token
    localStorage.setItem('user', JSON.stringify(userData)); // optionally store user info
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/');
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
        <Route path="/portfolio" element={<Portfolio isLoggedIn={isLoggedIn} user={user} />} />
        <Route path="/chat" element={<Chat isLoggedIn={isLoggedIn} user={user} />} />
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
