import React, { useState, useRef } from 'react';
import { useNotification } from '../../utils/notificationUtils.jsx';
import { uploadFile } from '../../utils/storageUtils';
import imageCompression from 'browser-image-compression';

function FileUploadArea({ 
  sagsnummer, 
  projectId, 
  projectName, 
  uploadedBy, 
  uploadedByUID, 
  onUploadComplete 
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const { showSuccess, showError } = useNotification();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowCategoryModal(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowCategoryModal(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategorySelect = async (category) => {
    setShowCategoryModal(false);
    if (pendingFile) {
      await handleUpload(pendingFile, category);
      setPendingFile(null);
    }
  };

  const compressImageFile = async (file, onProgress) => {
    try {
      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: onProgress
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);

      // Create thumbnail
      const thumbnailOptions = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 200,
        useWebWorker: true
      };
      const thumbnailFile = await imageCompression(file, thumbnailOptions);

      return {
        compressed: compressedFile,
        thumbnail: thumbnailFile
      };
    } catch (error) {
      console.error('Image compression error:', error);
      return {
        compressed: file,
        thumbnail: null
      };
    }
  };

  const handleUpload = async (file, category) => {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('Filen er for stor. Maksimum 10MB tilladt.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setCompressionProgress(0);

    try {
      let fileToUpload = file;
      let originalSize = file.size;
      let compressedSize = file.size;
      let isCompressed = false;
      let thumbnail = null;

      // Compress images
      if (file.type.startsWith('image/')) {
        const compressionResult = await compressImageFile(file, (progress) => {
          setCompressionProgress(progress);
        });

        if (compressionResult.compressed) {
          fileToUpload = compressionResult.compressed;
          compressedSize = compressionResult.compressed.size;
          isCompressed = true;
        }

        if (compressionResult.thumbnail) {
          thumbnail = compressionResult.thumbnail;
        }

        setCompressionProgress(100);
      }

      // Upload to Firebase
      const result = await uploadFile({
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

      if (result.success) {
        showSuccess('Fil uploaded!');
        onUploadComplete(result.fileData);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showError('Upload fejlede');
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
      <div className="file-upload-area-compact">
        <div 
          className="upload-dropzone-compact"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="upload-icon-compact">📁</span>
          <span className="upload-text-compact">Drag & drop eller klik for at uploade fil</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploading && (
          <div className="upload-progress-compact">
            {compressionProgress > 0 && compressionProgress < 100 && (
              <>
                <span className="progress-text-compact">Komprimerer... {compressionProgress}%</span>
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
                <span className="progress-text-compact">Uploader... {uploadProgress}%</span>
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