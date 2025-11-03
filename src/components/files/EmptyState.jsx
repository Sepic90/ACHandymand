import React from 'react';

function EmptyState({ category, onUpload }) {
  const getCategoryLabel = () => {
    const labels = {
      bilag: 'bilag',
      billeder: 'billeder',
      dokumenter: 'dokumenter'
    };
    return labels[category] || 'filer';
  };

  const getIcon = () => {
    const icons = {
      bilag: '🧾',
      billeder: '📸',
      dokumenter: '📄'
    };
    return icons[category] || '📎';
  };

  return (
    <div className="empty-state-file">
      <div className="empty-icon">{getIcon()}</div>
      <p>Ingen {getCategoryLabel()} uploaded endnu</p>
      <button 
        className="btn-secondary btn-small"
        onClick={onUpload}
      >
        Upload {getCategoryLabel()}
      </button>
    </div>
  );
}

export default EmptyState;