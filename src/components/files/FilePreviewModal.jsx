import React, { useEffect } from 'react';

function FilePreviewModal({ file, onClose, onNext, onPrev, hasNext, hasPrev }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!file) return null;

  const isImage = file.fileType.startsWith('image/');
  const isPDF = file.fileType === 'application/pdf';

  // For PDFs, open in new tab instead of modal
  if (isPDF) {
    window.open(file.fileURL, '_blank');
    onClose();
    return null;
  }

  // Only show modal for images
  if (!isImage) {
    onClose();
    return null;
  }

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="preview-header">
          <span className="preview-filename">{file.fileName}</span>
          <button 
            className="preview-close"
            onClick={onClose}
            aria-label="Luk"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="preview-content">
          <img 
            src={file.fileURL} 
            alt={file.fileName}
            className="preview-image"
          />
        </div>

        {/* Navigation */}
        <div className="preview-navigation">
          {hasPrev && (
            <button 
              className="preview-nav-btn preview-prev"
              onClick={onPrev}
              aria-label="Forrige"
            >
              ←
            </button>
          )}
          {hasNext && (
            <button 
              className="preview-nav-btn preview-next"
              onClick={onNext}
              aria-label="Næste"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;