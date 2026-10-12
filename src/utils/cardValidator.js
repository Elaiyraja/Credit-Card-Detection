/**
 * Card Validation and Security Utilities
 * Strictly enforces PCI-DSS guidelines:
 * - Never logs or persists full unmasked PAN
 * - Performs in-memory validation
 */

// Luhn Algorithm (Mod 10 Checksum)
function validateLuhn(cardNumber) {
  const sanitized = String(cardNumber).replace(/\D/g, '');
  if (!sanitized || sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Brand Detection based on standard IIN/BIN patterns
function detectCardBrand(cardNumber) {
  const clean = String(cardNumber).replace(/\D/g, '');
  
  if (/^4[0-9]{0,18}$/.test(clean)) {
    return { brand: 'visa', name: 'Visa', length: [16, 19], cvvLength: 3 };
  }
  if (/^(5[1-5][0-9]{0,14}|2(22[1-9][0-9]{0,12}|2[3-9][0-9]{0,13}|[3-6][0-9]{0,14}|7[0-1][0-9]{0,13}|720[0-9]{0,12}))$/.test(clean)) {
    return { brand: 'mastercard', name: 'Mastercard', length: [16], cvvLength: 3 };
  }
  if (/^3[47][0-9]{0,13}$/.test(clean)) {
    return { brand: 'amex', name: 'American Express', length: [15], cvvLength: 4 };
  }
  if (/^(6011|65|64[4-9]|622[1-9])[0-9]{0,15}$/.test(clean)) {
    return { brand: 'discover', name: 'Discover', length: [16], cvvLength: 3 };
  }
  if (/^(?:2131|1800|35[0-9]{2})[0-9]{0,15}$/.test(clean)) {
    return { brand: 'jcb', name: 'JCB', length: [16], cvvLength: 3 };
  }
  if (/^3(?:0[0-5]|[68][0-9])[0-9]{0,11}$/.test(clean)) {
    return { brand: 'diners', name: 'Diners Club', length: [14], cvvLength: 3 };
  }
  return { brand: 'unknown', name: 'Unknown Card', length: [16], cvvLength: 3 };
}

// PCI-DSS Compliant Pan Masking
function maskCardNumber(cardNumber) {
  const clean = String(cardNumber).replace(/\D/g, '');
  if (clean.length < 10) return '****';
  const first6 = clean.slice(0, 6);
  const last4 = clean.slice(-4);
  const maskedLength = clean.length - 10;
  return `${first6}${'*'.repeat(maskedLength)}${last4}`;
}

// Visual display format: **** **** **** 1234
function formatDisplayMasked(cardNumber) {
  const clean = String(cardNumber).replace(/\D/g, '');
  if (clean.length < 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

// Validate Expiry Date
function validateExpiry(month, year) {
  const m = parseInt(month, 10);
  let y = parseInt(year, 10);

  if (isNaN(m) || isNaN(y) || m < 1 || m > 12) {
    return { valid: false, error: 'Invalid expiry month' };
  }

  // Handle 2-digit year
  if (y < 100) {
    y += 2000;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  if (y < currentYear || (y === currentYear && m < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }

  if (y > currentYear + 25) {
    return { valid: false, error: 'Expiry year too far in the future' };
  }

  return { valid: true };
}

module.exports = {
  validateLuhn,
  detectCardBrand,
  maskCardNumber,
  formatDisplayMasked,
  validateExpiry,
};
