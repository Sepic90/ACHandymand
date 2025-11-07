import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import ProjectModal from '../components/ProjectModal';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import { getNextProjectNumber, calculateTotalHours, getProjectTimeEntries } from '../utils/projectUtils';
import { formatCurrency } from '../utils/formatUtils';
import { useNotification } from '../utils/notificationUtils';
import { formatFullAddress } from '../utils/postalCodeUtils';

// Color palette for project cards - eye-friendly but dark enough for white text
const CARD_COLORS = [
  '#5B8DBE', // Medium blue
  '#7A9D54', // Olive green
  '#CD7672', // Dusty rose
  '#8B7FB8', // Muted purple
  '#CC8E5E', // Terracotta
  '#5B9D9D', // Teal
  '#9D6B8B', // Mauve
  '#7B8D5B', // Sage green
  '#8B6B5B', // Warm brown
  '#6B7B9D', // Slate blue
  '#9D7B5B', // Sandy brown
  '#6B9D7B', // Forest green
];

// Generate a consistent color based on project ID
const getProjectColor = (projectId) => {
  if (!projectId) return CARD_COLORS[0];
  
  // Simple hash function to get consistent color for same ID
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CARD_COLORS.length;
  return CARD_COLORS[index];
};

function Sager() {
  const navigate = useNavigate();
  const { showSuccess, showError, showCriticalConfirm } = useNotification();

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectHours, setProjectHours] = useState({});
  const [showFilters, setShowFilters] = useState(false);

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
      showError('Hovsa! Kunne ikke indlæse sager. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectHours = async (projectList) => {
    const hoursMap = {};
    for (const project of projectList) {
      const entries = await getProjectTimeEntries(project.id);
      hoursMap[project.id] = calculateTotalHours(entries);
    }
    setProjectHours(hoursMap);
  };

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((project) =>
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.streetAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((project) => project.type === typeFilter);
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

  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        // Update existing project
        await updateDoc(doc(db, 'projects', editingProject.id), projectData);
        showSuccess('Sag opdateret!');
      } else {
        // Create new project with project number
        const currentYear = new Date().getFullYear();
        const nextNumber = await getNextProjectNumber(currentYear);
        await addDoc(collection(db, 'projects'), {
          ...projectData,
          projectNumber: nextNumber,
          createdAt: new Date().toISOString()
        });
        showSuccess('Ny sag oprettet!');
      }
      setModalOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      showError('Hovsa! Kunne ikke gemme sagen. Prøv igen.');
    }
  };

  const handleDeleteProject = async (e, project) => {
    e.stopPropagation();
    
    const hours = projectHours[project.id] || 0;
    
    const confirmed = await showCriticalConfirm({
      title: 'Slet sag permanent?',
      message: 'Dette kan ikke fortrydes. Alle data på sagen vil blive slettet.',
      itemName: `${project.projectNumber} - ${project.name}`,
      warningText: hours > 0 ? `Der er registreret ${hours} timer på denne sag` : null,
      confirmText: 'Slet Permanent',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'projects', project.id));
      showSuccess('Sag slettet!');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      showError('Hovsa! Kunne ikke slette sagen. Prøv igen.');
    }
  };

  const handleProjectClick = (project) => {
    navigate(`/sager/${project.id}`);
  };

  const getTypeLabel = (type) => {
    return type === 'fixed-price' ? 'Fast Pris' : 'Tid & Materiale';
  };

  const getStatusConfig = (status) => {
    const configs = {
      'planned': { color: '#3498db', label: 'Planlagt', icon: '📋' },
      'in-progress': { color: '#27ae60', label: 'I Gang', icon: '🔨' },
      'ready-for-invoice': { color: '#f39c12', label: 'Klar til Faktura', icon: '📄' },
      'closed': { color: '#9b59b6', label: 'Lukket', icon: '✅' }
    };
    return configs[status] || configs['planned'];
  };

  return (
    <div>
      {/* Hero Section with Welcome */}
        <div className="page-header-friendly">
	      <div className="welcome-section">
		    <h1>Hej! Her er dine sager 👋</h1>
		    <p className="welcome-subtitle">Klik på en sag for at se detaljer og timeregistreringer</p>
		    <img 
		      src="/workers.png" 
		      alt="" 
		      className="page-header-clipart clipart-sager"
		      aria-hidden="true"
		    />
	      </div>
	    </div>

      <div className="content-card">
        {/* Search and Filters */}
        <div className="sager-controls-new">
          <div className="search-section">
            <div className="search-box-large">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Skriv kundenavn eller sagsnavn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-large"
              />
            </div>
            <button 
              className="btn-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtre {showFilters ? '▲' : '▼'}
            </button>
            <button className="btn-create-friendly" onClick={handleAddProject}>
              <span className="btn-icon-large">+</span> Opret ny sag
            </button>
          </div>
          
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select-friendly"
                >
                  <option value="all">Alle statusser</option>
                  <option value="planned">📋 Planlagt</option>
                  <option value="in-progress">🔨 I Gang</option>
                  <option value="ready-for-invoice">📄 Klar til Faktura</option>
                  <option value="closed">✅ Lukket</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-select-friendly"
                >
                  <option value="all">Alle typer</option>
                  <option value="fixed-price">Fast Pris</option>
                  <option value="time-material">Tid & Materiale</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Projects Cards */}
        {loading ? (
          <div className="loading-friendly">
            <div className="spinner"></div>
            <p>Henter dine sager...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state-friendly">
            <div className="empty-icon">📁</div>
            <h3>
              {projects.length === 0
                ? 'Ingen sager endnu'
                : 'Ingen sager matcher din søgning'}
            </h3>
            <p>
              {projects.length === 0
                ? 'Klik på "Opret ny sag" for at komme i gang!'
                : 'Prøv at justere dine filtre eller søgning'}
            </p>
            {projects.length === 0 && (
              <button className="btn-create-friendly" onClick={handleAddProject} style={{ marginTop: '20px' }}>
                <span className="btn-icon-large">+</span> Opret din første sag
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((project) => {
              const statusConfig = getStatusConfig(project.status);
              const hours = projectHours[project.id] || 0;
              const cardColor = getProjectColor(project.id);
              
              return (
                <div
                  key={project.id}
                  className="project-card-new"
                  onClick={() => handleProjectClick(project)}
                >
                  {/* Colored Header Block */}
                  <div className="project-card-header-block" style={{ backgroundColor: cardColor }}>
                    <div className="project-card-address-main">
                      <div className="address-street">
                        {project.streetAddress || 'Adresse ikke angivet'}
                      </div>
                      <div className="address-postal">
                        {project.postalCode && project.city 
                          ? `${project.postalCode} ${project.city}`
                          : project.customerAddress || ''}
                      </div>
                    </div>
                    
                    {/* Action buttons in header */}
                    <div className="project-card-actions-new">
                      <button
                        className="card-action-btn-new edit"
                        onClick={(e) => handleEditProject(e, project)}
                        title="Ret sag"
                      >
                        ✏️
                      </button>
                      <button
                        className="card-action-btn-new delete"
                        onClick={(e) => handleDeleteProject(e, project)}
                        title="Slet sag"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Project Name - Below colored block */}
                  <h3 className="project-card-name">{project.name}</h3>

                  {/* Project Information */}
                  <div className="project-card-info">
                    <div className="info-row-new">
                      <span className="info-label">SAGSNR:</span>
                      <span className="info-value">{project.projectNumber}</span>
                    </div>
                    
                    <div className="info-row-new">
                      <span className="info-label">KUNDE:</span>
                      <span className="info-value">{project.customerName || 'Ikke angivet'}</span>
                    </div>
                    
                    <div className="info-row-new">
                      <span className="info-label">TYPE:</span>
                      <span className="info-value">{getTypeLabel(project.type)}</span>
                    </div>
                    
                    <div className="info-row-new">
                      <span className="info-label">STATUS:</span>
                      <span className="status-badge-new" style={{ 
                        backgroundColor: statusConfig.color + '15',
                        color: statusConfig.color,
                        borderColor: statusConfig.color
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="info-row-new">
                      <span className="info-label">TIMER REGISTRERET:</span>
                      <span className="info-value hours-value">{hours} Timer</span>
                    </div>
                  </div>
                </div>
              );
            })}
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