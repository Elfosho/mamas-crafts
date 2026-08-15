import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { loginUser, registerUser, resetPassword, getProfileById } from '../lib/db';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [requestSeller, setRequestSeller] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await loginUser(email, password);
        addToast("Welcome back! 🌙", "success");
        onAuthSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          setError("Name cannot be empty.");
          setLoading(false);
          return;
        }
        const result = await registerUser(name, email, password, requestSeller);
        // If Supabase returned a session immediately (email confirmation disabled),
        // log the user in right away. Otherwise ask them to check their inbox.
        if (result?.session) {
          const profile = await getProfileById(result.user.id);
          addToast(`Welcome, ${name}! 🌸 Account created successfully!`, 'success');
          onAuthSuccess(profile);
          onClose();
        } else {
          addToast('Almost there! Check your email to confirm your account.', 'success');
          setError('');
          setIsLogin(true);
        }
      }
    } catch (err) {
      // Make rate limit error human-readable
      const msg = err.message || 'Something went wrong.';
      const friendly = msg.includes('rate limit') || msg.includes('email rate')
        ? 'Too many emails sent. Please wait a few minutes and try again, or disable email confirmation in Supabase Dashboard → Authentication → Email.'
        : msg;
      setError(friendly);
      addToast(friendly, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Enter your email address above first.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      addToast("Password reset email sent!", "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (isLogin ? "Sign In" : "Register")}
          </button>

          {isLogin && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              {resetSent ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>✅ Check your inbox for a reset link.</span>
              ) : (
                <button type="button" className="btn-text" style={{ fontSize: '0.8rem' }} onClick={handleResetPassword}>
                  Forgot password?
                </button>
              )}
            </div>
          )}

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
