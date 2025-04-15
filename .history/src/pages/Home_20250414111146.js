import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-link">
        <div className="home-link">
          <Link to="/explore">Explore</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;