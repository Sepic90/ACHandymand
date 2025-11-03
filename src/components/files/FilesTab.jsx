import React, { useState, useEffect } from 'react';
import { useNotification } from '../../utils/notificationUtils.jsx';
import { getProjectFiles, getFilesByCategory, deleteFile } from '../../utils/storageUtils';
import FileUploadArea from './FileUploadArea';
import FileCategoryColumn from './FileCategoryColumn';
import FilePreviewModal from './FilePreviewModal';

function FilesTab({ project, currentUser }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [previewFile, setPreviewFile] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewCategory, setPreviewCategory] = useState('');
  
  const { showSuccess, showError, showConfirm } = useNotification();

  useEffect(() => {
    loadFiles();
  }, [project.projectNumber]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const result = await getProjectFiles(project.projectNumber);
      if (result.success) {
        setFiles(result.files);
      } else {
        showError('Kunne ikke indlæse filer');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      showError('Kunne ikke indlæse filer');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newFile) => {
    setFiles(prev => [...prev, newFile]);
  };

  const handleDelete = async (file) => {
    const confirmed = await showConfirm({
      title: 'Slet fil?',
      message: `Er du sikker på at du vil slette "${file.fileName}"? Denne handling kan ikke fortrydes.`,
      confirmText: 'Slet fil',
      cancelText: 'Annuller',
      type: 'danger'
    });

    if (confirmed) {
      try {
        const result = await deleteFile(file);
        if (result.success) {
          setFiles(prev => prev.filter(f => f.id !== file.id));
          showSuccess('Fil slettet');
        } else {
          showError('Kunne ikke slette fil');
        }
      } catch (error) {
        console.error('Delete error:', error);
        showError('Kunne ikke slette fil');
      }
    }
  };

  const handleDownload = (file) => {
    window.open(file.fileURL, '_blank');
  };

  const handlePreview = (file) => {
    const category = file.fileCategory;
    const categoryFiles = getFilteredFilesByCategory(category);
    const index = categoryFiles.findIndex(f => f.id === file.id);
    
    setPreviewFile(file);
    setPreviewIndex(index);
    setPreviewCategory(category);
  };

  const handlePreviewNext = () => {
    const categoryFiles = getFilteredFilesByCategory(previewCategory);
    if (previewIndex < categoryFiles.length - 1) {
      const nextIndex = previewIndex + 1;
      setPreviewFile(categoryFiles[nextIndex]);
      setPreviewIndex(nextIndex);
    }
  };

  const handlePreviewPrev = () => {
    if (previewIndex > 0) {
      const categoryFiles = getFilteredFilesByCategory(previewCategory);
      const prevIndex = previewIndex - 1;
      setPreviewFile(categoryFiles[prevIndex]);
      setPreviewIndex(prevIndex);
    }
  };

  const getFilteredFiles = () => {
    let filtered = [...files];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(file =>
        file.fileName.toLowerCase().includes(term) ||
        file.description?.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      } else if (sortBy === 'oldest') {
        return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      } else if (sortBy === 'name') {
        return a.fileName.localeCompare(b.fileName);
      }
      return 0;
    });

    return filtered;
  };

  const getFilteredFilesByCategory = (category) => {
    const filtered = getFilteredFiles();
    return getFilesByCategory(filtered, category);
  };

  if (loading) {
    return (
      <div className="loading-text">
        <span className="loading-spinner-dark"></span>
        Indlæser filer...
      </div>
    );
  }

  const bilagFiles = getFilteredFilesByCategory('bilag');
  const billederFiles = getFilteredFilesByCategory('billeder');
  const dokumenterFiles = getFilteredFilesByCategory('dokumenter');

  const categoryFiles = previewCategory ? getFilteredFilesByCategory(previewCategory) : [];

  return (
    <div className="files-tab">
      {/* Upload Area */}
      <FileUploadArea
        sagsnummer={project.projectNumber}
        projectId={project.id}
        projectName={project.name}
        uploadedBy={currentUser}
        uploadedByUID="user123"
        onUploadComplete={handleUploadComplete}
      />

      {/* Search and Sort */}
      <div className="files-controls">
        <input
          type="text"
          placeholder="Søg efter filnavn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="newest">Nyeste først</option>
          <option value="oldest">Ældste først</option>
          <option value="name">Navn (A-Z)</option>
        </select>
      </div>

      {/* 3 Column Layout */}
      <div className="files-columns">
        <FileCategoryColumn
          category="bilag"
          files={bilagFiles}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onUpload={() => {}}
        />
        <FileCategoryColumn
          category="billeder"
          files={billederFiles}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onUpload={() => {}}
        />
        <FileCategoryColumn
          category="dokumenter"
          files={dokumenterFiles}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onUpload={() => {}}
        />
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onNext={handlePreviewNext}
        onPrev={handlePreviewPrev}
        hasNext={previewIndex < categoryFiles.length - 1}
        hasPrev={previewIndex > 0}
      />
    </div>
  );
}

export default FilesTab;