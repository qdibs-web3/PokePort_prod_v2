import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <Link to="/explore">Explore</Link>
      </div>
    </div>
  );
};

export default Home;