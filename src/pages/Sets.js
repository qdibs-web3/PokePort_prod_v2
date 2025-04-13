import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import './Sets.css'; // Import the CSS file

const Sets = () => {
  const { series } = useParams();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    setLoading(true); // Set loading to true before the API call
    api.get(`/api/sets?q=series.id:${series}`)
      .then((res) => {
        setSets(res.data.data);
        setLoading(false); // Set loading to false after the data is fetched
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // Set loading to false even if there's an error
      });
  }, [series]);

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <div className="sets-container">
      <h1>{series} Sets</h1>
      <button className="back-button" onClick={handleBackClick}>
        &larr; Back
      </button>
      {/* Loading icon logic */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Sets...</p>
        </div>
      ) : (
        <div className="sets-grid">
          {sets.map((set) => (
            <Link to={`/cards/${set.id}`} key={set.id} className="set-card">
              <img src={set.images.logo} alt={set.name} className="set-logo" />
              <h3>{set.name}</h3>
              <p>Release Date: {set.releaseDate}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sets;
