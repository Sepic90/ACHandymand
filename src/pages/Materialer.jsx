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
import SupplierModal from '../components/SupplierModal';
import MaterialModal from '../components/MaterialModal';

function Materialer() {
  const [activeTab, setActiveTab] = useState('leverandoerer');
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);

  useEffect(() => {
    if (activeTab === 'leverandoerer') {
      loadSuppliers();
    } else if (activeTab === 'katalog') {
      loadMaterials();
      loadSuppliers(); // Need suppliers for material modal
    }
  }, [activeTab]);

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
    if (window.confirm(`Er du sikker på, at du vil slette leverandøren "${supplier.name}"?`)) {
      try {
        const result = await deleteSupplier(supplier.id);
        if (result.success) {
          await loadSuppliers();
        } else {
          alert('Der opstod en fejl ved sletning af leverandør.');
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Der opstod en fejl ved sletning af leverandør.');
      }
    }
  };

  const handleSaveSupplier = async (formData) => {
    try {
      if (editingSupplier) {
        const result = await updateSupplier(editingSupplier.id, formData);
        if (result.success) {
          setSupplierModalOpen(false);
          await loadSuppliers();
        } else {
          alert('Der opstod en fejl ved opdatering af leverandør.');
        }
      } else {
        const result = await createSupplier(formData);
        if (result.success) {
          setSupplierModalOpen(false);
          await loadSuppliers();
        } else {
          alert('Der opstod en fejl ved tilføjelse af leverandør.');
        }
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Der opstod en fejl ved gemning af leverandør.');
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
    if (window.confirm(`Er du sikker på, at du vil slette materialet "${material.name}"?`)) {
      try {
        const result = await deleteMaterial(material.id);
        if (result.success) {
          await loadMaterials();
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
      if (editingMaterial) {
        const result = await updateMaterial(editingMaterial.id, formData);
        if (result.success) {
          setMaterialModalOpen(false);
          await loadMaterials();
        } else {
          alert('Der opstod en fejl ved opdatering af materiale.');
        }
      } else {
        const result = await createMaterial(formData);
        if (result.success) {
          setMaterialModalOpen(false);
          await loadMaterials();
        } else {
          alert('Der opstod en fejl ved tilføjelse af materiale.');
        }
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Der opstod en fejl ved gemning af materiale.');
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
                {loading ? (
                  <div className="empty-state">
                    <p>Indlæser leverandører...</p>
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="empty-state">
                    <p>Ingen leverandører endnu</p>
                    <button className="btn-primary" onClick={handleAddSupplier}>
                      + Tilføj første leverandør
                    </button>
                  </div>
                ) : (
                  <div className="suppliers-grid">
                    {suppliers.map((supplier) => (
                      <div key={supplier.id} className="supplier-card">
                        <div className="supplier-card-header">
                          <div>
                            <h3 className="supplier-name">{supplier.name}</h3>
                            {supplier.type && (
                              <span className="supplier-type-badge">{supplier.type}</span>
                            )}
                          </div>
                          <div className="supplier-card-actions">
                            <button 
                              className="btn-icon" 
                              onClick={() => handleEditSupplier(supplier)}
                              title="Redigér"
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleDeleteSupplier(supplier)}
                              title="Slet"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="supplier-card-body">
                          <div className="supplier-info-grid">
                            <div className="supplier-info-item">
                              <span className="supplier-info-label">CVR:</span>
                              <span className="supplier-info-value">{supplier.cvr || '-'}</span>
                            </div>

                            {supplier.customerNumber && (
                              <div className="supplier-info-item">
                                <span className="supplier-info-label">Kundenr:</span>
                                <span className="supplier-info-value">{supplier.customerNumber}</span>
                              </div>
                            )}

                            {supplier.contactPerson && (
                              <div className="supplier-info-item">
                                <span className="supplier-info-label">Kontakt:</span>
                                <span className="supplier-info-value">{supplier.contactPerson}</span>
                              </div>
                            )}

                            {supplier.phone && (
                              <div className="supplier-info-item">
                                <span className="supplier-info-label">Telefon:</span>
                                <a href={`tel:${supplier.phone}`} className="supplier-info-link">
                                  {supplier.phone}
                                </a>
                              </div>
                            )}

                            {supplier.email && (
                              <div className="supplier-info-item">
                                <span className="supplier-info-label">Email:</span>
                                <a href={`mailto:${supplier.email}`} className="supplier-info-link">
                                  {supplier.email}
                                </a>
                              </div>
                            )}

                            {supplier.address && (
                              <div className="supplier-info-item full-width">
                                <span className="supplier-info-label">Adresse:</span>
                                <span className="supplier-info-value">{supplier.address}</span>
                              </div>
                            )}

                            {supplier.preferredPaymentMethod && (
                              <div className="supplier-info-item">
                                <span className="supplier-info-label">Betaling:</span>
                                <span className="supplier-info-value">{supplier.preferredPaymentMethod}</span>
                              </div>
                            )}

                            {supplier.notes && (
                              <div className="supplier-info-item full-width">
                                <span className="supplier-info-label">Noter:</span>
                                <span className="supplier-info-value">{supplier.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                {loading ? (
                  <div className="empty-state">
                    <p>Indlæser materialer...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="empty-state">
                    <p>Ingen materialer i kataloget endnu</p>
                    <button className="btn-primary" onClick={handleAddMaterial}>
                      + Tilføj første materiale
                    </button>
                  </div>
                ) : (
                  <div className="materials-grid">
                    {materials.map((material) => (
                      <div key={material.id} className="material-card">
                        <div className="material-card-header">
                          <div>
                            <h3 className="material-name">{material.name}</h3>
                            <div className="material-meta">
                              <span className="material-category-badge">{material.category}</span>
                              <span className="material-unit-badge">{material.unit}</span>
                            </div>
                          </div>
                          <div className="material-card-actions">
                            <button 
                              className="btn-icon" 
                              onClick={() => handleEditMaterial(material)}
                              title="Redigér"
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-icon" 
                              onClick={() => handleDeleteMaterial(material)}
                              title="Slet"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="material-card-body">
                          <div className="material-info-grid">
                            {material.sku && (
                              <div className="material-info-item">
                                <span className="material-info-label">Varenr:</span>
                                <span className="material-info-value">{material.sku}</span>
                              </div>
                            )}

                            {material.defaultSupplierName && (
                              <div className="material-info-item">
                                <span className="material-info-label">Standard leverandør:</span>
                                <span className="material-info-value">{material.defaultSupplierName}</span>
                              </div>
                            )}

                            <div className="material-info-item">
                              <span className="material-info-label">Standard avance:</span>
                              <span className="material-info-value">{material.standardMarkup}%</span>
                            </div>

                            {material.lastPurchasePrice && (
                              <>
                                <div className="material-info-item">
                                  <span className="material-info-label">Seneste indkøbspris:</span>
                                  <span className="material-info-value">
                                    {material.lastPurchasePrice.toFixed(2)} kr / {material.unit}
                                  </span>
                                </div>
                                <div className="material-info-item">
                                  <span className="material-info-label">Seneste indkøb:</span>
                                  <span className="material-info-value">
                                    {new Date(material.lastPurchaseDate).toLocaleDateString('da-DK')}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <p>Indkøbsoversigt kommer snart...</p>
                  <small style={{ color: '#7f8c8d', marginTop: '10px', display: 'block' }}>
                    Her kan du se alle materialeindkøb på tværs af alle sager
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {supplierModalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => setSupplierModalOpen(false)}
          onSave={handleSaveSupplier}
        />
      )}

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