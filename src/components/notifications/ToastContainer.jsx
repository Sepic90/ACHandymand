import React from 'react';
import Toast from './Toast';
import { useNotification } from '../../utils/notificationUtils.jsx';

function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onRemove={removeToast}
        />
      ))}
    </div>
  );
}

export default ToastContainer;