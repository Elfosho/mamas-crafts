import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Send, ArrowLeft, MessageSquare, ShieldAlert,
  Loader2, Search, Circle,
} from 'lucide-react';
import {
  getThreadsForUser,
  getMessages,
  sendMessage,
  subscribeToMessages,
  getProfileById,
  playChime,
} from '../lib/db';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Avatar = ({ src, name, size = 42 }) => {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#7c5cbf', '#5c8abf', '#bf7c5c', '#5cbf8a', '#bf5c7c'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];

  if (src && !src.includes('/assets/default')) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid var(--border-color)',
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: '700', fontSize: size * 0.36,
      border: '2px solid var(--border-color)',
    }}>
      {initials}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatDrawer({
  isOpen, onClose, currentUser,
  activeThreadId, setActiveThreadId,
  onOpenAuth, addToast,
}) {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Track which thread IDs have been opened this session (for unread simulation)
  const [openedThreads, setOpenedThreads] = useState(new Set());
  // Track new messages received via realtime per thread
  const [unreadCounts, setUnreadCounts] = useState({});

  const messagesEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load threads ────────────────────────────────────────────────────────────
  const loadThreads = useCallback(async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoadingThreads(true);
    try {
      const data = await getThreadsForUser(currentUser.id);
      setThreads(data);
      // If external thread ID was requested, open it
      if (activeThreadId) {
        const found = data.find(t => t.id === activeThreadId);
        if (found) openThread(found, data);
      }
    } catch (err) {
      console.error('Failed to load threads:', err);
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  }, [currentUser, activeThreadId]); // eslint-disable-line

  useEffect(() => {
    if (isOpen && currentUser) {
      loadThreads();
    }
    if (!isOpen) cleanupRealtime();
  }, [isOpen, currentUser]); // eslint-disable-line

  useEffect(() => {
    if (activeThreadId && threads.length > 0) {
      const found = threads.find(t => t.id === activeThreadId);
      if (found && (!activeThread || activeThread.id !== found.id)) openThread(found, threads);
    }
  }, [activeThreadId, threads]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeThread) inputRef.current?.focus();
  }, [activeThread]);

  // ── Realtime cleanup ────────────────────────────────────────────────────────
  const cleanupRealtime = () => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
      realtimeChannelRef.current = null;
    }
  };

  // ── Open thread ─────────────────────────────────────────────────────────────
  const openThread = async (thread, allThreads) => {
    cleanupRealtime();
    setActiveThread(thread);
    setOpenedThreads(prev => new Set([...prev, thread.id]));
    // Clear unread for this thread
    setUnreadCounts(prev => ({ ...prev, [thread.id]: 0 }));
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(thread.id);
      setMessages(msgs);

      // Subscribe to realtime messages
      realtimeChannelRef.current = subscribeToMessages(thread.id, async (newMsg) => {
        let enriched = {
          ...newMsg,
          senderId: newMsg.sender_id,
          text: newMsg.content,
          timestamp: newMsg.created_at,
          senderName: 'User',
        };
        try {
          const profile = await getProfileById(newMsg.sender_id);
          enriched.senderName = profile.name;
        } catch (_) {}

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          if (newMsg.sender_id !== currentUser.id) {
            playChime();
            addToast?.(`💬 New message from ${enriched.senderName}!`, 'info');
          }
          return [...prev, enriched];
        });

        // Refresh thread list to update last message preview
        loadThreads(true);
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ── Back to list ────────────────────────────────────────────────────────────
  const handleBack = () => {
    cleanupRealtime();
    setActiveThread(null);
    setMessages([]);
    setActiveThreadId(null);
    setNewMessageText('');
    loadThreads(true);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeThread || sending) return;
    setSending(true);
    const text = newMessageText.trim();
    setNewMessageText('');

    // Optimistic update
    const optimistic = {
      id: 'opt_' + Date.now(),
      senderId: currentUser.id,
      sender_id: currentUser.id,
      text,
      content: text,
      timestamp: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await sendMessage(activeThread.id, currentUser.id, text);
      playChime();
      // Realtime will add the real message; remove optimistic
      setMessages(prev => prev.filter(m => !m.optimistic));
      loadThreads(true);
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.optimistic));
      setNewMessageText(text);
      addToast('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Get recipient info from thread ──────────────────────────────────────────
  const getRecipient = (thread) => {
    if (!thread || !currentUser) return { id: null, name: 'User', image: null };
    const isCustomer = thread.customer_id === currentUser.id;
    const other = isCustomer ? thread.seller : thread.customer;
    return {
      id: isCustomer ? thread.seller_id : thread.customer_id,
      name: other?.name || (isCustomer ? 'Seller' : 'Customer'),
      image: other?.profile_image_url,
    };
  };

  // ── Filter threads by search ────────────────────────────────────────────────
  const filteredThreads = threads.filter(t => {
    const recipient = getRecipient(t);
    return recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.lastMessage?.content || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ── Sort: threads with messages first, then by last activity ───────────────
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at;
    const bTime = b.lastMessage?.created_at || b.created_at;
    return new Date(bTime) - new Date(aTime);
  });

  // ── Not open ─────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  // ── Not logged in ─────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <>
        <div className="modal-overlay" style={{ zIndex: 1000, backgroundColor: 'rgba(44, 42, 41, 0.4)' }} onClick={onClose} />
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="cart-header">
            <h3>Messages</h3>
            <button className="close-btn" onClick={onClose}><X size={20} /></button>
          </div>
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <ShieldAlert size={48} style={{ color: 'var(--warning)', marginBottom: '16px' }} />
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '10px' }}>
              Sign In to Chat
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              You need an account to message our creators and support team.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { onClose(); onOpenAuth(); }}>
              Sign In / Register
            </button>
          </div>
        </div>
      </>
    );
  }

  const recipient = activeThread ? getRecipient(activeThread) : null;

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 1000, backgroundColor: 'rgba(44, 42, 41, 0.4)' }} onClick={onClose} />
      <div className="cart-drawer" style={{ display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {activeThread ? (
          /* ════════════════════════════════════
             CONVERSATION VIEW
          ════════════════════════════════════ */
          <>
            {/* Header */}
            <div className="cart-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px' }}>
              <button className="icon-btn" onClick={handleBack} title="Back" style={{ flexShrink: 0 }}>
                <ArrowLeft size={18} />
              </button>
              <Avatar src={recipient.image} name={recipient.name} size={36} />
              <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recipient.name}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Circle size={5} fill="currentColor" /> Live Chat
                </div>
              </div>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            {/* Messages */}
            <div className="cart-items" style={{
              padding: '12px 16px', display: 'flex', flexDirection: 'column',
              gap: '8px', overflowY: 'auto', flexGrow: 1,
            }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <MessageSquare size={40} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = (msg.senderId || msg.sender_id) === currentUser.id;
                  const text = msg.text || msg.content || '';
                  const prevMsg = messages[idx - 1];
                  const showTime = !prevMsg ||
                    new Date(msg.timestamp || msg.created_at) - new Date(prevMsg.timestamp || prevMsg.created_at) > 300000;

                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', margin: '8px 0 4px', letterSpacing: '0.05em' }}>
                          {formatTime(msg.timestamp || msg.created_at)}
                        </div>
                      )}
                      <div style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        opacity: msg.optimistic ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                      }}>
                        <div style={{
                          background: isMe
                            ? 'linear-gradient(135deg, var(--brand-green), #5a8f6a)'
                            : 'var(--bg-secondary)',
                          color: isMe ? '#fff' : 'var(--text-main)',
                          padding: '9px 14px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          border: isMe ? 'none' : '1px solid var(--border-color)',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          wordBreak: 'break-word',
                        }}>
                          {text}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{
              borderTop: '1px solid var(--border-color)',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                style={{ borderRadius: '22px', flexGrow: 1, padding: '9px 16px', fontSize: '0.875rem' }}
                placeholder="Write a message..."
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                disabled={sending}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '9px', borderRadius: '50%', width: '38px', height: '38px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
                disabled={sending || !newMessageText.trim()}
              >
                {sending
                  ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={15} />
                }
              </button>
            </form>
          </>
        ) : (
          /* ════════════════════════════════════
             INBOX / THREAD LIST VIEW
          ════════════════════════════════════ */
          <>
            {/* Header */}
            <div className="cart-header" style={{ padding: '14px 18px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={19} style={{ color: 'var(--accent-gold)' }} />
                Messages
                {threads.length > 0 && (
                  <span style={{
                    background: 'var(--accent-gold)', color: '#1a1a1a',
                    borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700',
                    padding: '2px 7px', lineHeight: '1.4',
                  }}>
                    {threads.length}
                  </span>
                )}
              </h3>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            {/* Search bar */}
            {threads.length > 0 && (
              <div style={{ padding: '8px 14px 4px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '32px', borderRadius: '20px', fontSize: '0.8rem', padding: '7px 12px 7px 32px' }}
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Thread list */}
            <div style={{ overflowY: 'auto', flexGrow: 1 }}>
              {loadingThreads ? (
                <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                  <div style={{ marginTop: '10px', fontSize: '0.8rem' }}>Loading conversations...</div>
                </div>
              ) : sortedThreads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={48} style={{ color: 'var(--border-color)', marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                  {searchQuery ? (
                    <p>No conversations matching <strong>"{searchQuery}"</strong></p>
                  ) : (
                    <>
                      <p style={{ fontWeight: '600', marginBottom: '8px' }}>No conversations yet</p>
                      <p style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                        Visit a mama's profile or a product page and click <strong>"Chat"</strong> to start a conversation!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                sortedThreads.map((thread) => {
                  const rec = getRecipient(thread);
                  const last = thread.lastMessage;
                  const isUnread = last &&
                    last.sender_id !== currentUser.id &&
                    !openedThreads.has(thread.id);
                  const isActive = activeThread?.id === thread.id;

                  return (
                    <div
                      key={thread.id}
                      onClick={() => openThread(thread, threads)}
                      style={{
                        padding: '13px 18px',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '13px',
                        backgroundColor: isActive ? 'rgba(94, 141, 108, 0.08)' : 'transparent',
                        transition: 'background-color 0.15s',
                        position: 'relative',
                      }}
                      className="chat-thread-item"
                    >
                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar src={rec.image} name={rec.name} size={44} />
                        {isUnread && (
                          <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: '12px', height: '12px', borderRadius: '50%',
                            backgroundColor: 'var(--accent-gold)',
                            border: '2px solid var(--bg-primary)',
                          }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '3px',
                        }}>
                          <span style={{
                            fontWeight: isUnread ? '700' : '600',
                            fontSize: '0.9rem',
                            color: isUnread ? 'var(--text-main)' : 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '55%',
                          }}>
                            {rec.name}
                          </span>
                          {last && (
                            <span style={{
                              fontSize: '0.65rem',
                              color: isUnread ? 'var(--accent-gold)' : 'var(--text-muted)',
                              fontWeight: isUnread ? '600' : 'normal',
                              flexShrink: 0,
                            }}>
                              {formatTime(last.created_at)}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          color: isUnread ? 'var(--text-main)' : 'var(--text-muted)',
                          fontWeight: isUnread ? '500' : 'normal',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {last ? (
                            <>
                              {last.sender_id === currentUser.id && (
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>You: </span>
                              )}
                              {last.content}
                            </>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No messages yet — say hi! 👋</span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: 'var(--accent-gold)',
                          flexShrink: 0,
                        }} />
                      )}
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
