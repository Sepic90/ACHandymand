import React from 'react';
import FileCard from './FileCard';
import EmptyState from './EmptyState';

function FileCategoryColumn({ 
  category, 
  files, 
  onPreview, 
  onDelete, 
  onDownload
}) {
  const getCategoryLabel = () => {
    const labels = {
      bilag: 'BILAG',
      billeder: 'BILLEDER',
      dokumenter: 'DOKUMENTER'
    };
    return labels[category] || category.toUpperCase();
  };

  const getCategoryIcon = () => {
    const icons = {
      bilag: '🧾',
      billeder: '📸',
      dokumenter: '📄'
    };
    return icons[category] || '📎';
  };

  return (
    <div className="file-category-column">
      <div className="category-header">
        <span className="category-icon">{getCategoryIcon()}</span>
        <h3>{getCategoryLabel()}</h3>
        <span className="file-count">({files.length} filer)</span>
      </div>

      <div className="category-content">
        {files.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <div className="file-list">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={onPreview}
                onDelete={onDelete}
                onDownload={onDownload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileCategoryColumn;