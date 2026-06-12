import { 
  getWorkouts, saveWorkout, deleteWorkout,
  getCategories, saveCategory, deleteCategory,
  getWorkoutCategories, saveWorkoutCategory, deleteWorkoutCategory
} from '../backend';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

jest.mock('../firebaseConfig', () => ({
  db: {},
}));

describe('Backend Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWorkout = {
    id: 'test-1',
    name: 'Test Workout',
    intervals: [
      { id: '1', name: 'Work', duration: 30, type: 'high' as const },
    ],
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
  };

  const mockWorkoutCategory = {
    workoutId: 'test-1',
    categoryId: 'cat-1',
  };

  describe('Workouts', () => {
    it('getWorkouts should fetch from firestore', async () => {
      const docs = [
        { id: 'test-1', data: () => mockWorkout },
      ];
      const mockSnapshot = {
        docs,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback),
      };
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const workouts = await getWorkouts();
      expect(getDocs).toHaveBeenCalled();
      expect(workouts).toHaveLength(1);
      expect(workouts[0].name).toBe('Test Workout');
    });

    it('saveWorkout should write to firestore', async () => {
      await saveWorkout(mockWorkout);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'workouts', mockWorkout.id);
      expect(setDoc).toHaveBeenCalledWith(undefined, mockWorkout);
    });

    it('deleteWorkout should delete from firestore', async () => {
      await deleteWorkout('test-1');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'workouts', 'test-1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Categories', () => {
    it('getCategories should fetch from firestore', async () => {
      const docs = [
        { id: 'cat-1', data: () => mockCategory },
      ];
      const mockSnapshot = {
        docs,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback),
      };
      (getDocs as jest.Mock).mockResolvedValueOnce(mockSnapshot);

      const categories = await getCategories();
      expect(getDocs).toHaveBeenCalled();
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Test Category');
    });

    it('saveCategory should write to firestore', async () => {
      await saveCategory(mockCategory);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'categories', mockCategory.id);
      expect(setDoc).toHaveBeenCalledWith(undefined, mockCategory);
    });

    it('deleteCategory should delete from firestore', async () => {
      await deleteCategory('cat-1');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'categories', 'cat-1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('WorkoutCategories', () => {
    it('getWorkoutCategories should fetch from firestore', async () => {
      const docs = [
        { id: 'test-1_cat-1', data: () => mockWorkoutCategory },
      ];
      const mockSnapshot = {
        docs,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback),
      };
      (getDocs as jest.Mock).mockResolvedValueOnce(mockSnapshot);

      const items = await getWorkoutCategories();
      expect(getDocs).toHaveBeenCalled();
      expect(items).toHaveLength(1);
      expect(items[0].workoutId).toBe('test-1');
    });

    it('saveWorkoutCategory should write to firestore', async () => {
      await saveWorkoutCategory(mockWorkoutCategory);
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'workoutCategories', `${mockWorkoutCategory.workoutId}_${mockWorkoutCategory.categoryId}`);
      expect(setDoc).toHaveBeenCalledWith(undefined, mockWorkoutCategory);
    });

    it('deleteWorkoutCategory should delete from firestore', async () => {
      await deleteWorkoutCategory('test-1', 'cat-1');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'workoutCategories', 'test-1_cat-1');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });
});

