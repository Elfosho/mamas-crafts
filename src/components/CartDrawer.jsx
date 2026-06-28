import React, { useState } from 'react';
import { X, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, removeFromCart, onCheckout }) {
  const [isCheckout, setIsCheckout] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!name || !address || !phone) {
      alert("Please fill out all delivery fields.");
      return;
    }
    onCheckout(name, address, phone);
    setIsCheckout(false);
  };

  return (
    <>
      {/* Overlay to dim background */}
      <div 
        className="modal-overlay" 
        style={{ zIndex: 1000, backgroundColor: 'rgba(44, 42, 41, 0.4)' }}
        onClick={onClose}
      />
      
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h3>
            <ShoppingCart size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            {isCheckout ? "Checkout" : "Your Cart"}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isCheckout ? (
          <form onSubmit={handleCheckoutSubmit} className="cart-items" style={{ justifyContent: 'flex-start' }}>
            <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Total amount to pay: <strong style={{ color: 'var(--text-main)' }}>${total}</strong>
            </div>

            <div className="form-group">
              <label>Recipient Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Jane Doe"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Shipping Address</label>
              <textarea 
                className="form-control" 
                placeholder="Street Address, Apt, City, State, Zip Code"
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Contact Phone Number</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="+1 (555) 000-0000"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsCheckout(false)}
              >
                Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Place Order
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <ShoppingBag size={48} className="cart-empty-icon" />
                  <p>Your cart is empty</p>
                  <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '16px' }}>
                    Go to Shop
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="cart-item">
                    <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.name}</h4>
                      <div className="cart-item-seller">Mama: {item.sellerName}</div>
                      <div className="cart-item-price">${item.price}</div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)} 
                      className="icon-btn" 
                      style={{ height: 'fit-content', color: 'var(--danger)' }}
                      title="Remove from cart"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Subtotal:</span>
                  <span>${total}</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsCheckout(true)}
                >
                  Checkout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
