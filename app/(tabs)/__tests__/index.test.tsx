import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

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
    View: ({ children }: any) => <>{children}</>,
    SlideInDown: {},
    SlideOutDown: {},
  };
});

jest.mock('react-native-worklets', () => ({}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  return {
    GestureHandlerRootView: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('../../../services/backend', () => ({
  getWorkouts: jest.fn(() => Promise.resolve([])),
  getCategories: jest.fn(() => Promise.resolve([])),
  getWorkoutCategories: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../../components/Icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Icons: {
      LogOut: () => <View />,
      Plus: () => <View />,
      Search: () => <View />,
      X: () => <View />,
      Circle: () => <View />,
      CheckCircle2: () => <View />,
      Play: () => <View />,
      Edit2: () => <View />,
      Trash2: () => <View />,
    }
  };
});

import WorkoutPlansScreen from '../index';
import { useAuth } from '../../../stores/authStore';

jest.mock('../../../stores/authStore', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => <>{children}</>,
}));

describe('WorkoutPlansScreen Logout', () => {
  it('renders logout button and calls logout on press', () => {
    const logoutMock = jest.fn();
    (useAuth as any).mockReturnValue({ logout: logoutMock });
    
    const { getByTestId } = render(<WorkoutPlansScreen />);
    
    const logoutButton = getByTestId('logout-button');
    expect(logoutButton).toBeTruthy();
    
    fireEvent.press(logoutButton);
    expect(logoutMock).toHaveBeenCalled();
  });
});
