import React from 'react';
import { getLighterColor, formatTime, getEmployeeColor } from '../utils/calendarUtils';

function EventDetailsModal({ isOpen, onClose, selectedDate, events, absences, onEditEvent, onDeleteEvent }) {
  if (!isOpen) return null;

  const allItems = [];
  
  // Add regular events
  events.forEach(event => {
    allItems.push({
      ...event,
      isAbsence: false
    });
  });
  
  // Add absences
  absences.forEach(absence => {
    allItems.push({
      ...absence,
      title: `${absence.employeeName} - ${absence.absenceReason}`,
      isAbsence: true,
      originalData: absence
    });
  });

  const getEventTypeLabel = (type) => {
    switch(type) {
      case 'work': return 'Arbejde';
      case 'meeting': return 'Møde';
      case 'call': return 'Telefonmøde';
      case 'other': return 'Andet';
      default: return 'Arbejde';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-details-modal-popup" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Begivenheder for {selectedDate}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {allItems.length === 0 ? (
            <div className="no-data-text">
              <p>Ingen begivenheder denne dag</p>
            </div>
          ) : (
            <div className="event-details-list-modal">
              {allItems.map((item, idx) => {
                if (item.isAbsence) {
                  // Render absence
                  const color = '#f57c00';
                  return (
                    <div 
                      key={idx} 
                      className="event-detail-item-modal absence-item"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="event-item-header-modal">
                        <span className="event-badge-modal" style={{ backgroundColor: getLighterColor(color, 0.3), color: color }}>
                          Fravær
                        </span>
                        <div className="event-item-title-modal">{item.title}</div>
                      </div>
                      {item.originalData.hoursWorked && (
                        <div className="event-item-meta-modal">
                          ⏱️ Arbejdede {item.originalData.hoursWorked} timer
                        </div>
                      )}
                      {item.originalData.comment && (
                        <div className="event-item-description-modal">
                          💬 {item.originalData.comment}
                        </div>
                      )}
                      <div className="event-item-footer-modal">
                        <span className="event-footer-note">Fravær kan redigeres i Timeregistrering</span>
                      </div>
                    </div>
                  );
                } else {
                  // Render calendar event
                  const color = item.employeeIds && item.employeeIds.length > 0 
                    ? getEmployeeColor(item.employeeIds[0])
                    : '#7f8c8d';

                  return (
                    <div 
                      key={idx} 
                      className="event-detail-item-modal"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="event-item-header-modal">
                        <span className="event-badge-modal" style={{ 
                          backgroundColor: getLighterColor(color, 0.3),
                          color: color 
                        }}>
                          {getEventTypeLabel(item.eventType)}
                        </span>
                        <div className="event-item-title-modal">{item.title}</div>
                      </div>
                      
                      {(item.startTime || item.endTime) && (
                        <div className="event-item-time-modal">
                          ⏰ {formatTime(item.startTime)} {item.endTime && `- ${formatTime(item.endTime)}`}
                        </div>
                      )}
                      
                      <div className="event-item-employees-modal">
                        👤 {item.employeeNames?.join(', ')}
                      </div>
                      
                      {item.sagsnummer && (
                        <div className="event-item-meta-modal">
                          📋 Sag #{item.sagsnummer}
                        </div>
                      )}
                      
                      {item.description && (
                        <div className="event-item-description-modal">
                          💬 {item.description}
                        </div>
                      )}
                      
                      <div className="event-item-actions-modal">
                        <button 
                          className="btn-small btn-secondary"
                          onClick={() => {
                            onEditEvent(item);
                            onClose();
                          }}
                        >
                          ✏️ Redigér
                        </button>
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => {
                            onDeleteEvent(item);
                            onClose();
                          }}
                        >
                          🗑️ Slet
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;