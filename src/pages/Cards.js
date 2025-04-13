import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Cards.css'; // Import the CSS file

const Cards = () => {
  const { setId } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [cards, setCards] = useState([]); // State to store the fetched cards
  const [sortedCards, setSortedCards] = useState([]); // State to store the sorted cards
  const [selectedCard, setSelectedCard] = useState(null); // Track the selected card for enlargement
  const [setName, setSetName] = useState(''); // State to store the set name
  const [sortType, setSortType] = useState('price'); // State to track the current sort type
  const [searchQuery, setSearchQuery] = useState(''); // State to store the search query
  const [loading, setLoading] = useState(true); // State to track loading status

  useEffect(() => {
    // Fetch cards for the set
    api.get(`/api/cards?q=set.id:${setId}`).then((res) => {
      setCards(res.data.data); // Store the fetched cards
      setSortedCards(sortCards(res.data.data, sortType)); // Sort the cards initially
      setLoading(false); // Set loading to false after data is fetched
    });

    // Fetch set name (assuming you have an endpoint to get set details)
    api.get(`/api/sets?q=id:${setId}`).then((res) => {
      if (res.data.data && res.data.data.length > 0) {
        setSetName(res.data.data[0].name); // Set the set name
      }
    });
  }, [setId]);

  // Function to sort cards based on the sort type
  const sortCards = (cards, type) => {
    switch (type) {
      case 'price':
        return [...cards].sort((a, b) => {
          const priceA = a.cardmarket?.prices?.trendPrice || 0;
          const priceB = b.cardmarket?.prices?.trendPrice || 0;
          return priceB - priceA; // Sort by price (highest to lowest)
        });
      case 'name':
        return [...cards].sort((a, b) => a.name.localeCompare(b.name)); // Sort by name (A-Z)
      case 'setNumber':
        return [...cards].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })); // Sort by set number
      default:
        return cards;
    }
  };

  // Update sortedCards whenever sortType or searchQuery changes
  useEffect(() => {
    let filteredCards = cards;

    // Filter cards by search query
    if (searchQuery) {
      filteredCards = cards.filter((card) =>
        card.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort the filtered cards
    setSortedCards(sortCards(filteredCards, sortType));
  }, [sortType, cards, searchQuery]);

  const addToPortfolio = (cardId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add cards to your portfolio.');
      return;
    }
    api.post('/api/portfolio', { cardId })
      .then(() => alert('Card added to portfolio!'))
      .catch((err) => alert(err.response?.data?.error || 'An error occurred'));
  };

  // Handle card click to enlarge the image
  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  // Handle closing the enlarged image
  const handleCloseEnlarged = () => {
    setSelectedCard(null);
  };

  // Handle back button click
  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  // Handle sort button click
  const handleSortClick = (type) => {
    setSortType(type);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="cards-container">
      <div className="header">
        <button className="back-button" onClick={handleBackClick}>
          &larr; Back
        </button>
        <div className="header-content">
          <h1>Search Cards</h1>
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-box"
          />
        </div>
        <div className="filter-buttons">
          <button
            className={sortType === 'price' ? 'active' : ''}
            onClick={() => handleSortClick('price')}
          >
            Price
          </button>
          <button
            className={sortType === 'name' ? 'active' : ''}
            onClick={() => handleSortClick('name')}
          >
            A-Z
          </button>
          <button
            className={sortType === 'setNumber' ? 'active' : ''}
            onClick={() => handleSortClick('setNumber')}
          >
            Set #
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading Cards...</p>
        </div>
      ) : (
        <div className="cards-grid">
          {sortedCards.map((c) => (
            <div key={c.id} className="card" onClick={() => handleCardClick(c)}>
              <img src={c.images.small} alt={c.name} />
              <h3>{c.name}</h3>
              <p>Market Price: ${c.cardmarket?.prices?.trendPrice || 'N/A'}</p>
              <p>Set Number: {c.number}</p>
              <p>Set Name: {c.set.name}</p> {/* Add Set Name here */}
              <button onClick={(e) => { e.stopPropagation(); addToPortfolio(c.id); }}>Add to Portfolio</button>
            </div>
          ))}
        </div>
      )}

      {/* Enlarged card overlay */}
      {selectedCard && (
        <div className="enlarged-overlay" onClick={handleCloseEnlarged}>
          <div className="enlarged-card" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={handleCloseEnlarged}>&times;</span>
            <img src={selectedCard.images.large} alt={selectedCard.name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
