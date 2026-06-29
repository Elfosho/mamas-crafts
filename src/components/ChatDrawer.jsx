import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ArrowLeft, MessageSquare, ShieldAlert } from 'lucide-react';
import { getChats, sendMessage, getUsers, playChime } from '../mockDb';

export default function ChatDrawer({ 
  isOpen, 
  onClose, 
  currentUser, 
  activeThreadId, 
  setActiveThreadId,
  onOpenAuth, // Callback if they need to register/log in
  addToast
}) {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  
  const messagesEndRef = useRef(null);

  // Keep track of current threads list for diffing message counts
  const threadsRef = useRef([]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadThreads(false);
      
      // Poll every 3 seconds to check for incoming/replied messages in real time
      const interval = setInterval(() => {
        loadThreads(true);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUser, activeThreadId, activeThread?.id]);

  // Scroll to bottom of message list
  useEffect(() => {
    if (activeThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length]);

  const loadThreads = (shouldChime = false) => {
    const allChats = getChats();
    const myThreads = allChats.filter(chat => chat.participants.includes(currentUser.id));
    
    if (shouldChime && threadsRef.current.length > 0) {
      let hasNewMessage = false;
      myThreads.forEach(t => {
        const existing = threadsRef.current.find(et => et.id === t.id);
        if (existing && t.messages.length > existing.messages.length) {
          const lastMsg = t.messages[t.messages.length - 1];
          if (lastMsg && lastMsg.senderId !== currentUser.id) {
            hasNewMessage = true;
          }
        }
      });
      if (hasNewMessage) {
        playChime(); // Play the incoming celestial chime sound!
      }
    }
    
    threadsRef.current = myThreads;
    setThreads(myThreads);

    // If an active thread ID was requested externally (e.g. clicking 'Chat with Seller')
    if (activeThreadId) {
      const active = myThreads.find(t => t.id === activeThreadId);
      if (active) {
        setActiveThread(active);
      }
    } else if (activeThread) {
      const active = myThreads.find(t => t.id === activeThread.id);
      if (active) {
        setActiveThread(active);
      }
    }
  };

  if (!isOpen) return null;

  // If user is not logged in, we shouldn't show active chat drawer but a login prompt
  if (!currentUser) {
    return (
      <>
        <div className="modal-overlay" style={{ zIndex: 1000, backgroundColor: 'rgba(44, 42, 41, 0.4)' }} onClick={onClose} />
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-header">
            <h3>Message Center</h3>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <ShieldAlert size={48} style={{ color: 'var(--warning)', marginBottom: '16px' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '10px' }}>Authentication Required</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              You need to sign in or create an account to start chatting with our creators and platform support.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThread) return;

    try {
      const recipientId = activeThread.participants.find(p => p !== currentUser.id);
      const recipientName = activeThread.participantNames[recipientId] || "User";

      const updatedThread = sendMessage(activeThread.id, currentUser.id, currentUser.name, newMessageText);
      setActiveThread(updatedThread);
      setNewMessageText('');
      loadThreads(false); // Update thread storage reference without chime
      playChime(); // Play the outgoing chime immediately

      // Show simulated email notification being sent to the recipient
      const allUsers = getUsers();
      const recipientUser = allUsers.find(u => u.id === recipientId);
      if (recipientUser && addToast) {
        addToast(`✉️ Simulated Email notification sent to ${recipientUser.email} for this message!`, "success");
      }

      // Schedule a simulated auto-reply after 3 seconds
      if (recipientId && recipientId !== currentUser.id) {
        setTimeout(() => {
          let replyText = `Thank you for your message! I've received it and will get back to you shortly. ❤️`;
          if (recipientId === 'admin') {
            replyText = `Hello! This is Mama's Crafts Support. We have received your inquiry. One of our team members will respond shortly.`;
          } else if (recipientId === 'luna_mama') {
            replyText = `Hi there! I love stars and moons. I'll check my stock for you and reply in a moment! ✨`;
          } else if (recipientId === 'bloom_mama') {
            replyText = `Whimsical greetings! 🍄 I'm currently crafting in my fairy workshop, but I'll write back to you very soon!`;
          } else if (recipientId === 'earth_mama') {
            replyText = `Hello from nature! 🌿 I have received your message and will answer your questions as soon as I finish potting my crystals.`;
          }

          try {
            sendMessage(activeThread.id, recipientId, recipientName, replyText);
            // Show toast indicating an email alert is sent to current user's inbox
            if (addToast) {
              addToast(`✉️ New email notification in your inbox from ${recipientName}!`, "info");
            }
          } catch (err) {
            console.error("Auto-reply failed to send:", err);
          }
        }, 3000);
      }
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const getRecipientInfo = (thread) => {
    const recipientId = thread.participants.find(p => p !== currentUser.id);
    const recipientName = thread.participantNames[recipientId] || "User";
    return { id: recipientId, name: recipientName };
  };

  return (
    <>
      <div 
        className="modal-overlay" 
        style={{ zIndex: 1000, backgroundColor: 'rgba(44, 42, 41, 0.4)' }}
        onClick={onClose}
      />
      
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {activeThread ? (
          /* Active Chat Conversation view */
          <>
            <div className="cart-header" style={{ display: 'flex', alignItems: 'center' }}>
              <button 
                className="icon-btn" 
                style={{ marginRight: '10px' }}
                onClick={() => {
                  setActiveThread(null);
                  setActiveThreadId(null);
                  loadThreads();
                }}
                title="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>
                  {getRecipientInfo(activeThread).name}
                </h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {getRecipientInfo(activeThread).id === 'admin' ? 'Support Channel' : 'Creator Channel'}
                </span>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            {/* Messages history */}
            <div className="cart-items" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'flex-start', overflowY: 'auto' }}>
              {activeThread.messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: '40px auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No messages yet. Send a greeting to start chatting!
                </div>
              ) : (
                activeThread.messages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id} 
                      style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div 
                        style={{ 
                          backgroundColor: isMe ? 'var(--brand-green)' : 'var(--bg-secondary)',
                          color: isMe ? 'var(--white)' : 'var(--text-main)',
                          padding: '10px 14px',
                          borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                          border: isMe ? 'none' : '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send input footer */}
            <form onSubmit={handleSend} style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ borderRadius: '20px', flexGrow: 1, padding: '10px 16px' }}
                placeholder="Type your message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '10px', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Send"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          /* Conversation Lists view */
          <>
            <div className="cart-header">
              <h3>
                <MessageSquare size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom', color: 'var(--accent-gold)' }} />
                Messages
              </h3>
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            </div>

            <div className="cart-items" style={{ padding: '8px 0', justifyContent: 'flex-start' }}>
              {threads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ color: 'var(--border-color)', marginBottom: '16px', marginInline: 'auto' }} />
                  <p>No active conversations yet.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                    Open a mama's profile or a product details screen to ask them a question!
                  </p>
                </div>
              ) : (
                threads.map(thread => {
                  const recipient = getRecipientInfo(thread);
                  const lastMessage = thread.messages[thread.messages.length - 1];

                  return (
                    <div 
                      key={thread.id} 
                      style={{ 
                        padding: '16px 24px', 
                        borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => setActiveThread(thread)}
                      className="chat-thread-item"
                    >
                      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{recipient.name}</span>
                          {lastMessage && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                              {new Date(lastMessage.timestamp).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-muted)', 
                          marginTop: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {lastMessage ? (
                            <span>
                              {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                              {lastMessage.text}
                            </span>
                          ) : (
                            <span style={{ fontStyle: 'italic' }}>No messages yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
