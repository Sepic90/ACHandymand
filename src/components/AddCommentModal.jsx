import React, { useState, useEffect } from 'react';
import { 
  upsertTimesheetComment, 
  getTimesheetComment,
  deleteTimesheetComment 
} from '../utils/commentUtils';
import { useNotification } from '../utils/notificationUtils';
import { getAbsenceComment, findAbsenceForDate } from '../utils/absenceUtils';

function AddCommentModal({ isOpen, onClose, employee, onSuccess, absences = [] }) {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  
  const [date, setDate] = useState('');
  const [comment, setComment] = useState('');
  const [existingComment, setExistingComment] = useState(null);
  const [absenceInfo, setAbsenceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Max comment length to fit in PDF column (approximately)
  const MAX_COMMENT_LENGTH = 80;

  useEffect(() => {
    if (date && employee) {
      loadExistingComment();
      checkAbsence();
    } else {
      setExistingComment(null);
      setAbsenceInfo(null);
      setComment('');
    }
  }, [date, employee]);

  const loadExistingComment = async () => {
    try {
      const result = await getTimesheetComment(employee.id, date);
      if (result.success && result.comment) {
        setExistingComment(result.comment);
        setComment(result.comment.comment);
      } else {
        setExistingComment(null);
        setComment('');
      }
    } catch (error) {
      console.error('Error loading comment:', error);
    }
  };

  const checkAbsence = () => {
    if (absences && absences.length > 0) {
      const absence = findAbsenceForDate(absences, date);
      if (absence) {
        // Get weekday for absence comment generation
        const [day, month, year] = date.split('/');
        const dateObj = new Date(year, month - 1, day);
        const weekdays = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
        const weekday = weekdays[dateObj.getDay()];
        
        const absenceCommentText = getAbsenceComment(date, weekday, absences);
        setAbsenceInfo({
          type: absence.absenceReason,
          autoComment: absenceCommentText
        });
      } else {
        setAbsenceInfo(null);
      }
    }
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    if (value) {
      const [yyyy, mm, dd] = value.split('-');
      const formatted = `${dd}/${mm}/${yyyy}`;
      setDate(formatted);
    } else {
      setDate('');
    }
    
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: null }));
    }
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    
    if (value.length <= MAX_COMMENT_LENGTH) {
      setComment(value);
      if (errors.comment) {
        setErrors(prev => ({ ...prev, comment: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!date) {
      newErrors.date = 'Dato er påkrævet';
    }
    
    if (!comment || comment.trim() === '') {
      newErrors.comment = 'Kommentar er påkrævet';
    }
    
    if (comment && comment.trim().length > MAX_COMMENT_LENGTH) {
      newErrors.comment = `Kommentar må maksimalt være ${MAX_COMMENT_LENGTH} tegn`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await upsertTimesheetComment(
        employee.id,
        employee.name,
        date,
        comment
      );
      
      if (result.success) {
        showSuccess(existingComment ? 'Kommentar opdateret!' : 'Kommentar tilføjet!');
        onSuccess();
        onClose();
      } else {
        showError('Fejl ved gemning af kommentar.');
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      showError('Fejl ved gemning af kommentar.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingComment) return;
    
    const confirmed = await showConfirm({
      title: 'Slet kommentar',
      message: 'Er du sikker på at du vil slette denne kommentar?',
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });
    
    if (!confirmed) return;
    
    setLoading(true);
    
    try {
      const result = await deleteTimesheetComment(employee.id, date);
      
      if (result.success) {
        showSuccess('Kommentar slettet!');
        onSuccess();
        onClose();
      } else {
        showError('Fejl ved sletning af kommentar.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Fejl ved sletning af kommentar.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  const dateInputValue = date ? (() => {
    const [dd, mm, yyyy] = date.split('/');
    return `${yyyy}-${mm}-${dd}`;
  })() : '';

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '550px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{existingComment ? 'Redigér kommentar' : 'Tilføj kommentar'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              padding: '12px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#004085',
              marginBottom: '20px'
            }}>
              <strong>📝 Om kommentarer:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                <li>Kommentarer vises i "Afvigelser / Bemærkninger" kolonnen på timesedler</li>
                <li>Kommentarer overskriver automatiske fraværsmeddelelser</li>
                <li>Bruges til at tilføje noter på specifikke datoer</li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="date">Dato *</label>
              <input
                type="date"
                id="date"
                value={dateInputValue}
                onChange={handleDateChange}
                className={errors.date ? 'input-error' : ''}
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>

            {absenceInfo && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#856404',
                marginBottom: '15px'
              }}>
                <strong>⚠️ Bemærk:</strong> Der er registreret fravær på denne dato ({absenceInfo.type}).
                <br />
                <small>Automatisk besked ville være: "{absenceInfo.autoComment}"</small>
                <br />
                <small style={{ fontWeight: '500', marginTop: '4px', display: 'block' }}>
                  Din kommentar vil erstatte denne besked på timesedlen.
                </small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="comment">
                Kommentar * 
                <span style={{ 
                  float: 'right', 
                  fontSize: '12px',
                  color: remainingChars < 10 ? '#e74c3c' : '#7f8c8d'
                }}>
                  {remainingChars} tegn tilbage
                </span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={handleCommentChange}
                className={errors.comment ? 'input-error' : ''}
                placeholder="F.eks. Møde hos kunde, Kursusedag, Arbejde fra hjemme"
                rows="3"
                style={{ resize: 'vertical' }}
              />
              {errors.comment && <span className="error-text">{errors.comment}</span>}
              <small className="form-hint">
                Vises på timesedlen i "Afvigelser / Bemærkninger" kolonnen
              </small>
            </div>

            {existingComment && (
              <div style={{ 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6c757d'
              }}>
                <div>Oprettet: {new Date(existingComment.createdAt).toLocaleDateString('da-DK')}</div>
                <div>Sidst opdateret: {new Date(existingComment.updatedAt).toLocaleDateString('da-DK')}</div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {existingComment && (
              <button 
                type="button" 
                className="btn-action btn-delete"
                onClick={handleDelete}
                disabled={loading}
                style={{ marginRight: 'auto' }}
              >
                Slet
              </button>
            )}
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Annuller
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Gemmer...' : existingComment ? 'Gem ændringer' : 'Tilføj kommentar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCommentModal;