import React from 'react';

export default function Hero({ onJoinCircle }) {
  return (
    <div 
      className="hero-section" 
      style={{ backgroundImage: `url('/assets/hero_bg.jpg')` }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content fade-in">
        <span className="hero-cursive">For the moms who craft magic...</span>
        <h1>Creating Magic.<br />Raising Babies.<br />Healing Ourselves.</h1>
        <p>
          For the moms who are tired. Tired of the 9-5. Tired of doing it all. 
          Here, we create beautiful, spiritual art with our kids and build a life 
          with more time, more peace, and more of what matters.
        </p>
        <button className="btn btn-gold" onClick={onJoinCircle}>
          Join Our Mama Circle
        </button>
      </div>
    </div>
  );
}
