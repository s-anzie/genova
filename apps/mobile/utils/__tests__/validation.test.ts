import { validateEmail, validatePassword, validatePasswordMatch, validateRequired, validateName, validateBirthDate } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email format', () => {
      const result1 = validateEmail('test@example.com');
      expect(result1.valid).toBe(true);
      expect(result1.message).toBeUndefined();
      
      const result2 = validateEmail('user.name@domain.co.uk');
      expect(result2.valid).toBe(true);
      expect(result2.message).toBeUndefined();
    });

    it('rejects invalid email format', () => {
      const result1 = validateEmail('invalid');
      expect(result1.valid).toBe(false);
      expect(result1.message).toBeDefined();
      
      const result2 = validateEmail('invalid@');
      expect(result2.valid).toBe(false);
      expect(result2.message).toBeDefined();
      
      const result3 = validateEmail('@domain.com');
      expect(result3.valid).toBe(false);
      expect(result3.message).toBeDefined();
    });

    it('rejects empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Email is required');
    });
  });

  describe('validatePassword', () => {
    it('validates strong password', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('rejects empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    it('rejects short password', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters');
    });

    it('rejects password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password must contain a lowercase letter');
    });

    it('rejects password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password must contain an uppercase letter');
    });

    it('rejects password without number', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password must contain a number');
    });
  });

  describe('validatePasswordMatch', () => {
    it('validates matching passwords', () => {
      const result = validatePasswordMatch('Password123', 'Password123');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('rejects non-matching passwords', () => {
      const result = validatePasswordMatch('Password123', 'Password456');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Passwords do not match');
    });
  });

  describe('validateRequired', () => {
    it('validates non-empty value', () => {
      expect(validateRequired('test', 'Field')).toBeUndefined();
    });

    it('rejects empty value', () => {
      expect(validateRequired('', 'Field')).toBe('Field is required');
      expect(validateRequired('   ', 'Field')).toBe('Field is required');
    });
  });

  describe('validateName', () => {
    it('validates valid name', () => {
      const result1 = validateName('John');
      expect(result1.valid).toBe(true);
      expect(result1.message).toBeUndefined();
      
      const result2 = validateName('Jo');
      expect(result2.valid).toBe(true);
      expect(result2.message).toBeUndefined();
    });

    it('rejects short name', () => {
      const result = validateName('J');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Name must be at least 2 characters');
    });

    it('rejects empty name', () => {
      const result = validateName('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Name is required');
    });
  });

  describe('validateBirthDate', () => {
    it('validates valid birth date', () => {
      const result = validateBirthDate('15/06/1990');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
      expect(result.age).toBeGreaterThan(0);
    });

    it('rejects invalid format', () => {
      const result = validateBirthDate('1990-06-15');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Please use DD/MM/YYYY format');
    });

    it('rejects invalid date', () => {
      const result = validateBirthDate('32/13/1990');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid date');
    });

    it('rejects age below 5', () => {
      const currentYear = new Date().getFullYear();
      const result = validateBirthDate(`01/01/${currentYear - 2}`);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('You must be at least 5 years old');
    });

    it('rejects empty birth date', () => {
      const result = validateBirthDate('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Birth date is required');
    });
  });
});
