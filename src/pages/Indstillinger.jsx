import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import EmployeeModal from '../components/EmployeeModal';

function Indstillinger() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      const employeeList = [];
      querySnapshot.forEach((doc) => {
        employeeList.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by name
      employeeList.sort((a, b) => a.name.localeCompare(b.name));
      
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
      alert('Der opstod en fejl ved indlæsning af medarbejdere.');
    } finally {
      setLoading(false);
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

  const handleSaveEmployee = async (name) => {
    try {
      if (editingEmployee) {
        // Update existing employee
        await updateDoc(doc(db, 'employees', editingEmployee.id), { name });
      } else {
        // Add new employee
        await addDoc(collection(db, 'employees'), { 
          name,
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
        <p>Administrér medarbejdere og systemindstillinger</p>
      </div>

      <div className="content-card">
        <div className="settings-section">
          <h2>Medarbejdere</h2>
          
          {loading ? (
            <p>Indlæser medarbejdere...</p>
          ) : employees.length === 0 ? (
            <div className="empty-state">
              <p>Ingen medarbejdere tilføjet endnu.</p>
              <p>Klik på knappen nedenfor for at tilføje din første medarbejder.</p>
            </div>
          ) : (
            <div className="employee-list">
              {employees.map(employee => (
                <div key={employee.id} className="employee-item">
                  <span className="employee-name">{employee.name}</span>
                  <div className="employee-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEditEmployee(employee)}
                    >
                      Redigér
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteEmployee(employee)}
                    >
                      Slet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button className="btn-add" onClick={handleAddEmployee}>
            + Tilføj medarbejder
          </button>
        </div>
      </div>

      {modalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Indstillinger;
