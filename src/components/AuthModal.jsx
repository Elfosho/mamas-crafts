import React, { useState } from 'react';
import { X } from 'lucide-react';
import { loginUser, registerUser } from '../mockDb';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestSeller, setRequestSeller] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login flow
        const user = loginUser(email, password);
        addToast("Logged in successfully!", "success");
        onAuthSuccess(user);
        onClose();
      } else {
        // Register flow
        if (!name.trim()) {
          setError("Name cannot be empty.");
          return;
        }
        const user = registerUser(name, email, password, requestSeller);
        if (requestSeller) {
          addToast("Registration successful! Seller request sent to admin.", "success");
        } else {
          addToast("Registration successful!", "success");
        }
        onAuthSuccess(user);
        onClose();
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      addToast(err.message || "Auth error.", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isLogin ? "Sign In" : "Create Account"}</h3>
          <button className="close-btn" onClick={onClose} id="close-auth-modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '15px' }}>{error}</div>}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-name">Your Name / Alias</label>
              <input
                id="auth-name"
                type="text"
                className="form-control"
                placeholder="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="form-control"
              placeholder="example@mamascrafts.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={requestSeller}
                  onChange={(e) => setRequestSeller(e.target.checked)}
                />
                <span>I want to become a Seller (sell my crafts & edit my bio)</span>
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
            {isLogin ? "Sign In" : "Register"}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button type="button" className="btn-text" onClick={() => setIsLogin(false)}>
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="btn-text" onClick={() => setIsLogin(true)}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
