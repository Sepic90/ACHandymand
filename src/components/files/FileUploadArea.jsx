import React, { useState, useRef } from 'react';
import { useNotification } from '../../utils/notificationUtils.jsx';
import {
  validateFileSize,
  validateFileType,
  shouldCompressFile,
  compressImage,
  generateThumbnail,
  getCategoryLabel
} from '../../utils/fileUtils';
import { uploadFile } from '../../utils/storageUtils';

function FileUploadArea({ sagsnummer, projectId, projectName, uploadedBy, uploadedByUID, onUploadComplete, preselectedCategory }) {
  const [uploading, setUploading] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || '');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const { showSuccess, showError } = useNotification();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const processFile = (file) => {
    // Validate file size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      showError(sizeValidation.error);
      return;
    }

    setPendingFile(file);
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (category) => {
    if (!pendingFile) return;

    // Validate file type for category
    const typeValidation = validateFileType(pendingFile, category);
    if (!typeValidation.valid) {
      showError(typeValidation.error);
      setShowCategoryModal(false);
      setPendingFile(null);
      return;
    }

    setSelectedCategory(category);
    setShowCategoryModal(false);
    
    await uploadFileWithCompression(pendingFile, category);
    setPendingFile(null);
  };

  const uploadFileWithCompression = async (file, category) => {
    setUploading(true);
    setCompressionProgress(0);
    setUploadProgress(0);

    try {
      let fileToUpload = file;
      let thumbnail = null;
      let originalSize = file.size;
      let compressedSize = file.size;
      let isCompressed = false;

      // Compress if image
      if (shouldCompressFile(file)) {
        const compressionResult = await compressImage(file, (progress) => {
          setCompressionProgress(Math.round(progress));
        });

        if (compressionResult.success) {
          fileToUpload = compressionResult.file;
          compressedSize = compressionResult.compressedSize;
          isCompressed = true;
          
          // Generate thumbnail
          thumbnail = await generateThumbnail(fileToUpload);
        }
      }

      // Upload to Firebase
      const uploadResult = await uploadFile({
        file: fileToUpload,
        thumbnail,
        sagsnummer,
        projectId,
        projectName,
        category,
        uploadedBy,
        uploadedByUID,
        originalSize,
        compressedSize,
        isCompressed,
        onProgress: (progress) => {
          setUploadProgress(Math.round(progress));
        }
      });

      if (uploadResult.success) {
        showSuccess('Fil uploaded successfully');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (onUploadComplete) {
          onUploadComplete(uploadResult.metadata);
        }
      } else {
        showError('Upload fejlede - prøv igen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload fejlede - prøv igen');
    } finally {
      setUploading(false);
      setCompressionProgress(0);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="file-upload-area">
        <div 
          className="upload-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">📁</div>
          <p className="upload-text">Drag & drop eller klik for at vælge fil</p>
          <p className="upload-subtext">Maks 10MB per fil</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploading && (
          <div className="upload-progress-container">
            {compressionProgress > 0 && compressionProgress < 100 && (
              <>
                <div className="loading-text">
                  <span className="loading-spinner-dark"></span>
                  Komprimerer billede... {compressionProgress}%
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${compressionProgress}%` }}
                  ></div>
                </div>
              </>
            )}
            {uploadProgress > 0 && (
              <>
                <div className="loading-text">
                  <span className="loading-spinner-dark"></span>
                  Uploader til Firebase... {uploadProgress}%
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <div className="confirm-header">
              <h3>Vælg kategori</h3>
            </div>
            
            <div className="confirm-body">
              <p>Hvilken type fil er dette?</p>
              <div className="category-selection">
                <button
                  className="category-btn"
                  onClick={() => handleCategorySelect('bilag')}
                >
                  <span className="category-btn-icon">🧾</span>
                  <span>Bilag</span>
                </button>
                <button
                  className="category-btn"
                  onClick={() => handleCategorySelect('billeder')}
                >
                  <span className="category-btn-icon">📸</span>
                  <span>Billeder</span>
                </button>
                <button
                  className="category-btn"
                  onClick={() => handleCategorySelect('dokumenter')}
                >
                  <span className="category-btn-icon">📄</span>
                  <span>Dokumenter</span>
                </button>
              </div>
            </div>
            
            <div className="confirm-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowCategoryModal(false);
                  setPendingFile(null);
                }}
              >
                Annuller
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FileUploadArea;