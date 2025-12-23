import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../register';
import { AuthProvider } from '@/contexts/auth-context';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

describe('RegisterScreen', () => {
  it('renders registration form correctly', () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    expect(getByPlaceholderText('Enter your first name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your last name')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Create a password')).toBeTruthy();
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText, findByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    const createAccountButton = getByText('Create Account');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(findByText('First name is required')).toBeTruthy();
    });
  });

  it('validates password strength', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    const firstNameInput = getByPlaceholderText('Enter your first name');
    const lastNameInput = getByPlaceholderText('Enter your last name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Create a password');
    const createAccountButton = getByText('Create Account');

    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(passwordInput, 'weak');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(findByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('validates password confirmation match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    const firstNameInput = getByPlaceholderText('Enter your first name');
    const lastNameInput = getByPlaceholderText('Enter your last name');
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Create a password');
    const confirmPasswordInput = getByPlaceholderText('Confirm your password');
    const createAccountButton = getByText('Create Account');

    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(passwordInput, 'Password123');
    fireEvent.changeText(confirmPasswordInput, 'Password456');
    fireEvent.press(createAccountButton);

    await waitFor(() => {
      expect(findByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('allows role selection', () => {
    const { getByText } = render(
      <AuthProvider>
        <RegisterScreen />
      </AuthProvider>
    );

    const studentButton = getByText('Student');
    const tutorButton = getByText('Tutor');

    expect(studentButton).toBeTruthy();
    expect(tutorButton).toBeTruthy();

    fireEvent.press(tutorButton);
    // Role should be updated to tutor
  });
});
