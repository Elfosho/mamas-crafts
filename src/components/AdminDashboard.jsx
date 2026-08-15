import React, { useState } from 'react';
import { Users, ClipboardList, Check, X, ShieldAlert, MessageSquare } from 'lucide-react';

export default function AdminDashboard({ 
  users, 
  products, 
  currentUser,
  onApproveSeller, 
  onRejectSellerRequest, 
  onChangeRole, 
  onApproveProduct, 
  onRejectProduct,
  onStartChat
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'products'

  const pendingSellers = users.filter(u => u.request_seller_status);
  const pendingProducts = products.filter(p => p.status === 'pending');

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="dashboard-sidebar">
        <div className="dashboard-nav">
          <button 
            className={`dash-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users {pendingSellers.length > 0 && `(${pendingSellers.length})`}</span>
          </button>
          <button 
            className={`dash-nav-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ClipboardList size={18} />
            <span>Products Moderation {pendingProducts.length > 0 && `(${pendingProducts.length})`}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {activeTab === 'users' ? (
          <div>
            <h3 className="dashboard-section-title">User Role Management</h3>
            
            {/* Pending Requests Section */}
            {pendingSellers.length > 0 && (
              <div style={{ marginBottom: '40px', border: '1px dashed var(--accent-gold)', borderRadius: '6px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
                <h4 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0', fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>
                  <ShieldAlert size={18} />
                  Seller Application Requests ({pendingSellers.length})
                </h4>
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingSellers.map(u => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: '500' }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px' }}
                                onClick={() => onApproveSeller(u.id)}
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px', color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                                onClick={() => onRejectSellerRequest(u.id)}
                              >
                                <X size={14} /> Reject
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => onStartChat(u.id, u.name)}
                                title="Chat with Applicant"
                              >
                                <MessageSquare size={14} /> Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General Users Table */}
            <h4 style={{ margin: '0 0 16px 0', fontFamily: 'var(--font-serif)' }}>All Users</h4>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Change Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '500' }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-rejected' : u.role === 'seller' ? 'badge-approved' : 'badge-pending'}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'seller' ? 'Seller' : 'Customer'}
                        </span>
                      </td>
                      <td>
                        {/* Don't allow changing your own role */}
                        {u.id !== currentUser?.id ? (
                          <select
                            className="form-control"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto', display: 'inline-block', height: 'auto', borderRadius: '20px' }}
                            value={u.role}
                            onChange={(e) => onChangeRole(u.id, e.target.value)}
                          >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>You (Super Admin)</span>
                        )}
                      </td>
                      <td>
                        {u.id !== currentUser?.id && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => onStartChat(u.id, u.name)}
                            title="Chat with User"
                          >
                            <MessageSquare size={12} /> Chat
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="dashboard-section-title">New Products Moderation</h3>
            
            {pendingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                No products waiting for moderation.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Creator</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.imageUrl} alt={p.name} className="table-img" />
                        </td>
                        <td style={{ fontWeight: '500' }}>{p.name}</td>
                        <td>{p.sellerName}</td>
                        <td>{p.category}</td>
                        <td style={{ fontWeight: '600' }}>${p.price}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.description}>
                          {p.description}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px' }}
                              onClick={() => onApproveProduct(p.id)}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '15px', color: 'var(--danger)' }}
                              onClick={() => onRejectProduct(p.id)}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
