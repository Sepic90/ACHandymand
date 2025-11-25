import React, { useState, useEffect } from 'react';
import { useNotification } from '../utils/notificationUtils';

// Existing modals for reuse
import CreateAbsenceModal from './CreateAbsenceModal';
import ViewAbsenceModal from './ViewAbsenceModal';
import CreateOvertimeModal from './CreateOvertimeModal';
import ViewOvertimeModal from './ViewOvertimeModal';
import ViewSHAccumulationModal from './ViewSHAccumulationModal';
import AddCommentModal from './AddCommentModal';

// Firebase imports
import { getEmployeeAbsences } from '../utils/absenceUtils';
import { getEmployeeOvertime } from '../utils/overtimeUtils';
import { getSHAccumulation } from '../utils/shAccumulationUtils';
import { getEmployeeTimesheetComments, deleteTimesheetComment } from '../utils/commentUtils';

function EmployeeAdminModal({ employee, employees, isOpen, onClose }) {
  const { showSuccess, showError, showConfirm } = useNotification();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('oversigt');
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Stats data
  const [stats, setStats] = useState({
    absenceCount: 0,
    overtimeHours: 0,
    shAmount: 0,
    shYear: new Date().getFullYear(),
    commentCount: 0
  });
  
  // Sub-modal states
  const [showCreateAbsence, setShowCreateAbsence] = useState(false);
  const [showViewAbsence, setShowViewAbsence] = useState(false);
  const [showCreateOvertime, setShowCreateOvertime] = useState(false);
  const [showViewOvertime, setShowViewOvertime] = useState(false);
  const [showSHModal, setShowSHModal] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  
  // Comments data for the Bemærkninger tab
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Absences for comment modal (needed for showing absence info)
  const [absencesForComments, setAbsencesForComments] = useState([]);

  // Load statistics when modal opens
  useEffect(() => {
    if (isOpen && employee) {
      loadStats();
    }
  }, [isOpen, employee]);

  // Load comments when tab changes to Bemærkninger
  useEffect(() => {
    if (activeTab === 'bemaerkninger' && employee) {
      loadComments();
    }
  }, [activeTab, employee]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const currentYear = new Date().getFullYear();
      
      // Load absences
      const absencesResult = await getEmployeeAbsences(employee.id);
      const absenceCount = absencesResult.success ? absencesResult.absences.length : 0;
      setAbsencesForComments(absencesResult.success ? absencesResult.absences : []);
      
      // Load overtime
      const overtimeResult = await getEmployeeOvertime(employee.id);
      let overtimeHours = 0;
      if (overtimeResult.success) {
        overtimeHours = overtimeResult.overtime.reduce((sum, ot) => sum + (ot.hours || 0), 0);
      }
      
      // Load SH accumulation for current year
      const shResult = await getSHAccumulation(employee.id, currentYear);
      const shAmount = shResult.success ? (shResult.data?.accumulatedAmount || 0) : 0;
      
      // Load comments
      const commentsResult = await getEmployeeTimesheetComments(employee.id);
      const commentCount = commentsResult.success ? commentsResult.comments.length : 0;
      
      setStats({
        absenceCount,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        shAmount: Math.round(shAmount * 100) / 100,
        shYear: currentYear,
        commentCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const result = await getEmployeeTimesheetComments(employee.id);
      if (result.success) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    const confirmed = await showConfirm({
      title: 'Slet kommentar',
      message: `Er du sikker på at du vil slette kommentaren for ${comment.date}?`,
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      const result = await deleteTimesheetComment(employee.id, comment.date);
      if (result.success) {
        showSuccess('Kommentar slettet!');
        await loadComments();
        await loadStats();
      } else {
        showError('Fejl ved sletning af kommentar.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showError('Fejl ved sletning af kommentar.');
    }
  };

  const handleSubModalSuccess = () => {
    loadStats();
    if (activeTab === 'bemaerkninger') {
      loadComments();
    }
  };

  if (!isOpen || !employee) return null;

  const tabs = [
    { id: 'oversigt', label: 'Oversigt', icon: '📊' },
    { id: 'fravaer', label: 'Fravær', icon: '📅' },
    { id: 'overarbejde', label: 'Overarbejde', icon: '⏰' },
    { id: 'sh', label: 'Søgnehelligdage', icon: '🎄' },
    { id: 'bemaerkninger', label: 'Bemærkninger', icon: '📝' }
  ];

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content employee-admin-modal" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Administrér: {employee.name}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          {/* Tab Navigation */}
          <div className="admin-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="modal-body admin-modal-body">
            {/* OVERSIGT TAB */}
            {activeTab === 'oversigt' && (
              <div className="admin-tab-content">
                <div className="stats-overview">
                  <h3 style={{ marginBottom: '24px', color: '#2c3e50' }}>
                    Overblik for {employee.name}
                  </h3>
                  
                  {loadingStats ? (
                    <div className="loading-stats">
                      <p>Indlæser statistik...</p>
                    </div>
                  ) : (
                    <div className="stats-cards">
                      <div 
                        className="stat-card clickable"
                        onClick={() => setActiveTab('fravaer')}
                      >
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                          <div className="stat-value">{stats.absenceCount}</div>
                          <div className="stat-label">Fraværsregistreringer</div>
                        </div>
                        <div className="stat-arrow">→</div>
                      </div>

                      <div 
                        className="stat-card clickable"
                        onClick={() => setActiveTab('overarbejde')}
                      >
                        <div className="stat-icon">⏰</div>
                        <div className="stat-content">
                          <div className="stat-value">{stats.overtimeHours} timer</div>
                          <div className="stat-label">Overarbejde i alt</div>
                        </div>
                        <div className="stat-arrow">→</div>
                      </div>

                      <div 
                        className="stat-card clickable"
                        onClick={() => setActiveTab('sh')}
                      >
                        <div className="stat-icon">🎄</div>
                        <div className="stat-content">
                          <div className="stat-value">{stats.shAmount.toLocaleString('da-DK')} kr.</div>
                          <div className="stat-label">SH-akkumulering ({stats.shYear})</div>
                        </div>
                        <div className="stat-arrow">→</div>
                      </div>

                      <div 
                        className="stat-card clickable"
                        onClick={() => setActiveTab('bemaerkninger')}
                      >
                        <div className="stat-icon">📝</div>
                        <div className="stat-content">
                          <div className="stat-value">{stats.commentCount}</div>
                          <div className="stat-label">Timeseddelbemærkninger</div>
                        </div>
                        <div className="stat-arrow">→</div>
                      </div>
                    </div>
                  )}

                  {/* Employee Info Summary */}
                  <div className="employee-info-summary">
                    <h4>Medarbejderinformation</h4>
                    <div className="info-grid-compact">
                      <div className="info-item-compact">
                        <span className="info-label">Rolle:</span>
                        <span className="info-value">{employee.role || 'Ikke angivet'}</span>
                      </div>
                      <div className="info-item-compact">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{employee.email || 'Ikke angivet'}</span>
                      </div>
                      <div className="info-item-compact">
                        <span className="info-label">Telefon:</span>
                        <span className="info-value">{employee.phone || 'Ikke angivet'}</span>
                      </div>
                      <div className="info-item-compact">
                        <span className="info-label">Intern timepris:</span>
                        <span className="info-value">
                          {employee.internalHourlyRate 
                            ? `${employee.internalHourlyRate} kr./time` 
                            : 'Ikke angivet'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FRAVÆR TAB */}
            {activeTab === 'fravaer' && (
              <div className="admin-tab-content">
                <div className="tab-header-row">
                  <div>
                    <h3>Fravær</h3>
                    <p className="tab-description">
                      Registrer og administrer fravær for {employee.name}
                    </p>
                  </div>
                </div>

                <div className="action-buttons-grid">
                  <button 
                    className="action-card"
                    onClick={() => setShowCreateAbsence(true)}
                  >
                    <div className="action-icon">➕</div>
                    <div className="action-content">
                      <div className="action-title">Opret fravær</div>
                      <div className="action-description">
                        Registrer nyt fravær (feriedag, sygdom, etc.)
                      </div>
                    </div>
                  </button>

                  <button 
                    className="action-card"
                    onClick={() => setShowViewAbsence(true)}
                  >
                    <div className="action-icon">📅</div>
                    <div className="action-content">
                      <div className="action-title">Se / rediger fravær</div>
                      <div className="action-description">
                        Kalendervisning af alle fraværsregistreringer
                      </div>
                    </div>
                  </button>
                </div>

                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="quick-stat-value">{stats.absenceCount}</span>
                    <span className="quick-stat-label">registreringer i alt</span>
                  </div>
                </div>
              </div>
            )}

            {/* OVERARBEJDE TAB */}
            {activeTab === 'overarbejde' && (
              <div className="admin-tab-content">
                <div className="tab-header-row">
                  <div>
                    <h3>Overarbejde</h3>
                    <p className="tab-description">
                      Registrer og administrer overarbejde for {employee.name}
                    </p>
                  </div>
                </div>

                <div className="action-buttons-grid">
                  <button 
                    className="action-card"
                    onClick={() => setShowCreateOvertime(true)}
                  >
                    <div className="action-icon">➕</div>
                    <div className="action-content">
                      <div className="action-title">Registrer overarbejde</div>
                      <div className="action-description">
                        Tilføj nye overarbejdstimer
                      </div>
                    </div>
                  </button>

                  <button 
                    className="action-card"
                    onClick={() => setShowViewOvertime(true)}
                  >
                    <div className="action-icon">📊</div>
                    <div className="action-content">
                      <div className="action-title">Se / rediger overarbejde</div>
                      <div className="action-description">
                        Kalendervisning af alle overarbejdstimer
                      </div>
                    </div>
                  </button>
                </div>

                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="quick-stat-value">{stats.overtimeHours}</span>
                    <span className="quick-stat-label">timer overarbejde i alt</span>
                  </div>
                </div>
              </div>
            )}

            {/* SØGNEHELLIGDAGE TAB */}
            {activeTab === 'sh' && (
              <div className="admin-tab-content">
                <div className="tab-header-row">
                  <div>
                    <h3>Søgnehelligdage (SH)</h3>
                    <p className="tab-description">
                      14,7% akkumulering for danske helligdage
                    </p>
                  </div>
                </div>

                <div className="sh-summary-card">
                  <div className="sh-summary-header">
                    <span className="sh-year">{stats.shYear}</span>
                    <span className="sh-amount">{stats.shAmount.toLocaleString('da-DK')} kr.</span>
                  </div>
                  <div className="sh-summary-info">
                    <p>
                      SH-beløb akkumuleres automatisk når søgnehelligdage registreres.
                      Beløbet udbetales med decemberløn.
                    </p>
                    {!employee.internalHourlyRate && (
                      <div className="sh-warning">
                        ⚠️ Medarbejderen har ingen intern timepris sat. 
                        SH kan ikke beregnes automatisk.
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowSHModal(true)}
                    style={{ marginTop: '16px' }}
                  >
                    Se alle SH-registreringer
                  </button>
                </div>
              </div>
            )}

            {/* BEMÆRKNINGER TAB */}
            {activeTab === 'bemaerkninger' && (
              <div className="admin-tab-content">
                <div className="tab-header-row">
                  <div>
                    <h3>Timeseddelbemærkninger</h3>
                    <p className="tab-description">
                      Bemærkninger der vises på timesedler i PDF
                    </p>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowAddComment(true)}
                  >
                    + Tilføj bemærkning
                  </button>
                </div>

                {loadingComments ? (
                  <div className="loading-comments">
                    <p>Indlæser bemærkninger...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="empty-comments">
                    <div className="empty-icon">📝</div>
                    <h4>Ingen bemærkninger endnu</h4>
                    <p>
                      Bemærkninger bruges til at tilføje noter på specifikke datoer,
                      som vises i "Afvigelser / Bemærkninger" kolonnen på timesedler.
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowAddComment(true)}
                    >
                      Tilføj første bemærkning
                    </button>
                  </div>
                ) : (
                  <div className="comments-list">
                    {comments.map((comment, index) => (
                      <div key={index} className="comment-item">
                        <div className="comment-date">
                          <span className="date-icon">📅</span>
                          {comment.date}
                        </div>
                        <div className="comment-text">{comment.comment}</div>
                        <div className="comment-actions">
                          <button 
                            className="btn-small btn-secondary"
                            onClick={() => {
                              // Pre-select the date for editing
                              setShowAddComment(true);
                            }}
                          >
                            Rediger
                          </button>
                          <button 
                            className="btn-small btn-danger"
                            onClick={() => handleDeleteComment(comment)}
                          >
                            Slet
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Sub-modals */}
      {showCreateAbsence && (
        <CreateAbsenceModal
          employee={employee}
          employees={employees}
          onClose={() => setShowCreateAbsence(false)}
          onSuccess={() => {
            setShowCreateAbsence(false);
            handleSubModalSuccess();
          }}
        />
      )}

      {showViewAbsence && (
        <ViewAbsenceModal
          employee={employee}
          onClose={() => setShowViewAbsence(false)}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {showCreateOvertime && (
        <CreateOvertimeModal
          employee={employee}
          onClose={() => setShowCreateOvertime(false)}
          onSuccess={() => {
            setShowCreateOvertime(false);
            handleSubModalSuccess();
          }}
        />
      )}

      {showViewOvertime && (
        <ViewOvertimeModal
          employee={employee}
          onClose={() => setShowViewOvertime(false)}
          onSuccess={handleSubModalSuccess}
        />
      )}

      {showSHModal && (
        <ViewSHAccumulationModal
          isOpen={showSHModal}
          onClose={() => setShowSHModal(false)}
          employee={employee}
        />
      )}

      {showAddComment && (
        <AddCommentModal
          isOpen={showAddComment}
          onClose={() => setShowAddComment(false)}
          employee={employee}
          absences={absencesForComments}
          onSuccess={() => {
            setShowAddComment(false);
            handleSubModalSuccess();
          }}
        />
      )}
    </>
  );
}

export default EmployeeAdminModal;