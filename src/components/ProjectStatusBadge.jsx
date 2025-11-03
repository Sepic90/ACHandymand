import React from 'react';

function ProjectStatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'planned':
        return '#3498db'; // Blue
      case 'in-progress':
        return '#e67e22'; // Orange
      case 'ready-for-invoice':
        return '#27ae60'; // Green
      case 'closed':
        return '#95a5a6'; // Gray
      default:
        return '#95a5a6';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'planned':
        return 'Planlagt';
      case 'in-progress':
        return 'I Gang';
      case 'ready-for-invoice':
        return 'Klar til Faktura';
      case 'closed':
        return 'Lukket';
      default:
        return status;
    }
  };

  return (
    <span
      className="status-badge"
      style={{
        backgroundColor: getStatusColor(status),
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '500',
        display: 'inline-block'
      }}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export default ProjectStatusBadge;