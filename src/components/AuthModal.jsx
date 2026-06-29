import React, { useState } from 'react';
import { X } from 'lucide-react';
import { loginUser, registerUser, getUsers } from '../mockDb';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestSeller, setRequestSeller] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [sentCode, setSentCode] = useState('');
  const [userCode, setUserCode] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setIsVerifying(false);
    setError('');
    setUserCode('');
    onClose();
  };

  const handleSwitchMode = (toLogin) => {
    setIsLogin(toLogin);
    setIsVerifying(false);
    setError('');
    setUserCode('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Login flow
        const user = loginUser(email, password);
        addToast("Logged in successfully!", "success");
        onAuthSuccess(user);
        handleClose();
      } else if (isVerifying) {
        // Verification code check
        if (userCode.trim() !== sentCode) {
          setError("Invalid verification code. Please try again.");
          addToast("Invalid verification code.", "error");
          return;
        }

        // Complete registration
        const user = registerUser(name, email, password, requestSeller);
        if (requestSeller) {
          addToast("Email verified! Registration successful. Seller request sent to admin.", "success");
        } else {
          addToast("Email verified! Registration successful.", "success");
        }
        onAuthSuccess(user);
        handleClose();
      } else {
        // First step of registration: send verification code
        if (!name.trim()) {
          setError("Name cannot be empty.");
          return;
        }

        // Check if user already exists
        const allUsers = getUsers();
        if (allUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
          setError("A user with this email already exists.");
          addToast("A user with this email already exists.", "error");
          return;
        }

        // Generate 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setSentCode(code);
        setIsVerifying(true);
        addToast(`✉️ Verification code sent to ${email}! Enter code: ${code}`, "success");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
      addToast(err.message || "Auth error.", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isVerifying 
              ? "Verify Email" 
              : isLogin 
                ? "Sign In" 
                : "Create Account"}
          </h3>
          <button className="close-btn" onClick={handleClose} id="close-auth-modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '15px' }}>{error}</div>}

          {isVerifying ? (
            /* OTP Verification Screen */
            <div style={{ padding: '5px 0' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '20px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We've sent a 4-digit verification code to <strong>{email}</strong>. Please enter the code below to complete your registration.
              </p>
              
              <div className="form-group">
                <label htmlFor="auth-code">Verification Code</label>
                <input
                  id="auth-code"
                  type="text"
                  maxLength={4}
                  className="form-control"
                  placeholder="XXXX"
                  style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
                Verify & Create Account
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
                Didn't receive the code?{' '}
                <button 
                  type="button" 
                  className="btn-text" 
                  onClick={() => {
                    const code = Math.floor(1000 + Math.random() * 9000).toString();
                    setSentCode(code);
                    addToast(`✉️ New verification code sent to ${email}! Enter code: ${code}`, "success");
                  }}
                >
                  Resend Code
                </button>
              </div>
            </div>
          ) : (
            /* Normal Sign In / Register Fields */
            <>
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
                    <button type="button" className="btn-text" onClick={() => handleSwitchMode(false)}>
                      Register here
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button type="button" className="btn-text" onClick={() => handleSwitchMode(true)}>
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
