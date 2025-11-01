import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateMonthPairs } from '../utils/dateUtils';
import { generateTimesheetPDF } from '../utils/pdfGenerator';

function Timeregistrering() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthPair, setMonthPair] = useState(new Date().getMonth());
  const [allEmployees, setAllEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const monthPairs = generateMonthPairs();
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Load employees from Firestore
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
      if (employeeList.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeeList[0].name);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!allEmployees && !selectedEmployee) {
      alert('Vælg venligst en medarbejder.');
      return;
    }

    setGenerating(true);
    
    try {
      const employeeNames = allEmployees 
        ? employees.map(emp => emp.name)
        : [selectedEmployee];
      
      await generateTimesheetPDF(year, monthPair, employeeNames, allEmployees);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Der opstod en fejl ved generering af PDF. Prøv igen.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Timeregistrering</h1>
        <p>Generér timeregistreringsformularer til medarbejdere</p>
      </div>

      <div className="content-card">
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
                  <option value="">Ingen medarbejdere tilgængelige</option>
                ) : (
                  employees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {generating && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Genererer dokument...</span>
            </div>
          )}

          <button
            className="btn-generate"
            onClick={handleGeneratePDF}
            disabled={generating || employees.length === 0}
          >
            Generér og download dokument
          </button>

          {employees.length === 0 && !loading && (
            <p style={{ color: '#e74c3c', fontSize: '14px', marginTop: '10px' }}>
              Ingen medarbejdere fundet. Tilføj medarbejdere i Indstillinger først.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timeregistrering;
