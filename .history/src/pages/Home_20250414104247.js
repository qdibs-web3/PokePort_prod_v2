import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file

const Home = () => {
  return (
    <div className="home-container">
      <h1>PokéPort by qdibs</h1>
      <Link to="/explore">Explore</Link>
    </div>
  );
};

export default Home;