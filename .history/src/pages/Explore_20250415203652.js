import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Explore.css';

const Explore = () => {
  const [view, setView] = useState('cards');
  const [series, setSeries] = useState([]);
  const [sealedProducts, setSealedProducts] = useState([]);
  const [filteredSealed, setFilteredSealed] = useState([]);
  const [sortType, setSortType] = useState('price');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [addedMap, setAddedMap] = useState({}); // Track which product was just added
  const [showPopup, setShowPopup] = useState(false);
  const [popupText, setPopupText] = useState('');
  const pageSize = 50;

  const handleImageClick = (imageUrl, e) => {
    e.stopPropagation();
    setEnlargedImage(imageUrl);
  };

  const handleCloseEnlarged = () => {
    setEnlargedImage(null);
  };

  useEffect(() => {
    if (view === 'cards') {
      setLoading(true);
      api.get('/api/sets')
        .then((res) => {
          const uniqueSeries = [...new Set(res.data.data.map((set) => set.series))];
          setSeries(uniqueSeries);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching series:', err);
          setLoading(false);
        });
    }
  }, [view]);

  useEffect(() => {
    let retryTimeout;
  
    const fetchSealedProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/sealed');
        setSealedProducts(res.data.data || []);
        setLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 503) {
          console.log('Sealed data still loading, retrying in 3 seconds...');
          retryTimeout = setTimeout(fetchSealedProducts, 3000);
        } else {
          console.error('Error fetching sealed products:', error);
          setLoading(false);
        }
      }
    };
  
    if (view === 'sealed') {
      fetchSealedProducts();
    }
  
    return () => {
      clearTimeout(retryTimeout);
    };
  }, [view]);
  

  useEffect(() => {
    let filtered = [...sealedProducts];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortType === 'price') {
      filtered.sort((a, b) => {
        const priceA = a?.tcgplayer?.prices?.normal?.mid ||
                       a?.tcgplayer?.prices?.holofoil?.mid ||
                       a?.tcgplayer?.prices?.reverseHolofoil?.mid || 0;
        const priceB = b?.tcgplayer?.prices?.normal?.mid ||
                       b?.tcgplayer?.prices?.holofoil?.mid ||
                       b?.tcgplayer?.prices?.reverseHolofoil?.mid || 0;
        return priceB - priceA;
      });
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredSealed(filtered);
    setPage(1);
  }, [sealedProducts, sortType, searchQuery]);

  const addToPortfolio = (productId, productName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add to your portfolio.');
      return;
    }
    api.post('/api/portfolio', { itemId: productId, isSealed: true })
      .then(() => {
        setAddedMap(prev => ({ ...prev, [productId]: true }));
        setPopupText(`${productName} added to your portfolio`);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          setAddedMap(prev => {
            const copy = { ...prev };
            delete copy[productId];
            return copy;
          });
        }, 3000);
      })
      .catch((err) => {
        console.error('Error adding to portfolio:', err);
        alert(err.response?.data?.error || 'An error occurred');
      });
  };

  const formatProductName = (name) => {
    return name
      .replace(/\(([^)]+)\)/g, '<span class="small-text">($1)</span>')
      .replace(/\[([^\]]+)\]/g, '<span class="small-text">[$1]</span>');
  };

  const paginatedProducts = filteredSealed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dashboard-container">
      {showPopup && <div className="popup-confirm">{popupText}</div>}

      <div className="view-toggle">
        <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')}>Pokémon Cards</button>
        <button className={view === 'sealed' ? 'active' : ''} onClick={() => setView('sealed')}>Sealed Products</button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading {view === 'cards' ? 'Series...' : 'Sealed Products...'}</p>
        </div>
      ) : view === 'cards' ? (
        <>
          <h1>English Pokémon Series</h1>
          <div className="series-grid">
            {series.map((s, index) => (
              <div key={index} className="series-item">
                <Link to={`/sets/${encodeURIComponent(s)}`} className="series-link">{s}</Link>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1>Sealed Products</h1>
          <div className="sealed-controls">
            <div className="search-boxx">
              <input
                type="text"
                placeholder="Search sealed product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-buttons">
              <button className={sortType === 'price' ? 'active' : ''} onClick={() => setSortType('price')}>Price</button>
              <button className={sortType === 'name' ? 'active' : ''} onClick={() => setSortType('name')}>Name</button>
            </div>
          </div>
          <div className="sealed-grid">
            {paginatedProducts.map((product, idx) => (
              <div
                className="sealed-item"
                key={idx}
                onClick={(e) => handleImageClick(product.images?.large || product.images?.small, e)}
              >
                <img
                  src={product.images?.large || product.images?.small}
                  alt={product.name}
                  className="sealed-img"
                />
                <h3 dangerouslySetInnerHTML={{ __html: formatProductName(product.name) }} />
                <p className="mid-price">
                  Market Price: ${product?.tcgplayer?.prices?.normal?.mid?.toFixed(2) || 'N/A'}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToPortfolio(product.id, product.name);
                  }}
                >
                  {addedMap[product.id] ? <span className="added-text">Added</span> : 'Add to Portfolio'}
                </button>
              </div>
            ))}
          </div>
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage(p => (page * pageSize < filteredSealed.length ? p + 1 : p))}
              disabled={page * pageSize >= filteredSealed.length}
            >
              Next
            </button>
          </div>
          <p className="total-results">Total Products: {filteredSealed.length}</p>

          {enlargedImage && (
            <div className="enlarged-overlay" onClick={handleCloseEnlarged}>
              <div className="enlarged-image-container" onClick={(e) => e.stopPropagation()}>
                <span className="close-btn" onClick={handleCloseEnlarged}>&times;</span>
                <img src={enlargedImage} alt="Enlarged product" className="enlarged-image" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Explore;
