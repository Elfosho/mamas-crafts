import React, { useState } from 'react';
import { User, Package, PlusCircle, Save, ShoppingCart, DollarSign, Check, MessageSquare, Loader2, Upload } from 'lucide-react';
import { uploadProductImage, uploadAvatarImage } from '../lib/db';

export default function SellerDashboard({ 
  user, 
  products, 
  orders,
  onUpdateBio, 
  onAddProduct, 
  onUpdateOrderStatus,
  onStartChat,
  addToast 
}) {
  const [activeTab, setActiveTab] = useState('bio'); // 'bio' | 'products' | 'add' | 'orders'

  // Bio state
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [tags, setTags] = useState(user.tags || '');
  const [profileImage, setProfileImage] = useState(user.profile_image_url || user.profileImage || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Add Product state
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategory, setProdCategory] = useState('Candles');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodImgUploading, setProdImgUploading] = useState(false);
  const [prodStock, setProdStock] = useState('5'); // Default stock quantity

  const myProducts = products.filter(p => p.sellerId === user.id);

  // Filter orders that contain products from this seller
  const myReceivedOrders = (orders || []).filter(order => 
    order.items.some(item => item.sellerId === user.id)
  );

  // Upload avatar to Supabase Storage
  const handleAvatarUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large! Max 5 MB.', 'error');
      return;
    }
    setAvatarUploading(true);
    try {
      // 1️⃣ upload to Supabase Storage
      const url = await uploadAvatarImage(file, user.id);
      // 2️⃣ persist avatar URL in profile (RLS allows only owner)
      await updateAvatarUrl(user.id, url);
      setProfileImage(url);
      addToast('Avatar uploaded and saved! 🎉', 'success');
    } catch (err) {
      addToast('Avatar upload failed: ' + err.message, 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Upload product image to Supabase Storage
  const handleProductImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large! Max 5 MB.', 'error');
      return;
    }
    setProdImgUploading(true);
    try {
      const url = await uploadProductImage(file, user.id);
      setProdImg(url);
      addToast('Product image uploaded to cloud! ☁️', 'success');
    } catch (err) {
      addToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setProdImgUploading(false);
    }
  };

  const handleUpdateBioSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("Name cannot be empty.", "error");
      return;
    }
    onUpdateBio({
      name,
      bio,
      tags,
      profileImage: profileImage || null
    });
    addToast("Profile updated successfully!", "success");
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice || !prodDesc.trim() || !prodStock) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    onAddProduct({
      name: prodName,
      price: prodPrice,
      category: prodCategory,
      description: prodDesc,
      imageUrl: prodImg || "/assets/placeholder_product.jpg",
      sellerId: user.id,
      sellerName: user.name,
      stock: parseInt(prodStock) >= 0 ? parseInt(prodStock) : 5
    });

    addToast("Product added and sent to the administrator for moderation!", "success");
    
    // reset form
    setProdName('');
    setProdPrice('');
    setProdDesc('');
    setProdImg('');
    setProdStock('5');
    setActiveTab('products'); // switch to product list
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div className="dashboard-nav">
          <button 
            className={`dash-nav-btn ${activeTab === 'bio' ? 'active' : ''}`}
            onClick={() => setActiveTab('bio')}
          >
            <User size={18} />
            <span>My Biography</span>
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>My Creations ({myProducts.length})</span>
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            id="seller-orders-tab"
          >
            <ShoppingCart size={18} />
            <span>Orders Received ({myReceivedOrders.length})</span>
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <PlusCircle size={18} />
            <span>Add Product</span>
          </button>
          <button 
            className="dash-nav-btn"
            style={{ color: 'var(--accent-gold)', marginTop: '20px' }}
            onClick={() => onStartChat('admin', 'Admin Support')}
            id="seller-support-chat-btn"
          >
            <MessageSquare size={18} />
            <span>Contact Admin</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {activeTab === 'bio' ? (
          <form onSubmit={handleUpdateBioSubmit}>
            <h3 className="dashboard-section-title">Your Biography on the Home Page</h3>
            <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
              This information will be displayed in the "Meet The Mamas" section of the homepage. Share your story, how you create your items, and how your children inspire or help you.
            </p>

            <div className="form-group">
              <label>Name / Creative Alias</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>About Yourself (Biography)</label>
              <textarea 
                className="form-control" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Tell your story: why you started crafting, what materials you use, how you raise babies while healing yourself..."
                required 
              />
            </div>

            <div className="form-group">
              <label>Specialty / Tags (comma-separated)</label>
              <input 
                type="text" 
                className="form-control" 
                value={tags} 
                onChange={(e) => setTags(e.target.value)} 
                placeholder="Candles, Macrame, Felt Toys, Nursery Art" 
              />
            </div>

            <div className="form-group">
              <label>Profile Picture</label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                {profileImage && (
                  <img 
                    src={profileImage} 
                    alt="Profile Preview" 
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                  />
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-secondary)',
                    opacity: avatarUploading ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {avatarUploading
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading to cloud...</>
                    : <><Upload size={14} /> Upload Photo (max 5 MB)</>}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={avatarUploading}
                    onChange={(e) => handleAvatarUpload(e.target.files[0])}
                  />
                </label>
              </div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Or paste a direct image URL:</small>
              <input 
                type="text" 
                className="form-control" 
                value={profileImage} 
                onChange={(e) => setProfileImage(e.target.value)} 
                placeholder="/assets/luna_mama.jpg" 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        ) : activeTab === 'products' ? (
          <div>
            <h3 className="dashboard-section-title">My Creations</h3>
            
            {myProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                You have not added any creations yet.
                <div style={{ marginTop: '20px' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('add')}>
                    Add Your First Creation
                  </button>
                </div>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.imageUrl} alt={p.name} className="table-img" />
                        </td>
                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td style={{ fontWeight: '600' }}>${p.price}</td>
                        <td style={{ fontWeight: '600', color: p.stock === 0 ? 'var(--danger)' : 'var(--text-main)' }}>
                          {p.stock === 0 ? 'Out of stock' : p.stock}
                        </td>
                        <td>
                          <span className={`badge ${
                            p.status === 'approved' ? 'badge-approved' : 
                            p.status === 'pending' ? 'badge-pending' : 'badge-rejected'
                          }`}>
                            {p.status === 'approved' ? 'Approved' : 
                             p.status === 'pending' ? 'Pending' : 'Rejected'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'orders' ? (
          <div>
            <h3 className="dashboard-section-title">Orders Received</h3>
            {myReceivedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                No orders received yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {myReceivedOrders.map(order => {
                  const myItems = order.items.filter(item => item.sellerId === user.id);
                  const myTotal = myItems.reduce((sum, item) => sum + item.price, 0);

                  return (
                    <div 
                      key={order.id} 
                      style={{ 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '6px', 
                        padding: '24px', 
                        backgroundColor: 'var(--bg-secondary)'
                      }}
                      className="seller-order-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem' }}>Order ID: {order.id}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Placed on: {new Date(order.date).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className={`badge ${
                            order.status === 'Pending' ? 'badge-pending' :
                            order.status === 'Shipped' ? 'badge-approved' : 'badge-rejected'
                          }`} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '20px' }} className="features-grid">
                        <div>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>Shipping Details</h4>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            <strong>Customer Name:</strong> {order.customerName}<br />
                            <strong>Phone Number:</strong> {order.phone}<br />
                            <strong>Address:</strong> {order.shippingAddress}
                          </p>
                          {order.customerId && !order.customerId.startsWith('guest_') && (
                            <button 
                              className="btn btn-secondary chat-buyer-btn"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}
                              onClick={() => onStartChat(order.customerId, order.customerName)}
                            >
                              <MessageSquare size={12} /> Chat with Buyer
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontFamily: 'var(--font-serif)' }}>My Items in this Order</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {myItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <img src={item.imageUrl} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                              <div style={{ flexGrow: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}</div>
                              </div>
                              <div style={{ fontWeight: '600' }}>${item.price}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: '600', fontSize: '1.05rem', marginTop: '15px', color: 'var(--brand-green)' }}>
                          My Earnings: ${myTotal}
                        </div>
                      </div>

                      {/* Shipments status action triggers */}
                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {order.status === 'Pending' && (
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => onUpdateOrderStatus(order.id, 'Shipped')}
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {order.status === 'Shipped' && (
                          <button 
                            className="btn btn-gold"
                            style={{ padding: '8px 20px', borderRadius: '20px', fontSize: '0.8rem' }}
                            onClick={() => onUpdateOrderStatus(order.id, 'Delivered')}
                          >
                            Mark as Delivered
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand-green)', fontSize: '0.85rem', fontWeight: '600' }}>
                            <Check size={16} /> Delivered to Customer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddProductSubmit}>
            <h3 className="dashboard-section-title">Add New Creation</h3>
            <p style={{ marginBottom: '24px', fontSize: '0.9rem' }}>
              Submit your product here. It will appear on the shop shelf as soon as the Admin moderates and approves it.
            </p>

            <div className="form-group">
              <label>Product Title *</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Vanilla Soy Candle"
                value={prodName} 
                onChange={(e) => setProdName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label>Category *</label>
                <select 
                  className="form-control"
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                >
                  <option value="Candles">Candles</option>
                  <option value="Wall Decor">Wall Decor</option>
                  <option value="Home Decor">Home Decor</option>
                  <option value="Crystals & Stones">Crystals & Stones</option>
                  <option value="Posters & Prints">Posters & Prints</option>
                  <option value="Kids' Crafts">Kids' Crafts</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label>Price ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  className="form-control" 
                  placeholder="25.00"
                  value={prodPrice} 
                  onChange={(e) => setProdPrice(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label>Stock Qty *</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  placeholder="5"
                  value={prodStock} 
                  onChange={(e) => setProdStock(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea 
                className="form-control" 
                placeholder="Detail your creation: materials used (e.g. soy wax, essential oils), size, burn time, safety rules..."
                value={prodDesc} 
                onChange={(e) => setProdDesc(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Product Image</label>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px' }}>
                {prodImg && (
                  <img 
                    src={prodImg} 
                    alt="Product Preview" 
                    style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                  />
                )}
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    cursor: prodImgUploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-secondary)',
                    opacity: prodImgUploading ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {prodImgUploading
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading to cloud...</>
                    : <><Upload size={14} /> Upload Photo (max 5 MB)</>}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={prodImgUploading}
                    onChange={(e) => handleProductImageUpload(e.target.files[0])}
                  />
                </label>
              </div>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Or paste a direct image URL:</small>
              <input 
                type="text" 
                className="form-control" 
                placeholder="/assets/ritual_candle.jpg"
                value={prodImg} 
                onChange={(e) => setProdImg(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              <PlusCircle size={16} /> Add & Send to Moderation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
