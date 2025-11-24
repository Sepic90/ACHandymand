import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNotification } from '../utils/notificationUtils';
import EmployeeModal from '../components/EmployeeModal';

function Indstillinger() {
  const { showSuccess, showError, showCriticalConfirm } = useNotification();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [defaultRate, setDefaultRate] = useState(450);
  const [editingRate, setEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(450);

  useEffect(() => {
    loadSettings();
    loadEmployees();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'hourlyRates'));
      if (settingsDoc.exists()) {
        const rate = settingsDoc.data().defaultRate || 450;
        setDefaultRate(rate);
        setTempRate(rate);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
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
      showError('Der opstod en fejl ved indlæsning af medarbejdere.');
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultRate = async () => {
    try {
      const rateValue = parseFloat(tempRate);
      if (isNaN(rateValue) || rateValue <= 0) {
        showError('Indtast venligst en gyldig timepris.');
        return;
      }

      await setDoc(doc(db, 'settings', 'hourlyRates'), {
        defaultRate: rateValue,
        updatedAt: new Date().toISOString()
      });
      
      setDefaultRate(rateValue);
      setEditingRate(false);
      showSuccess('Timepris gemt!');
    } catch (error) {
      console.error('Error saving default rate:', error);
      showError('Der opstod en fejl ved gemning af timepris.');
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setModalOpen(true);
  };

  const handleDeleteEmployee = async (employee) => {
    const confirmed = await showCriticalConfirm({
      title: 'Slet medarbejder?',
      message: 'Dette vil permanent slette medarbejderen fra systemet.',
      itemName: employee.name,
      warningText: 'Historiske timeregistreringer vil stadig være synlige, men medarbejderen kan ikke vælges fremadrettet',
      confirmText: 'Slet Permanent',
      cancelText: 'Annuller'
    });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'employees', employee.id));
      showSuccess('Medarbejder slettet!');
      await loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      showError('Der opstod en fejl ved sletning af medarbejder.');
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        // Update existing employee - spread all data to include internalHourlyRate
        await updateDoc(doc(db, 'employees', editingEmployee.id), {
          ...employeeData,
          updatedAt: new Date().toISOString()
        });
        showSuccess('Medarbejder opdateret!');
      } else {
        // Create new employee - spread all data to include internalHourlyRate
        await addDoc(collection(db, 'employees'), { 
          ...employeeData,
          createdAt: new Date().toISOString()
        });
        showSuccess('Medarbejder oprettet!');
      }
      
      setModalOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Der opstod en fejl ved gemning af medarbejder.');
    }
  };

  return (
    <div>
      <div className="page-header">
	    <h1>Indstillinger</h1>
	    <p>Administrér medarbejdere og priser</p>
	    <img 
		  src="/admin.png" 
		  alt="" 
		  className="page-header-clipart clipart-indstillinger"
		  aria-hidden="true"
	    />
	  </div>

      {/* Standard Timepris */}
      <div className="content-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#2c3e50' }}>Standard Timepris</h2>
        
        {editingRate ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
              style={{ 
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                width: '150px'
              }}
              autoFocus
            />
            <button className="btn-primary" onClick={saveDefaultRate}>
              Gem
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setEditingRate(false);
                setTempRate(defaultRate);
              }}
            >
              Annuller
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>
              {defaultRate} kr./time
            </span>
            <button className="btn-secondary" onClick={() => setEditingRate(true)}>
              Redigér
            </button>
          </div>
        )}
        
        <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '14px' }}>
          Denne timepris bruges som standard når nye sager oprettes.
        </p>
      </div>

      {/* Medarbejdere */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', color: '#2c3e50', margin: 0 }}>Medarbejdere</h2>
          <button className="btn-primary" onClick={handleAddEmployee}>
            + Tilføj medarbejder
          </button>
        </div>

        {loading ? (
          <p>Indlæser medarbejdere...</p>
        ) : employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <p>Ingen medarbejdere tilføjet endnu.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ecf0f1' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#2c3e50', fontWeight: '600' }}>Navn</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#2c3e50', fontWeight: '600' }}>Intern timepris</th>
                <th style={{ textAlign: 'right', padding: '12px', color: '#2c3e50', fontWeight: '600' }}>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px' }}>
                    <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{employee.name}</strong>
                  </td>
                  <td style={{ padding: '15px', color: '#7f8c8d' }}>
                    {employee.internalHourlyRate ? (
                      <span style={{ color: '#27ae60', fontWeight: '500' }}>
                        {employee.internalHourlyRate} kr./time
                      </span>
                    ) : (
                      <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                        Ikke angivet
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <button
                      className="btn-action btn-edit"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      Redigér
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteEmployee(employee)}
                    >
                      Slet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />
    </div>
  );
}

export default Indstillinger;