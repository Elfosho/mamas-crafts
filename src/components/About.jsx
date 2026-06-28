import React from 'react';
import { Moon, Palette, Leaf } from 'lucide-react';

export default function About({ onOurStoryClick }) {
  return (
    <section className="section" id="about-section">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '50px', alignItems: 'center' }}>
          
          {/* Main Info */}
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header" style={{ marginBottom: '30px' }}>
              <h2>About Mama's Crafts</h2>
              <p>Our Mission & Philosophy</p>
            </div>
            <p style={{ fontSize: '1.05rem', marginBottom: '20px', color: 'var(--text-main)' }}>
              We're three moms on a mission to create a lifestyle filled with intention, creativity, and freedom. 
              Through spiritual art, handmade goods, and healing practices, we're building a business that 
              allows us to be more present for our babies and ourselves.
            </p>
            <p style={{ 
              fontFamily: 'var(--font-cursive)', 
              fontStyle: 'italic', 
              fontSize: '1.4rem', 
              color: 'var(--accent-gold)',
              marginBottom: '30px'
            }}>
              "We believe in slow living, deep healing, and making magic every day."
            </p>
            <button className="btn btn-secondary" onClick={onOurStoryClick}>
              Our Story
            </button>
          </div>

          {/* Value Cards */}
          <div className="features-grid" style={{ marginTop: '30px' }}>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Moon size={28} />
              </div>
              <h3>Spiritual Living</h3>
              <p>We honor the moon, the seasons, and our inner magic.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Palette size={28} />
              </div>
              <h3>Creative Expression</h3>
              <p>Art is our therapy. We create to heal, inspire, and connect.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Leaf size={28} />
              </div>
              <h3>Natural Healing</h3>
              <p>Plants, stones, and rituals to nourish our souls.</p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
