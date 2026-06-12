import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth } from '../authStore';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  getReactNativePersistence: jest.fn(),
  initializeAuth: jest.fn()
}));

jest.mock('../../services/firebaseConfig', () => ({
  auth: {}
}));

describe('useAuth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.setState({ user: null, isLoading: false, error: null });
  });

  it('has initial state', () => {
    const state = useAuth.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('can login user', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: '123', email: 'test@test.com' }
    });

    await useAuth.getState().login('test@test.com', 'password123');
    const state = useAuth.getState();
    expect(state.user).toEqual({ uid: '123', email: 'test@test.com' });
    expect(state.isLoading).toBe(false);
  });

  it('handles login error', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

    await useAuth.getState().login('test@test.com', 'wrong');
    const state = useAuth.getState();
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid credentials');
    expect(state.isLoading).toBe(false);
  });

  it('can register user', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: { uid: '456', email: 'new@test.com' }
    });

    await useAuth.getState().register('new@test.com', 'password123');
    const state = useAuth.getState();
    expect(state.user).toEqual({ uid: '456', email: 'new@test.com' });
    expect(state.isLoading).toBe(false);
  });

  it('can logout user', async () => {
    useAuth.setState({ user: { uid: '123', email: 'test@test.com' } });
    (signOut as jest.Mock).mockResolvedValue(undefined);

    await useAuth.getState().logout();
    const state = useAuth.getState();
    expect(state.user).toBeNull();
    expect(signOut).toHaveBeenCalled();
  });
});
