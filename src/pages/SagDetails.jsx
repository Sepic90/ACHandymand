import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, addDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import ProjectModal from '../components/ProjectModal';
import TimeEntryModal from '../components/TimeEntryModal';
import MaterialPurchaseModal from '../components/MaterialPurchaseModal';
import { 
  getProjectTimeEntries, 
  calculateTotalHours, 
  calculateBillableHours, 
  calculateTotalValue 
} from '../utils/projectUtils';
import { 
  getCaseMaterialPurchases,
  calculateTotalPurchaseCost,
  calculateTotalSellingPrice,
  calculateTotalMargin,
  createMaterialPurchase,
  updateMaterialPurchase,
  deleteMaterialPurchase,
  getSuppliers,
  getMaterials
} from '../utils/materialUtils';
import { formatCurrency, formatDate, formatHours, createMapsUrl, formatPhone } from '../utils/formatUtils';
import FilesTab from '../components/files/FilesTab';

function SagDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [materialPurchases, setMaterialPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [timeEntryModalOpen, setTimeEntryModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState(null);
  const [editingMaterialPurchase, setEditingMaterialPurchase] = useState(null);
  const [defaultRate, setDefaultRate] = useState(450);
  const [activeTab, setActiveTab] = useState('oversigt');

  useEffect(() => {
    loadProject();
    loadTimeEntries();
    loadMaterialPurchases();
    loadSuppliers();
    loadMaterials();
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

  const loadMaterialPurchases = async () => {
    try {
      const result = await getCaseMaterialPurchases(id);
      if (result.success) {
        setMaterialPurchases(result.purchases);
      }
    } catch (error) {
      console.error('Error loading material purchases:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const result = await getSuppliers();
      if (result.success) {
        setSuppliers(result.suppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const result = await getMaterials();
      if (result.success) {
        setMaterials(result.materials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
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

  const handleAddMaterial = () => {
    setEditingMaterialPurchase(null);
    setMaterialModalOpen(true);
  };

  const handleEditMaterial = (purchase) => {
    setEditingMaterialPurchase(purchase);
    setMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (purchase) => {
    if (window.confirm('Er du sikker på, at du vil slette dette materiale?')) {
      try {
        const result = await deleteMaterialPurchase(purchase.id);
        if (result.success) {
          await loadMaterialPurchases();
        } else {
          alert('Der opstod en fejl ved sletning af materiale.');
        }
      } catch (error) {
        console.error('Error deleting material:', error);
        alert('Der opstod en fejl ved sletning af materiale.');
      }
    }
  };

  const handleSaveMaterial = async (formData) => {
    try {
      if (editingMaterialPurchase) {
        const result = await updateMaterialPurchase(editingMaterialPurchase.id, formData);
        if (result.success) {
          setMaterialModalOpen(false);
          await loadMaterialPurchases();
        } else {
          alert('Der opstod en fejl ved opdatering af materiale.');
        }
      } else {
        const result = await createMaterialPurchase(formData);
        if (result.success) {
          setMaterialModalOpen(false);
          await loadMaterialPurchases();
        } else {
          alert('Der opstod en fejl ved tilføjelse af materiale.');
        }
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Der opstod en fejl ved gemning af materiale.');
    }
  };

  const getTypeLabel = (type) => {
    return type === 'fixed-price' ? 'Fast Pris' : 'Tid & Materiale';
  };

  const getStatusConfig = (status) => {
    const configs = {
      'planned': { color: '#3498db', label: 'Planlagt' },
      'in-progress': { color: '#27ae60', label: 'I Gang' },
      'ready-for-invoice': { color: '#f39c12', label: 'Klar til Faktura' },
      'closed': { color: '#9b59b6', label: 'Lukket' }
    };
    return configs[status] || configs['planned'];
  };

  if (loading) {
    return (
      <div>
        <div className="page-header-friendly">
          <div className="loading-friendly">
            <div className="spinner"></div>
            <p>Henter sag...</p>
          </div>
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
  
  const totalPurchaseCost = calculateTotalPurchaseCost(materialPurchases);
  const totalSellingPrice = calculateTotalSellingPrice(materialPurchases);
  const totalMaterialMargin = calculateTotalMargin(materialPurchases);

  const statusConfig = getStatusConfig(project.status);

  return (
    <div>
      {/* Friendly Header */}
      <div className="sag-details-header">
        <button className="btn-back-friendly" onClick={() => navigate('/sager')}>
          ← Tilbage til alle sager
        </button>
        <div className="sag-details-title-section">
          <h1 className="sag-details-customer">{project.customerName || 'Kunde ikke angivet'}</h1>
          <p className="sag-details-name">{project.name}</p>
          <div className="sag-details-meta">
            <span className="sag-meta-number">Sagsnr. {project.projectNumber}</span>
            <span className="sag-meta-divider">•</span>
            <span className="sag-meta-status" style={{ 
              backgroundColor: statusConfig.color + '20',
              color: statusConfig.color,
              border: `2px solid ${statusConfig.color}`
            }}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Colorful Tabs with Icons */}
      <div className="sag-tabs-colorful">
        <button 
          className={`sag-tab-colorful tab-blue ${activeTab === 'oversigt' ? 'active' : ''}`}
          onClick={() => setActiveTab('oversigt')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-text">Oversigt</span>
        </button>
        <button 
          className={`sag-tab-colorful tab-green ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          <span className="tab-icon">⏱️</span>
          <span className="tab-text">Timer</span>
        </button>
        <button 
          className={`sag-tab-colorful tab-orange ${activeTab === 'materialer' ? 'active' : ''}`}
          onClick={() => setActiveTab('materialer')}
        >
          <span className="tab-icon">🛠️</span>
          <span className="tab-text">Materialer</span>
        </button>
        <button 
          className={`sag-tab-colorful tab-purple ${activeTab === 'dokumenter' ? 'active' : ''}`}
          onClick={() => setActiveTab('dokumenter')}
        >
          <span className="tab-icon">📁</span>
          <span className="tab-text">Dokumenter</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="sag-tab-content-colorful">
        {activeTab === 'oversigt' && (
          <div className="oversigt-tab-new">
            <div className="sag-sections-grid">
			  <img 
				src="/house.png" 
				alt="" 
				className="page-header-clipart clipart-sagdetails"
				aria-hidden="true"
			  />
			  {/* Section 1: Sagsoplysninger - Blue */}
			  <div className="sag-section-card section-blue">
                <div className="section-header header-blue">
                  <div className="section-header-left">
                    <span className="section-icon">📋</span>
                    <h2>Sagsoplysninger</h2>
                  </div>
                  <button className="btn-section-action" onClick={handleEditProject}>
                    ✏️ Ret
                  </button>
                </div>
                <div className="section-body">
                  <div className="info-row">
                    <span className="info-label-new">Status:</span>
                    <span className="info-badge" style={{ 
                      backgroundColor: statusConfig.color + '20',
                      color: statusConfig.color,
                      border: `2px solid ${statusConfig.color}`
                    }}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label-new">Type:</span>
                    <span className="info-value-new">{getTypeLabel(project.type)}</span>
                  </div>
                  {project.type === 'fixed-price' && (
                    <div className="info-row">
                      <span className="info-label-new">Fast pris:</span>
                      <span className="info-value-new highlight-green">{formatCurrency(project.fixedPrice)}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label-new">Oprettet:</span>
                    <span className="info-value-new">{formatDate(project.createdAt)}</span>
                  </div>
                  {project.description && (
                    <div className="info-row full">
                      <span className="info-label-new">Beskrivelse:</span>
                      <p className="info-description-new">{project.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Kunde - Blue */}
              <div className="sag-section-card section-blue">
                <div className="section-header header-blue">
                  <div className="section-header-left">
                    <span className="section-icon">👤</span>
                    <h2>Kundeoplysninger</h2>
                  </div>
                </div>
                <div className="section-body">
                  <div className="info-row">
                    <span className="info-label-new">Navn:</span>
                    <span className="info-value-new">{project.customerName || 'Ikke angivet'}</span>
                  </div>
                  {project.customerPhone && (
                    <div className="info-row">
                      <span className="info-label-new">Telefon:</span>
                      <a href={`tel:${project.customerPhone}`} className="info-link-new">
                        📞 {formatPhone(project.customerPhone)}
                      </a>
                    </div>
                  )}
                  {project.customerEmail && (
                    <div className="info-row">
                      <span className="info-label-new">Email:</span>
                      <a href={`mailto:${project.customerEmail}`} className="info-link-new">
                        ✉️ {project.customerEmail}
                      </a>
                    </div>
                  )}
                  {project.customerAddress && (
                    <div className="info-row full">
                      <span className="info-label-new">Adresse:</span>
                      <a 
                        href={createMapsUrl(project.customerAddress)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="info-link-new"
                      >
                        📍 {project.customerAddress}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Timer - Green */}
              <div className="sag-section-card section-green">
                <div className="section-header header-green">
                  <div className="section-header-left">
                    <span className="section-icon">⏱️</span>
                    <h2>Timer Status</h2>
                  </div>
                </div>
                <div className="section-body">
                  <div className="stats-compact">
                    <div className="stat-compact">
                      <div className="stat-value-compact">{totalHours.toFixed(1)}</div>
                      <div className="stat-label-compact">I alt arbejdet</div>
                    </div>
                    <div className="stat-compact">
                      <div className="stat-value-compact highlight-green">{billableHours.toFixed(1)}</div>
                      <div className="stat-label-compact">Kan faktureres</div>
                    </div>
                    <div className="stat-compact">
                      <div className="stat-value-compact highlight-green">{formatCurrency(totalValue)}</div>
                      <div className="stat-label-compact">Værdi</div>
                    </div>
                  </div>
                  {timeEntries.length > 0 && (
                    <div className="recent-activity">
                      <p className="recent-label">Seneste registreringer:</p>
                      {timeEntries.slice(0, 3).map((entry, idx) => (
                        <div key={idx} className="recent-item-compact">
                          <span className="recent-date">{formatDate(entry.date)}</span>
                          <span className="recent-name">{entry.employeeName}</span>
                          <span className="recent-hours">{formatHours(entry.duration || entry.hours || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Materialer - Orange */}
              <div className="sag-section-card section-orange">
                <div className="section-header header-orange">
                  <div className="section-header-left">
                    <span className="section-icon">🛠️</span>
                    <h2>Materialer Status</h2>
                  </div>
                </div>
                <div className="section-body">
                  <div className="stats-compact">
                    <div className="stat-compact">
                      <div className="stat-value-compact">{materialPurchases.length}</div>
                      <div className="stat-label-compact">Indkøb</div>
                    </div>
                    <div className="stat-compact">
                      <div className="stat-value-compact">{formatCurrency(totalPurchaseCost)}</div>
                      <div className="stat-label-compact">Indkøbspris</div>
                    </div>
                    <div className="stat-compact">
                      <div className="stat-value-compact">{formatCurrency(totalSellingPrice)}</div>
                      <div className="stat-label-compact">Salgspris</div>
                    </div>
                    <div className="stat-compact">
                      <div 
                        className="stat-value-compact" 
                        style={{ color: totalMaterialMargin >= 0 ? '#27ae60' : '#e74c3c' }}
                      >
                        {formatCurrency(totalMaterialMargin)}
                      </div>
                      <div className="stat-label-compact">Avance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="timer-tab-new">
            <div className="tab-header-section">
              <div className="tab-summary-boxes">
                <div className="summary-box box-green">
                  <div className="summary-icon">⏱️</div>
                  <div className="summary-content">
                    <div className="summary-value">{totalHours.toFixed(1)} timer</div>
                    <div className="summary-label">I alt arbejdet</div>
                  </div>
                </div>
                <div className="summary-box box-green">
                  <div className="summary-icon">✓</div>
                  <div className="summary-content">
                    <div className="summary-value">{billableHours.toFixed(1)} timer</div>
                    <div className="summary-label">Kan faktureres</div>
                  </div>
                </div>
                <div className="summary-box box-green">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <div className="summary-value">{formatCurrency(totalValue)}</div>
                    <div className="summary-label">Total værdi</div>
                  </div>
                </div>
              </div>
              <button className="btn-add-friendly btn-green" onClick={handleAddTimeEntry}>
                <span className="btn-icon-large">+</span> Registrer nye timer
              </button>
            </div>

            <div className="content-table-wrapper">
              {timeEntries.length === 0 ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">⏱️</div>
                  <h3>Ingen timer registreret endnu</h3>
                  <p>Klik på "Registrer nye timer" for at komme i gang</p>
                </div>
              ) : (
                <table className="friendly-table">
                  <thead>
                    <tr>
                      <th>Dato</th>
                      <th>Medarbejder</th>
                      <th>Timer</th>
                      <th>Timepris</th>
                      <th>Fakturerbar</th>
                      <th>Værdi</th>
                      <th>Aktivitet</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td className="employee-cell">{entry.employeeName || 'Ikke angivet'}</td>
                        <td className="hours-cell">{formatHours(entry.duration || entry.hours || 0)}</td>
                        <td>{formatCurrency(entry.rate || entry.hourlyRate || 0)}</td>
                        <td>{entry.billable ? '✓' : '✗'}</td>
                        <td className="value-cell">
                          {entry.billable ? formatCurrency((entry.duration || entry.hours || 0) * (entry.rate || entry.hourlyRate || 0)) : '-'}
                        </td>
                        <td className="activity-cell">{entry.activity || entry.description || '-'}</td>
                        <td className="actions-cell">
                          <button 
                            className="btn-icon-action" 
                            onClick={() => handleEditTimeEntry(entry)}
                            title="Ret"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-action" 
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
              )}
            </div>
          </div>
        )}

        {activeTab === 'materialer' && (
          <div className="materialer-tab-new">
            <div className="tab-header-section">
              <div className="tab-summary-boxes">
                <div className="summary-box box-orange">
                  <div className="summary-icon">📦</div>
                  <div className="summary-content">
                    <div className="summary-value">{materialPurchases.length}</div>
                    <div className="summary-label">Indkøb</div>
                  </div>
                </div>
                <div className="summary-box box-orange">
                  <div className="summary-icon">🛒</div>
                  <div className="summary-content">
                    <div className="summary-value">{formatCurrency(totalPurchaseCost)}</div>
                    <div className="summary-label">Indkøbspris</div>
                  </div>
                </div>
                <div className="summary-box box-orange">
                  <div className="summary-icon">💵</div>
                  <div className="summary-content">
                    <div className="summary-value">{formatCurrency(totalSellingPrice)}</div>
                    <div className="summary-label">Salgspris</div>
                  </div>
                </div>
                <div className={`summary-box ${totalMaterialMargin >= 0 ? 'box-green' : 'box-red'}`}>
                  <div className="summary-icon">{totalMaterialMargin >= 0 ? '📈' : '📉'}</div>
                  <div className="summary-content">
                    <div className="summary-value">{formatCurrency(totalMaterialMargin)}</div>
                    <div className="summary-label">Avance</div>
                  </div>
                </div>
              </div>
              <button className="btn-add-friendly btn-orange" onClick={handleAddMaterial}>
                <span className="btn-icon-large">+</span> Tilføj materiale
              </button>
            </div>

            <div className="content-table-wrapper">
              {materialPurchases.length === 0 ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">🛠️</div>
                  <h3>Ingen materialer endnu</h3>
                  <p>Klik på "Tilføj materiale" for at registrere indkøb</p>
                </div>
              ) : (
                <table className="friendly-table">
                  <thead>
                    <tr>
                      <th>Materiale</th>
                      <th>Leverandør</th>
                      <th>Antal</th>
                      <th>Indkøbspris</th>
                      <th>Salgspris</th>
                      <th>Avance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="material-cell">{purchase.materialName || 'Ikke angivet'}</td>
                        <td>{purchase.supplierName || '-'}</td>
                        <td>{purchase.quantity} {purchase.unit}</td>
                        <td>{formatCurrency(purchase.purchasePrice)}</td>
                        <td>{formatCurrency(purchase.sellingPrice)}</td>
                        <td 
                          className="margin-cell" 
                          style={{ color: (purchase.marginKr || 0) >= 0 ? '#27ae60' : '#e74c3c' }}
                        >
                          {formatCurrency(purchase.marginKr)}
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="btn-icon-action" 
                            onClick={() => handleEditMaterial(purchase)}
                            title="Ret"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-action" 
                            onClick={() => handleDeleteMaterial(purchase)}
                            title="Slet"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dokumenter' && (
          <div className="dokumenter-tab-new">
            <FilesTab 
              project={project} 
              currentUser="Admin"
            />
          </div>
        )}
      </div>

      {/* Modals */}
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

      {materialModalOpen && (
        <MaterialPurchaseModal
          purchase={editingMaterialPurchase}
          project={project}
          suppliers={suppliers}
          materials={materials}
          onClose={() => setMaterialModalOpen(false)}
          onSave={handleSaveMaterial}
        />
      )}
    </div>
  );
}

export default SagDetails;