import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Cards.css';

const Cards = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [sortedCards, setSortedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [setName, setSetName] = useState('');
  const [sortType, setSortType] = useState('price');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [portfolioIds, setPortfolioIds] = useState([]);
  const [popup, setPopup] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cardsRes = await api.get(`/api/cards?q=set.id:${setId}`);
        setCards(cardsRes.data.data);
        setSortedCards(sortCards(cardsRes.data.data, sortType));
        setLoading(false);

        const setRes = await api.get(`/api/sets?q=id:${setId}`);
        if (setRes.data.data && setRes.data.data.length > 0) {
          setSetName(setRes.data.data[0].name);
        }

        const token = localStorage.getItem('token');
        if (token) {
          const portfolioRes = await api.get('/api/portfolio');
          const ids = portfolioRes.data.map(item => item.cardId);
          setPortfolioIds(ids);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [setId]);

  const sortCards = (cards, type) => {
    switch (type) {
      case 'price':
        return [...cards].sort((a, b) => (b.cardmarket?.prices?.trendPrice || 0) - (a.cardmarket?.prices?.trendPrice || 0));
      case 'name':
        return [...cards].sort((a, b) => a.name.localeCompare(b.name));
      case 'setNumber':
        return [...cards].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
      default:
        return cards;
    }
  };

  useEffect(() => {
    let filteredCards = cards;
    if (searchQuery) {
      filteredCards = cards.filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setSortedCards(sortCards(filteredCards, sortType));
  }, [sortType, cards, searchQuery]);

  const addToPortfolio = (cardId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add cards to your portfolio.');
      return;
    }

    if (portfolioIds.includes(cardId)) {
      return;
    }

    api.post('/api/portfolio', { cardId })
      .then(() => {
        setPortfolioIds([...portfolioIds, cardId]);
        showPopup('Card added to portfolio!');
      })
      .catch(err => {
        showPopup(err.response?.data?.error || 'An error occurred');
      });
  };

  const showPopup = (message) => {
    setPopup(message);
    setTimeout(() => setPopup(''), 3000);
  };

  const handleCardClick = (card) => setSelectedCard(card);
  const handleCloseEnlarged = () => setSelectedCard(null);
  const handleBackClick = () => navigate(-1);
  const handleSortClick = (type) => setSortType(type);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  return (
    <div className="cards-container">
      <div className="header">
        <button className="back-button" onClick={handleBackClick}>&larr; Back</button>
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
          <button className={sortType === 'price' ? 'active' : ''} onClick={() => handleSortClick('price')}>Price</button>
          <button className={sortType === 'name' ? 'active' : ''} onClick={() => handleSortClick('name')}>A-Z</button>
          <button className={sortType === 'setNumber' ? 'active' : ''} onClick={() => handleSortClick('setNumber')}>Set #</button>
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
              <p>Set Name: {c.set.name}</p>
              {portfolioIds.includes(c.id) ? (
                <button className="in-portfolio" disabled>In Portfolio</button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); addToPortfolio(c.id); }}>Add to Portfolio</button>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="enlarged-overlay" onClick={handleCloseEnlarged}>
          <div className="enlarged-card" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={handleCloseEnlarged}>&times;</span>
            <img src={selectedCard.images.large} alt={selectedCard.name} />
          </div>
        </div>
      )}

      {popup && (
        <div className="popup-message">
          {popup}
        </div>
      )}
    </div>
  );
};

export default Cards;
