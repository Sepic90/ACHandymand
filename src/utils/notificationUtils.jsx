import React, { createContext, useContext, useState, useCallback } from 'react';

// ============================================
// NOTIFICATION CONTEXT
// ============================================

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// ============================================
// NOTIFICATION PROVIDER
// ============================================

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Add toast notification
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
    
    return id;
  }, []);

  // Remove toast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Show success toast
  const showSuccess = useCallback((message) => {
    return showToast(message, 'success');
  }, [showToast]);

  // Show error toast
  const showError = useCallback((message) => {
    return showToast(message, 'error');
  }, [showToast]);

  // Show info toast
  const showInfo = useCallback((message) => {
    return showToast(message, 'info');
  }, [showToast]);

  // Show warning toast
  const showWarning = useCallback((message) => {
    return showToast(message, 'warning');
  }, [showToast]);

  // Show confirmation dialog
  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        ...config,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const value = {
    toasts,
    showToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirm,
    confirmDialog
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getToastIcon = (type) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✗';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
};

export const getToastColorClass = (type) => {
  switch (type) {
    case 'success':
      return 'toast-success';
    case 'error':
      return 'toast-error';
    case 'warning':
      return 'toast-warning';
    case 'info':
    default:
      return 'toast-info';
  }
};