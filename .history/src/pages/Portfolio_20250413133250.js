import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Portfolio.css';

const Portfolio = ({ isLoggedIn, user }) => {
  const navigate = useNavigate();
  const [portfolioCards, setPortfolioCards] = useState([]);
  const [sortType, setSortType] = useState('price');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleCardClick = (card) => {
    setSelectedCard(card);
  };

  const handleCloseEnlarged = () => {
    setSelectedCard(null);
  };

  useEffect(() => {
    if (isLoggedIn) {
      const fetchPortfolio = async () => {
        try {
          // No need to manually set token as it's handled by the api utility
          const response = await api.get('/api/portfolio');
          const sortedCards = sortCards(response.data, 'price');
          setPortfolioCards(sortedCards);
        } catch (err) {
          console.error('Error fetching portfolio:', err);
        }
      };
      fetchPortfolio();
    }
  }, [isLoggedIn]);

  const sortCards = (cards, type) => {
    switch (type) {
      case 'price':
        return [...cards].sort((a, b) => {
          const priceA = (a.cardmarket?.prices?.trendPrice || a.tcgplayer?.prices?.normal?.mid || 0) * a.quantity;
          const priceB = (b.cardmarket?.prices?.trendPrice || b.tcgplayer?.prices?.normal?.mid || 0) * b.quantity;
          return priceB - priceA;
        });
      case 'name':
        return [...cards].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return cards;
    }
  };

  const handleSortClick = (type) => {
    setSortType(type);
    const sortedCards = sortCards(portfolioCards, type);
    setPortfolioCards(sortedCards);
  };

  const updateQuantity = async (itemId, newQuantity, isSealed) => {
    try {
      if (newQuantity <= 0) {
        // First remove from local state to prevent UI issues
        setPortfolioCards(prevCards => 
          prevCards.filter(card => 
            !((card.id === itemId || card.cardId === itemId) && card.isSealed === isSealed)
          )
        );
        
        // Then make API call to delete
        await api.delete(
          `/api/portfolio/${itemId}`,
          {
            params: { isSealed: isSealed }
          }
        );
      } else {
        const response = await api.put(
          `/api/portfolio/${itemId}`,
          { 
            quantity: newQuantity,
            isSealed: isSealed 
          }
        );
        
        setPortfolioCards(prevCards =>
          prevCards.map(card => 
            (card.id === itemId || card.cardId === itemId) && card.isSealed === isSealed
              ? { ...card, quantity: newQuantity }
              : card
          )
        );
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert(`Failed to update quantity: ${err.response?.data?.error || err.message}`);
      // Consider refetching portfolio data here to sync with server
    }
  };

  const calculatePortfolioStats = () => {
    let sealedValue = 0;
    let nonSealedValue = 0;
    let totalItems = 0;
    let sealedItems = 0;
    let nonSealedItems = 0;

    portfolioCards.forEach(card => {
      const price = parseFloat(
        card.cardmarket?.prices?.trendPrice ||
        card.tcgplayer?.prices?.normal?.mid ||
        0
      );
      const value = price * (card.quantity || 1);
      
      if (card.isSealed) {
        sealedValue += value;
        sealedItems += card.quantity || 1;
      } else {
        nonSealedValue += value;
        nonSealedItems += card.quantity || 1;
      }
      
      totalItems += card.quantity || 1;
    });

    const totalValue = sealedValue + nonSealedValue;
    const sealedPercentage = totalValue > 0 ? (sealedValue / totalValue) * 100 : 0;
    const nonSealedPercentage = totalValue > 0 ? (nonSealedValue / totalValue) * 100 : 0;

    return {
      sealedValue,
      nonSealedValue,
      totalValue,
      sealedPercentage,
      nonSealedPercentage,
      sealedItems,
      nonSealedItems,
      totalItems
    };
  };

  const renderPieChart = () => {
    const { sealedPercentage, totalValue } = calculatePortfolioStats();
    
    // Calculate the angle for the sealed portion (blue)
    const sealedAngle = (sealedPercentage / 100) * 360;
  
    return (
      <div className="pie-chart">
        {/* Full green background (non-sealed) */}
        <div className="pie-full slice-non-sealed"></div>
        
        {/* Blue sealed portion that covers the correct percentage */}
        <div 
          className="pie-cover slice-sealed"
          style={{
            transform: `rotate(${sealedAngle}deg)`,
            clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 50%)'
          }}
        ></div>
        
        <div className="chart-center">
          <h3>Total Value</h3>
          <p>${totalValue.toFixed(2)}</p>
        </div>
      </div>
    );
  };


  const renderAnalyticsPage = () => {
    const {
      sealedValue,
      nonSealedValue,
      totalValue,
      sealedPercentage,
      nonSealedPercentage,
      sealedItems,
      nonSealedItems,
      totalItems
    } = calculatePortfolioStats();

    return (
      <div className="analytics-container">        
        <div className="chart-container">
        <h2>Portfolio Analytics</h2>

          {renderPieChart()}
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color legend-sealed"></div>
              <span>Sealed ({sealedPercentage.toFixed(1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-non-sealed"></div>
              <span>Cards ({nonSealedPercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Portfolio Value</h3>
            <p>${totalValue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Sealed Product Value</h3>
            <p>${sealedValue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Cards Value</h3>
            <p>${nonSealedValue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Items</h3>
            <p>{totalItems}</p>
          </div>
          <div className="stat-card">
            <h3>Sealed Items</h3>
            <p>{sealedItems}</p>
          </div>
          <div className="stat-card">
            <h3>Cards</h3>
            <p>{nonSealedItems}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="not-logged-in">
        <h1>Sign in or create an account to manage your portfolio.</h1>
        <button onClick={() => navigate('/login')}>Sign In / Create Account</button>
      </div>
    );
  }

  const { totalValue } = calculatePortfolioStats();

  return (
    <div className="portfolio-container">
      <div className="portfolio-title-section">
        <h1>Welcome to your PokePort, {user.name}</h1>
        <p className="portfolio-value">Your portfolio value: ${totalValue.toFixed(2)}</p>
      </div>
      
      <div className="portfolio-header">
        <div className="view-toggle">
          <span className="toggle-label">
            {showAnalytics ? 'Analytics' : 'Portfolio'}
          </span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={showAnalytics}
              onChange={() => setShowAnalytics(!showAnalytics)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        
        {!showAnalytics && (
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
          </div>
        )}
      </div>
      
      {showAnalytics ? (
        renderAnalyticsPage()
      ) : (
        <div className="portfolio-grid">
          {portfolioCards.map((card) => (
            <div 
              key={card.id || card.cardId} 
              className={`card ${card.isSealed ? 'sealed-product' : ''}`} 
              onClick={() => handleCardClick(card)}
            >
              <img src={card.images?.small || card.images?.large || '/path/to/default/image.jpg'} alt={card.name} />
              <h3>{card.name}</h3>
              <p>{card.set?.name}</p>
              {!card.isSealed && <p className="set-number">Set number: {card.number}</p>}
              <div className="card-footer">
                <div className="price-section">
                  <h3>
                    {'$' + (
                      parseFloat(
                        card.cardmarket?.prices?.trendPrice ||
                        card.tcgplayer?.prices?.normal?.mid ||
                        0
                      ) * (card.quantity || 1)
                    ).toFixed(2)}
                  </h3>
                  {card.quantity > 1 && (
                    <p className="individual-price">
                      {'(Each: $' + parseFloat(
                        card.cardmarket?.prices?.trendPrice ??
                        card.tcgplayer?.prices?.normal?.mid ??
                        0
                      ).toFixed(2) + ')'}
                    </p>
                  )}
                </div>
                <div className="quantity-controls">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(card.id || card.cardId, card.quantity - 1, card.isSealed);
                    }}
                  >
                    -
                  </button>
                  <span>{card.quantity || 1}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(card.id || card.cardId, card.quantity + 1, card.isSealed);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedCard && (
        <div className="enlarged-overlay" onClick={handleCloseEnlarged}>
          <div className="enlarged-card" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={handleCloseEnlarged}>&times;</span>
            <img src={selectedCard.images?.large || selectedCard.images?.small || '/path/to/default/image.jpg'} alt={selectedCard.name} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
