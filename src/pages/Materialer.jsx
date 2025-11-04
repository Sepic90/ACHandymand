import React, { useState, useEffect } from 'react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} from '../utils/materialUtils';
import SupplierModal from '../components/SupplierModal';

function Materialer() {
  const [activeTab, setActiveTab] = useState('leverandoerer');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    if (activeTab === 'leverandoerer') {
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
                <button className="btn-primary" disabled>
                  + Tilføj materiale
                </button>
              </div>
              <div className="card-body">
                <div className="empty-state">
                  <p>Materiale katalog kommer snart...</p>
                  <small style={{ color: '#7f8c8d', marginTop: '10px', display: 'block' }}>
                    Her kan du oprette genbrugelige materialer med standardpriser og avancer
                  </small>
                </div>
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
    </div>
  );
}

export default Materialer;