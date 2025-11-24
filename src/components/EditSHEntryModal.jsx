import React, { useState, useEffect } from 'react';
import { updateSHEntry } from '../utils/shAccumulationUtils';
import { useNotification } from '../utils/notificationUtils';

function EditSHEntryModal({ isOpen, onClose, employee, year, entry, onSuccess }) {
  const { showSuccess, showError } = useNotification();
  
  const [holidayName, setHolidayName] = useState('');
  const [amount, setAmount] = useState('');
  const [dailyHours, setDailyHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setHolidayName(entry.holidayName || '');
      setAmount(entry.amount ? entry.amount.toString() : '');
      setDailyHours(entry.dailyHours ? entry.dailyHours.toString() : '');
      setHourlyRate(entry.hourlyRate ? entry.hourlyRate.toString() : '');
    }
  }, [entry]);

  const handleHourlyRateChange = (e) => {
    const value = e.target.value;
    setHourlyRate(value);
    
    if (errors.hourlyRate) {
      setErrors(prev => ({ ...prev, hourlyRate: null }));
    }
    
    // Recalculate amount if we have all values
    if (dailyHours && value && !isNaN(parseFloat(value))) {
      const rate = parseFloat(value);
      const hours = parseFloat(dailyHours);
      const newAmount = (rate * hours * 0.147).toFixed(2);
      setAmount(newAmount);
    }
  };

  const handleDailyHoursChange = (e) => {
    const value = e.target.value;
    setDailyHours(value);
    
    if (errors.dailyHours) {
      setErrors(prev => ({ ...prev, dailyHours: null }));
    }
    
    // Recalculate amount if we have all values
    if (hourlyRate && value && !isNaN(parseFloat(value))) {
      const rate = parseFloat(hourlyRate);
      const hours = parseFloat(value);
      const newAmount = (rate * hours * 0.147).toFixed(2);
      setAmount(newAmount);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
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
      const updatedData = {
        holidayName: holidayName.trim(),
        amount: parseFloat(amount),
        hourlyRate: parseFloat(hourlyRate),
        dailyHours: parseFloat(dailyHours)
      };
      
      const result = await updateSHEntry(
        employee.id,
        year,
        entry.date,
        updatedData
      );
      
      if (result.success) {
        showSuccess('SH-registrering opdateret!');
        onSuccess();
        onClose();
      } else {
        showError(result.error || 'Fejl ved opdatering af SH-registrering.');
      }
    } catch (error) {
      console.error('Error updating SH entry:', error);
      showError('Fejl ved opdatering af SH-registrering.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !entry) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '550px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Redigér SH-registrering</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Dato</label>
              <input
                type="text"
                value={entry.date}
                disabled
                style={{
                  backgroundColor: '#f5f5f5',
                  cursor: 'not-allowed'
                }}
              />
              <small className="form-hint">
                Datoen kan ikke ændres. Slet og tilføj ny registrering for at ændre dato.
              </small>
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
                onChange={handleDailyHoursChange}
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
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#856404'
            }}>
              <strong>⚠️ Vigtigt:</strong> Ændringer her påvirker den akkumulerede total. Sørg for at beløbet er korrekt før du gemmer.
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
              {submitting ? 'Gemmer...' : 'Gem ændringer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSHEntryModal;