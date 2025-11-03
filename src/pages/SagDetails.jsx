import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import ProjectModal from '../components/ProjectModal';
import TimeEntryModal from '../components/TimeEntryModal';
import { 
  getProjectTimeEntries, 
  calculateTotalHours, 
  calculateBillableHours, 
  calculateTotalValue 
} from '../utils/projectUtils';
import { formatCurrency, formatDate, formatHours, createMapsUrl, formatPhone } from '../utils/formatUtils';
import FilesTab from '../components/files/FilesTab';

function SagDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [timeEntryModalOpen, setTimeEntryModalOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);
  const [defaultRate, setDefaultRate] = useState(450);
  const [activeTab, setActiveTab] = useState('overblik');

  useEffect(() => {
    loadProject();
    loadTimeEntries();
  }, [id]);

  const loadProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', id));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      } else {
        alert('Sag ikke fundet');
        navigate('/sager');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Der opstod en fejl ved indlæsning af sag.');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const entries = await getProjectTimeEntries(id);
      setTimeEntries(entries);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const handleEditProject = () => {
    setEditModalOpen(true);
  };

  const handleSaveProject = async (formData) => {
    try {
      await updateDoc(doc(db, 'projects', id), {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Admin'
      });
      
      setEditModalOpen(false);
      await loadProject();
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Der opstod en fejl ved opdatering af sag.');
    }
  };

  const handleAddTimeEntry = () => {
    setEditingTimeEntry(null);
    setTimeEntryModalOpen(true);
  };

  const handleEditTimeEntry = (entry) => {
    setEditingTimeEntry(entry);
    setTimeEntryModalOpen(true);
  };

  const handleDeleteTimeEntry = async (entry) => {
    if (window.confirm('Er du sikker på, at du vil slette denne timeregistrering?')) {
      try {
        await deleteDoc(doc(db, 'timeEntries', entry.id));
        await loadTimeEntries();
      } catch (error) {
        console.error('Error deleting time entry:', error);
        alert('Der opstod en fejl ved sletning af timeregistrering.');
      }
    }
  };

  const handleSaveTimeEntry = async (formData) => {
    try {
      if (editingTimeEntry) {
        await updateDoc(doc(db, 'timeEntries', editingTimeEntry.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'timeEntries'), {
          ...formData,
          projectId: id,
          createdAt: new Date().toISOString(),
          createdBy: 'Admin'
        });
      }
      
      setTimeEntryModalOpen(false);
      await loadTimeEntries();
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Der opstod en fejl ved gemning af timeregistrering.');
    }
  };

  const getTypeLabel = (type) => {
    return type === 'fixed-price' ? 'Fast Pris' : 'Tid & Materiale';
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>Indlæser...</h1>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const totalHours = calculateTotalHours(timeEntries);
  const billableHours = calculateBillableHours(timeEntries);
  const totalValue = calculateTotalValue(timeEntries);

  return (
    <div>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/sager')}>
          ← Tilbage til oversigt
        </button>
        <h1>{project.name}</h1>
        <p>Sagsnr. {project.projectNumber}</p>
      </div>

      {/* Tab Navigation */}
      <div className="sag-tabs">
        <button 
          className={`sag-tab ${activeTab === 'overblik' ? 'active' : ''}`}
          onClick={() => setActiveTab('overblik')}
        >
          Overblik
        </button>
        <button 
          className={`sag-tab ${activeTab === 'timeregistrering' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeregistrering')}
        >
          Timeregistrering
        </button>
        <button 
          className={`sag-tab ${activeTab === 'filer' ? 'active' : ''}`}
          onClick={() => setActiveTab('filer')}
        >
          Filer
        </button>
      </div>

      {/* Tab Content */}
      <div className="sag-tab-content">
        {activeTab === 'overblik' && (
          <div className="overblik-tab">
            <div className="sag-grid">
              {/* Project Information Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Sagsoplysninger</h2>
                  <button className="btn-secondary btn-small" onClick={handleEditProject}>
                    Redigér sag
                  </button>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Status:</span>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <div className="info-item">
                      <span className="info-label">Type:</span>
                      <span className="info-value">{getTypeLabel(project.type)}</span>
                    </div>
                    {project.type === 'fixed-price' && (
                      <div className="info-item">
                        <span className="info-label">Fast Pris:</span>
                        <span className="info-value">{formatCurrency(project.fixedPrice)}</span>
                      </div>
                    )}
                    {project.hourlyRate && (
                      <div className="info-item">
                        <span className="info-label">Timepris:</span>
                        <span className="info-value">{formatCurrency(project.hourlyRate)}/time</span>
                      </div>
                    )}
                    {project.estimatedHours && (
                      <div className="info-item">
                        <span className="info-label">Estimeret timer:</span>
                        <span className="info-value">{formatHours(project.estimatedHours)}</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="info-item">
                        <span className="info-label">Startdato:</span>
                        <span className="info-value">{formatDate(project.startDate)}</span>
                      </div>
                    )}
                    {project.endDate && (
                      <div className="info-item">
                        <span className="info-label">Slutdato:</span>
                        <span className="info-value">{formatDate(project.endDate)}</span>
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <div className="info-description">
                      <span className="info-label">Beskrivelse:</span>
                      <p>{project.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Kundeoplysninger</h2>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Navn:</span>
                      <span className="info-value">{project.customerName || '-'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Telefon:</span>
                      {project.customerPhone ? (
                        <a href={`tel:${project.customerPhone}`} className="info-link">
                          {formatPhone(project.customerPhone)}
                        </a>
                      ) : (
                        <span className="info-value">-</span>
                      )}
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      {project.customerEmail ? (
                        <a href={`mailto:${project.customerEmail}`} className="info-link">
                          {project.customerEmail}
                        </a>
                      ) : (
                        <span className="info-value">-</span>
                      )}
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Adresse:</span>
                      {project.address ? (
                        <a 
                          href={createMapsUrl(project.address)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="info-link"
                        >
                          {project.address} 📍
                        </a>
                      ) : (
                        <span className="info-value">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Statistics Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Timestatistik</h2>
                </div>
                <div className="card-body">
                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-value">{formatHours(totalHours)}</div>
                      <div className="stat-label">Totale timer</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{formatHours(billableHours)}</div>
                      <div className="stat-label">Fakturerbare timer</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{formatCurrency(totalValue)}</div>
                      <div className="stat-label">Total værdi</div>
                    </div>
                  </div>
                  {project.type === 'fixed-price' && project.fixedPrice && (
                    <div className="progress-section">
                      <div className="progress-label">
                        <span>Fremskridt</span>
                        <span>{Math.round((totalValue / project.fixedPrice) * 100)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${Math.min((totalValue / project.fixedPrice) * 100, 100)}%`,
                            backgroundColor: totalValue > project.fixedPrice ? '#e74c3c' : '#27ae60'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Card */}
              {timeEntries.length > 0 && (
                <div className="sag-card full-width">
                  <div className="card-header">
                    <h2>Seneste timeregistreringer</h2>
                  </div>
                  <div className="card-body">
                    <table className="time-entries-table">
                      <thead>
                        <tr>
                          <th>Dato</th>
                          <th>Medarbejder</th>
                          <th>Timer</th>
                          <th>Beskrivelse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeEntries.slice(0, 5).map((entry) => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.employeeName}</td>
                            <td>{formatHours(entry.hours)}</td>
                            <td>{entry.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeregistrering' && (
          <div className="timeregistrering-tab">
            <div className="sag-card">
              <div className="card-header">
                <h2>Timeregistreringer</h2>
                <button className="btn-primary" onClick={handleAddTimeEntry}>
                  + Tilføj timer
                </button>
              </div>
              <div className="card-body">
                {timeEntries.length === 0 ? (
                  <div className="empty-state">
                    <p>Ingen timeregistreringer endnu</p>
                    <button className="btn-primary" onClick={handleAddTimeEntry}>
                      Tilføj første timeregistrering
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="time-summary">
                      <div className="summary-item">
                        <span className="summary-label">Totale timer:</span>
                        <span className="summary-value">{formatHours(totalHours)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Fakturerbare timer:</span>
                        <span className="summary-value">{formatHours(billableHours)}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total værdi:</span>
                        <span className="summary-value">{formatCurrency(totalValue)}</span>
                      </div>
                    </div>

                    <table className="time-entries-table">
                      <thead>
                        <tr>
                          <th>Dato</th>
                          <th>Medarbejder</th>
                          <th>Timer</th>
                          <th>Timepris</th>
                          <th>Fakturerbar</th>
                          <th>Værdi</th>
                          <th>Beskrivelse</th>
                          <th>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timeEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{formatDate(entry.date)}</td>
                            <td>{entry.employeeName}</td>
                            <td>{formatHours(entry.hours)}</td>
                            <td>{formatCurrency(entry.hourlyRate)}</td>
                            <td>{entry.billable ? '✓' : '✗'}</td>
                            <td>{entry.billable ? formatCurrency(entry.hours * entry.hourlyRate) : '-'}</td>
                            <td>{entry.description || '-'}</td>
                            <td>
                              <button 
                                className="btn-icon" 
                                onClick={() => handleEditTimeEntry(entry)}
                                title="Redigér"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-icon" 
                                onClick={() => handleDeleteTimeEntry(entry)}
                                title="Slet"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'filer' && (
          <FilesTab 
            project={project} 
            currentUser="Admin"
          />
        )}
      </div>

      {editModalOpen && (
        <ProjectModal
          project={project}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveProject}
        />
      )}

      {timeEntryModalOpen && (
        <TimeEntryModal
          timeEntry={editingTimeEntry}
          defaultRate={defaultRate}
          onClose={() => setTimeEntryModalOpen(false)}
          onSave={handleSaveTimeEntry}
        />
      )}
    </div>
  );
}

export default SagDetails;