import React from 'react';
import { render } from '@testing-library/react-native';
import SessionsScreen from '../index';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock API client
jest.mock('@/utils/api', () => ({
  ApiClient: {
    get: jest.fn().mockResolvedValue([]),
  },
}));

describe('SessionsScreen', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<SessionsScreen />);
    expect(getByText('Mes Sessions')).toBeTruthy();
  });

  it('displays tab buttons', () => {
    const { getByText } = render(<SessionsScreen />);
    expect(getByText('À venir')).toBeTruthy();
    expect(getByText('Passées')).toBeTruthy();
  });

  it('shows empty state when no sessions', async () => {
    const { findByText } = render(<SessionsScreen />);
    const emptyText = await findByText('Aucune session à venir');
    expect(emptyText).toBeTruthy();
  });
});
