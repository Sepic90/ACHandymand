import React, { useState, useEffect } from 'react';
import { addSHEntry, checkSHEntryExists } from '../utils/shAccumulationUtils';
import { 
  isSøgnehelligdag, 
  calculateSHCompensation, 
  getWeekdayFromDate 
} from '../utils/søgnehelligdageUtils';
import { useNotification } from '../utils/notificationUtils';

function AddManualSHEntryModal({ isOpen, onClose, employee, year, onSuccess }) {
  const { showSuccess, showError } = useNotification();
  
  const [date, setDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [amount, setAmount] = useState('');
  const [dailyHours, setDailyHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState(employee.internalHourlyRate || '');
  const [autoDetected, setAutoDetected] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (employee.internalHourlyRate) {
      setHourlyRate(employee.internalHourlyRate);
    }
  }, [employee]);

  // Auto-detect holiday when date changes
  useEffect(() => {
    if (date) {
      const holiday = isSøgnehelligdag(date);
      if (holiday) {
        setHolidayName(holiday.name);
        setAutoDetected(true);
        
        // Auto-calculate if we have hourly rate
        if (hourlyRate && hourlyRate > 0) {
          calculateAmount(date, parseFloat(hourlyRate));
        }
      } else {
        if (autoDetected) {
          setHolidayName('');
          setAutoDetected(false);
        }
      }
    }
  }, [date, hourlyRate]);

  const calculateAmount = (dateString, rate) => {
    const weekday = getWeekdayFromDate(dateString);
    const compensation = calculateSHCompensation(rate, weekday);
    
    // Determine daily hours based on weekday
    const hours = weekday === 'Fredag' ? 7 : 7.5;
    
    setAmount(compensation.toFixed(2));
    setDailyHours(hours);
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    if (value) {
      const [yyyy, mm, dd] = value.split('-');
      const formatted = `${dd}/${mm}/${yyyy}`;
      setDate(formatted);
    } else {
      setDate('');
    }
    
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: null }));
    }
  };

  const handleHourlyRateChange = (e) => {
    const value = e.target.value;
    setHourlyRate(value);
    
    if (errors.hourlyRate) {
      setErrors(prev => ({ ...prev, hourlyRate: null }));
    }
    
    // Recalculate if we have date
    if (date && value && !isNaN(parseFloat(value))) {
      calculateAmount(date, parseFloat(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!date) {
      newErrors.date = 'Dato er påkrævet';
    } else {
      // Validate date format
      const [day, month, yearStr] = date.split('/');
      if (!day || !month || !yearStr || parseInt(yearStr) !== year) {
        newErrors.date = `Datoen skal være i ${year}`;
      }
    }
    
    if (!holidayName || holidayName.trim() === '') {
      newErrors.holidayName = 'Helligdagsnavn er påkrævet';
    }
    
    if (!hourlyRate || isNaN(parseFloat(hourlyRate)) || parseFloat(hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Gyldig timepris er påkrævet';
    }
    
    if (!dailyHours || isNaN(parseFloat(dailyHours)) || parseFloat(dailyHours) <= 0) {
      newErrors.dailyHours = 'Gyldigt antal timer er påkrævet';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Gyldigt beløb er påkrævet';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Check if entry already exists
      const existsResult = await checkSHEntryExists(employee.id, year, date);
      if (existsResult.success && existsResult.exists) {
        showError(`Der findes allerede en SH-registrering for ${date}`);
        setSubmitting(false);
        return;
      }
      
      // Create entry
      const entryData = {
        date: date,
        holidayName: holidayName.trim(),
        amount: parseFloat(amount),
        hourlyRate: parseFloat(hourlyRate),
        dailyHours: parseFloat(dailyHours)
      };
      
      const result = await addSHEntry(
        employee.id,
        employee.name,
        year,
        entryData
      );
      
      if (result.success) {
        showSuccess('SH-registrering tilføjet!');
        onSuccess();
        onClose();
      } else {
        showError(result.error || 'Fejl ved tilføjelse af SH-registrering.');
      }
    } catch (error) {
      console.error('Error adding SH entry:', error);
      showError('Fejl ved tilføjelse af SH-registrering.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input
  const dateInputValue = date ? (() => {
    const [dd, mm, yyyy] = date.split('/');
    return `${yyyy}-${mm}-${dd}`;
  })() : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '550px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Tilføj manuel SH-registrering</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="date">Dato *</label>
              <input
                type="date"
                id="date"
                value={dateInputValue}
                onChange={handleDateChange}
                className={errors.date ? 'input-error' : ''}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
              {autoDetected && (
                <small className="form-hint" style={{ color: '#27ae60' }}>
                  ✓ Helligdag genkendt automatisk
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="holidayName">Helligdagsnavn *</label>
              <input
                type="text"
                id="holidayName"
                value={holidayName}
                onChange={(e) => {
                  setHolidayName(e.target.value);
                  if (errors.holidayName) setErrors(prev => ({ ...prev, holidayName: null }));
                }}
                className={errors.holidayName ? 'input-error' : ''}
                placeholder="F.eks. Juledag, Påskedag"
              />
              {errors.holidayName && <span className="error-text">{errors.holidayName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hourlyRate">Timepris (kr.) *</label>
              <input
                type="number"
                id="hourlyRate"
                value={hourlyRate}
                onChange={handleHourlyRateChange}
                className={errors.hourlyRate ? 'input-error' : ''}
                placeholder="250"
                step="0.01"
                min="0"
              />
              {errors.hourlyRate && <span className="error-text">{errors.hourlyRate}</span>}
              <small className="form-hint">
                Medarbejderens timeløn på denne dato
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="dailyHours">Daglige timer *</label>
              <select
                id="dailyHours"
                value={dailyHours}
                onChange={(e) => {
                  setDailyHours(e.target.value);
                  if (errors.dailyHours) setErrors(prev => ({ ...prev, dailyHours: null }));
                  
                  // Recalculate amount when hours change
                  if (hourlyRate && e.target.value) {
                    const rate = parseFloat(hourlyRate);
                    const hours = parseFloat(e.target.value);
                    const newAmount = (rate * hours * 0.147).toFixed(2);
                    setAmount(newAmount);
                  }
                }}
                className={errors.dailyHours ? 'input-error' : ''}
              >
                <option value="">Vælg timer</option>
                <option value="7.5">7,5 timer (Man-Tor)</option>
                <option value="7">7 timer (Fredag)</option>
              </select>
              {errors.dailyHours && <span className="error-text">{errors.dailyHours}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="amount">Beløb (14,7% af dagløn) *</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));
                }}
                className={errors.amount ? 'input-error' : ''}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
              <small className="form-hint">
                Beregnes automatisk: Timepris × Timer × 14,7%
              </small>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#004085'
            }}>
              <strong>💡 Tip:</strong> Vælg en dato, så genkender systemet automatisk om det er en helligdag og beregner det korrekte beløb.
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Annuller
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Tilføjer...' : 'Tilføj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddManualSHEntryModal;