import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import EmployeeModal from '../components/EmployeeModal';

function Indstillinger() {
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
      alert('Der opstod en fejl ved indlæsning af medarbejdere.');
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultRate = async () => {
    try {
      const rateValue = parseFloat(tempRate);
      if (isNaN(rateValue) || rateValue <= 0) {
        alert('Indtast venligst en gyldig timepris.');
        return;
      }

      await setDoc(doc(db, 'settings', 'hourlyRates'), {
        defaultRate: rateValue,
        updatedAt: new Date().toISOString()
      });
      
      setDefaultRate(rateValue);
      setEditingRate(false);
      alert('Timepris gemt!');
    } catch (error) {
      console.error('Error saving default rate:', error);
      alert('Der opstod en fejl ved gemning af timepris.');
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
    if (window.confirm(`Er du sikker på, at du vil slette ${employee.name}?`)) {
      try {
        await deleteDoc(doc(db, 'employees', employee.id));
        await loadEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Der opstod en fejl ved sletning af medarbejder.');
      }
    }
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', editingEmployee.id), {
          name: employeeData.name,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'employees'), { 
          name: employeeData.name,
          createdAt: new Date().toISOString()
        });
      }
      
      setModalOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Der opstod en fejl ved gemning af medarbejder.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Indstillinger</h1>
        <p>Administrér medarbejdere og priser</p>
      </div>

      {/* Standard Timepris */}
      <div className="content-card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', color: '#2c3e50' }}>Standard Timepris</h2>
        
        {editingRate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                min="0"
                step="50"
                style={{
                  padding: '10px',
                  fontSize: '18px',
                  width: '150px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
                autoFocus
              />
              <span style={{ color: '#7f8c8d' }}>kr/time</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setTempRate(defaultRate);
                  setEditingRate(false);
                }}
              >
                Annuller
              </button>
              <button 
                className="btn-primary"
                onClick={saveDefaultRate}
              >
                Gem
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60', marginBottom: '5px' }}>
                {defaultRate} kr
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Standard timepris brugt for alle sager (kan tilpasses per sag)
              </div>
            </div>
            <button 
              className="btn-secondary"
              onClick={() => setEditingRate(true)}
            >
              Redigér
            </button>
          </div>
        )}
      </div>

      {/* Medarbejdere */}
      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#2c3e50' }}>Medarbejdere</h2>
          <button className="btn-primary" onClick={handleAddEmployee}>
            + Tilføj Medarbejder
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
                <th style={{ textAlign: 'right', padding: '12px', color: '#2c3e50', fontWeight: '600' }}>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                  <td style={{ padding: '15px' }}>
                    <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{employee.name}</strong>
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