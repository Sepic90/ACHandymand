import React, { useState, useEffect } from 'react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '../utils/materialUtils';
import { useNotification } from '../utils/notificationUtils';
import SupplierModal from '../components/SupplierModal';
import MaterialModal from '../components/MaterialModal';

function Materialer() {
  const { showSuccess, showError, showCriticalConfirm } = useNotification();
  
  const [activeTab, setActiveTab] = useState('leverandoerer');
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // Search and filter states
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('all');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCategoryFilter, setMaterialCategoryFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'leverandoerer') {
      loadSuppliers();
    } else if (activeTab === 'katalog') {
      loadMaterials();
      loadSuppliers(); // Need suppliers for material modal
    }
  }, [activeTab]);

  // Filter suppliers when search or filter changes
  useEffect(() => {
    filterSuppliers();
  }, [suppliers, supplierSearch, supplierTypeFilter]);

  // Filter materials when search or filter changes
  useEffect(() => {
    filterMaterials();
  }, [materials, materialSearch, materialCategoryFilter]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const result = await getSuppliers();
      if (result.success) {
        setSuppliers(result.suppliers);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const result = await getMaterials();
      if (result.success) {
        setMaterials(result.materials);
      }
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    // Search filter
    if (supplierSearch.trim()) {
      const searchLower = supplierSearch.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name?.toLowerCase().includes(searchLower) ||
        supplier.contactPerson?.toLowerCase().includes(searchLower) ||
        supplier.phone?.toLowerCase().includes(searchLower) ||
        supplier.email?.toLowerCase().includes(searchLower) ||
        supplier.cvr?.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (supplierTypeFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.type === supplierTypeFilter);
    }

    setFilteredSuppliers(filtered);
  };

  const filterMaterials = () => {
    let filtered = [...materials];

    // Search filter
    if (materialSearch.trim()) {
      const searchLower = materialSearch.toLowerCase();
      filtered = filtered.filter(material =>
        material.name?.toLowerCase().includes(searchLower) ||
        material.sku?.toLowerCase().includes(searchLower) ||
        material.category?.toLowerCase().includes(searchLower) ||
        material.defaultSupplierName?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (materialCategoryFilter !== 'all') {
      filtered = filtered.filter(material => material.category === materialCategoryFilter);
    }

    setFilteredMaterials(filtered);
  };

  // Supplier handlers
  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierModalOpen(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (supplier) => {
    // Count materials linked to this supplier (check all materials, not filtered)
    const linkedMaterials = materials.filter(m => m.defaultSupplierId === supplier.id);
    const linkedCount = linkedMaterials.length;
    
    const confirmed = await showCriticalConfirm({
      title: 'Slet leverandør?',
      message: 'Dette vil permanent slette leverandøren fra systemet.',
      itemName: supplier.name,
      warningText: linkedCount > 0 ? `${linkedCount} materiale${linkedCount > 1 ? 'r' : ''} er knyttet til denne leverandør` : null,
      confirmText: 'Slet Permanent',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      const result = await deleteSupplier(supplier.id);
      if (result.success) {
        showSuccess('Leverandør slettet!');
        await loadSuppliers();
      } else {
        showError('Der opstod en fejl ved sletning af leverandør.');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showError('Der opstod en fejl ved sletning af leverandør.');
    }
  };

  const handleSaveSupplier = async (formData) => {
    try {
      if (editingSupplier) {
        const result = await updateSupplier(editingSupplier.id, formData);
        if (result.success) {
          setSupplierModalOpen(false);
          showSuccess('Leverandør opdateret!');
          await loadSuppliers();
        } else {
          showError('Der opstod en fejl ved opdatering af leverandør.');
        }
      } else {
        const result = await createSupplier(formData);
        if (result.success) {
          setSupplierModalOpen(false);
          showSuccess('Leverandør oprettet!');
          await loadSuppliers();
        } else {
          showError('Der opstod en fejl ved tilføjelse af leverandør.');
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      showError('Der opstod en fejl ved gemning af leverandør.');
    }
  };

  // Material handlers
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialModalOpen(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setMaterialModalOpen(true);
  };

  const handleDeleteMaterial = async (material) => {
    const confirmed = await showCriticalConfirm({
      title: 'Slet materiale?',
      message: 'Dette vil permanent slette materialet fra kataloget.',
      itemName: material.name,
      warningText: material.lastPurchaseDate ? 'Dette materiale har historiske indkøb knyttet til sig' : null,
      confirmText: 'Slet Permanent',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      const result = await deleteMaterial(material.id);
      if (result.success) {
        showSuccess('Materiale slettet!');
        await loadMaterials();
      } else {
        showError('Der opstod en fejl ved sletning af materiale.');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      showError('Der opstod en fejl ved sletning af materiale.');
    }
  };

  const handleSaveMaterial = async (formData) => {
    try {
      if (editingMaterial) {
        const result = await updateMaterial(editingMaterial.id, formData);
        if (result.success) {
          setMaterialModalOpen(false);
          showSuccess('Materiale opdateret!');
          await loadMaterials();
        } else {
          showError('Der opstod en fejl ved opdatering af materiale.');
        }
      } else {
        const result = await createMaterial(formData);
        if (result.success) {
          setMaterialModalOpen(false);
          showSuccess('Materiale oprettet!');
          await loadMaterials();
        } else {
          showError('Der opstod en fejl ved tilføjelse af materiale.');
        }
      }
    } catch (error) {
      console.error('Error saving material:', error);
      showError('Der opstod en fejl ved gemning af materiale.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Materialer</h1>
        <p>Administrer leverandører, materiale-katalog og se indkøbsoversigt</p>
      </div>

      {/* Tab Navigation */}
      <div className="sag-tabs">
        <button 
          className={`sag-tab ${activeTab === 'leverandoerer' ? 'active' : ''}`}
          onClick={() => setActiveTab('leverandoerer')}
        >
          Leverandører
        </button>
        <button 
          className={`sag-tab ${activeTab === 'katalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('katalog')}
        >
          Materiale Katalog
        </button>
        <button 
          className={`sag-tab ${activeTab === 'indkoeb' ? 'active' : ''}`}
          onClick={() => setActiveTab('indkoeb')}
        >
          Alle Indkøb
        </button>
      </div>

      {/* Tab Content */}
      <div className="sag-tab-content">
        {activeTab === 'leverandoerer' && (
          <div className="leverandoerer-tab">
            <div className="sag-card">
              <div className="card-header">
                <h2>Leverandører</h2>
                <button className="btn-primary" onClick={handleAddSupplier}>
                  + Tilføj leverandør
                </button>
              </div>
              <div className="card-body">
                {/* Search and Filter Controls */}
                <div className="sager-controls">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Søg efter leverandør, kontakt, telefon, email eller CVR..."
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-row">
                    <select
                      value={supplierTypeFilter}
                      onChange={(e) => setSupplierTypeFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Alle typer</option>
                      <option value="Byggemarked">Byggemarked</option>
                      <option value="Grossist">Grossist</option>
                      <option value="Specialforhandler">Specialforhandler</option>
                      <option value="Andet">Andet</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <p>Indlæser leverandører...</p>
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="empty-state">
                    <p>
                      {suppliers.length === 0
                        ? 'Ingen leverandører endnu. Tilføj din første leverandør for at komme i gang.'
                        : 'Ingen leverandører matcher din søgning eller filtre.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="sager-table">
                      <thead>
                        <tr>
                          <th>Navn</th>
                          <th>Type</th>
                          <th>Kontaktperson</th>
                          <th>Telefon</th>
                          <th>Email</th>
                          <th>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSuppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td>
                              <strong>{supplier.name}</strong>
                              {supplier.cvr && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  CVR: {supplier.cvr}
                                </div>
                              )}
                            </td>
                            <td>{supplier.type || '-'}</td>
                            <td>{supplier.contactPerson || '-'}</td>
                            <td>
                              {supplier.phone ? (
                                <a href={`tel:${supplier.phone}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                                  {supplier.phone}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>
                              {supplier.email ? (
                                <a href={`mailto:${supplier.email}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                                  {supplier.email}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="btn-icon btn-edit" 
                                onClick={() => handleEditSupplier(supplier)}
                                title="Redigér"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-icon btn-delete" 
                                onClick={() => handleDeleteSupplier(supplier)}
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
            </div>
          </div>
        )}

        {activeTab === 'katalog' && (
          <div className="katalog-tab">
            <div className="sag-card">
              <div className="card-header">
                <h2>Materiale Katalog</h2>
                <button className="btn-primary" onClick={handleAddMaterial}>
                  + Tilføj materiale
                </button>
              </div>
              <div className="card-body">
                {/* Search and Filter Controls */}
                <div className="sager-controls">
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Søg efter materiale, kategori, SKU eller leverandør..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  
                  <div className="filter-row">
                    <select
                      value={materialCategoryFilter}
                      onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">Alle kategorier</option>
                      <option value="Træ">Træ</option>
                      <option value="Gips">Gips</option>
                      <option value="El-materialer">El-materialer</option>
                      <option value="VVS">VVS</option>
                      <option value="Maling">Maling</option>
                      <option value="Værktøj">Værktøj</option>
                      <option value="Diverse">Diverse</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <p>Indlæser materialer...</p>
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="empty-state">
                    <p>
                      {materials.length === 0
                        ? 'Ingen materialer endnu. Tilføj dit første materiale for at komme i gang.'
                        : 'Ingen materialer matcher din søgning eller filtre.'}
                    </p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="sager-table">
                      <thead>
                        <tr>
                          <th>Navn</th>
                          <th>Kategori</th>
                          <th>Enhed</th>
                          <th>Standard leverandør</th>
                          <th>Seneste pris</th>
                          <th>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaterials.map((material) => (
                          <tr key={material.id}>
                            <td>
                              <strong>{material.name}</strong>
                              {material.sku && (
                                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                                  SKU: {material.sku}
                                </div>
                              )}
                            </td>
                            <td>{material.category}</td>
                            <td>{material.unit}</td>
                            <td>{material.defaultSupplierName || '-'}</td>
                            <td>
                              {material.lastPurchasePrice ? (
                                <>
                                  {material.lastPurchasePrice} kr
                                  {material.lastPurchaseDate && (
                                    <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                                      {new Date(material.lastPurchaseDate).toLocaleDateString('da-DK')}
                                    </div>
                                  )}
                                </>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="actions-cell">
                              <button 
                                className="btn-icon btn-edit" 
                                onClick={() => handleEditMaterial(material)}
                                title="Redigér"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-icon btn-delete" 
                                onClick={() => handleDeleteMaterial(material)}
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
            </div>
          </div>
        )}

        {activeTab === 'indkoeb' && (
          <div className="indkoeb-tab">
            <div className="sag-card">
              <div className="card-header">
                <h2>Alle Indkøb</h2>
              </div>
              <div className="card-body">
                <div className="empty-state">
                  <p>Indkøb vises her når du tilføjer materialer til sager</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {supplierModalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => setSupplierModalOpen(false)}
          onSave={handleSaveSupplier}
        />
      )}

      {/* Material Modal */}
      {materialModalOpen && (
        <MaterialModal
          material={editingMaterial}
          suppliers={suppliers}
          onClose={() => setMaterialModalOpen(false)}
          onSave={handleSaveMaterial}
        />
      )}
    </div>
  );
}

export default Materialer;