import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../login';
import { useAuth } from '../../../stores/authStore';

jest.mock('../../../stores/authStore', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return {
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
    }),
    Link: ({ children, href, asChild }: any) => {
      // Return a basic touchable wrapper or just children
      return <TouchableOpacity>{children}</TouchableOpacity>;
    }
  };
});

describe('LoginScreen', () => {
  it('renders login form correctly', () => {
    (useAuth as any).mockReturnValue({ login: jest.fn(), isLoading: false, error: null });
    
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
    expect(getByText('Create an account')).toBeTruthy();
  });
});
