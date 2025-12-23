export const validateEmail = (email: string): { valid: boolean; message?: string } => {
  if (!email || !email.trim()) {
    return { valid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  
  return { valid: true };
};

export const validatePasswordMatch = (password: string, confirmPassword: string): { valid: boolean; message?: string } => {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  return { valid: true };
};

export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || !value.trim()) {
    return `${fieldName} is required`;
  }
  return undefined;
};

export const validateName = (name: string): { valid: boolean; message?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }
  
  return { valid: true };
};

export const validateBirthDate = (birthDate: string): { valid: boolean; message?: string; age?: number } => {
  if (!birthDate || !birthDate.trim()) {
    return { valid: false, message: 'Birth date is required' };
  }
  
  // Parse DD/MM/YYYY format
  const parts = birthDate.split('/');
  if (parts.length !== 3) {
    return { valid: false, message: 'Please use DD/MM/YYYY format' };
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { valid: false, message: 'Invalid date' };
  }
  
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
    return { valid: false, message: 'Invalid date' };
  }
  
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return { valid: false, message: 'Invalid date' };
  }
  
  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  
  if (age < 5) {
    return { valid: false, message: 'You must be at least 5 years old' };
  }
  
  if (age > 120) {
    return { valid: false, message: 'Invalid age' };
  }
  
  return { valid: true, age };
};
