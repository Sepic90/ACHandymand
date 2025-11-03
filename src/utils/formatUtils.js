// Format currency in DKK
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  // Format as XX XX XX XX
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return phone;
};

// Create Google Maps URL from address
export const createMapsUrl = (address) => {
  if (!address) return '#';
  const encoded = encodeURIComponent(address);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
};

// Format date for display (DD/MM/YYYY)
export const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Format decimal hours (e.g., 4.5 timer)
export const formatHours = (hours) => {
  if (!hours && hours !== 0) return '0';
  return Number(hours).toFixed(1).replace('.', ',');
};

// Parse Danish decimal input (replace comma with dot)
export const parseDecimal = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(String(value).replace(',', '.')) || 0;
};