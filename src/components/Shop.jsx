import React, { useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';

const CATEGORIES = [
  'All Creations',
  'Candles',
  'Wall Decor',
  'Home Decor',
  'Crystals & Stones',
  'Posters & Prints',
  'Kids\' Crafts',
  'Other'
];

export default function Shop({ 
  products, 
  onAddToCart, 
  onViewProductDetail, 
  selectedSellerId, 
  onClearSellerFilter,
  sellers 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Creations');

  // Filter approved products only for public catalog
  const publicProducts = products.filter(p => p.status === 'approved');

  // Filter by seller, category, and search query
  const filteredProducts = publicProducts.filter(p => {
    const matchesSeller = !selectedSellerId || p.sellerId === selectedSellerId;
    
    const matchesCategory = selectedCategory === 'All Creations' || 
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSeller && matchesCategory && matchesSearch;
  });

  const selectedSeller = sellers.find(s => s.id === selectedSellerId);

  return (
    <section className="section" id="shop-section">
      <div className="container">
        
        <div className="section-header">
          <h2>Shop Our Creations</h2>
          <p>Handmade with love. Inspired by nature. Created for you.</p>
        </div>

        {/* Filter bar by seller if active */}
        {selectedSellerId && selectedSeller && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 24px', 
            backgroundColor: 'var(--brand-green-light)', 
            borderRadius: '6px', 
            marginBottom: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--brand-green)', fontWeight: '500' }}>
              Showing items only from: <strong>{selectedSeller.name}</strong>
            </span>
            <button className="btn-text" onClick={onClearSellerFilter}>
              Show all creations
            </button>
          </div>
        )}

        {/* Search and Category filters */}
        <div className="shop-controls">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by title, description, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="product-search-input"
            />
          </div>

          <div className="filter-group">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat} 
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            No matching handmade items found. Try changing search or category filters.
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;

              return (
                <div key={product.id} className="product-card">
                  
                  {/* Product Image */}
                  <div 
                    className="product-img-wrapper" 
                    onClick={() => onViewProductDetail(product)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="product-img" 
                    />
                    {isOutOfStock && (
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        color: 'var(--danger)',
                        fontSize: '1rem',
                        letterSpacing: '0.05em'
                      }}>
                        OUT OF STOCK
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="product-info">
                    <span 
                      className="product-seller"
                      onClick={() => onViewProductDetail(product)}
                    >
                      {product.sellerName}
                    </span>
                    <h3 
                      className="product-title"
                      onClick={() => onViewProductDetail(product)}
                      style={{ cursor: 'pointer' }}
                    >
                      {product.name}
                    </h3>
                    
                    {/* Stock level display */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div className="product-price" style={{ margin: 0 }}>${product.price}</div>
                      {product.stock > 0 ? (
                        <span style={{ fontSize: '0.75rem', color: product.stock <= 2 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: '500' }}>
                          {product.stock} left
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: '600' }}>
                          Sold Out
                        </span>
                      )}
                    </div>
                    
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        padding: '8px 16px', 
                        fontSize: '0.75rem', 
                        borderRadius: '4px', 
                        marginTop: 'auto',
                        backgroundColor: isOutOfStock ? 'var(--border-color)' : 'var(--brand-green)',
                        color: isOutOfStock ? 'var(--text-muted)' : 'var(--white)',
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => onAddToCart(product)}
                      disabled={isOutOfStock}
                    >
                      <ShoppingCart size={14} /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
