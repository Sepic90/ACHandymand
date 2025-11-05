import React, { useState, useEffect } from 'react';
import { 
  getSuppliers, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getAllMaterialPurchases,
  deleteMaterialPurchase
} from '../utils/materialUtils';
import { useNotification } from '../utils/notificationUtils';
import SupplierModal from '../components/SupplierModal';
import MaterialModal from '../components/MaterialModal';

function Materialer() {
  const { showSuccess, showError, showCriticalConfirm } = useNotification();
  
  const [activeTab, setActiveTab] = useState('leverandoerer');
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
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
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('all');
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('all');
  
  // Filter visibility states
  const [showSupplierFilters, setShowSupplierFilters] = useState(false);
  const [showMaterialFilters, setShowMaterialFilters] = useState(false);
  const [showPurchaseFilters, setShowPurchaseFilters] = useState(false);

  useEffect(() => {
    if (activeTab === 'leverandoerer') {
      loadSuppliers();
    } else if (activeTab === 'katalog') {
      loadMaterials();
      loadSuppliers(); // Need suppliers for material modal
    } else if (activeTab === 'indkoeb') {
      loadAllPurchases();
      loadSuppliers(); // For filter dropdown
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

  // Filter purchases when search or filter changes
  useEffect(() => {
    filterPurchases();
  }, [allPurchases, purchaseSearch, purchaseSupplierFilter, purchaseCategoryFilter]);

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

  const loadAllPurchases = async () => {
    setLoading(true);
    try {
      const result = await getAllMaterialPurchases();
      if (result.success) {
        setAllPurchases(result.purchases);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
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
        material.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (materialCategoryFilter !== 'all') {
      filtered = filtered.filter(material => material.category === materialCategoryFilter);
    }

    setFilteredMaterials(filtered);
  };

  const filterPurchases = () => {
    let filtered = [...allPurchases];

    // Search filter
    if (purchaseSearch.trim()) {
      const searchLower = purchaseSearch.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.materialName?.toLowerCase().includes(searchLower) ||
        purchase.supplierName?.toLowerCase().includes(searchLower) ||
        purchase.caseName?.toLowerCase().includes(searchLower) ||
        purchase.caseNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Supplier filter
    if (purchaseSupplierFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.supplierId === purchaseSupplierFilter);
    }

    // Category filter
    if (purchaseCategoryFilter !== 'all') {
      filtered = filtered.filter(purchase => purchase.category === purchaseCategoryFilter);
    }

    setFilteredPurchases(filtered);
  };

  // Calculate totals for purchases overview
  const calculatePurchaseTotals = () => {
    const totalPurchaseCost = filteredPurchases.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalSellingPrice = filteredPurchases.reduce((sum, p) => sum + (p.sellingPrice || 0), 0);
    const totalMargin = totalSellingPrice - totalPurchaseCost;

    return { totalPurchaseCost, totalSellingPrice, totalMargin };
  };

  const formatCurrency = (value) => {
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} kr`;
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
    const confirmed = await showCriticalConfirm({
      title: 'Slet leverandør?',
      message: 'Dette vil permanent slette leverandøren.',
      itemName: supplier.name,
      warningText: null,
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

  // Purchase handlers
  const handleDeletePurchase = async (purchase) => {
    const confirmed = await showCriticalConfirm({
      title: 'Slet indkøb?',
      message: 'Dette vil permanent slette indkøbet.',
      itemName: purchase.materialName,
      warningText: `Fra sag: ${purchase.caseName || 'Ukendt sag'}`,
      confirmText: 'Slet Permanent',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      const result = await deleteMaterialPurchase(purchase.id);
      if (result.success) {
        showSuccess('Indkøb slettet!');
        await loadAllPurchases();
      } else {
        showError('Der opstod en fejl ved sletning af indkøb.');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      showError('Der opstod en fejl ved sletning af indkøb.');
    }
  };

  // Get unique categories for filters
  const getUniqueCategories = () => {
    const categories = new Set();
    materials.forEach(m => m.category && categories.add(m.category));
    return Array.from(categories).sort();
  };

  const { totalPurchaseCost, totalSellingPrice, totalMargin } = calculatePurchaseTotals();

  return (
    <div>
      {/* Welcome Section */}
      <div className="welcome-section">
	    <h1>Hej! Her er dine materialer</h1>
	    <p className="helper-text">Administrer leverandører, materialer og hold styr på alle indkøb</p>
	    <img 
	 	  src="/planks.png" 
		  alt="" 
		  className="page-header-clipart clipart-materialer"
		  aria-hidden="true"
	    />
	</div>

      {/* Colorful Tabs with Icons */}
      <div className="sag-tabs-colorful material-tabs">
        <button 
          className={`sag-tab-colorful tab-blue ${activeTab === 'leverandoerer' ? 'active' : ''}`}
          onClick={() => setActiveTab('leverandoerer')}
        >
          <span className="tab-icon">🏪</span>
          <span className="tab-text">Leverandører</span>
        </button>
        <button 
          className={`sag-tab-colorful tab-green ${activeTab === 'katalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('katalog')}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-text">Materiale Katalog</span>
        </button>
        <button 
          className={`sag-tab-colorful tab-orange ${activeTab === 'indkoeb' ? 'active' : ''}`}
          onClick={() => setActiveTab('indkoeb')}
        >
          <span className="tab-icon">🛒</span>
          <span className="tab-text">Alle Indkøb</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {/* LEVERANDØRER TAB */}
        {activeTab === 'leverandoerer' && (
          <div className="tab-section">
            {/* Header Section */}
            <div className="tab-header-section">
              <div>
                <h2 className="tab-title">Dine leverandører</h2>
                <p className="tab-subtitle">Hold styr på kontaktinfo og leverandørdetaljer</p>
              </div>
              <button className="btn-add-friendly btn-blue" onClick={handleAddSupplier}>
                <span className="btn-icon-large">+</span> Ny leverandør
              </button>
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-box-large">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Søg efter navn, kontakt, telefon, email eller CVR..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="search-input-large"
                />
              </div>
              <button 
                className={`btn-filter-toggle ${showSupplierFilters ? 'active' : ''}`}
                onClick={() => setShowSupplierFilters(!showSupplierFilters)}
              >
                Filtre {showSupplierFilters ? '▲' : '▼'}
              </button>
            </div>

            {/* Filter Panel */}
            {showSupplierFilters && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={supplierTypeFilter}
                    onChange={(e) => setSupplierTypeFilter(e.target.value)}
                    className="filter-select-friendly"
                  >
                    <option value="all">Alle typer</option>
                    <option value="Byggemarked">Byggemarked</option>
                    <option value="Grossist">Grossist</option>
                    <option value="Specialforhandler">Specialforhandler</option>
                    <option value="Andet">Andet</option>
                  </select>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="content-table-wrapper">
              {loading ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">⏳</div>
                  <h3>Henter leverandører...</h3>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">🏪</div>
                  <h3>Ingen leverandører {supplierSearch || supplierTypeFilter !== 'all' ? 'matcher din søgning' : 'endnu'}</h3>
                  <p>{supplierSearch || supplierTypeFilter !== 'all' ? 'Prøv en anden søgning' : 'Klik på "Ny leverandør" for at komme i gang'}</p>
                </div>
              ) : (
                <table className="friendly-table">
                  <thead>
                    <tr>
                      <th>Navn</th>
                      <th>Type</th>
                      <th>Kontaktperson</th>
                      <th>Telefon</th>
                      <th>Email</th>
                      <th>CVR</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="supplier-name-cell">
                          <strong>{supplier.name}</strong>
                        </td>
                        <td>
                          <span className="badge-neutral">{supplier.type || '-'}</span>
                        </td>
                        <td>{supplier.contactPerson || '-'}</td>
                        <td>{supplier.phone || '-'}</td>
                        <td>{supplier.email || '-'}</td>
                        <td>{supplier.cvr || '-'}</td>
                        <td className="actions-cell">
                          <button 
                            className="btn-icon-friendly btn-edit" 
                            onClick={() => handleEditSupplier(supplier)}
                            title="Ret"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-friendly btn-delete" 
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
              )}
            </div>
          </div>
        )}

        {/* MATERIALE KATALOG TAB */}
        {activeTab === 'katalog' && (
          <div className="tab-section">
            {/* Header Section */}
            <div className="tab-header-section">
              <div>
                <h2 className="tab-title">Materiale katalog</h2>
                <p className="tab-subtitle">Opret genbrugelige materialer med standardpriser</p>
              </div>
              <button className="btn-add-friendly btn-green" onClick={handleAddMaterial}>
                <span className="btn-icon-large">+</span> Nyt materiale
              </button>
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-box-large">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Søg efter materiale navn eller varenummer..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="search-input-large"
                />
              </div>
              <button 
                className={`btn-filter-toggle ${showMaterialFilters ? 'active' : ''}`}
                onClick={() => setShowMaterialFilters(!showMaterialFilters)}
              >
                Filtre {showMaterialFilters ? '▲' : '▼'}
              </button>
            </div>

            {/* Filter Panel */}
            {showMaterialFilters && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label>Kategori</label>
                  <select
                    value={materialCategoryFilter}
                    onChange={(e) => setMaterialCategoryFilter(e.target.value)}
                    className="filter-select-friendly"
                  >
                    <option value="all">Alle kategorier</option>
                    {getUniqueCategories().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="content-table-wrapper">
              {loading ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">⏳</div>
                  <h3>Henter materialer...</h3>
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">📦</div>
                  <h3>Ingen materialer {materialSearch || materialCategoryFilter !== 'all' ? 'matcher din søgning' : 'endnu'}</h3>
                  <p>{materialSearch || materialCategoryFilter !== 'all' ? 'Prøv en anden søgning' : 'Klik på "Nyt materiale" for at tilføje til kataloget'}</p>
                </div>
              ) : (
                <table className="friendly-table">
                  <thead>
                    <tr>
                      <th>Materiale</th>
                      <th>Varenr.</th>
                      <th>Kategori</th>
                      <th>Enhed</th>
                      <th>Standard avance</th>
                      <th>Seneste pris</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr key={material.id}>
                        <td className="material-name-cell">
                          <strong>{material.name}</strong>
                        </td>
                        <td>{material.sku || '-'}</td>
                        <td>
                          <span className="badge-neutral">{material.category}</span>
                        </td>
                        <td>{material.unit}</td>
                        <td>{material.standardMarkup}%</td>
                        <td>
                          {material.lastPurchasePrice ? (
                            <>
                              {formatCurrency(material.lastPurchasePrice)}
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
                            className="btn-icon-friendly btn-edit" 
                            onClick={() => handleEditMaterial(material)}
                            title="Ret"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-friendly btn-delete" 
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
              )}
            </div>
          </div>
        )}

        {/* ALLE INDKØB TAB */}
        {activeTab === 'indkoeb' && (
          <div className="tab-section">
            {/* Header Section */}
            <div className="tab-header-section">
              <div>
                <h2 className="tab-title">Alle indkøb</h2>
                <p className="tab-subtitle">Oversigt over alle materialeindkøb på tværs af sager</p>
              </div>
            </div>

            {/* Summary Boxes */}
            <div className="tab-summary-boxes">
              <div className="summary-box box-blue">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(totalPurchaseCost)}</div>
                  <div className="summary-label">Indkøbt for</div>
                </div>
              </div>
              <div className="summary-box box-orange">
                <div className="summary-icon">💵</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(totalSellingPrice)}</div>
                  <div className="summary-label">Sælges for</div>
                </div>
              </div>
              <div className={`summary-box ${totalMargin >= 0 ? 'box-green' : 'box-red'}`}>
                <div className="summary-icon">{totalMargin >= 0 ? '📈' : '📉'}</div>
                <div className="summary-content">
                  <div className="summary-value">{formatCurrency(totalMargin)}</div>
                  <div className="summary-label">Total avance</div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-box-large">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Søg efter materiale, leverandør, sag..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="search-input-large"
                />
              </div>
              <button 
                className={`btn-filter-toggle ${showPurchaseFilters ? 'active' : ''}`}
                onClick={() => setShowPurchaseFilters(!showPurchaseFilters)}
              >
                Filtre {showPurchaseFilters ? '▲' : '▼'}
              </button>
            </div>

            {/* Filter Panel */}
            {showPurchaseFilters && (
              <div className="filter-panel">
                <div className="filter-group">
                  <label>Leverandør</label>
                  <select
                    value={purchaseSupplierFilter}
                    onChange={(e) => setPurchaseSupplierFilter(e.target.value)}
                    className="filter-select-friendly"
                  >
                    <option value="all">Alle leverandører</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Kategori</label>
                  <select
                    value={purchaseCategoryFilter}
                    onChange={(e) => setPurchaseCategoryFilter(e.target.value)}
                    className="filter-select-friendly"
                  >
                    <option value="all">Alle kategorier</option>
                    {getUniqueCategories().map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="content-table-wrapper">
              {loading ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">⏳</div>
                  <h3>Henter indkøb...</h3>
                </div>
              ) : filteredPurchases.length === 0 ? (
                <div className="empty-state-friendly">
                  <div className="empty-icon">🛒</div>
                  <h3>Ingen indkøb {purchaseSearch || purchaseSupplierFilter !== 'all' || purchaseCategoryFilter !== 'all' ? 'matcher din søgning' : 'endnu'}</h3>
                  <p>{purchaseSearch || purchaseSupplierFilter !== 'all' || purchaseCategoryFilter !== 'all' ? 'Prøv en anden søgning' : 'Indkøb vises her når du tilføjer materialer til sager'}</p>
                </div>
              ) : (
                <table className="friendly-table">
                  <thead>
                    <tr>
                      <th>Dato</th>
                      <th>Materiale</th>
                      <th>Sag</th>
                      <th>Leverandør</th>
                      <th>Antal</th>
                      <th>Indkøbspris</th>
                      <th>Salgspris</th>
                      <th>Avance</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{new Date(purchase.date).toLocaleDateString('da-DK')}</td>
                        <td className="material-name-cell">
                          <strong>{purchase.materialName}</strong>
                          {purchase.sku && (
                            <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                              {purchase.sku}
                            </div>
                          )}
                        </td>
                        <td>
                          <div>{purchase.caseName || 'Ukendt'}</div>
                          <div style={{ fontSize: '11px', color: '#7f8c8d' }}>
                            {purchase.caseNumber}
                          </div>
                        </td>
                        <td>{purchase.supplierName || '-'}</td>
                        <td>{purchase.quantity} {purchase.unit}</td>
                        <td>{formatCurrency(purchase.purchasePrice)}</td>
                        <td>{formatCurrency(purchase.sellingPrice)}</td>
                        <td 
                          className="margin-cell" 
                          style={{ color: (purchase.marginKr || 0) >= 0 ? '#27ae60' : '#e74c3c' }}
                        >
                          <div>{formatCurrency(purchase.marginKr || 0)}</div>
                          <div style={{ fontSize: '11px' }}>
                            ({(purchase.marginPercent || 0).toFixed(1)}%)
                          </div>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="btn-icon-friendly btn-delete" 
                            onClick={() => handleDeletePurchase(purchase)}
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