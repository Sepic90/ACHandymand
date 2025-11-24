import React, { useState, useEffect } from 'react';
import { 
  getSHAccumulation, 
  deleteSHEntry, 
  markSHAsPaidOut, 
  unmarkSHAsPaidOut 
} from '../utils/shAccumulationUtils';
import { useNotification } from '../utils/notificationUtils';
import AddManualSHEntryModal from './AddManualSHEntryModal';
import EditSHEntryModal from './EditSHEntryModal';

function ViewSHAccumulationModal({ isOpen, onClose, employee }) {
  const { showSuccess, showError, showConfirm } = useNotification();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [accumulation, setAccumulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    if (isOpen && employee) {
      loadAccumulation();
    }
  }, [isOpen, employee, selectedYear]);

  const loadAccumulation = async () => {
    setLoading(true);
    try {
      const result = await getSHAccumulation(employee.id, selectedYear);
      if (result.success) {
        setAccumulation(result.data);
      } else {
        showError('Fejl ved indlæsning af SH-akkumulering.');
      }
    } catch (error) {
      console.error('Error loading SH accumulation:', error);
      showError('Fejl ved indlæsning af SH-akkumulering.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entry) => {
    const confirmed = await showConfirm({
      title: 'Slet SH-registrering',
      message: `Er du sikker på at du vil slette registreringen for ${entry.holidayName} (${entry.date})?`,
      confirmText: 'Slet',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      const result = await deleteSHEntry(employee.id, selectedYear, entry.date);
      if (result.success) {
        showSuccess('SH-registrering slettet!');
        await loadAccumulation();
      } else {
        showError('Fejl ved sletning af SH-registrering.');
      }
    } catch (error) {
      console.error('Error deleting SH entry:', error);
      showError('Fejl ved sletning af SH-registrering.');
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleTogglePaidOut = async () => {
    if (!accumulation) return;

    try {
      if (accumulation.isPaidOut) {
        const result = await unmarkSHAsPaidOut(employee.id, selectedYear);
        if (result.success) {
          showSuccess('Markering fjernet - SH er ikke længere markeret som udbetalt.');
          await loadAccumulation();
        } else {
          showError('Fejl ved fjernelse af udbetalt-markering.');
        }
      } else {
        const confirmed = await showConfirm({
          title: 'Markér som udbetalt',
          message: `Markér ${selectedYear} SH-akkumulering som udbetalt? Dette låser ikke dataene, men viser at beløbet er udbetalt med decemberløn.`,
          confirmText: 'Markér som udbetalt',
          cancelText: 'Annuller'
        });

        if (!confirmed) return;

        const result = await markSHAsPaidOut(employee.id, selectedYear);
        if (result.success) {
          showSuccess('SH-akkumulering markeret som udbetalt!');
          await loadAccumulation();
        } else {
          showError('Fejl ved markering af udbetaling.');
        }
      }
    } catch (error) {
      console.error('Error toggling paidOut status:', error);
      showError('Fejl ved ændring af udbetalingsstatus.');
    }
  };

  const handleEntryAdded = () => {
    setShowAddModal(false);
    loadAccumulation();
  };

  const handleEntryUpdated = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    loadAccumulation();
  };

  if (!isOpen) return null;

  const entries = accumulation?.entries || [];
  const totalAmount = accumulation?.accumulatedAmount || 0;
  const isPaidOut = accumulation?.isPaidOut || false;

  // Sort entries by date (most recent first)
  const sortedEntries = [...entries].sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/');
    const [dayB, monthB, yearB] = b.date.split('/');
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB - dateA;
  });

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="modal-content" 
          style={{ maxWidth: '900px', maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>💰 Søgnehelligdage - {employee.name}</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>

          <div className="modal-body" style={{ maxHeight: 'calc(85vh - 140px)', overflowY: 'auto' }}>
            {/* Year Selector and Summary */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: '600', color: '#2c3e50' }}>År:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '15px',
                    fontWeight: '500'
                  }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '4px' }}>
                  Total akkumuleret
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: totalAmount > 0 ? '#27ae60' : '#95a5a6'
                }}>
                  {totalAmount.toFixed(2).replace('.', ',')} kr.
                </div>
              </div>
            </div>

            {/* Payout Status */}
            {totalAmount > 0 && (
              <div style={{
                marginBottom: '20px',
                padding: '12px 15px',
                backgroundColor: isPaidOut ? '#d4edda' : '#fff3cd',
                border: `1px solid ${isPaidOut ? '#c3e6cb' : '#ffeaa7'}`,
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  {isPaidOut ? (
                    <>
                      <strong style={{ color: '#155724' }}>✓ Udbetalt</strong>
                      <div style={{ fontSize: '13px', color: '#155724', marginTop: '4px' }}>
                        Dette beløb er markeret som udbetalt med decemberløn
                      </div>
                    </>
                  ) : (
                    <>
                      <strong style={{ color: '#856404' }}>⏳ Afventer udbetaling</strong>
                      <div style={{ fontSize: '13px', color: '#856404', marginTop: '4px' }}>
                        Skal udbetales med decemberløn {selectedYear}
                      </div>
                    </>
                  )}
                </div>
                <button
                  className={isPaidOut ? 'btn-secondary' : 'btn-primary'}
                  onClick={handleTogglePaidOut}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isPaidOut ? 'Fjern markering' : 'Markér som udbetalt'}
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginBottom: '20px' }}>
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
                disabled={isPaidOut}
                style={{ opacity: isPaidOut ? 0.5 : 1 }}
              >
                + Tilføj manuel SH-registrering
              </button>
              {isPaidOut && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#e74c3c', 
                  marginTop: '8px' 
                }}>
                  Fjern "udbetalt" markeringen for at tilføje eller redigere registreringer
                </div>
              )}
            </div>

            {/* Entries Table */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                <p>Indlæser SH-registreringer...</p>
              </div>
            ) : sortedEntries.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                color: '#7f8c8d' 
              }}>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Ingen SH-registreringer for {selectedYear}
                </p>
                <p style={{ fontSize: '14px' }}>
                  SH bliver automatisk registreret når du markerer fravær som "Søgnehelligdag"
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px'
                }}>
                  <thead>
                    <tr style={{ 
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #dee2e6'
                    }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Dato</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Helligdag</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Timer</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Timepris</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Beløb (14,7%)</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry, index) => (
                      <tr 
                        key={index}
                        style={{ 
                          borderBottom: '1px solid #dee2e6',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }}
                      >
                        <td style={{ padding: '12px' }}>{entry.date}</td>
                        <td style={{ padding: '12px', fontWeight: '500' }}>
                          {entry.holidayName}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#7f8c8d' }}>
                          {entry.dailyHours} t
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#7f8c8d' }}>
                          {entry.hourlyRate} kr.
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#27ae60'
                        }}>
                          {entry.amount.toFixed(2).replace('.', ',')} kr.
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditEntry(entry)}
                            disabled={isPaidOut}
                            style={{ 
                              marginRight: '5px',
                              opacity: isPaidOut ? 0.5 : 1,
                              cursor: isPaidOut ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Redigér
                          </button>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleDeleteEntry(entry)}
                            disabled={isPaidOut}
                            style={{ 
                              opacity: isPaidOut ? 0.5 : 1,
                              cursor: isPaidOut ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Slet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Info Box */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#004085'
            }}>
              <strong>ℹ️ Om SH-beregning:</strong>
              <ul style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
                <li>Medarbejdere får 14,7% af deres daglige løn for hver søgnehelligdag</li>
                <li>Mandag-Torsdag: 7,5 timer × timepris × 14,7%</li>
                <li>Fredag: 7 timer × timepris × 14,7%</li>
                <li>Beløbet akkumuleres gennem året og udbetales med decemberløn</li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              Luk
            </button>
          </div>
        </div>
      </div>

      {/* Add Manual Entry Modal */}
      {showAddModal && (
        <AddManualSHEntryModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          employee={employee}
          year={selectedYear}
          onSuccess={handleEntryAdded}
        />
      )}

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <EditSHEntryModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          employee={employee}
          year={selectedYear}
          entry={editingEntry}
          onSuccess={handleEntryUpdated}
        />
      )}
    </>
  );
}

export default ViewSHAccumulationModal;