import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
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
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [timeEntryModalOpen, setTimeEntryModalOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);
  const [defaultRate, setDefaultRate] = useState(450);
  const [activeTab, setActiveTab] = useState('overblik');

  useEffect(() => {
    loadProject();
    loadTimeEntries();
    loadEmployees();
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

  const loadEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeeList = [];
      querySnapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() });
      });
      employeeList.sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
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
      const dataToSave = {
        ...formData,
        projectId: id,
        duration: formData.duration,
        hours: formData.duration,
        hourlyRate: formData.rate || 0,
        employeeName: formData.employeeName || 'Ikke angivet',
        activity: formData.activity,
        billable: formData.billable,
        rate: formData.rate || 0
      };

      if (editingTimeEntry) {
        await updateDoc(doc(db, 'timeEntries', editingTimeEntry.id), {
          ...dataToSave,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'timeEntries'), {
          ...dataToSave,
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
            <div className="sag-grid-4col">
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
                        <span className="info-label">Fast pris:</span>
                        <span className="info-value">{formatCurrency(project.fixedPrice)}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="info-label">Oprettet:</span>
                      <span className="info-value">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Beskrivelse:</span>
                      <p className="info-value">{project.description || 'Ingen beskrivelse'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Kundeoplysninger</h2>
                </div>
                <div className="card-body">
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <span className="info-label">Navn:</span>
                      <span className="info-value">{project.customerName}</span>
                    </div>
                    {project.customerPhone && (
                      <div className="info-item">
                        <span className="info-label">Telefon:</span>
                        <a href={`tel:${project.customerPhone}`} className="info-link">
                          {formatPhone(project.customerPhone)}
                        </a>
                      </div>
                    )}
                    {project.customerEmail && (
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <a href={`mailto:${project.customerEmail}`} className="info-link">
                          {project.customerEmail}
                        </a>
                      </div>
                    )}
                    {project.customerAddress && (
                      <div className="info-item full-width">
                        <span className="info-label">Adresse:</span>
                        <a 
                          href={createMapsUrl(project.customerAddress)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="info-link"
                        >
                          {project.customerAddress}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Statistics Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Timestatistik</h2>
                </div>
                <div className="card-body">
                  <div className="stats-grid-vertical">
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

                  {project.type === 'fixed-price' && project.fixedPrice > 0 && (
                    <div className="progress-section">
                      <div className="progress-label">
                        <span>Forbrug</span>
                        <span>{Math.round((totalValue / project.fixedPrice) * 100)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${Math.min((totalValue / project.fixedPrice) * 100, 100)}%`,
                            background: totalValue > project.fixedPrice ? '#e74c3c' : '#27ae60'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Card */}
              <div className="sag-card">
                <div className="card-header">
                  <h2>Seneste timer</h2>
                </div>
                <div className="card-body">
                  {timeEntries.length === 0 ? (
                    <div className="empty-state-small">
                      <p>Ingen timeregistreringer</p>
                    </div>
                  ) : (
                    <div className="recent-entries-list">
                      {timeEntries.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="recent-entry-item">
                          <div className="recent-entry-date">{formatDate(entry.date)}</div>
                          <div className="recent-entry-name">{entry.employeeName || 'Ikke angivet'}</div>
                          <div className="recent-entry-hours">{formatHours(entry.duration || entry.hours || 0)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
                            <td>{entry.employeeName || 'Ikke angivet'}</td>
                            <td>{formatHours(entry.duration || entry.hours || 0)}</td>
                            <td>{formatCurrency(entry.rate || entry.hourlyRate || 0)}</td>
                            <td>{entry.billable ? '✓' : '✗'}</td>
                            <td>{entry.billable ? formatCurrency((entry.duration || entry.hours || 0) * (entry.rate || entry.hourlyRate || 0)) : '-'}</td>
                            <td>{entry.activity || entry.description || '-'}</td>
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
          isOpen={editModalOpen}
          project={project}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveProject}
        />
      )}

      {timeEntryModalOpen && (
        <TimeEntryModal
          timeEntry={editingTimeEntry}
          defaultRate={defaultRate}
          employees={employees}
          onClose={() => setTimeEntryModalOpen(false)}
          onSave={handleSaveTimeEntry}
        />
      )}
    </div>
  );
}

export default SagDetails;