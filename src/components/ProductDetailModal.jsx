import React from 'react';
import { X, ShoppingBag, MessageSquare } from 'lucide-react';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart, onViewSeller, onStartChat }) {
  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Product Details</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="product-detail-layout">
            <div style={{ position: 'relative' }}>
              <img src={product.imageUrl} alt={product.name} className="product-detail-img" />
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
                  fontSize: '1.2rem',
                  letterSpacing: '0.05em'
                }}>
                  OUT OF STOCK
                </div>
              )}
            </div>
            <div>
              <div className="product-detail-category">{product.category}</div>
              <h2 className="product-detail-title">{product.name}</h2>
              
              <div className="product-detail-seller">
                Created by: <span 
                  style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    onViewSeller(product.sellerId);
                    onClose();
                  }}
                >
                  {product.sellerName}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="product-detail-price" style={{ border: 'none', padding: 0, margin: 0 }}>${product.price}</div>
                <div>
                  {product.stock > 0 ? (
                    <span style={{ fontSize: '0.85rem', color: product.stock <= 2 ? 'var(--warning)' : 'var(--brand-green)', fontWeight: '600' }}>
                      {product.stock} items left in stock
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: '600' }}>
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>
              
              <p className="product-detail-desc">{product.description}</p>

              <button 
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  backgroundColor: isOutOfStock ? 'var(--border-color)' : 'var(--brand-green)',
                  color: isOutOfStock ? 'var(--text-muted)' : 'var(--white)',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                disabled={isOutOfStock}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ 
                  width: '100%', 
                  justifyContent: 'center',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => {
                  onStartChat(product.sellerId, product.sellerName);
                  onClose();
                }}
              >
                <MessageSquare size={18} />
                Chat with Creator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
