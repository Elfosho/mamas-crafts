import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Shield, Compass, LogOut, CheckCircle2, ShoppingBag, Truck, MessageSquare } from 'lucide-react';
import { 
  initDb, 
  getUsers, 
  getProducts, 
  getOrders,
  updateSellerBio, 
  addProduct, 
  approveSeller, 
  rejectSellerRequest,
  changeUserRole, 
  approveProduct, 
  rejectProduct,
  placeOrder,
  updateOrderStatus,
  getOrCreateThread
} from './mockDb';

// Components
import Hero from './components/Hero';
import About from './components/About';
import MeetMamas from './components/MeetMamas';
import Shop from './components/Shop';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import NotificationToast from './components/NotificationToast';
import ChatDrawer from './components/ChatDrawer';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [activeView, setActiveView] = useState('home'); // 'home' | 'dashboard'

  // Modals / Drawer toggles
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);

  // Customer Dashboard sub-tab: 'orders' | 'onboarding'
  const [customerTab, setCustomerTab] = useState('orders');

  // Initialize DB, load users, products, orders, session and cart
  useEffect(() => {
    initDb();
    setUsers(getUsers());
    setProducts(getProducts());
    setOrders(getOrders());

    // Load active session if any (simulated)
    const savedUser = sessionStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Load persisted shopping cart
    const savedCart = localStorage.getItem('mamas_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mamas_cart', JSON.stringify(cart));
  }, [cart]);

  // Update databases helper
  const refreshDbState = () => {
    setUsers(getUsers());
    setProducts(getProducts());
    setOrders(getOrders());
    // Refresh current user info if role/bio changed
    if (currentUser) {
      const allUsers = getUsers();
      const updatedMe = allUsers.find(u => u.id === currentUser.id);
      if (updatedMe) {
        setCurrentUser(updatedMe);
        sessionStorage.setItem('current_user', JSON.stringify(updatedMe));
      }
    }
  };

  // Notification actions
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Handlers
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem('current_user', JSON.stringify(user));
    refreshDbState();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('current_user');
    setActiveView('home');
    addToast("Logged out successfully.", "success");
  };

  // Cart actions
  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    addToast(`"${product.name}" added to cart.`, "success");
  };

  const removeFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Order Placement
  const handleCheckout = (name, address, phone) => {
    try {
      const customerId = currentUser ? currentUser.id : "guest_" + Date.now();
      placeOrder(customerId, name, address, phone, cart);
      addToast("Order placed successfully! Thank you for supporting our creative mamas!", "success");
      clearCart();
      refreshDbState();
      setIsCartOpen(false);
      
      // If customer is logged in, redirect to dashboard so they see their order tracking!
      if (currentUser) {
        setActiveView('dashboard');
        setCustomerTab('orders');
      }
    } catch (err) {
      addToast(err.message || "Failed to place order.", "error");
    }
  };

  // Chat Actions
  const handleStartChat = (recipientId, recipientName) => {
    if (!currentUser) {
      addToast("Please sign in or register to start chatting.", "error");
      setIsAuthOpen(true);
    } else {
      try {
        const thread = getOrCreateThread(currentUser.id, recipientId, currentUser.name, recipientName);
        setActiveThreadId(thread.id);
        setIsChatOpen(true);
      } catch (err) {
        addToast("Could not start chat thread.", "error");
      }
    }
  };

  // Seller Dashboard Handlers
  const handleUpdateBio = (bioData) => {
    updateSellerBio(currentUser.id, bioData);
    refreshDbState();
  };

  const handleAddProduct = (productData) => {
    addProduct(productData);
    refreshDbState();
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    try {
      updateOrderStatus(orderId, newStatus);
      addToast(`Order status updated to "${newStatus}"!`, "success");
      refreshDbState();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  // Admin Dashboard Handlers
  const handleApproveSeller = (userId) => {
    approveSeller(userId);
    addToast("Application approved! User is now a Seller.", "success");
    refreshDbState();
  };

  const handleRejectSellerRequest = (userId) => {
    rejectSellerRequest(userId);
    addToast("Application rejected.", "error");
    refreshDbState();
  };

  const handleChangeRole = (userId, newRole) => {
    changeUserRole(userId, newRole);
    addToast(`User role successfully changed to "${newRole}".`, "success");
    refreshDbState();
  };

  const handleApproveProduct = (productId) => {
    approveProduct(productId);
    addToast("Product approved and published in the shop!", "success");
    refreshDbState();
  };

  const handleRejectProduct = (productId) => {
    rejectProduct(productId);
    addToast("Product rejected.", "error");
    refreshDbState();
  };

  const handleRequestSellerFromDashboard = () => {
    const allUsers = getUsers();
    const idx = allUsers.findIndex(u => u.id === currentUser.id);
    if (idx !== -1) {
      allUsers[idx].requestSellerStatus = true;
      localStorage.setItem("mamas_users", JSON.stringify(allUsers));
      addToast("Seller application successfully sent to the admin!", "success");
      refreshDbState();
    }
  };

  const handleFilterBySeller = (sellerId) => {
    setSelectedSellerId(sellerId);
    const shopEl = document.getElementById('shop-section');
    if (shopEl) {
      shopEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mamas = users.filter(u => u.role === 'seller');
  
  // Filter orders placed by the current customer
  const myOrders = currentUser ? orders.filter(o => o.customerId === currentUser.id) : [];

  return (
    <>
      {/* Header */}
      <header>
        <div className="container nav-container">
          <a href="#" className="logo" onClick={() => setActiveView('home')}>
            <span className="logo-icon">🌙</span> Mama's Crafts
          </a>

          <nav>
            <ul className="nav-links">
              <li>
                <a 
                  href="#" 
                  className={activeView === 'home' ? 'active' : ''} 
                  onClick={() => setActiveView('home')}
                >
                  Home
                </a>
              </li>
              <li>
                <a href="#about-section" onClick={() => setActiveView('home')}>About</a>
              </li>
              <li>
                <a href="#meet-mamas-section" onClick={() => setActiveView('home')}>Meet the Mamas</a>
              </li>
              <li>
                <a href="#shop-section" onClick={() => setActiveView('home')}>Shop</a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            {currentUser && (
              <button 
                className={`btn btn-secondary ${activeView === 'dashboard' ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setActiveView(activeView === 'dashboard' ? 'home' : 'dashboard')}
                id="dashboard-toggle-btn"
              >
                {currentUser.role === 'admin' ? (
                  <>
                    <Shield size={16} /> Admin Panel
                  </>
                ) : (
                  <>
                    <User size={16} /> Dashboard
                  </>
                )}
              </button>
            )}

            {currentUser ? (
              <button 
                className="icon-btn" 
                onClick={handleLogout} 
                title="Logout"
                id="logout-btn"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.8rem' }}
                onClick={() => setIsAuthOpen(true)}
                id="login-btn"
              >
                Sign In
              </button>
            )}

            {/* Messages Button */}
            <button 
              className="icon-btn" 
              onClick={() => {
                if (!currentUser) {
                  addToast("Please sign in to check your messages.", "error");
                  setIsAuthOpen(true);
                } else {
                  setIsChatOpen(true);
                }
              }} 
              title="Open Messages"
              id="messages-btn"
            >
              <MessageSquare size={20} />
            </button>

            <button 
              className="icon-btn" 
              onClick={() => setIsCartOpen(true)} 
              title="Open Cart"
              id="cart-btn"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeView === 'home' ? (
          <>
            <Hero onJoinCircle={() => {
              if (currentUser) {
                addToast("You have already joined our mama circle!", "success");
              } else {
                setIsAuthOpen(true);
              }
            }} />
            
            <About onOurStoryClick={() => addToast("Our story begins very soon. Thank you for your interest!", "success")} />
            
            <MeetMamas 
              mamas={mamas} 
              currentUser={currentUser}
              onFilterBySeller={handleFilterBySeller}
              onEditBioClick={() => setActiveView('dashboard')}
              selectedSellerId={selectedSellerId}
              onStartChat={handleStartChat}
            />

            <Shop 
              products={products}
              onAddToCart={addToCart}
              onViewProductDetail={setSelectedProduct}
              selectedSellerId={selectedSellerId}
              onClearSellerFilter={() => setSelectedSellerId(null)}
              sellers={mamas}
            />
          </>
        ) : (
          <div className="container section">
            {/* Dashboard Content */}
            <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
              {currentUser.role === 'admin' ? "Platform Management Board" : "Personal Dashboard"}
            </h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
              Logged in as: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
            </div>

            {currentUser.role === 'admin' ? (
              <AdminDashboard 
                users={users}
                products={products}
                onApproveSeller={handleApproveSeller}
                onRejectSellerRequest={handleRejectSellerRequest}
                onChangeRole={handleChangeRole}
                onApproveProduct={handleApproveProduct}
                onRejectProduct={handleRejectProduct}
                onStartChat={handleStartChat}
              />
            ) : currentUser.role === 'seller' ? (
              <SellerDashboard 
                user={currentUser}
                products={products}
                orders={orders}
                onUpdateBio={handleUpdateBio}
                onAddProduct={handleAddProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onStartChat={handleStartChat}
                addToast={addToast}
              />
            ) : (
              /* Customer/Buyer dashboard - featuring Order Tracking and Seller onboarding request tabs */
              <div className="dashboard-layout">
                {/* Sidebar Navigation */}
                <div className="dashboard-sidebar">
                  <div className="dashboard-nav">
                    <button 
                      className={`dash-nav-btn ${customerTab === 'orders' ? 'active' : ''}`}
                      onClick={() => setCustomerTab('orders')}
                      id="customer-orders-tab"
                    >
                      <ShoppingBag size={18} />
                      <span>My Orders ({myOrders.length})</span>
                    </button>
                    <button 
                      className={`dash-nav-btn ${customerTab === 'onboarding' ? 'active' : ''}`}
                      onClick={() => setCustomerTab('onboarding')}
                      id="customer-onboarding-tab"
                    >
                      <Compass size={18} />
                      <span>Become a Creator</span>
                    </button>
                    <button 
                      className="dash-nav-btn"
                      onClick={() => handleStartChat('admin', 'Admin Support')}
                      id="customer-support-chat-btn"
                      style={{ color: 'var(--accent-gold)', marginTop: '20px' }}
                    >
                      <MessageSquare size={18} />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Content Area */}
                <div className="dashboard-content">
                  {customerTab === 'orders' ? (
                    <div>
                      <h3 className="dashboard-section-title">My Orders & Tracking</h3>
                      {myOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                          You have not placed any orders yet. 
                          <div style={{ marginTop: '20px' }}>
                            <button className="btn btn-primary" onClick={() => setActiveView('home')}>
                              Shop Our Creations
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {myOrders.map(order => (
                            <div 
                              key={order.id} 
                              style={{ 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '6px', 
                                padding: '20px', 
                                backgroundColor: 'var(--bg-secondary)'
                              }}
                              className="order-card-tracking"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                <div>
                                  <strong>Order: #{order.id}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Placed: {new Date(order.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <span className={`badge ${
                                    order.status === 'Pending' ? 'badge-pending' :
                                    order.status === 'Shipped' ? 'badge-approved' : 'badge-rejected'
                                  }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Truck size={12} /> {order.status}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {order.items.map((item, index) => {
                                  const sellerName = users.find(u => u.id === item.sellerId)?.name || item.sellerName || "Seller";
                                  return (
                                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexGrow: 1 }}>
                                        <img src={item.imageUrl} alt={item.name} style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                                        <div style={{ flexGrow: 1, fontSize: '0.85rem' }}>
                                          <div>{item.name}</div>
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seller: {sellerName}</span>
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>${item.price}</div>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                          onClick={() => handleStartChat(item.sellerId, sellerName)}
                                          title="Chat with Seller"
                                        >
                                          <MessageSquare size={12} /> Chat
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Delivery to: {order.shippingAddress}</span>
                                <strong>Total: ${order.total}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Seller onboarding request tab */
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      {currentUser.requestSellerStatus ? (
                        <div>
                          <div style={{ color: 'var(--warning)', marginBottom: '20px' }}>
                            <Compass size={48} style={{ animation: 'pulse 2s infinite' }} />
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                            Application Under Review
                          </h3>
                          <p style={{ lineHeight: '1.7', maxWidth: '500px', margin: '0 auto' }}>
                            Your request to become a Seller has been sent to the administrator. 
                            As soon as the administrator approves your request, you will receive full access to your personal dashboard 
                            to upload products and edit your biography.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ color: 'var(--accent-gold)', marginBottom: '20px' }}>
                            <CheckCircle2 size={48} />
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '16px' }}>
                            Become a Seller on Mama's Crafts!
                          </h3>
                          <p style={{ lineHeight: '1.7', marginBottom: '28px', maxWidth: '500px', margin: '0 auto' }}>
                            You can create your own seller profile, write your bio, and publish your handmade items 
                            (candles, kids' crafts, home decor) directly on our storefront gallery.
                          </p>
                          <button 
                            className="btn btn-primary"
                            onClick={handleRequestSellerFromDashboard}
                            id="request-seller-btn"
                          >
                            Apply for Seller Status
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer>
        <div className="container footer-grid">
          <div className="footer-col footer-about">
            <h4 style={{ fontFamily: 'var(--font-serif)' }}>🌙 Mama's Crafts</h4>
            <p>
              A platform built by moms, for moms. We bring cozy, natural warmth and beautiful handmade crafts to your home.
            </p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#" onClick={() => { setActiveView('home'); window.scrollTo(0,0); }}>Home</a></li>
              <li><a href="#about-section" onClick={() => setActiveView('home')}>About</a></li>
              <li><a href="#meet-mamas-section" onClick={() => setActiveView('home')}>Meet the Mamas</a></li>
              <li><a href="#shop-section" onClick={() => setActiveView('home')}>Shop</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Creations</h4>
            <ul>
              <li><a href="#shop-section" onClick={() => setActiveView('home')}>Candles</a></li>
              <li><a href="#shop-section" onClick={() => setActiveView('home')}>Wall Decor</a></li>
              <li><a href="#shop-section" onClick={() => setActiveView('home')}>Home Decor</a></li>
              <li><a href="#shop-section" onClick={() => setActiveView('home')}>Crystals & Stones</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <p style={{ color: '#c9ceca', fontSize: '0.9rem', marginBottom: '12px' }}>
              Email: hello@mamascrafts.com<br />
              Phone: +1 (555) 000-11-22
            </p>
            <ul>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleStartChat('admin', 'Admin Support');
                  }}
                  id="contact-support-link"
                  style={{ color: 'var(--accent-gold)', fontWeight: '500' }}
                >
                  💬 Chat with Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Mama's Crafts Collective. Made with love by caring mothers.
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        addToast={addToast}
      />

      <ProductDetailModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onViewSeller={handleFilterBySeller}
        onStartChat={handleStartChat}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        onCheckout={handleCheckout}
      />

      <ChatDrawer 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        activeThreadId={activeThreadId}
        setActiveThreadId={setActiveThreadId}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <NotificationToast 
        toasts={toasts}
        removeToast={removeToast}
      />
    </>
  );
}
