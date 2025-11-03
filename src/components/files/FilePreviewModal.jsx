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

  // Handle non-image files in useEffect to avoid setState during render
  useEffect(() => {
    if (!file) return;
    
    const isPDF = file.fileType === 'application/pdf';
    const isImage = file.fileType.startsWith('image/');

    // For PDFs, open in new tab and close modal
    if (isPDF) {
      window.open(file.fileURL, '_blank');
      onClose();
      return;
    }

    // For other non-image files, just close
    if (!isImage) {
      onClose();
    }
  }, [file, onClose]);

  if (!file) return null;

  const isImage = file.fileType.startsWith('image/');

  // Only render modal for images
  if (!isImage) {
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