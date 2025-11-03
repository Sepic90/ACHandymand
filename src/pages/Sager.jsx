import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import ProjectModal from '../components/ProjectModal';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import { getNextProjectNumber, calculateTotalHours, getProjectTimeEntries } from '../utils/projectUtils';
import { formatCurrency } from '../utils/formatUtils';
import { useNotification } from '../utils/notificationUtils';

function Sager() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning, showConfirm } = useNotification();

  const testNotifications = async () => {
    showSuccess('Success! Dette er en success besked');
    setTimeout(() => showError('Error! Dette er en fejlbesked'), 1000);
    setTimeout(() => showInfo('Info! Dette er en info besked'), 2000);
    setTimeout(() => showWarning('Warning! Dette er en advarsel'), 3000);
    setTimeout(async () => {
      const confirmed = await showConfirm({
        title: 'Test Bekræftelse',
        message: 'Vil du teste bekræftelsesdialogen?',
        confirmText: 'Ja, test den!',
        cancelText: 'Nej tak'
      });
      if (confirmed) {
        showSuccess('Du klikked bekræft!');
      } else {
        showInfo('Du klikked annuller!');
      }
    }, 4000);
  };
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectHours, setProjectHours] = useState({});

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter, typeFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projectList = [];
      
      querySnapshot.forEach((doc) => {
        projectList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by project number (newest first)
      projectList.sort((a, b) => {
        if (b.projectNumber && a.projectNumber) {
          return b.projectNumber.localeCompare(a.projectNumber);
        }
        return 0;
      });
      
      setProjects(projectList);
      
      // Load hours for each project
      loadProjectHours(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
      alert('Der opstod en fejl ved indlæsning af sager.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectHours = async (projectList) => {
    const hoursData = {};
    
    for (const project of projectList) {
      try {
        const timeEntries = await getProjectTimeEntries(project.id);
        hoursData[project.id] = calculateTotalHours(timeEntries);
      } catch (error) {
        console.error(`Error loading hours for project ${project.id}:`, error);
        hoursData[project.id] = 0;
      }
    }
    
    setProjectHours(hoursData);
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        (project.name && project.name.toLowerCase().includes(term)) ||
        (project.customerName && project.customerName.toLowerCase().includes(term)) ||
        (project.projectNumber && project.projectNumber.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(project => project.type === typeFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleDeleteProject = async (e, project) => {
    e.stopPropagation();
    
    if (window.confirm(`Er du sikker på, at du vil slette sagen "${project.name}"?\n\nDette vil også slette alle tilknyttede timer.`)) {
      try {
        // Delete all time entries for this project
        const timeEntries = await getProjectTimeEntries(project.id);
        for (const entry of timeEntries) {
          await deleteDoc(doc(db, 'timeEntries', entry.id));
        }
        
        // Delete the project
        await deleteDoc(doc(db, 'projects', project.id));
        await loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Der opstod en fejl ved sletning af sag.');
      }
    }
  };

  const handleSaveProject = async (formData) => {
    try {
      const currentUser = 'Admin'; // In future, get from auth context
      
      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, 'projects', editingProject.id), {
          ...formData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser
        });
      } else {
        // Create new project
        const projectNumber = await getNextProjectNumber(new Date().getFullYear());
        
        await addDoc(collection(db, 'projects'), {
          ...formData,
          projectNumber,
          assignedTo: currentUser,
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser
        });
      }
      
      setModalOpen(false);
      await loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Der opstod en fejl ved gemning af sag.');
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/sager/${project.id}`);
  };

  const getTypeLabel = (type) => {
    return type === 'fixed-price' ? 'Fast Pris' : 'Tid & Materiale';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Sager</h1>
        <p>Administrér projekter og timeregistrering</p>
      </div>

      <button onClick={testNotifications} className="btn-primary" style={{ margin: '20px' }}>
        🧪 Test Notifications
      </button>

      <div className="content-card">
        {/* Search and Filters */}
        <div className="sager-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Søg efter sagsnavn, kunde eller sagsnummer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-row">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle statusser</option>
              <option value="planned">Planlagt</option>
              <option value="in-progress">I Gang</option>
              <option value="ready-for-invoice">Klar til Faktura</option>
              <option value="closed">Lukket</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Alle typer</option>
              <option value="fixed-price">Fast Pris</option>
              <option value="time-material">Tid & Materiale</option>
            </select>
          </div>

          <button className="btn-create-new" onClick={handleAddProject}>
            ✨ Opret ny sag
          </button>
        </div>

        {/* Projects Table */}
        {loading ? (
          <p>Indlæser sager...</p>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <p>
              {projects.length === 0
                ? 'Ingen sager endnu. Opret din første sag for at komme i gang.'
                : 'Ingen sager matcher din søgning eller filtre.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="sager-table">
              <thead>
                <tr>
                  <th>Sagsnr.</th>
                  <th>Navn</th>
                  <th>Kunde</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Timer</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    onClick={() => handleProjectClick(project)}
                    className="clickable-row"
                  >
                    <td className="project-number">{project.projectNumber}</td>
                    <td className="project-name">{project.name}</td>
                    <td>{project.customerName || '-'}</td>
                    <td>{getTypeLabel(project.type)}</td>
                    <td>
                      <ProjectStatusBadge status={project.status} />
                    </td>
                    <td>{projectHours[project.id] || 0} timer</td>
                    <td className="actions-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={(e) => handleEditProject(e, project)}
                        title="Redigér"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => handleDeleteProject(e, project)}
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

      {/* Project Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveProject}
        project={editingProject}
      />
    </div>
  );
}

export default Sager;