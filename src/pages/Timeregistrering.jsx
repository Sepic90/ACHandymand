import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateMonthPairs } from '../utils/dateUtils';
import { generateTimesheetPDF } from '../utils/pdfGenerator';
import { useNotification } from '../utils/notificationUtils';
import CreateAbsenceModal from '../components/CreateAbsenceModal';
import ViewAbsenceModal from '../components/ViewAbsenceModal';
import CreateOvertimeModal from '../components/CreateOvertimeModal';
import ViewOvertimeModal from '../components/ViewOvertimeModal';

function Timeregistrering() {
  const { showError, showWarning } = useNotification();
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthPair, setMonthPair] = useState(new Date().getMonth());
  const [allEmployees, setAllEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Absence modals
  const [showCreateAbsence, setShowCreateAbsence] = useState(false);
  const [showViewAbsence, setShowViewAbsence] = useState(false);
  const [selectedEmployeeForAbsence, setSelectedEmployeeForAbsence] = useState(null);

  // Overtime modals
  const [showCreateOvertime, setShowCreateOvertime] = useState(false);
  const [showViewOvertime, setShowViewOvertime] = useState(false);
  const [selectedEmployeeForOvertime, setSelectedEmployeeForOvertime] = useState(null);

  const monthPairs = generateMonthPairs();
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

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

  const handleCreateAbsence = (employee) => {
    setSelectedEmployeeForAbsence(employee);
    setShowCreateAbsence(true);
  };

  const handleViewAbsence = (employee) => {
    setSelectedEmployeeForAbsence(employee);
    setShowViewAbsence(true);
  };

  const handleAbsenceSuccess = () => {
    // Refresh is handled in the modals
  };

  const handleCreateOvertime = (employee) => {
    setSelectedEmployeeForOvertime(employee);
    setShowCreateOvertime(true);
  };

  const handleViewOvertime = (employee) => {
    setSelectedEmployeeForOvertime(employee);
    setShowViewOvertime(true);
  };

  const handleOvertimeSuccess = () => {
    // Refresh is handled in the modals
  };

  return (
    <div>
      <div className="page-header">
        <h1>Timeregistrering</h1>
        <p>Generér timeregistreringsformularer for medarbejdere</p>
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
              <p>Indlæser medarbejdere...</p>
            ) : (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                disabled={allEmployees || employees.length === 0}
              >
                {employees.length === 0 ? (
                  <option value="">Ingen medarbejdere</option>
                ) : (
                  employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))
                )}
              </select>
            )}

            {employees.length === 0 && (
              <p className="no-employees-text">
                Tilføj medarbejdere i Indstillinger først
              </p>
            )}
          </div>

          <button 
            className="btn-generate"
            onClick={handleGeneratePDF}
            disabled={generating || employees.length === 0}
          >
            {generating ? 'Genererer...' : 'Generér PDF'}
          </button>
        </div>
      </div>

      <div className="content-card" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Timer og fravær</h3>
        
        {loading ? (
          <p>Indlæser medarbejdere...</p>
        ) : employees.length === 0 ? (
          <p className="no-employees-text">
            Tilføj medarbejdere i Indstillinger først
          </p>
        ) : (
          <div className="absence-employee-list">
            {employees.map(employee => (
              <div key={employee.id} className="absence-employee-row">
                <span className="absence-employee-name">{employee.name}</span>
                <div className="absence-employee-actions">
                  <button 
                    className="btn-primary btn-small"
                    onClick={() => handleCreateAbsence(employee)}
                  >
                    Opret fravær
                  </button>
                  <button 
                    className="btn-secondary btn-small"
                    onClick={() => handleViewAbsence(employee)}
                  >
                    Se / rediger fravær
                  </button>
                  <button 
                    className="btn-primary btn-small"
                    onClick={() => handleCreateOvertime(employee)}
                  >
                    Registrer overarbejde
                  </button>
                  <button 
                    className="btn-secondary btn-small"
                    onClick={() => handleViewOvertime(employee)}
                  >
                    Se / rediger overarbejde
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateAbsence && selectedEmployeeForAbsence && (
        <CreateAbsenceModal
          employee={selectedEmployeeForAbsence}
          employees={employees}
          onClose={() => setShowCreateAbsence(false)}
          onSuccess={handleAbsenceSuccess}
        />
      )}

      {showViewAbsence && selectedEmployeeForAbsence && (
        <ViewAbsenceModal
          employee={selectedEmployeeForAbsence}
          onClose={() => setShowViewAbsence(false)}
          onSuccess={handleAbsenceSuccess}
        />
      )}

      {showCreateOvertime && selectedEmployeeForOvertime && (
        <CreateOvertimeModal
          employee={selectedEmployeeForOvertime}
          onClose={() => setShowCreateOvertime(false)}
          onSuccess={handleOvertimeSuccess}
        />
      )}

      {showViewOvertime && selectedEmployeeForOvertime && (
        <ViewOvertimeModal
          employee={selectedEmployeeForOvertime}
          onClose={() => setShowViewOvertime(false)}
          onSuccess={handleOvertimeSuccess}
        />
      )}
    </div>
  );
}

export default Timeregistrering;