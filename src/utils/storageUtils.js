import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { storage, db } from '../services/firebase';
import { 
  generateFileId, 
  sanitizeFilename, 
  getExtensionFromMimeType,
  formatFileSize 
} from './fileUtils';

// ============================================
// FIREBASE STORAGE OPERATIONS
// ============================================

/**
 * Upload file to Firebase Storage
 * Returns upload task for progress tracking
 */
export const uploadFileToStorage = (file, sagsnummer, category, fileId) => {
  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);
  const extension = getExtensionFromMimeType(file.type) || `.${file.name.split('.').pop()}`;
  const filename = `${fileId}_${sanitizedName}`;
  
  // Storage path: projects/{sagsnummer}/{category}/{fileId}_filename
  const storagePath = `projects/${sagsnummer}/${category}/${filename}`;
  const storageRef = ref(storage, storagePath);
  
  // Create upload task
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type
  });
  
  return {
    uploadTask,
    storagePath,
    filename
  };
};

/**
 * Upload thumbnail to Firebase Storage
 */
export const uploadThumbnail = async (thumbnailFile, sagsnummer, category, fileId) => {
  if (!thumbnailFile) return null;
  
  const sanitizedName = 'thumbnail';
  const extension = getExtensionFromMimeType(thumbnailFile.type);
  const filename = `${fileId}_${sanitizedName}${extension}`;
  
  const storagePath = `projects/${sagsnummer}/${category}/${filename}`;
  const storageRef = ref(storage, storagePath);
  
  try {
    await uploadBytesResumable(storageRef, thumbnailFile);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      thumbnailURL: downloadURL,
      thumbnailPath: storagePath
    };
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    return null;
  }
};

/**
 * Delete file from Firebase Storage
 */
export const deleteFileFromStorage = async (storagePath) => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Storage delete error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// FIRESTORE OPERATIONS
// ============================================

/**
 * Save file metadata to Firestore
 */
export const saveFileMetadata = async (metadata) => {
  try {
    const docRef = await addDoc(collection(db, 'files'), {
      ...metadata,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    
    return { success: true, fileId: docRef.id };
  } catch (error) {
    console.error('Firestore save error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all files for a project (by sagsnummer)
 */
export const getProjectFiles = async (sagsnummer) => {
  try {
    const q = query(
      collection(db, 'files'),
      where('sagsnummer', '==', sagsnummer)
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, files };
  } catch (error) {
    console.error('Firestore get files error:', error);
    return { success: false, error: error.message, files: [] };
  }
};

/**
 * Get files by category
 */
export const getFilesByCategory = (files, category) => {
  return files.filter(file => file.fileCategory === category);
};

/**
 * Delete file metadata from Firestore
 */
export const deleteFileMetadata = async (fileId) => {
  try {
    await deleteDoc(doc(db, 'files', fileId));
    return { success: true };
  } catch (error) {
    console.error('Firestore delete error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update file metadata in Firestore
 */
export const updateFileMetadata = async (fileId, updates) => {
  try {
    await updateDoc(doc(db, 'files', fileId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Firestore update error:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// COMPLETE FILE OPERATIONS
// ============================================

/**
 * Complete file upload process
 * 1. Upload file to Storage
 * 2. Upload thumbnail (if image)
 * 3. Save metadata to Firestore
 */
export const uploadFile = async ({
  file,
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
  description = '',  // NEW: Added description parameter
  onProgress
}) => {
  const fileId = generateFileId();
  
  try {
    // 1. Upload main file
    const { uploadTask, storagePath, filename } = uploadFileToStorage(
      file,
      sagsnummer,
      category,
      fileId
    );
    
    // Track upload progress
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject({ success: false, error: error.message });
        },
        async () => {
          try {
            // Get download URL
            const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 2. Upload thumbnail if provided
            let thumbnailData = null;
            if (thumbnail) {
              thumbnailData = await uploadThumbnail(thumbnail, sagsnummer, category, fileId);
            }
            
            // 3. Prepare metadata
            const metadata = {
              fileId,
              fileName: file.name,
              originalFileName: file.name,
              fileType: file.type,
              fileExtension: getExtensionFromMimeType(file.type),
              fileCategory: category,
              fileSizeOriginal: originalSize,
              fileSizeCompressed: compressedSize,
              isCompressed,
              compressionRatio: isCompressed ? 
                Math.round((1 - compressedSize / originalSize) * 100) + '%' : 
                null,
              sagsnummer,
              projectId,
              projectName,
              fileURL,
              storagePath,
              thumbnailURL: thumbnailData?.thumbnailURL || null,
              thumbnailPath: thumbnailData?.thumbnailPath || null,
              uploadedBy,
              uploadedByUID,
              description: description.trim(),  // NEW: Include description in metadata
              tags: []
            };
            
            // 4. Save to Firestore
            const result = await saveFileMetadata(metadata);
            
            if (result.success) {
              resolve({ 
                success: true, 
                fileId: result.fileId,
                fileData: { ...metadata, id: result.fileId }
              });
            } else {
              reject(result);
            }
          } catch (error) {
            reject({ success: false, error: error.message });
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload process error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Complete file deletion process
 * 1. Delete from Storage
 * 2. Delete thumbnail if exists
 * 3. Delete metadata from Firestore
 */
export const deleteFile = async (fileData) => {
  try {
    // 1. Delete main file from Storage
    await deleteFileFromStorage(fileData.storagePath);
    
    // 2. Delete thumbnail if exists
    if (fileData.thumbnailPath) {
      await deleteFileFromStorage(fileData.thumbnailPath);
    }
    
    // 3. Delete metadata from Firestore
    await deleteFileMetadata(fileData.id);
    
    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    return { success: false, error: error.message };
  }
};