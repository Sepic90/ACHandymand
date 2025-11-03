import React from 'react';
import { useNotification } from '../../utils/notificationUtils.jsx';

function ConfirmDialog() {
  const { confirmDialog } = useNotification();

  if (!confirmDialog) return null;

  const {
    title = 'Bekræft handling',
    message,
    confirmText = 'Bekræft',
    cancelText = 'Annuller',
    onConfirm,
    onCancel,
    type = 'danger'
  } = confirmDialog;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-footer">
          <button 
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={type === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;