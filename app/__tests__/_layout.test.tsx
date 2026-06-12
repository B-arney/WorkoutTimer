import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    default: {
      call: jest.fn(),
      createAnimatedComponent: (cb: any) => cb,
    },
    useSharedValue: jest.fn(),
    useAnimatedStyle: jest.fn(),
    withTiming: jest.fn(),
    withSpring: jest.fn(),
    createAnimatedComponent: (cb: any) => cb,
    // Add other common animated components if needed
    View: ({ children }: any) => <>{children}</>,
  };
});

// Also mock react-native-worklets if needed
jest.mock('react-native-worklets', () => ({}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }: any) => <>{children}</>,
  };
});
import RootLayout from '../_layout';
import { useAuth } from '../../stores/authStore';
import { useRouter, useSegments } from 'expo-router';

jest.mock('../../stores/authStore', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  const Stack = ({ children }: any) => <>{children}</>;
  Stack.Screen = ({ children }: any) => <>{children}</>;
  return {
    Stack,
    useRouter: jest.fn(),
    useSegments: jest.fn(),
  };
});

describe('Navigation Guards', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /auth/login if not authenticated and trying to access a protected route', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    (useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    render(<RootLayout />);

    expect(mockReplace).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to /(tabs) if authenticated and trying to access an auth route', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '123' } });
    (useSegments as jest.Mock).mockReturnValue(['auth', 'login']);

    render(<RootLayout />);

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
