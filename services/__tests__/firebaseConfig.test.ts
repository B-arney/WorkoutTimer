jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
}));

import { app, db, auth } from '../firebaseConfig';

describe('Firebase Configuration', () => {
  it('initializes the firebase app', () => {
    expect(app).toBeDefined();
  });

  it('initializes the firestore database', () => {
    expect(db).toBeDefined();
  });

  it('initializes the firebase auth', () => {
    expect(auth).toBeDefined();
  });
});

