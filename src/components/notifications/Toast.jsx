import React, { useEffect } from 'react';
import { getToastIcon, getToastColorClass } from '../../utils/notificationUtils.jsx';

function Toast({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast ${getToastColorClass(toast.type)}`}>
      <div className="toast-icon">
        {getToastIcon(toast.type)}
      </div>
      <div className="toast-message">
        {toast.message}
      </div>
      <button 
        className="toast-close"
        onClick={() => onRemove(toast.id)}
        aria-label="Luk notifikation"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;