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
  const [enlargedImage, setEnlargedImage] = useState(null); // Just track the image URL
  const pageSize = 50;

  // Handle image click to enlarge
  const handleImageClick = (imageUrl, e) => {
    e.stopPropagation(); // Prevent triggering the div click
    setEnlargedImage(imageUrl);
  };

  // Handle closing the enlarged image
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
    const fetchSealedProducts = async () => {
      setLoading(true);
      try {
        // The Pokemon TCG API doesn't have a supertype:sealed filter
        // Instead, we'll use a direct call to get sealed products
        const res = await api.get('/api/sealed');
        setSealedProducts(res.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching sealed products:', error);
        setLoading(false);
      }
    };

    if (view === 'sealed') {
      fetchSealedProducts();
    }
  }, [view]);

  useEffect(() => {
    let filtered = [...sealedProducts]; // Create a new array to avoid mutation
  
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  
    if (sortType === 'price') {
      filtered = [...filtered].sort((a, b) => {
        // Use the same price source that's displayed in the UI
        const priceA = a?.tcgplayer?.prices?.normal?.mid || 
                      a?.tcgplayer?.prices?.holofoil?.mid || 
                      a?.tcgplayer?.prices?.reverseHolofoil?.mid || 
                      0;
        const priceB = b?.tcgplayer?.prices?.normal?.mid || 
                      b?.tcgplayer?.prices?.holofoil?.mid || 
                      b?.tcgplayer?.prices?.reverseHolofoil?.mid || 
                      0;
        return priceB - priceA; // Sort highest to lowest
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
  
    setFilteredSealed(filtered);
    setPage(1);
  }, [sealedProducts, sortType, searchQuery]);

  const addToPortfolio = (productId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add to your portfolio.');
      return;
    }
    api.post(
      '/api/portfolio', 
      { itemId: productId, isSealed: true }
    )
      .then(() => alert('Sealed product added to portfolio!'))
      .catch((err) => {
        console.error('Error adding to portfolio:', err);
        alert(err.response?.data?.error || 'An error occurred');
      });
  };

  const formatProductName = (name) => {
    const formatted = name
      .replace(/\(([^)]+)\)/g, '<span class="small-text">($1)</span>')
      .replace(/\[([^\]]+)\]/g, '<span class="small-text">[$1]</span>');
    return formatted;
  };

  const paginatedProducts = filteredSealed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dashboard-container">
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
              <button 
                className={sortType === 'price' ? 'active' : ''}
                onClick={() => setSortType('price')}
              >
                Price
              </button>
              <button 
                className={sortType === 'name' ? 'active' : ''}
                onClick={() => setSortType('name')}
              >
                Name
              </button>
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
                <button onClick={(e) => {
                  e.stopPropagation();
                  addToPortfolio(product.id);
                }}>
                  Add to Portfolio
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
          
          {/* Enlarged product overlay */}
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
