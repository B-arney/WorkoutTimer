import { useWorkoutDataStore } from '../workoutStore';
import { 
  saveWorkout as backendSaveWorkout, 
  deleteWorkout as backendDeleteWorkout,
  getCategories as backendGetCategories,
  saveCategory as backendSaveCategory,
  getWorkoutCategories as backendGetWorkoutCategories,
  saveWorkoutCategory as backendSaveWorkoutCategory,
  deleteWorkoutCategory as backendDeleteWorkoutCategory
} from '../../services/backend';

jest.mock('../../services/backend', () => ({
  saveWorkout: jest.fn(),
  deleteWorkout: jest.fn(),
  getWorkouts: jest.fn(),
  getCategories: jest.fn(),
  saveCategory: jest.fn(),
  getWorkoutCategories: jest.fn(),
  saveWorkoutCategory: jest.fn(),
  deleteWorkoutCategory: jest.fn()
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useWorkoutDataStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useWorkoutDataStore.setState({ 
      savedWorkouts: [],
      categories: [],
      workoutCategories: []
    });
  });

  const mockWorkout = {
    id: 'test-1',
    name: 'Test',
    intervals: [],
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Cardio'
  };

  const mockWorkoutCategory = {
    workoutId: 'test-1',
    categoryId: 'cat-1'
  };

  describe('Workouts', () => {
    it('saveWorkout should update store and call backend saveWorkout', async () => {
      // Delay the mock to test loading state
      (backendSaveWorkout as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 10)));
      
      const savePromise = useWorkoutDataStore.getState().saveWorkout(mockWorkout);
      
      // While saving, isLoading should be true
      expect(useWorkoutDataStore.getState().isLoading).toBe(true);
      
      await savePromise;
      
      // After saving, isLoading should be false
      expect(useWorkoutDataStore.getState().isLoading).toBe(false);
      expect(backendSaveWorkout).toHaveBeenCalledWith(mockWorkout);
      expect(useWorkoutDataStore.getState().savedWorkouts).toContainEqual(mockWorkout);
    });

    it('deleteWorkout should call backend deleteWorkout and update state', async () => {
      useWorkoutDataStore.setState({ savedWorkouts: [mockWorkout] });
      await useWorkoutDataStore.getState().deleteWorkout('test-1');
      expect(backendDeleteWorkout).toHaveBeenCalledWith('test-1');
      expect(useWorkoutDataStore.getState().savedWorkouts).not.toContainEqual(mockWorkout);
    });

    it('saveWorkout should throw error when backend fails', async () => {
      const error = new Error('Backend failed');
      (backendSaveWorkout as jest.Mock).mockRejectedValueOnce(error);
      await expect(useWorkoutDataStore.getState().saveWorkout(mockWorkout)).rejects.toThrow('Backend failed');
      expect(useWorkoutDataStore.getState().isLoading).toBe(false);
    });

    it('deleteWorkout should throw error when backend fails', async () => {
      const error = new Error('Backend failed');
      (backendDeleteWorkout as jest.Mock).mockRejectedValueOnce(error);
      await expect(useWorkoutDataStore.getState().deleteWorkout('test-1')).rejects.toThrow('Backend failed');
      expect(useWorkoutDataStore.getState().isLoading).toBe(false);
    });
  });

  describe('Categories', () => {
    it('loadCategories should fetch from backend and update state', async () => {
      (backendGetCategories as jest.Mock).mockResolvedValueOnce([mockCategory]);
      (backendGetWorkoutCategories as jest.Mock).mockResolvedValueOnce([mockWorkoutCategory]);
      
      await useWorkoutDataStore.getState().loadCategories();
      
      expect(backendGetCategories).toHaveBeenCalled();
      expect(backendGetWorkoutCategories).toHaveBeenCalled();
      expect(useWorkoutDataStore.getState().categories).toContainEqual(mockCategory);
      expect(useWorkoutDataStore.getState().workoutCategories).toContainEqual(mockWorkoutCategory);
    });

    it('createCategory should call backend and update state', async () => {
      await useWorkoutDataStore.getState().createCategory(mockCategory);
      
      expect(backendSaveCategory).toHaveBeenCalledWith(mockCategory);
      expect(useWorkoutDataStore.getState().categories).toContainEqual(mockCategory);
    });

    it('updateWorkoutCategories should call backend and update state for additions and removals', async () => {
      // Set initial state: workout 'test-1' has category 'cat-old'
      const oldWorkoutCategory = { workoutId: 'test-1', categoryId: 'cat-old' };
      useWorkoutDataStore.setState({ workoutCategories: [oldWorkoutCategory] });
      
      // Update: assign 'cat-new' and remove 'cat-old'
      await useWorkoutDataStore.getState().updateWorkoutCategories('test-1', ['cat-new']);
      
      expect(backendSaveWorkoutCategory).toHaveBeenCalledWith({ workoutId: 'test-1', categoryId: 'cat-new' });
      expect(backendDeleteWorkoutCategory).toHaveBeenCalledWith('test-1', 'cat-old');
      
      const state = useWorkoutDataStore.getState().workoutCategories;
      expect(state).toContainEqual({ workoutId: 'test-1', categoryId: 'cat-new' });
      expect(state).not.toContainEqual(oldWorkoutCategory);
    });
  });
});
