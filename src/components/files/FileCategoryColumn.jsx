import React from 'react';
import { formatDate } from '../../utils/formatUtils';
import { formatFileSize } from '../../utils/fileUtils';

function FileCategoryColumn({ category, files, onPreview, onDelete, onDownload }) {
  const getCategoryInfo = () => {
    switch (category) {
      case 'bilag':
        return { icon: '🧾', title: 'Bilag', emptyText: 'Ingen bilag endnu' };
      case 'billeder':
        return { icon: '📸', title: 'Billeder', emptyText: 'Ingen billeder endnu' };
      case 'dokumenter':
        return { icon: '📄', title: 'Dokumenter', emptyText: 'Ingen dokumenter endnu' };
      default:
        return { icon: '📁', title: 'Filer', emptyText: 'Ingen filer endnu' };
    }
  };

  const categoryInfo = getCategoryInfo();

  return (
    <div className="file-category-column">
      <div className="category-header">
        <span className="category-icon">{categoryInfo.icon}</span>
        <h3>{categoryInfo.title}</h3>
        <span className="category-count">{files.length}</span>
      </div>

      <div className="files-list">
        {files.length === 0 ? (
          <div className="empty-state-file">
            <div className="empty-icon">{categoryInfo.icon}</div>
            <p>{categoryInfo.emptyText}</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-preview" onClick={() => onPreview(file)}>
                {file.thumbnailURL ? (
                  <img src={file.thumbnailURL} alt={file.fileName} />
                ) : (
                  <div className="file-icon">
                    {file.fileType?.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                )}
              </div>
              
              <div className="file-details">
                <div className="file-name" title={file.fileName}>
                  {file.fileName}
                </div>
                
                {file.description && (
                  <div className="file-note" title={file.description}>
                    💬 {file.description}
                  </div>
                )}
                
                <div className="file-meta">
                  <span className="file-date">{formatDate(file.uploadedAt)}</span>
                  {file.fileSizeCompressed && (
                    <span className="file-size">{formatFileSize(file.fileSizeCompressed)}</span>
                  )}
                </div>
                
                {file.uploadedBy && (
                  <div className="file-uploader">
                    👤 {file.uploadedBy}
                  </div>
                )}
              </div>

              <div className="file-actions">
                <button
                  className="action-btn"
                  onClick={() => onPreview(file)}
                  title="Vis"
                >
                  👁️
                </button>
                <button
                  className="action-btn"
                  onClick={() => onDownload(file)}
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  className="action-btn danger"
                  onClick={() => onDelete(file)}
                  title="Slet"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FileCategoryColumn;