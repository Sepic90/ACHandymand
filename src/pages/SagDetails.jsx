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
        // Update existing time entry
        await updateDoc(doc(db, 'timeEntries', editingTimeEntry.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new time entry
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

      {/* Project Information */}
      <div className="content-card">
        <div className="card-header">
          <h2>Sagsinformation</h2>
          <button className="btn-secondary" onClick={handleEditProject}>
            Redigér Sag
          </button>
        </div>

        <div className="project-info-grid">
          <div className="info-item">
            <label>Status</label>
            <div><ProjectStatusBadge status={project.status} /></div>
          </div>

          <div className="info-item">
            <label>Type</label>
            <div>{getTypeLabel(project.type)}</div>
          </div>

          <div className="info-item">
            <label>Kunde</label>
            <div>{project.customerName || '-'}</div>
          </div>

          <div className="info-item">
            <label>Telefon</label>
            <div>{project.customerPhone ? formatPhone(project.customerPhone) : '-'}</div>
          </div>

          <div className="info-item">
            <label>Email</label>
            <div>{project.customerEmail || '-'}</div>
          </div>

          <div className="info-item">
            <label>Adresse</label>
            <div>
              {project.address ? (
                <a 
                  href={createMapsUrl(project.address)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="maps-link"
                >
                  {project.address} 🗺️
                </a>
              ) : '-'}
            </div>
          </div>

          <div className="info-item">
            <label>Tildelt til</label>
            <div>{project.assignedTo || '-'}</div>
          </div>

          <div className="info-item">
            <label>Oprettet</label>
            <div>{formatDate(project.createdAt)}</div>
          </div>
        </div>
      </div>
	  
      {/* Files Tab */}
      <div className="content-card">
        <div className="card-header">
          <h2>Filer</h2>
        </div>
        <FilesTab project={project} currentUser="Admin" />
      </div>
      {/* Time Entries Summary */}
      <div className="content-card">
        <div className="card-header">
          <h2>Timeregistrering</h2>
          <button className="btn-primary" onClick={handleAddTimeEntry}>
            + Tilføj Timer
          </button>
        </div>

        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Timer</label>
            <div className="summary-value">{formatHours(totalHours)}</div>
          </div>

          <div className="summary-item">
            <label>Fakturerbare Timer</label>
            <div className="summary-value">{formatHours(billableHours)}</div>
          </div>

          <div className="summary-item">
            <label>Total Værdi</label>
            <div className="summary-value">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        {/* Time Entries Table */}
        {timeEntries.length === 0 ? (
          <div className="empty-state">
            <p>Ingen timer registreret endnu. Tilføj den første timeregistrering for at komme i gang.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="time-entries-table">
              <thead>
                <tr>
                  <th>Dato</th>
                  <th>Timer</th>
                  <th>Aktivitet</th>
                  <th>Fakturerbar</th>
                  <th>Timepris</th>
                  <th>Total</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{formatHours(entry.duration)}</td>
                    <td className="activity-cell">{entry.activity}</td>
                    <td>
                      <span className={`billable-badge ${entry.billable ? 'yes' : 'no'}`}>
                        {entry.billable ? 'Ja' : 'Nej'}
                      </span>
                    </td>
                    <td>{formatCurrency(entry.rate)}</td>
                    <td><strong>{formatCurrency(entry.duration * entry.rate)}</strong></td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditTimeEntry(entry)}
                        title="Redigér"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
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
          </div>
        )}
      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveProject}
        project={project}
      />

      <TimeEntryModal
        isOpen={timeEntryModalOpen}
        onClose={() => setTimeEntryModalOpen(false)}
        onSave={handleSaveTimeEntry}
        timeEntry={editingTimeEntry}
        defaultRate={defaultRate}
      />
    </div>
  );
}

export default SagDetails;