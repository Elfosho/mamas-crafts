import React from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function NotificationToast({ toasts, removeToast }) {
  return (
    <div className="toasts-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.type === 'error' ? (
            <AlertCircle size={18} className="toast-icon-error" style={{ color: 'var(--danger)' }} />
          ) : (
            <CheckCircle size={18} className="toast-icon-success" style={{ color: 'var(--brand-green)' }} />
          )}
          <div className="toast-message">{toast.message}</div>
          <button onClick={() => removeToast(toast.id)} className="toast-close">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
