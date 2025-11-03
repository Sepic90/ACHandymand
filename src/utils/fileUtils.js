import imageCompression from 'browser-image-compression';

// ============================================
// FILE VALIDATION
// ============================================

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types by category
export const ALLOWED_FILE_TYPES = {
  bilag: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  billeder: ['image/jpeg', 'image/jpg', 'image/png'],
  dokumenter: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
};

// File extension mapping
export const FILE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt',
  'text/csv': '.csv'
};

/**
 * Validate file size
 */
export const validateFileSize = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Filen er for stor. Maksimal størrelse er ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }
  return { valid: true };
};

/**
 * Validate file type for category
 */
export const validateFileType = (file, category) => {
  const allowedTypes = ALLOWED_FILE_TYPES[category];
  
  if (!allowedTypes || !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Filtypen ${file.type} er ikke tilladt for ${getCategoryLabel(category)}.`
    };
  }
  
  return { valid: true };
};

/**
 * Get category label in Danish
 */
export const getCategoryLabel = (category) => {
  const labels = {
    bilag: 'Bilag',
    billeder: 'Billeder',
    dokumenter: 'Dokumenter'
  };
  return labels[category] || category;
};

// ============================================
// FILE COMPRESSION
// ============================================

/**
 * Check if file is an image that should be compressed
 */
export const shouldCompressFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Compress image file
 */
export const compressImage = async (file, onProgress) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.8,
    onProgress: onProgress
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    return {
      success: true,
      file: compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100)
    };
  } catch (error) {
    console.error('Compression error:', error);
    return {
      success: false,
      error: 'Kunne ikke komprimere billedet. Prøver at uploade original fil.'
    };
  }
};

// ============================================
// THUMBNAIL GENERATION
// ============================================

/**
 * Generate thumbnail for image
 */
export const generateThumbnail = async (file) => {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 300,
    useWebWorker: true,
    quality: 0.7
  };

  try {
    const thumbnail = await imageCompression(file, options);
    return thumbnail;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return null;
  }
};

// ============================================
// FILE UTILITIES
// ============================================

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMimeType = (mimeType) => {
  return FILE_EXTENSIONS[mimeType] || '';
};

/**
 * Check if file is an image
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/');
};

/**
 * Check if file is a PDF
 */
export const isPdfFile = (file) => {
  return file.type === 'application/pdf';
};

/**
 * Generate unique file ID
 */
export const generateFileId = () => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitize filename (remove special characters)
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Get icon for file type
 */
export const getFileIcon = (fileType) => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  return '📎';
};