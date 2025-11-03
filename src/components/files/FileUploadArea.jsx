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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fileNote, setFileNote] = useState('');
  const fileInputRef = useRef(null);
  
  const { showSuccess, showError } = useNotification();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setFileNote('');
      setShowCategoryModal(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setPendingFile(file);
      setFileNote('');
      setShowCategoryModal(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleUploadConfirm = async () => {
    if (!selectedCategory) {
      showError('Vælg venligst en kategori');
      return;
    }

    setShowCategoryModal(false);
    if (pendingFile) {
      await handleUpload(pendingFile, selectedCategory, fileNote);
      setPendingFile(null);
      setSelectedCategory('');
      setFileNote('');
    }
  };

  const compressImageFile = async (file, onProgress) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: onProgress
      };

      const compressedFile = await imageCompression(file, options);

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

  const handleUpload = async (file, category, note) => {
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
        description: note,
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

      {showCategoryModal && (
        <div className="confirm-overlay">
          <div className="confirm-dialog file-upload-dialog">
            <div className="confirm-header">
              <h3>Upload fil</h3>
              <button className="modal-close" onClick={() => {
                setShowCategoryModal(false);
                setPendingFile(null);
                setSelectedCategory('');
                setFileNote('');
              }}>&times;</button>
            </div>
            
            <div className="confirm-body">
              <div className="file-info">
                <p className="file-name">📄 {pendingFile?.name}</p>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Vælg kategori *</label>
                <div className="category-selection-compact">
                  <button
                    type="button"
                    className={`category-btn-compact ${selectedCategory === 'bilag' ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect('bilag')}
                  >
                    <span className="category-icon">🧾</span>
                    <span>Bilag</span>
                  </button>
                  <button
                    type="button"
                    className={`category-btn-compact ${selectedCategory === 'billeder' ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect('billeder')}
                  >
                    <span className="category-icon">📸</span>
                    <span>Billeder</span>
                  </button>
                  <button
                    type="button"
                    className={`category-btn-compact ${selectedCategory === 'dokumenter' ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect('dokumenter')}
                  >
                    <span className="category-icon">📄</span>
                    <span>Dokumenter</span>
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="fileNote">Kommentar/Note (valgfri)</label>
                <textarea
                  id="fileNote"
                  value={fileNote}
                  onChange={(e) => setFileNote(e.target.value)}
                  placeholder="Tilføj en note eller kommentar til filen..."
                  rows="3"
                  maxLength="500"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <small className="form-hint">{fileNote.length}/500 tegn</small>
              </div>
            </div>
            
            <div className="confirm-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowCategoryModal(false);
                  setPendingFile(null);
                  setSelectedCategory('');
                  setFileNote('');
                }}
              >
                Annuller
              </button>
              <button 
                className="btn-primary"
                onClick={handleUploadConfirm}
                disabled={!selectedCategory}
              >
                Upload fil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FileUploadArea;