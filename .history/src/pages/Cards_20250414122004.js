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
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    api.get(`/api/cards?q=set.id:${setId}`).then((res) => {
      setCards(res.data.data);
      setSortedCards(sortCards(res.data.data, sortType));
      setLoading(false);
    });

    api.get(`/api/sets?q=id:${setId}`).then((res) => {
      if (res.data.data && res.data.data.length > 0) {
        setSetName(res.data.data[0].name);
      }
    });
  }, [setId]);

  const sortCards = (cards, type) => {
    switch (type) {
      case 'price':
        return [...cards].sort((a, b) => {
          const priceA = a.cardmarket?.prices?.trendPrice || 0;
          const priceB = b.cardmarket?.prices?.trendPrice || 0;
          return priceB - priceA;
        });
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
      filteredCards = cards.filter((card) =>
        card.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setSortedCards(sortCards(filteredCards, sortType));
  }, [sortType, cards, searchQuery]);

  const addToPortfolio = (cardId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add cards to your portfolio.');
      return;
    }

    api
      .post('/api/portfolio', { cardId })
      .then(() => {
        setPopupMessage('Card added to portfolio!');
        setTimeout(() => setPopupMessage(''), 2500);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.error || 'An error occurred';
        setPopupMessage(errorMessage);
        setTimeout(() => setPopupMessage(''), 2500);
      });
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleCloseEnlarged = () => {
    setSelectedCard(null);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSortClick = (type) => {
    setSortType(type);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="cards-container">
      {popupMessage && <div className="popup-message">{popupMessage}</div>}

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
              <p>Set Name: {c.set.name}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToPortfolio(c.id);
                }}
              >
                Add to Portfolio
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedCard && (
        <div className="enlarged-overlay" onClick={handleCloseEnlarged}>
          <div className="enlarged-card" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={handleCloseEnlarged}>
              &times;
            </span>
            <img src={selectedCard.images.large} alt={selectedCard.name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
