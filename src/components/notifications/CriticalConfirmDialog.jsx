import React, { useState, useEffect } from 'react';
import { useNotification } from '../../utils/notificationUtils.jsx';

function CriticalConfirmDialog() {
  const { criticalConfirmDialog } = useNotification();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset input when dialog changes
    setInputValue('');
    setError(false);
  }, [criticalConfirmDialog]);

  if (!criticalConfirmDialog) return null;

  const {
    title = 'Bekræft sletning',
    message,
    itemName,
    confirmText = 'Slet',
    cancelText = 'Annuller',
    onConfirm,
    onCancel,
    warningText
  } = criticalConfirmDialog;

  const handleConfirm = () => {
    if (inputValue.toLowerCase() === 'slet') {
      setError(false);
      onConfirm();
    } else {
      setError(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="confirm-overlay">
      <div className="critical-confirm-dialog">
        <div className="confirm-header critical-header">
          <div className="critical-icon">⚠️</div>
          <h3>{title}</h3>
        </div>
        
        <div className="confirm-body">
          <p className="critical-message">{message}</p>
          
          {itemName && (
            <div className="item-highlight">
              <strong>{itemName}</strong>
            </div>
          )}
          
          {warningText && (
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <span>{warningText}</span>
            </div>
          )}
          
          <div className="confirmation-input-section">
            <label>
              Skriv <strong>"Slet"</strong> for at bekræfte:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(false);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Skriv Slet"
              className={error ? 'input-error' : ''}
              autoFocus
            />
            {error && (
              <span className="error-text">
                Du skal skrive "Slet" for at bekræfte
              </span>
            )}
          </div>
        </div>
        
        <div className="confirm-footer">
          <button 
            className="btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className="btn-danger"
            onClick={handleConfirm}
            disabled={!inputValue}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CriticalConfirmDialog;