import React from 'react';
import { Edit, Eye, MessageSquare } from 'lucide-react';

export default function MeetMamas({ 
  mamas, 
  currentUser, 
  onFilterBySeller, 
  onEditBioClick, 
  selectedSellerId,
  onStartChat
}) {
  return (
    <section className="section section-bg" id="meet-mamas-section">
      <div className="container">
        
        <div className="section-header">
          <h2>Meet The Mamas</h2>
          <p>Get inspired by our creators</p>
        </div>

        <div className="mamas-grid">
          {mamas.map((mama) => {
            const isMe = currentUser && currentUser.id === mama.id;
            const isSelected = selectedSellerId === mama.id;

            return (
              <div 
                key={mama.id} 
                className="mama-card"
                style={isSelected ? { borderColor: 'var(--accent-gold)', boxShadow: 'var(--shadow-md)', backgroundColor: '#fffdf9' } : {}}
              >
                {/* Arch Photo Frame */}
                <div className="mama-img-frame">
                  <img 
                    src={mama.profileImage || "/assets/default_seller.jpg"} 
                    alt={mama.name} 
                    className="mama-img" 
                  />
                </div>

                <h3 className="mama-name">{mama.name}</h3>
                
                {/* Specialization Tags */}
                <div className="mama-tags">
                  {mama.tags && mama.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="mama-tag">
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <p className="mama-bio">{mama.bio}</p>

                <div className="mama-actions">
                  <button 
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 18px', fontSize: '0.75rem', borderRadius: '20px' }}
                    onClick={() => onFilterBySeller(mama.id)}
                  >
                    <Eye size={14} /> {isSelected ? "Show all creations" : "View creations"}
                  </button>

                  {!isMe && (
                    <button 
                      className="btn btn-secondary chat-mama-btn"
                      style={{ padding: '8px 18px', fontSize: '0.75rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => onStartChat(mama.id, mama.name)}
                      title="Chat with Mama"
                    >
                      <MessageSquare size={14} /> Chat
                    </button>
                  )}

                  {isMe && (
                    <button 
                      className="btn btn-gold"
                      style={{ padding: '8px 18px', fontSize: '0.75rem', borderRadius: '20px' }}
                      onClick={onEditBioClick}
                      title="Edit biography"
                    >
                      <Edit size={14} /> Edit Bio
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
