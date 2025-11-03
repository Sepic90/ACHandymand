import React from 'react';
import { formatFileSize } from '../../utils/fileUtils';

function FileCard({ file, onPreview, onDelete, onDownload }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = file.fileType.startsWith('image/');
  const isPDF = file.fileType === 'application/pdf';

  return (
    <div className="file-card">
      {/* Thumbnail or Icon */}
      <div 
        className="file-thumbnail"
        onClick={() => onPreview(file)}
        style={{ cursor: isImage || isPDF ? 'pointer' : 'default' }}
      >
        {isImage && file.thumbnailURL ? (
          <img src={file.thumbnailURL} alt={file.fileName} />
        ) : (
          <div className="file-icon">
            {isPDF ? '📄' : '📎'}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="file-info">
        <div 
          className="file-name"
          onClick={() => onPreview(file)}
          style={{ cursor: isImage || isPDF ? 'pointer' : 'default' }}
          title={file.fileName}
        >
          {file.fileName}
        </div>
        <div className="file-meta">
          <span>{formatFileSize(file.fileSizeCompressed || file.fileSizeOriginal)}</span>
          <span>•</span>
          <span>{formatDate(file.uploadedAt)}</span>
        </div>
        <div className="file-uploader">{file.uploadedBy}</div>
      </div>

      {/* Actions */}
      <div className="file-actions">
        <button 
          className="btn-text"
          onClick={() => onDownload(file)}
        >
          Hent
        </button>
        <button 
          className="btn-text btn-danger-text"
          onClick={() => onDelete(file)}
        >
          Slet
        </button>
      </div>
    </div>
  );
}

export default FileCard;