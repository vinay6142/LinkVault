import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const generateShareId = () => {
  // Generate a unique share ID that is hard to guess
  // Using UUID but shortening it for readability
  const uuid = uuidv4().replace(/-/g, '');
  return uuid.substring(0, 12); // 12 character unique ID
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const calculateExpiryTime = (expiryMinutes = null) => {
  const now = new Date();
  const expiryTime = expiryMinutes || 10; // Default 10 minutes
  return new Date(now.getTime() + expiryTime * 60000);
};

export const validateExpiryDateTime = (expiryDateTime) => {
  try {
    const selectedDateTime = new Date(expiryDateTime);
    const now = new Date();

    // Check if date is valid
    if (isNaN(selectedDateTime.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    // Check if date is in the future
    if (selectedDateTime <= now) {
      return { valid: false, error: 'Expiry date and time must be in the future' };
    }

    // Check if date is not too far in the future (max 1 year)
    const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    if (selectedDateTime > maxDate) {
      return { valid: false, error: 'Expiry date cannot be more than 365 days in the future' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Error validating expiry date' };
  }
};

export const validateExpiryMinutes = (expiryMinutes) => {
  try {
    const minutes = parseInt(expiryMinutes);

    // Check if it's a valid number
    if (isNaN(minutes)) {
      return { valid: false, error: 'Expiry minutes must be a valid number' };
    }

    // Check minimum (at least 1 minute)
    if (minutes < 1) {
      return { valid: false, error: 'Expiry minutes must be at least 1' };
    }

    // Check maximum (max 525600 minutes = 1 year)
    if (minutes > 525600) {
      return { valid: false, error: 'Expiry minutes cannot exceed 365 days (525600 minutes)' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Error validating expiry minutes' };
  }
};
