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
      loadSuppliers();
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

      <div style={{ marginTop: '20px' }}>
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
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Navn</th>
                          <th>Type</th>
                          <th>Kontaktperson</th>
                          <th>Telefon</th>
                          <th>Email</th>
                          <th>CVR</th>
                          <th>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td><strong>{supplier.name}</strong></td>
                            <td>
                              {supplier.type && (
                                <span className="table-badge table-badge-blue">
                                  {supplier.type}
                                </span>
                              )}
                            </td>
                            <td>{supplier.contactPerson || '-'}</td>
                            <td>
                              {supplier.phone ? (
                                <a href={`tel:${supplier.phone}`} className="table-link">
                                  {supplier.phone}
                                </a>
                              ) : '-'}
                            </td>
                            <td>
                              {supplier.email ? (
                                <a href={`mailto:${supplier.email}`} className="table-link">
                                  {supplier.email}
                                </a>
                              ) : '-'}
                            </td>
                            <td>{supplier.cvr || '-'}</td>
                            <td>
                              <div className="table-actions">
                                <button 
                                  className="btn-small btn-secondary"
                                  onClick={() => handleEditSupplier(supplier)}
                                >
                                  Redigér
                                </button>
                                <button 
                                  className="btn-small btn-danger"
                                  onClick={() => handleDeleteSupplier(supplier)}
                                >
                                  Slet
                                </button>
                              </div>
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
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Navn</th>
                          <th>Kategori</th>
                          <th>Enhed</th>
                          <th>Varenr.</th>
                          <th>Standard leverandør</th>
                          <th>Avance</th>
                          <th>Seneste pris</th>
                          <th>Handlinger</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((material) => (
                          <tr key={material.id}>
                            <td><strong>{material.name}</strong></td>
                            <td>
                              <span className="table-badge table-badge-green">
                                {material.category}
                              </span>
                            </td>
                            <td>
                              <span className="table-badge table-badge-orange">
                                {material.unit}
                              </span>
                            </td>
                            <td>{material.sku || '-'}</td>
                            <td>{material.defaultSupplierName || '-'}</td>
                            <td>{material.standardMarkup}%</td>
                            <td>
                              {material.lastPurchasePrice ? (
                                <>
                                  {material.lastPurchasePrice.toFixed(2)} kr
                                  <br />
                                  <small style={{ color: '#7f8c8d' }}>
                                    {new Date(material.lastPurchaseDate).toLocaleDateString('da-DK')}
                                  </small>
                                </>
                              ) : '-'}
                            </td>
                            <td>
                              <div className="table-actions">
                                <button 
                                  className="btn-small btn-secondary"
                                  onClick={() => handleEditMaterial(material)}
                                >
                                  Redigér
                                </button>
                                <button 
                                  className="btn-small btn-danger"
                                  onClick={() => handleDeleteMaterial(material)}
                                >
                                  Slet
                                </button>
                              </div>
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