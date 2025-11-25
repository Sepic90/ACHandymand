import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateMonthPairs } from '../utils/dateUtils';
import { generateTimesheetPDF } from '../utils/pdfGenerator';
import { useNotification } from '../utils/notificationUtils';
import { autoPopulateSH } from '../utils/shAutoPopulationUtils';
import EmployeeAdminModal from '../components/EmployeeAdminModal';

function Timeregistrering() {
  const { showError, showWarning } = useNotification();
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthPair, setMonthPair] = useState(new Date().getMonth());
  const [allEmployees, setAllEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Admin modal state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedEmployeeForAdmin, setSelectedEmployeeForAdmin] = useState(null);

  const monthPairs = generateMonthPairs();
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    loadEmployees();
  }, []);

  // Auto-populate SH when employees are loaded
  useEffect(() => {
    if (employees.length > 0) {
      triggerSHAutoPopulation();
    }
  }, [employees]);

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
      if (employeeList.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeeList[0].name);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      showError('Fejl ved indlæsning af medarbejdere.');
    } finally {
      setLoading(false);
    }
  };

  const triggerSHAutoPopulation = async () => {
    try {
      console.log('🔄 Triggering automatic SH population...');
      await autoPopulateSH(employees);
      console.log('✅ SH auto-population check complete');
    } catch (error) {
      console.error('❌ Error in SH auto-population:', error);
      // Don't show error to user - this runs in background
    }
  };

  const handleGeneratePDF = async () => {
    if (!allEmployees && !selectedEmployee) {
      showWarning('Vælg venligst en medarbejder.');
      return;
    }

    setGenerating(true);
    
    try {
      const employeeNames = allEmployees 
        ? employees.map(emp => emp.name)
        : [selectedEmployee];
      
      await generateTimesheetPDF(year, monthPair, employeeNames, allEmployees, employees);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showError('Der opstod en fejl ved generering af PDF. Prøv igen.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenAdmin = (employee) => {
    setSelectedEmployeeForAdmin(employee);
    setShowAdminModal(true);
  };

  const handleCloseAdmin = () => {
    setShowAdminModal(false);
    setSelectedEmployeeForAdmin(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Medarbejderadministration</h1>
        <p>Administrer medarbejdere, fravær, overarbejde og generér timesedler</p>
        <img 
          src="/worker.png" 
          alt="" 
          className="page-header-clipart clipart-timeregistrering"
          aria-hidden="true"
        />
      </div>

      <div className="content-card">
        <h3 style={{ marginBottom: '20px' }}>Generér PDF</h3>
        <div className="timesheet-form">
          <div className="form-section">
            <label htmlFor="year">Vælg år</label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label htmlFor="monthPair">Vælg måneder</label>
            <select
              id="monthPair"
              value={monthPair}
              onChange={(e) => setMonthPair(Number(e.target.value))}
            >
              {monthPairs.map(pair => (
                <option key={pair.value} value={pair.value}>
                  {pair.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Ansatte</label>
            
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="allEmployees"
                checked={allEmployees}
                onChange={(e) => setAllEmployees(e.target.checked)}
              />
              <label htmlFor="allEmployees">Alle ansatte</label>
            </div>

            {loading ? (
              <p>Indlæser...</p>
            ) : employees.length === 0 ? (
              <p className="no-employees-text">
                Ingen ansatte tilgængelige. Tilføj medarbejdere i Indstillinger.
              </p>
            ) : !allEmployees ? (
              <select 
                value={selectedEmployee} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <button 
            className="btn-primary"
            onClick={handleGeneratePDF}
            disabled={generating || loading || employees.length === 0}
            style={{ marginTop: '20px' }}
          >
            {generating ? 'Genererer...' : 'Generér PDF'}
          </button>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Medarbejdere</h3>
        
        {loading ? (
          <p>Indlæser medarbejdere...</p>
        ) : employees.length === 0 ? (
          <p className="no-employees-text">
            Tilføj medarbejdere i Indstillinger først
          </p>
        ) : (
          <div className="employee-admin-list">
            {employees.map(employee => (
              <div key={employee.id} className="employee-admin-row">
                <div className="employee-info">
                  <span className="employee-admin-name">{employee.name}</span>
                  <span className="employee-admin-role">{employee.role || 'Medarbejder'}</span>
                </div>
                <button 
                  className="btn-admin"
                  onClick={() => handleOpenAdmin(employee)}
                >
                  <span className="btn-admin-icon">⚙️</span>
                  <span>Administrér</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Admin Modal */}
      {showAdminModal && selectedEmployeeForAdmin && (
        <EmployeeAdminModal
          employee={selectedEmployeeForAdmin}
          employees={employees}
          isOpen={showAdminModal}
          onClose={handleCloseAdmin}
        />
      )}
    </div>
  );
}

export default Timeregistrering;