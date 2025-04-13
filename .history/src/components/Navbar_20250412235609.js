import React from 'react';
import { Link } from 'react-router-dom';
import plogo from '../assets/plogo.png'; // Correct relative path
import './Navbar.css';

const Navbar = ({ isLoggedIn, onLogout }) => {
  return (
    <nav>
      {/* Logo as a button to home */}
      <Link to="/">
        <img src={plogo} alt="Logo" className="navbar-logo" />
      </Link>

      {/* Explore, Portfolio, and Chat Links */}
      <div className="navbar-links">
        <Link to="/explore">Explore</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/social" className="chat-link">Chat</Link>
      </div>

      {/* Spacer to push login/logout to the right */}
      <div className="navbar-spacer"></div>

      {/* Login/Logout Button */}
      {isLoggedIn ? (
        <button onClick={onLogout} className="navbar-button">Log Out</button>
      ) : (
        <Link to="/login" className="navbar-button">Sign In</Link>
      )}
    </nav>
  );
};

export default Navbar;
