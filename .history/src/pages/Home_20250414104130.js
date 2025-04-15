import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file

const Home = () => {
  return (
    <div className="home-container">
      <h1>PokéPort by qdibs</h1>
      <div className="navbar-links">
        <Link to="/explore">Explore</Link>
        <Link to="/portfolio">Portfolio</Link>
        <Link to="/chat" className="chat-link">Social</Link>
      </div>
    </div>
  );
};

export default Home;